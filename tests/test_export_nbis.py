import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scripts"))
from export_nbis import NoTrade, select_trade  # noqa: E402

LIMITS = {"dte": (7, 28), "delta": (0.15, 0.30), "min_ann": 0.12}


def put(strike, dte, delta, ann, gex_at_k=-1e6, put_wall=200):
    return dict(strike=strike, dte=dte, delta=delta, ann=ann, gex_at_k=gex_at_k, put_wall=put_wall)


def test_winner_passes_all_limits():
    puts = [
        put(158, 8, 0.34, 0.216),
        put(155, 11, 0.22, 0.148),
        put(153, 14, 0.16, 0.091),
        put(150, 3, 0.20, 0.30),
    ]
    out = select_trade(puts, LIMITS)
    assert (out["winner"]["strike"], out["winner"]["dte"]) == (155, 11)


def test_losers_fail_different_limits():
    puts = [
        put(158, 8, 0.34, 0.216),
        put(155, 11, 0.22, 0.148),
        put(153, 14, 0.16, 0.091),
        put(152, 14, 0.18, 0.13, put_wall=150),
    ]
    out = select_trade(puts, LIMITS)
    rules = [loser["reason"][:3] for loser in out["losers"]]
    assert len(out["losers"]) == 2
    assert len(set(rules)) == 2
    assert all(r.startswith("✕") for r in rules)
    assert out["losers"][0]["reason"] == "✕ 2 · delta 0.34"


def test_tie_breaks_on_gex():
    puts = [
        put(155, 11, 0.22, 0.15, gex_at_k=-2e6),
        put(154, 11, 0.20, 0.15, gex_at_k=-5e6),
        put(158, 8, 0.34, 0.2),
        put(153, 14, 0.16, 0.05),
    ]
    assert select_trade(puts, LIMITS)["winner"]["strike"] == 154


def test_raises_when_none_pass():
    puts = [put(158, 8, 0.34, 0.216), put(153, 14, 0.16, 0.091)]
    with pytest.raises(NoTrade):
        select_trade(puts, LIMITS)


def test_rule_4_is_at_or_below_put_wall():
    puts = [put(150, 10, 0.2, 0.5, put_wall=150), put(152.5, 10, 0.25, 0.6, put_wall=150)]
    out = select_trade(puts, LIMITS)
    assert out["winner"]["strike"] == 150
    assert out["losers"][0]["reason"] == "✕ 4 · above 150 put wall"


def test_nan_premium_fails_rule_3():
    puts = [put(155, 11, 0.22, float("nan")), put(154, 11, 0.20, 0.15)]
    out = select_trade(puts, LIMITS)
    assert out["winner"]["strike"] == 154
    assert out["losers"][0]["reason"].startswith("✕ 3")
