"""Freeze one real NBIS options snapshot into data/nbis.json for the site.

Run from this repo with WheelTracker's environment:
    uv run --project C:/Users/quint/projects/WheelTracker python scripts/export_nbis.py

Exits 2 when no put passes all four limits today; rerun on a later trading day.
"""

import json
import math
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WHEELTRACKER = Path("C:/Users/quint/projects/WheelTracker")
TICKER = "NBIS"
LIMITS = {"dte": (7, 28), "delta": (0.15, 0.30), "min_ann": 0.12}
# Rule 4: strike at or below that expiry's put wall (the strike with the most negative net GEX).
RULE_ORDER = [2, 3, 4, 1]  # which failures make the most telling losers


class NoTrade(Exception):
    pass


def first_failure(p: dict, limits: dict) -> tuple[int, str] | None:
    """The first of the four limits this put breaks, as (rule number, reason), or None."""
    lo, hi = limits["dte"]
    if not lo <= p["dte"] <= hi:
        return 1, f"✕ 1 · {p['dte']} days"
    lo, hi = limits["delta"]
    if not lo <= p["delta"] <= hi:
        return 2, f"✕ 2 · delta {p['delta']:.2f}"
    if not p["ann"] >= limits["min_ann"]:  # NaN fails too
        return 3, f"✕ 3 · {p['ann'] * 100:.1f}% annualized"
    if p["strike"] > p["put_wall"]:
        return 4, f"✕ 4 · above {p['put_wall']:g} put wall"
    return None


def select_trade(puts: list[dict], limits: dict) -> dict:
    """Winner = highest annualized put passing all limits (ties: larger |GEX| at strike).
    Losers = the two puts nearest the winner that each break a different limit."""
    passing = [p for p in puts if first_failure(p, limits) is None]
    if not passing:
        raise NoTrade(f"no put passes all limits among {len(puts)}")
    winner = max(passing, key=lambda p: (p["ann"], abs(p["gex_at_k"])))

    def distance(p: dict) -> float:
        return abs(p["strike"] - winner["strike"]) + abs(p["dte"] - winner["dte"]) * 0.5

    nearest: dict[int, dict] = {}
    for p in sorted(puts, key=distance):
        fail = first_failure(p, limits)
        if fail and fail[0] not in nearest:
            nearest[fail[0]] = {**p, "reason": fail[1]}
    losers = [nearest[r] for r in RULE_ORDER if r in nearest][:2]
    return {"winner": winner, "losers": sorted(losers, key=lambda p: p["reason"])}


def _clean(x):
    if isinstance(x, float) and (math.isnan(x) or math.isinf(x)):
        return None
    return x


def main() -> int:
    from datetime import date

    from wheel_tracker.config import Settings
    from wheel_tracker.gex.engine import build_matrix, with_gex, zero_gamma_level
    from wheel_tracker.gex.tradier import fetch_snapshot

    settings = Settings(_env_file=str(WHEELTRACKER / ".env"))
    snap = fetch_snapshot(TICKER, settings.tradier_token, settings.tradier_base_url, max_dte=28)
    now = snap.fetched_at
    today = now.date()
    gex_chain = with_gex(snap.chain, snap.spot, now)
    m = build_matrix(gex_chain, snap.spot).around_spot(10)
    flip = zero_gamma_level(gex_chain, snap.spot, now)
    exps = list(m.expirations)
    strikes = m.strikes  # descending

    def as_date(v) -> date:
        return v if isinstance(v, date) else date.fromisoformat(str(v)[:10])

    puts = []
    chain = snap.chain[snap.chain["option_type"] == "put"]
    for row in chain.itertuples():
        k, exp = float(row.strike), as_date(row.expiration)
        bid, ask = (float("nan") if x is None else float(x) for x in (row.bid, row.ask))
        if k not in strikes or exp not in exps or not (bid > 0 and ask > 0):  # NaN-safe
            continue
        dte = (exp - today).days
        mid = (bid + ask) / 2
        if dte <= 0 or mid <= 0 or row.delta is None or math.isnan(float(row.delta)):
            continue
        col = m.net[exp]
        i = strikes.index(k)
        puts.append(
            dict(
                strike=k,
                dte=dte,
                expiration=exp.isoformat(),
                delta=round(abs(float(row.delta)), 2),
                mid=round(mid, 2),
                ann=round(mid / k * 365 / dte, 4),
                gex_at_k=round(float(col.iloc[i])),
                put_wall=float(col.idxmin()),
            )
        )

    try:
        pick = select_trade(puts, LIMITS)
    except NoTrade as e:
        print(f"no trade today: {e}", file=sys.stderr)
        return 2

    w = pick["winner"]
    in_band = [
        p["strike"] for p in puts
        if p["expiration"] == w["expiration"] and LIMITS["delta"][0] <= p["delta"] <= LIMITS["delta"][1]
    ]
    out = {
        "ticker": TICKER,
        "date": today.isoformat(),
        "spot": round(snap.spot, 2),
        "flip": round(flip, 2) if flip else None,
        "dtes": [(e - today).days for e in exps],
        "strikes": strikes,
        "net": [[_clean(round(float(m.net.at[k, e]))) for e in exps] for k in strikes],
        "limits": {"dte": list(LIMITS["dte"]), "delta": list(LIMITS["delta"]), "min_ann": LIMITS["min_ann"]},
        "delta_band": [min(in_band), max(in_band)],
        "winner": w,
        "losers": pick["losers"],
        "verdict": f"Sell the {w['strike']:g}p, {w['dte']} days: passes all four, "
        + ("right at" if w["strike"] == w["put_wall"] else "below")
        + f" the {w['put_wall']:g} put wall.",
    }
    (ROOT / "data").mkdir(exist_ok=True)
    (ROOT / "data" / "nbis.json").write_text(json.dumps(out, indent=1, ensure_ascii=False), encoding="utf-8")
    print(f"wrote data/nbis.json: spot {out['spot']}, {len(puts)} puts, winner {w['strike']}p {w['dte']}d")
    return 0


if __name__ == "__main__":
    sys.exit(main())
