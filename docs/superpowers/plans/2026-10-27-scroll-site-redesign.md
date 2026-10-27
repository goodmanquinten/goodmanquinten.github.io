# Scroll-Driven Portfolio Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the card-based page with a dark, scroll-driven site where each project builds itself (real NBIS options data, sample job-agent data, real Sept 13 news data), ending in a factual background/contact section.

**Architecture:** Static `index.html` + `style.css` + one JS file per section under `js/`, with data frozen as JSON under `data/` that each section `fetch()`es. Content is fully visible without JS; `js/main.js` adds `html.anim` to switch on pinned GSAP timelines. A Python exporter in `scripts/` takes the NBIS snapshot through WheelTracker's own Tradier client and GEX engine and applies the four limits with a pure, tested function.

**Tech Stack:** HTML/CSS/vanilla JS; GSAP 3.12.5 + ScrollTrigger (cdnjs); Lenis 1.x (jsdelivr); Fontshare General Sans + Google Fonts JetBrains Mono; Python 3.11 + WheelTracker package for the exporter; pytest via `uv run --with pytest`.

**Spec:** `docs/superpowers/specs/2026-10-27-scroll-site-redesign-design.md` (prototype it is based on: `.superpowers/brainstorm/1289-1793121989/content/scroll-prototype-v4.html` — reuse its markup, CSS and timelines as the starting point).

## Global Constraints

- Static files on GitHub Pages; no build step; scripts only from cdnjs.cloudflare.com / cdn.jsdelivr.net; fonts from api.fontshare.com / fonts.googleapis.com.
- No phone number anywhere; no real positions, balances or P&L.
- Plain copy, no taglines or personas. Project names exactly: "Options Analytics Dashboard", "AI Job Search Agent", "AI Market News Digest".
- Section labels exactly: `REAL DATA · NBIS · <Mon D, YYYY>`, `SAMPLE DATA`, `REAL DATA · SEP 13, 2026`.
- Each pinned build ≤ 850px of scroll (`end: '+=850'`).
- Palette: bg `#0b0d12`, ink `#ece9e1`, muted `#8b8f99`, cyan `#3fd0ff`, gold `#f2d34a`, red `#ff5d5d`.
- The options section always ends on a real trade passing all four limits; never "no trade".
- `python scripts/check_site.py` prints `OK`.

## Review Focus

- JS or a CDN fails to load → all copy, the job shortlist, the digest and the close section still show; only the heatmap needs JS (Task 2 Step 3).
- `prefers-reduced-motion: reduce` → no pinning, sections render finished (Task 7 check).
- Phone width 375px → each build's finished state fits in one screen, no horizontal scroll (Task 7 check).
- Window resized or page reloaded mid-scroll → overlays (bands, spot line, marks) stay aligned to cells (Task 3: positions recomputed in ScrollTrigger `onRefresh`).
- NBIS chain where several puts pass → the winner is deterministic (highest annualized, ties → higher GEX at strike) (Task 1 test).

---

### Task 1: NBIS snapshot exporter

**Files:**
- Create: `scripts/export_nbis.py`, `tests/test_export_nbis.py`
- Create (output): `data/nbis.json`

**Interfaces:**
- Produces `select_trade(puts: list[dict], limits: dict) -> dict` where each put dict has `strike, dte, delta, ann, gex_at_k, wall_below` and returns `{"winner": put, "losers": [put, put], "reasons": {strike_dte_key: "✕ N · text"}}`.
- Produces `data/nbis.json`: `{"ticker","date","spot","flip","dtes":[int],"strikes":[float desc],"net":[[float]] (rows=strikes, cols=dtes),"limits":{...},"winner":{...},"losers":[{..., "reason":"✕ 2 · delta 0.34"}],"verdict": str}`.
- Limits (exact): `dte 7–28`, `put delta 0.15–0.30` (absolute value), `ann >= 0.12`, `wall_below > 0` = net GEX summed over strikes ≤ K at that expiry is positive.

