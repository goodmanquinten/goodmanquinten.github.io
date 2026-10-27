# Scroll-driven portfolio redesign — design

Date: 2026-10-27
Replaces the layout of `2026-09-28-portfolio-site-design.md` (same repo, hosting, privacy rules).
Prototype that this design is based on: `.superpowers/brainstorm/1289-1793121989/content/scroll-prototype-v4.html`.

## Intent

The current site is tasteful but reads as a template: screenshots in cards. Quinten treats the
site as his personal brand. A recruiter who closes it after 30 seconds should think: **unique,
technical, tasteful, high effort.** The story is that he enjoys financial markets, AI workflows
and AI analysis; the three projects are the evidence, and each one *builds itself* as you scroll.

## Goals

- Scroll-driven storytelling: name → project 1 builds itself → project 2 → project 3 → close.
- The visitor never has to click or hover to get the story. Motion shows; it doesn't decorate.
- Each build shows a **method**: set rules → things that break them are removed with the reason
  shown → what survives is picked/ranked. Same visual language across all three projects.
- Feels high-effort: smooth scrolling, distinctive type, a section progress rail, link preview image.

## Non-goals

- No interactivity required (no hover-to-reveal, no clicking to advance).
- No framework or build step. No paid services.

## Anti-goals (failure even if it works)

- Plain screenshots placed on a page.
- Copy that sounds AI-written, or clever taglines/personas ("the underwriter" etc. — user called this cringe).
- Long dead scroll between builds (v1/v2 were too long; v4's ~850px pin per project is the ceiling).
- Showing Quinten's real positions, balances, P&L or phone number.

## Structure and content (decided)

Project names are plain descriptions, not product names (repo names stay as they are).

1. **Hero** — "Quinten Goodman", one muted line "Finance × AI · MSc Finance, Nova SBE", scroll cue.
2. **01 Options Analytics Dashboard** — label `REAL DATA · NBIS · <snapshot date>`.
   - Copy: "Maps dealer gamma exposure across strikes and expirations, then checks candidate puts
     against my delta, expiration and yield limits to pick a strike."
   - Build: real NBIS GEX heatmap (every expiry 0–28 DTE, ±10 strikes around spot) fills in → spot
     line → zero-gamma flip → limit bands (7–28 DTE, put Δ 0.15–0.30) → three real candidate puts
     appear with delta / annualized premium / GEX at strike → the ones breaking a limit are struck
     with the reason → winner outlined gold with a one-line verdict.
   - Limits panel: 1 Expiration 7–28 days · 2 Put delta 0.15–0.30 · 3 ≥ 12% annualized premium ·
     4 Positive gamma wall at or below strike.
   - Data: one snapshot from Tradier via WheelTracker's own client + GEX engine, frozen into
     `data/nbis.json`. Candidates are chosen by applying the four limits to the real chain: the
     winner is the best-annualized put passing all four; the two losers are the nearest
     candidates that each fail a different limit. If no real put passes all four that day, show
     the closest and say "no trade today" honestly rather than inventing one.
3. **02 AI Job Search Agent** — label `SAMPLE DATA`, fictional companies.
   - Copy: "Pulls new postings every week, removes anything that breaks my rules, scores the rest
     against my interests and experience, and sends me a ranked shortlist." (No "Claude scores".)
   - Rules: 1 Entry level, ≤ 2 yrs required · 2 Starts summer 2027 or later · 3 U.S. or Europe ·
     4 Finance, AI, tech or consulting.
   - Build: postings slide in → each failure flashes its rule red, shows "✕ N · reason", gets
     struck and collapses → survivors get "fit N/10" → fake Telegram chat "JobScout" builds the
     "Jobs this week" message line by line with `/save N, /applied N or /skip N`.
4. **03 AI Market News Digest** — label `REAL DATA · SEP 13, 2026` (as in v4).
   - Real INTC headlines from `wheel_tracker.db` → 13F filings / listicles / syndicated repeats
     struck with tags → the two headlines the digest used light up → the real 16:30 digest builds
     with real links.
5. **Close** — plain, factual, from the 2026 resume:
   - Nova SBE, MSc Finance (expected June 2027); Nova Students Portfolio, student-managed fund member.
   - ASU W. P. Carey, B.S. Finance and Management, 4.0 major GPA (May 2026); Korea University exchange.
   - Solugenix, Staff Accountant Intern (Oct 2023–May 2026): credit-facility benchmarking, payroll
     and asset-tracking automation, Ramp rollout.
   - Links: Resume (PDF, existing phone-free `assets/resume.pdf`), quinten@goodmansonline.com,
     linkedin.com/in/quintengoodman, github.com/goodmanquinten.
   - Each project section also ends with a small "View code" link (WheelTracker repo, JobScout
     repo, WheelTracker `src/wheel_tracker/news`).

## Look and motion (decided)

- Dark, data-first (direction B): near-black background, off-white ink, cyan accent, gold for the
  winning pick, red for removals.
- Free upgrades, all included: Lenis smooth scrolling; GSAP + ScrollTrigger (free) with pinned,
  scrubbed timelines; Fontshare display font for headings (my call: General Sans or Clash Display,
  JetBrains Mono for data); a fixed 01·02·03 progress rail; `prefers-reduced-motion` shows each
  section in its finished state with no pinning; Open Graph/Twitter link-preview image (1200×630,
  generated from the hero) and meta tags.
- Phones (< 900px): no side-by-side; the Telegram panel sits under the build and the pin length
  accounts for it, or the chat replaces the feed at the end of the build. Must show the finished
  state inside one screen.

## Constraints

- Static files on GitHub Pages (`goodmanquinten.github.io`), no build step; libraries from
  cdnjs/jsdelivr; fonts from Fontshare/Google Fonts.
- Existing `scripts/check_site.py` keeps passing (update its required-text list to the new names).
- No phone number anywhere; no real positions or P&L.

## Left to the builder

- Exact pin lengths (≤ ~850px each), easing, stagger timings, colors within the palette.
- File split (`index.html`, `style.css`, `js/*.js`, `data/*.json`).
- How the OG image is produced (a static PNG rendered once is fine).

## Later (not free, noted only)

- Custom domain (e.g. quintengoodman.com, ~$12/yr) pointed at GitHub Pages.
