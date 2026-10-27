import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scripts"))
from update_marks import last_close  # noqa: E402

# 2026-10-23, 2026-10-26, 2026-10-27 at 13:30 UTC (market open)
TIMES = [1792762200, 1793021400, 1793107800]


def payload(closes):
    return {"chart": {"result": [{"timestamp": TIMES, "indicators": {"quote": [{"close": closes}]}}]}}


def test_last_close_takes_latest_day():
    assert last_close(payload([2.79, 2.71, 2.72])) == {"close": 2.72, "date": "2026-10-27"}


def test_last_close_skips_missing_values():
    assert last_close(payload([2.79, 2.71, None])) == {"close": 2.71, "date": "2026-10-26"}


def test_last_close_rounds_float_noise():
    assert last_close(payload([2.7899999618530273, None, None]))["close"] == 2.79
