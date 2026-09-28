"""Checks for the portfolio site. Run: python scripts/check_site.py"""

import re
import sys
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PHONE = re.compile(r"480\D{0,3}678\D{0,3}4610")
REQUIRED_TEXT = [
    "Quinten Goodman",
    "WheelTracker",
    "Quantitative options analytics platform",
    "News Alerts",
    "JobScout",
    "quinten@goodmansonline.com",
    "linkedin.com/in/quintengoodman",
    "github.com/goodmanquinten",
]


class Refs(HTMLParser):
    def __init__(self):
        super().__init__()
        self.refs: list[str] = []
        self.imgs_without_alt: list[str] = []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        for key in ("href", "src"):
            if a.get(key):
                self.refs.append(a[key])
        if tag == "img" and not a.get("alt"):
            self.imgs_without_alt.append(a.get("src", "?"))


def check() -> list[str]:
    errors = []
    index = ROOT / "index.html"
    if not index.exists():
        return ["index.html missing"]
    html = index.read_text(encoding="utf-8")

    for text in REQUIRED_TEXT:
        if text not in html:
            errors.append(f"missing text: {text!r}")
    for path in [index, ROOT / "style.css"]:
        if path.exists() and PHONE.search(path.read_text(encoding="utf-8")):
            errors.append(f"phone number found in {path.name}")
    if '<meta name="viewport"' not in html:
        errors.append("missing viewport meta tag")

    parser = Refs()
    parser.feed(html)
    for ref in parser.refs:
        if ref.startswith(("http://", "https://", "mailto:", "#")):
            continue
        if not (ROOT / ref).exists():
            errors.append(f"broken local reference: {ref}")
    for src in parser.imgs_without_alt:
        errors.append(f"img without alt: {src}")
    return errors


if __name__ == "__main__":
    problems = check()
    for p in problems:
        print("FAIL:", p)
    print("OK" if not problems else f"{len(problems)} problem(s)")
    sys.exit(1 if problems else 0)
