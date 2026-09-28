# Portfolio site — design

Date: 2026-09-28
Status: approved in brainstorming, pending spec review

## Purpose

A one-page site linked from job applications for finance and AI roles. The
reader is a recruiter or hiring manager who spends under a minute on it. They
should leave knowing: MSc Finance student who builds real quantitative and AI
tools, with WheelTracker as the proof.

The site should match the resume (`OneDrive/Career/Goodman_Quinten_Resume_2026.docx`)
so a reader who comes from the resume sees the same projects under the same names.

## Audience framing

Quinten is a finance person who codes, not a software engineer applying for
finance jobs. Lead with finance outcomes (strategy, risk, P&L target, gamma
exposure); put the engineering (APIs, SQLite, tests) second.

## Page structure

Single `index.html`, style A (minimal light), automatic dark mode via
`prefers-color-scheme`, responsive down to 375px, no JavaScript.

1. **Header**
   - Name: Quinten Goodman
   - Headline (draft): "Finance student building quantitative and AI tools"
   - Intro, 2–3 sentences (draft for user edit): MSc Finance at Nova SBE
     (expected June 2027); B.S. Finance and Management from ASU (4.0 major GPA);
     member of the Nova Students Portfolio student-managed fund. Looking for
     roles in analytical finance, trading, or AI applied to markets.
   - Location line: Lisbon, Portugal (U.S. citizen)

2. **Featured card — WheelTracker** (full width)
   - Title: "WheelTracker" with subtitle "Quantitative options analytics
     platform" (the resume's name for it)
   - Media: dashboard GIF or screenshot, sandbox/fake data only
   - One-line summary: rules-based cash-secured put and covered call strategy,
     tracked against a 1–2% monthly return target
   - Highlights (3):
     - Syncs brokerage positions (SnapTrade) and option chains, Greeks, and IV
       (Tradier) into SQLite; links each wheel cycle from put to assignment to call
     - Dealer gamma exposure (GEX) model across strikes and expirations out to
       28 days, finding gamma walls and the zero-gamma flip
     - Streamlit dashboard and contract screener ranking contracts by
       annualized premium, spread, open interest, IV, and GEX at strike
   - "What was hard" line (draft to confirm with user)
   - Stack: Python, pandas, SQLite, Streamlit, SnapTrade API, Tradier API
   - Link: GitHub repo

3. **Two cards side by side** (stack on mobile)
   - **News Alerts** — Claude-summarized market news sent to Telegram: immediate
     pings for relevant news plus pre-open and end-of-day digests with source
     links. Used to pick wheel candidates and read the market regime. Stack:
     Python, Claude API, Finnhub, Telegram. Link: the news module in the
     WheelTracker repo (`src/wheel_tracker/news/`).
   - **JobScout** — job-search agent that checks company boards and Handshake
     alert emails, filters obvious non-fits, has Claude score the rest against
     the resume, and sends a Telegram digest with deadline reminders. Stack:
     Python, Claude API, Gmail API, Telegram. Link: JobScout repo.
   - Each: screenshot, 2 highlights, stack, link.

4. **Footer**: Resume (PDF), email `quinten@goodmansonline.com`, LinkedIn
   `linkedin.com/in/quintengoodman`, GitHub `goodmanquinten`.

Not included: algo, TradingAgents paper desk, PaperPeek, momentum-lab, Travel,
beer projects. No experience/education section beyond the intro — the resume
covers it.

## Files

New repo `~/projects/portfolio`, published as GitHub repo
`goodmanquinten.github.io`.

```
index.html
style.css
assets/
  wheeltracker.gif (or .png)
  news-alerts.png
  jobscout.png
  resume.pdf
docs/superpowers/specs/   (this file)
```

Card markup is copied by hand per project; no templating.

## Privacy rules

- No phone number anywhere on the site. The resume PDF published here is a
  copy of the 2026 resume with the phone number removed.
- Screenshots use Tradier sandbox or fake data; no real Fidelity balances,
  positions, or P&L. Telegram screenshots crop out chat IDs and bot names.
- JobScout screenshots use a fake or blurred job list if it shows anything
  personal.

## Publishing the project repos

Before any repo link goes live, for WheelTracker and JobScout:

1. Scan full git history (all branches that will be pushed) for API keys,
   tokens, `.env`, `*.db`, `credentials.json`, `token.json`, `profile/`, and
   real account numbers or balances. Use `gitleaks` if available, plus
   targeted `git log -p` greps.
2. If anything is found: rewrite history (`git filter-repo`) on a copy and
   rotate the exposed key. Only `main` gets pushed; `claude/*` worktree
   branches stay local.
3. Write a clean public README per repo: what it is, a screenshot, how it
   works, stack, setup. Remove references to personal account details.
4. The user creates the GitHub repos and pushes; Claude prepares everything
   up to that point.

News Alerts has no separate repo; it lives on WheelTracker `main`.

## Deploy

GitHub Pages from `main` of `goodmanquinten.github.io`. Site URL:
`https://goodmanquinten.github.io`.

## Verification

Before calling it done, in the in-app browser:
- Desktop (1280px) and phone (375px) widths, light and dark mode
- Every link resolves (repo links checked after repos are public)
- No horizontal scroll; images load; resume PDF opens and has no phone number

## Inputs needed from the user

- Approve or edit the headline, intro, and "what was hard" drafts
- Confirm the phone-free resume PDF
- Create the GitHub repos and push
- (Optional) Fix typo "sewmesters" in `Goodman_Quinten_Resume_2026.docx`
