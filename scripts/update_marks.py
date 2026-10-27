"""Mark the site's stock pitches to market: writes data/marks.json with each ticker's
latest daily close. Run daily by .github/workflows/marks.yml (stdlib only, no API key)."""

import json
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TICKERS = ["GRAB"]
URL = "https://query1.finance.yahoo.com/v8/finance/chart/{}?range=5d&interval=1d"


def last_close(payload: dict) -> dict:
    """Latest non-missing daily close from a Yahoo chart payload, as {"close", "date"}."""
    result = payload["chart"]["result"][0]
    closes = result["indicators"]["quote"][0]["close"]
    for ts, close in reversed(list(zip(result["timestamp"], closes))):
        if close is not None:
            day = datetime.fromtimestamp(ts, timezone.utc).date().isoformat()
            return {"close": round(close, 2), "date": day}
    raise ValueError("no closes in payload")


def fetch(ticker: str) -> dict:
    req = urllib.request.Request(URL.format(ticker), headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.load(r)


def main() -> int:
    marks = {t: last_close(fetch(t)) for t in TICKERS}
    path = ROOT / "data" / "marks.json"
    path.parent.mkdir(exist_ok=True)
    path.write_text(json.dumps(marks, indent=1) + "\n", encoding="utf-8")
    print(json.dumps(marks))
    return 0


if __name__ == "__main__":
    sys.exit(main())