- [ ] **Step 1: Write failing tests** in `tests/test_export_nbis.py`:
  - `test_winner_passes_all_limits`: 4 puts, one passes all → it is `winner`.
  - `test_losers_fail_different_limits`: losers' reasons start with different rule numbers (`"✕ 2"`, `"✕ 3"` …).
  - `test_tie_breaks_on_gex`: two passing puts with equal `ann` → higher `gex_at_k` wins.
  - `test_raises_when_none_pass`: no put passes → raises `NoTrade` (the script then exits 2 so it's rerun another day; the page never shows "no trade").
- [ ] **Step 2: Run** `uv run --with pytest --with pandas pytest tests/test_export_nbis.py -q` → FAIL (import error).
- [ ] **Step 3: Implement** `select_trade` and `class NoTrade(Exception)` in `scripts/export_nbis.py`; a `main()` that imports `wheel_tracker.gex.tradier.fetch_snapshot(ticker="NBIS", token, base_url, max_dte=28)` and `wheel_tracker.gex.engine.with_gex / build_matrix / zero_gamma_level`, reads `TRADIER_TOKEN`/`TRADIER_BASE_URL` from `C:/Users/quint/projects/WheelTracker/.env` (via `wheel_tracker`'s settings), keeps ±10 strikes around spot (`GexMatrix.around_spot(10)`), computes per-put `ann = mid / strike * 365 / dte`, and writes `data/nbis.json` with `verdict = "Sell the {K}p, {dte} days: passes all four, with a +${gex}M gamma wall at the strike."`.
- [ ] **Step 4: Run tests** → PASS.
- [ ] **Step 5: Export** `uv run --project C:/Users/quint/projects/WheelTracker python scripts/export_nbis.py` → writes `data/nbis.json`, exit 0. If exit 2 (no trade), stop and tell the user it will be retaken next trading day.
- [ ] **Step 6: Commit** `feat(data): NBIS options snapshot exporter and data`.

### Task 2: Page skeleton, styles, no-JS content

**Files:**
- Modify: `index.html` (full rewrite), `style.css` (full rewrite), `scripts/check_site.py` (REQUIRED_TEXT → new names, `"REAL DATA"`, `"View code"`, `"Nova Students Portfolio"`, `"Solugenix"`)
- Create: `data/news.json` (the 10 Sept 13 INTC headlines with `s,h,drop?,key?,url` and the digest lines + links, copied from the v4 prototype)

**Interfaces:**
- Produces section ids `#hero`, `#p1`, `#p2`, `#p3`, `#close`; rail `<nav class="rail">` with `a[href="#p1"]…`; each project ends with `<a class="code" href="…">View code</a>` (WheelTracker, JobScout, WheelTracker `/tree/main/src/wheel_tracker/news`).
- Static markup contains the finished state (job shortlist after removal, digest text; the options grid and candidates are rendered by Task 3). CSS hides pre-animation states only under `html.anim`.
- Close section copy (exact facts): Nova SBE MSc Finance (expected June 2027) · Nova Students Portfolio, student-managed investment fund member · ASU W. P. Carey, B.S. Finance and Management, 4.0 major GPA (May 2026) · Korea University exchange (2025) · Solugenix, Staff Accountant Intern (Oct 2023–May 2026): benchmarked comparables for a seven-figure credit facility, automated payroll and asset tracking, built Ramp automation rules. Links: `assets/resume.pdf`, `mailto:quinten@goodmansonline.com`, `https://www.linkedin.com/in/quintengoodman/`, `https://github.com/goodmanquinten`.
- Fonts: General Sans (Fontshare `https://api.fontshare.com/v2/css?f[]=general-sans@500,600,700&display=swap`) for headings/body, JetBrains Mono for data.

- [ ] **Step 1:** Update `check_site.py` REQUIRED_TEXT; run → FAIL (old page).
- [ ] **Step 2:** Write `index.html`, `style.css`, `data/news.json`; run `python scripts/check_site.py` → `OK`.
- [ ] **Step 3:** In the browser pane with JS disabled (or `html` without `.anim`), confirm all three sections show finished content and the close section. 
- [ ] **Step 4: Commit** `feat(site): scroll redesign skeleton with static finished content`.

### Task 3: Options section build (`js/options.js`)

**Interfaces:** Consumes `data/nbis.json` (Task 1) and `#p1` markup (Task 2). Produces `initOptions(): Promise<void>`.

- [ ] **Step 1:** Render grid from `net` (color thresholds scaled to the data's max |net|, 6 buckets as in the prototype), bands from limits, spot line between the two strikes around `spot`, flip line at `flip`, three marks + candidate rows from `winner/losers`; label from `date`.
- [ ] **Step 2:** Timeline (pin `#p1`, `+=850`, scrub .4, `onRefresh: place`): cells → spot + flip → bands → candidates + marks → strike losers with their reasons → gold winner + verdict.
- [ ] **Step 3:** Verify in browser at 1440×900: final state shows winner outlined and verdict text equals `nbis.json.verdict`; resize to 1000px mid-section → overlays still on their cells.
- [ ] **Step 4: Commit** `feat(site): options section builds from real NBIS data`.

### Task 4: Job agent build (`js/jobs.js`)

**Interfaces:** Produces `initJobs()`. Sample data and rules exactly as prototype v4 (rules 1–4, fictional companies, Telegram "JobScout" chat, footer `Reply /save N, /applied N or /skip N`).

- [ ] **Step 1:** Port the v4 timeline; pin `+=850`.
- [ ] **Step 2:** Verify final state: 4 failures gone, 4 survivors with fit badges, chat shows 4 ranked lines.
- [ ] **Step 3: Commit** `feat(site): job agent section`.

### Task 5: News build (`js/news.js`)

**Interfaces:** Consumes `data/news.json`. Produces `initNews()`.

- [ ] **Step 1:** Port the v4 timeline (drops struck with tags, two key headlines lit, digest lines in); pin `+=850`. Digest links use the real URLs from `news.json`.
- [ ] **Step 2:** Verify final state matches the v4 prototype.
- [ ] **Step 3: Commit** `feat(site): news digest section with real Sept 13 data`.

### Task 6: Motion shell (`js/main.js`)

**Interfaces:** Consumes `initOptions/initJobs/initNews`. 

- [ ] **Step 1:** If `matchMedia('(prefers-reduced-motion: reduce)')` → do nothing (static finished page). Else add `html.anim`, start Lenis (`new Lenis(); lenis.on('scroll', ScrollTrigger.update); gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0)`), await the three inits, then `ScrollTrigger.refresh()`.
- [ ] **Step 2:** Progress rail: highlight the current section via ScrollTrigger `onToggle`; rail links scroll with `lenis.scrollTo`.
- [ ] **Step 3:** Hero intro: name letters rise in on load (CSS or GSAP), scroll cue fades on first scroll.
- [ ] **Step 4: Commit** `feat(site): smooth scroll, progress rail, reduced-motion fallback`.

### Task 7: Link preview, phone layout, verification, deploy

**Files:** Create `assets/og.png` (1200×630 render of the hero via headless Edge or Playwright); modify `index.html` head (`og:title` "Quinten Goodman", `og:description` "Finance × AI · MSc Finance, Nova SBE", `og:image` absolute `https://goodmanquinten.github.io/assets/og.png`, `twitter:card` `summary_large_image`).

- [ ] **Step 1:** Generate `og.png`; add meta tags; `check_site.py` → OK.
- [ ] **Step 2:** Phone (375×812): each pinned section's finished state fits one screen; `scrollWidth <= innerWidth` everywhere. Fix CSS under `@media (max-width: 900px)` (chat replaces the feed at the end of the job and news builds).
- [ ] **Step 3:** Reduced motion emulation → no pins, all finished content visible.
- [ ] **Step 4:** Desktop 1440×900 light pass through all three builds; no console errors.
- [ ] **Step 5: Commit**, push `main`, wait for Pages, confirm the live page contains "Options Analytics Dashboard" and the og image URL returns 200.

## Later (not free)
- Custom domain (~$12/yr).
