# Portfolio Site Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a one-page portfolio site (WheelTracker featured, News Alerts and JobScout as smaller cards) and get the linked repos safe to publish.

**Architecture:** Static `index.html` + `style.css` + `assets/`, no JavaScript, no build step. A small Python check script (`scripts/check_site.py`, stdlib only) acts as the test suite: it asserts required content, local asset references, and the no-phone-number rule. Deployed via GitHub Pages from repo `goodmanquinten.github.io`.

**Tech Stack:** HTML, CSS (custom properties, `prefers-color-scheme`), Python 3.11 stdlib for checks, Word COM (PowerShell) to make the phone-free resume PDF.

**Spec:** `docs/superpowers/specs/2026-09-28-portfolio-site-design.md`

**Repo:** `C:\Users\quint\projects\portfolio` (git, branch `main`, spec already committed)

---

## File structure

```
index.html              page content and structure
style.css               all styles; light/dark tokens on :root
assets/
  wheeltracker.png      GEX heatmap / dashboard screenshot (Task 5)
  news-alerts.png       Telegram digest screenshot (Task 5, user-supplied)
  jobscout.png          Telegram digest screenshot (Task 5, user-supplied)
  resume.pdf            2026 resume without phone number (Task 4)
scripts/check_site.py   site checks; exit 0 = pass
```

Until real screenshots exist, cards show a styled placeholder `<div class="shot placeholder">`. Task 5 swaps them for `<img>`.

---

## Chunk 1: Site

### Task 1: Site check script (the test)

**Files:**
- Create: `scripts/check_site.py`

- [ ] **Step 1: Write the check script**

```python
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
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `python scripts/check_site.py`
Expected: `FAIL: index.html missing`, exit code 1.

- [ ] **Step 3: Commit**

```bash
git add scripts/check_site.py
git commit -m "test: add site check script"
```

### Task 2: Stylesheet

**Files:**
- Create: `style.css`

- [ ] **Step 1: Write `style.css`**

```css
:root {
  --bg: #faf9f5;
  --card: #ffffff;
  --text: #2c2c2a;
  --muted: #5f5e5a;
  --faint: #888780;
  --border: #d3d1c7;
  --accent: #185fa5;
  --chip-bg: #e6f1fb;
  --chip-text: #0c447c;
  --shot-bg: #f1efe8;
  color-scheme: light dark;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #1a1a19;
    --card: #232322;
    --text: #ecebe6;
    --muted: #b4b2a9;
    --faint: #888780;
    --border: #3a3a38;
    --accent: #85b7eb;
    --chip-bg: #0c447c;
    --chip-text: #e6f1fb;
    --shot-bg: #2c2c2a;
  }
}

* { box-sizing: border-box; }

body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font: 16px/1.6 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}

main {
  max-width: 960px;
  margin: 0 auto;
  padding: 56px 16px 32px;
}

a { color: var(--accent); }

header { margin-bottom: 40px; }
h1 { font-size: 32px; font-weight: 600; margin: 0 0 4px; }
.headline { font-size: 18px; color: var(--muted); margin: 0 0 16px; }
.intro { max-width: 640px; margin: 0 0 8px; }
.location { font-size: 14px; color: var(--faint); margin: 0; }

.card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 24px;
}
.label { font-size: 13px; color: var(--accent); margin: 0 0 4px; }
.card h2 { font-size: 22px; font-weight: 600; margin: 0; }
.card h3 { font-size: 18px; font-weight: 600; margin: 0 0 4px; }
.subtitle { color: var(--muted); margin: 0 0 12px; }
.card ul { padding-left: 20px; margin: 12px 0; }
.card li { margin-bottom: 6px; }
.hard { font-size: 15px; color: var(--muted); margin: 12px 0; }

.featured {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
  gap: 24px;
  align-items: start;
  margin-bottom: 24px;
}
.pair {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
}

.shot {
  width: 100%;
  border-radius: 8px;
  border: 1px solid var(--border);
  display: block;
}
.placeholder {
  aspect-ratio: 16 / 10;
  background: var(--shot-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--faint);
  font-size: 13px;
}
.pair .shot { margin-bottom: 16px; }

.chips { display: flex; flex-wrap: wrap; gap: 6px; margin: 12px 0; padding: 0; list-style: none; }
.chips li {
  font-size: 12px;
  background: var(--chip-bg);
  color: var(--chip-text);
  padding: 2px 8px;
  border-radius: 6px;
  margin: 0;
}

.repo { font-size: 15px; font-weight: 500; }

footer {
  margin-top: 48px;
  padding-top: 24px;
  border-top: 1px solid var(--border);
  display: flex;
  flex-wrap: wrap;
  gap: 8px 24px;
  font-size: 15px;
}

@media (max-width: 720px) {
  main { padding-top: 32px; }
  .featured, .pair { grid-template-columns: minmax(0, 1fr); }
  .featured .shot { order: -1; }
}
```

- [ ] **Step 2: Commit**

```bash
git add style.css
git commit -m "feat: add site stylesheet with light and dark themes"
```

### Task 3: Page content

**Files:**
- Create: `index.html`

- [ ] **Step 1: Write `index.html`**

Copy marked "draft" in the spec is included as written; the user edits it in Task 6.

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Quinten Goodman</title>
  <meta name="description" content="Finance student building quantitative and AI tools.">
  <link rel="stylesheet" href="style.css">
</head>
<body>
<main>
  <header>
    <h1>Quinten Goodman</h1>
    <p class="headline">Finance student building quantitative and AI tools</p>
    <p class="intro">
      I'm studying for an MSc in Finance at Nova SBE (expected June 2027) after a B.S. in
      Finance and Management from Arizona State (4.0 major GPA), and I'm a member of the
      Nova Students Portfolio student-managed fund. I build the tools I use to trade and
      research. I'm looking for roles in analytical finance, trading, or AI applied to markets.
    </p>
    <p class="location">Lisbon, Portugal · U.S. citizen</p>
  </header>

  <article class="card featured">
    <div>
      <p class="label">Featured project</p>
      <h2>WheelTracker</h2>
      <p class="subtitle">Quantitative options analytics platform</p>
      <p>
        Runs a rules-based cash-secured put and covered call strategy on a personal
        portfolio, tracked against a 1–2% monthly return target.
      </p>
      <ul>
        <li>Syncs brokerage positions (SnapTrade) and option chains, Greeks, and IV (Tradier)
          into SQLite, and links each wheel cycle from put to assignment to covered call.</li>
        <li>Dealer gamma exposure (GEX) model across strikes and expirations out to 28 days,
          finding gamma walls and the zero-gamma flip.</li>
        <li>Streamlit dashboard and contract screener that ranks contracts by annualized
          premium, spread, open interest, IV, and GEX at the strike.</li>
      </ul>
      <p class="hard">
        Hardest part: keeping the gamma map live. The dashboard refreshes prices every
        10 seconds and full option chains every 2 minutes without stalling the page.
      </p>
      <ul class="chips">
        <li>Python</li><li>pandas</li><li>SQLite</li><li>Streamlit</li>
        <li>SnapTrade API</li><li>Tradier API</li>
      </ul>
      <a class="repo" href="https://github.com/goodmanquinten/WheelTracker">View code on GitHub</a>
    </div>
    <div class="shot placeholder">Dashboard screenshot</div>
  </article>

  <div class="pair">
    <article class="card">
      <div class="shot placeholder">Telegram digest screenshot</div>
      <h3>News Alerts</h3>
      <p class="subtitle">AI-summarized market news for picking trades</p>
      <ul>
        <li>Claude filters and summarizes market news, with an immediate alert for anything
          relevant and pre-open and end-of-day digests on Telegram.</li>
        <li>Every item links its source, and feeds WheelTracker's choice of which names to
          sell puts on and how to read the market regime.</li>
      </ul>
      <ul class="chips">
        <li>Python</li><li>Claude API</li><li>Finnhub</li><li>Telegram</li>
      </ul>
      <a class="repo" href="https://github.com/goodmanquinten/WheelTracker/tree/main/src/wheel_tracker/news">View code on GitHub</a>
    </article>

    <article class="card">
      <div class="shot placeholder">Telegram digest screenshot</div>
      <h3>JobScout</h3>
      <p class="subtitle">Job-search agent</p>
      <ul>
        <li>Checks company job boards and Handshake alert emails, drops obvious non-fits, and
          has Claude score the rest against my resume.</li>
        <li>Sends a weekly Telegram digest, pings strong matches closing within 7 days, and
          reminds me before saved jobs' deadlines.</li>
      </ul>
      <ul class="chips">
        <li>Python</li><li>Claude API</li><li>Gmail API</li><li>Telegram</li>
      </ul>
      <a class="repo" href="https://github.com/goodmanquinten/JobScout">View code on GitHub</a>
    </article>
  </div>

  <footer>
    <a href="assets/resume.pdf">Resume (PDF)</a>
    <a href="mailto:quinten@goodmansonline.com">quinten@goodmansonline.com</a>
    <a href="https://www.linkedin.com/in/quintengoodman/">linkedin.com/in/quintengoodman</a>
    <a href="https://github.com/goodmanquinten">github.com/goodmanquinten</a>
  </footer>
</main>
</body>
</html>
```

- [ ] **Step 2: Run the check**

Run: `python scripts/check_site.py`
Expected: exactly one failure, `FAIL: broken local reference: assets/resume.pdf` (fixed in Task 4).

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add portfolio page content"
```

### Task 4: Phone-free resume PDF

**Files:**
- Create: `assets/resume.pdf`

- [ ] **Step 1: Export the 2026 resume to PDF without the phone number (PowerShell, Word COM)**

Works on a copy; the original docx is never saved.

```powershell
New-Item -ItemType Directory -Force "C:\Users\quint\projects\portfolio\assets" | Out-Null
$src = "C:\Users\quint\OneDrive\Career\Goodman_Quinten_Resume_2026.docx"
$tmp = "$env:TEMP\resume_public.docx"
Copy-Item $src $tmp -Force
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$doc = $word.Documents.Open($tmp)
$find = $doc.Content.Find
$null = $find.Execute(" | +1 480 678 4610", $false, $false, $false, $false, $false, $true, 1, $false, "", 2)
$null = $doc.Content.Find.Execute("sewmesters", $false, $false, $false, $false, $false, $true, 1, $false, "semesters", 2)
$doc.SaveAs([ref]"C:\Users\quint\projects\portfolio\assets\resume.pdf", [ref]17)
$doc.Close([ref]0)
$word.Quit()
Remove-Item $tmp
```

- [ ] **Step 2: Verify the PDF has no phone number**

Run: `uv run --with pypdf python -c "import pypdf,re;t=''.join(p.extract_text() for p in pypdf.PdfReader('assets/resume.pdf').pages);print('PHONE FOUND' if re.search(r'480\D{0,3}678',t) else 'clean');print(t[:200])"`
Expected: `clean`, followed by the name and contact line without a phone number. Also open the PDF in the browser pane and confirm the header line still reads cleanly (no stray `|`).

- [ ] **Step 3: Run the check**

Run: `python scripts/check_site.py`
Expected: `OK`

- [ ] **Step 4: Commit**

```bash
git add assets/resume.pdf
git commit -m "feat: add public resume PDF without phone number"
```

### Task 5: Screenshots

**Files:**
- Create: `assets/wheeltracker.png`, `assets/news-alerts.png`, `assets/jobscout.png`
- Modify: `index.html` (swap three placeholders for `<img>`)

- [ ] **Step 1: WheelTracker screenshot**

Screenshot only market-data views (GEX heatmap and contract screener), never positions, balances, or P&L. The dashboard runs at `http://127.0.0.1:8501` (Task Scheduler launcher). Open it in the browser pane at 1280px width, go to the GEX heatmap for a liquid ticker (e.g. SPY), take a screenshot, crop to the heatmap, and save as `assets/wheeltracker.png` (under 500 KB; resize to 1200px wide if larger). Show the image to the user and confirm it contains no account data before continuing.

- [ ] **Step 2: News Alerts and JobScout screenshots (user-supplied)**

Ask the user for one Telegram screenshot of each, with chat names and bot names cropped out. Save them as `assets/news-alerts.png` and `assets/jobscout.png`. If they aren't available yet, leave those placeholders in place and continue; the site can ship with them and get updated later.

- [ ] **Step 3: Swap placeholders for images**

For each screenshot that exists, replace its placeholder, e.g.:

```html
<img class="shot" src="assets/wheeltracker.png"
     alt="WheelTracker gamma exposure heatmap across strikes and expirations">
```

```html
<img class="shot" src="assets/news-alerts.png"
     alt="News Alerts end-of-day digest in Telegram with source links">
```

```html
<img class="shot" src="assets/jobscout.png"
     alt="JobScout weekly digest in Telegram with scored job matches">
```

- [ ] **Step 4: Run the check**

Run: `python scripts/check_site.py`
Expected: `OK`

- [ ] **Step 5: Commit**

```bash
git add assets/*.png index.html
git commit -m "feat: add project screenshots"
```

### Task 6: Copy review and visual check

- [ ] **Step 1: Copy review with the user**

Show the user the headline, intro, and "Hardest part" line. Apply their edits to `index.html`, re-run `python scripts/check_site.py` (expect `OK`), and commit: `git commit -am "copy: apply review edits"`.

- [ ] **Step 2: Visual check in the browser pane**

Open `index.html` in the browser pane. Check at desktop width (1280px) and mobile preset (375px), in light and dark color schemes (`resize_window` with `colorScheme`):
- no horizontal scroll (`document.documentElement.scrollWidth <= innerWidth` via javascript_tool)
- featured card goes single-column on mobile with the image first
- text is readable in dark mode; chips are legible
Reset the viewport to desktop afterwards. Fix any issues in `style.css`, re-check, and commit.

---

## Chunk 2: Publishing

### Task 7: Scrub WheelTracker for publication

Work in `C:\Users\quint\projects\WheelTracker` on `main`. Only `main` will be pushed.

- [ ] **Step 1: Look for sensitive files ever committed on `main`**

Run:
```bash
git log main --name-only --format= | sort -u | grep -Ei '\.env$|\.db$|\.sqlite|credentials|token\.json|\.log$|resume|\.pdf$|\.xlsx?$|\.csv$'
```
Expected: no output. Anything listed must be reviewed.

- [ ] **Step 2: Look for secrets in `main` history content**

Run:
```bash
git log main -p | grep -EnI '(api[_-]?key|token|secret|password|bearer|account[_-]?(id|number))\s*[:=]\s*["'"'"']?[A-Za-z0-9_\-]{12,}' | grep -v 'your_\|example\|<\|xxx' | head -50
git log main -p | grep -EnI 'sk-ant-[A-Za-z0-9]|[0-9]{8,10}:[A-Za-z0-9_-]{30,}' | head
```
Expected: no real key values (placeholders in `.env.example` are fine). Also grep for dollar balances or Fidelity account numbers if the tests use fixtures: `git log main -p | grep -EnI 'fidelity|Z[0-9]{8}' | head`.

- [ ] **Step 3: If anything real is found — stop and tell the user**

Report what was found and where. The fix is `git filter-repo` on a fresh clone plus rotating the exposed key; do that only after the user agrees.

- [ ] **Step 4: Public README**

Rewrite `README.md` for a public reader: one-paragraph summary using the resume framing (quantitative options analytics platform), screenshot (`docs/images/gex-heatmap.png`, a copy of `assets/wheeltracker.png`), features list (matching the site card), architecture (clients → SQLite → analytics/GEX → Streamlit; news module), stack, setup (`uv sync`, `.env.example`), and a note that trading decisions are the author's own and this isn't investment advice. Remove mentions of personal account balances. Run `uv run ruff check` and `uv run pytest -q` to make sure nothing is broken (expect all pass), then commit on `main`.

### Task 8: Scrub JobScout for publication

Work in `C:\Users\quint\projects\JobScout`.

- [ ] **Step 1: Run the same two history scans as Task 7 Steps 1–2**, replacing `main` with `HEAD`. Also confirm `profile/`, `watchlist.toml` contents, and `tests/fixtures/` contain nothing personal: `git log -p -- tests/fixtures watchlist.toml | grep -Ei 'goodman|@|phone' | head`.

- [ ] **Step 2: Stop and report findings** if anything real turns up (same rule as Task 7 Step 3).

- [ ] **Step 3: Public README**

Add a short summary and screenshot at the top of the existing README, keep the setup steps, and remove anything personal. Run `uv run pytest -q` (expect all pass) and commit.

### Task 9: Publish and go live (user pushes)

- [ ] **Step 1: Hand the user the exact steps**

1. On GitHub, create public repos `WheelTracker`, `JobScout`, and `goodmanquinten.github.io` (all empty, no README).
2. Push each:

```bash
git -C C:/Users/quint/projects/WheelTracker remote add origin https://github.com/goodmanquinten/WheelTracker.git
git -C C:/Users/quint/projects/WheelTracker push -u origin main
git -C C:/Users/quint/projects/JobScout remote add origin https://github.com/goodmanquinten/JobScout.git
git -C C:/Users/quint/projects/JobScout push -u origin main
git -C C:/Users/quint/projects/portfolio remote add origin https://github.com/goodmanquinten/goodmanquinten.github.io.git
git -C C:/Users/quint/projects/portfolio push -u origin main
```

3. In `goodmanquinten.github.io` → Settings → Pages, set Source to "Deploy from a branch", branch `main`, folder `/ (root)`.

- [ ] **Step 2: Live check**

After the user confirms the push, open `https://goodmanquinten.github.io` in the browser pane. Confirm the page renders, the resume PDF opens, and all three repo links load (not 404). Report the live URL to the user.
