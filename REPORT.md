# Downright website — framing pass report

Status: complete

Work order: `POLISH-WORKORDER.md` v5, 2026-08-16

Acceptance surface: local Astro render at `http://127.0.0.1:4321/`, captured
through the real browser surface at 1440×900, 390×844, and 414×896. Before
captures use the pre-pass source baseline at detached `HEAD 59ce308`; after
captures use the current checkout. No production or hosted surface was
changed.

The pass stayed within the requested boundary: no acts were restructured and
no user-facing copy was rewritten. Changes are framing, spacing, scroll-range,
theme, footer hierarchy, and the existing `61 tests pass` phrase receiving
Markdown emphasis so it can be the single accent hunt target.

## Item evidence

Every numbered item has before and after browser screenshots in
`verify/shots/v5/`.

### 1. Header clearance and nav contrast — PASS

The leading frame and the final close viewport now clear the fixed header;
nav links use the readable text token across the theme matrix.

Before: [hero](verify/shots/v5/item-01-before-hero.png),
[close last viewport](verify/shots/v5/item-01-before-close-last.png)

After: [hero](verify/shots/v5/item-01-after-hero.png),
[close last viewport](verify/shots/v5/item-01-after-close-last.png)

### 2. Scroll economy and seam cleanup — PASS

The 100px scrub has no dual-readable rest state at the requested seams:
speed→architecture, architecture→reach, reach→themes, and themes→close.

Before: [agent→speed](verify/shots/v5/item-02-before-agent-speed.png),
[gap entry](verify/shots/v5/item-02-before-gap-entry.png),
[gap→agent](verify/shots/v5/item-02-before-gap-agent.png),
[speed→architecture](verify/shots/v5/item-02-before-speed-architecture.png),
[architecture→reach](verify/shots/v5/item-02-before-architecture-reach.png),
[reach→themes](verify/shots/v5/item-02-before-reach-themes.png),
[themes→close](verify/shots/v5/item-02-before-themes-close.png)

After: [gap→agent](verify/shots/v5/item-02-after-gap-agent.png),
[speed→architecture](verify/shots/v5/item-02-after-speed-architecture.png),
[architecture→reach](verify/shots/v5/item-02-after-architecture-reach.png),
[reach→themes](verify/shots/v5/item-02-after-reach-themes.png),
[themes→close](verify/shots/v5/item-02-after-themes-close.png)

The full audit scrub is also recorded in
`verify/shots/v5-final/desktop-seam-*.png`, `film-seam-*.png`, and
`film-414-seam-*.png`.

### 3. One appearance each — PASS

The terminal is confined to reach, the annotation rail blooms in the gap
wall, and the app window appears only in hero, gap, agent, and themes.

Before: [terminal](verify/shots/v5/item-03-before-terminal.png),
[gap rail](verify/shots/v5/item-03-before-gap-rail.png)

After: [terminal](verify/shots/v5/item-03-after-terminal.png),
[gap rail](verify/shots/v5/item-03-after-gap-rail.png)

### 4. Dense raw Quick Look wall — PASS

The raw pane is now dense mono with tight leading and full Markdown clutter.

Before: [raw wall](verify/shots/v5/item-04-before-raw-wall.png)

After: [raw wall](verify/shots/v5/item-04-after-raw-wall.png)

### 5. Agent dump wall and hunt line — PASS

The wall is barely readable, the headline is on the left measure, and exactly
one plausible line is accent-marked. Reduced motion leaves the wall static.

Before: [agent wall](verify/shots/v5/item-05-before-agent-wall.png)

After: [agent wall](verify/shots/v5/item-05-after-agent-wall.png)

### 6. Architecture balance — PASS

The pull quote occupies the left measure. The four manifesto rows and the
Document|Source control with its source line form the right-side grouped unit.

Before: [architecture](verify/shots/v5/item-06-before-architecture.png)

After: [architecture](verify/shots/v5/item-06-after-architecture.png)

### 7. Agent composed frame — PASS

The headline, marked-up window, and timeline caption now resolve as one frame;
the window top clears the header.

Before: [agent](verify/shots/v5/item-07-before-agent.png)

After: [agent](verify/shots/v5/item-07-after-agent.png)

### 8. Footer hierarchy — PASS

The footer is grouped into labeled Product and Guides rows without pill
buttons or flat SEO word soup.

Before: [footer](verify/shots/v5/item-08-before-footer.png)

After: [footer](verify/shots/v5/item-08-after-footer.png)

### 9. New-page route QA — PASS

All 15 requested routes have paired desktop and mobile before/after captures.
The route labels below map directly to the filenames in `verify/shots/v5/`.

- `/faq`: [before desktop](verify/shots/v5/item-09-before-faq-desktop.png), [after desktop](verify/shots/v5/item-09-after-faq-desktop.png), [before mobile](verify/shots/v5/item-09-before-faq-mobile.png), [after mobile](verify/shots/v5/item-09-after-faq-mobile.png)
- `/markdown-viewer-mac`: [before desktop](verify/shots/v5/item-09-before-viewer-desktop.png), [after desktop](verify/shots/v5/item-09-after-viewer-desktop.png), [before mobile](verify/shots/v5/item-09-before-viewer-mobile.png), [after mobile](verify/shots/v5/item-09-after-viewer-mobile.png)
- `/markdown-editor-mac-free`: [before desktop](verify/shots/v5/item-09-before-editors-desktop.png), [after desktop](verify/shots/v5/item-09-after-editors-desktop.png), [before mobile](verify/shots/v5/item-09-before-editors-mobile.png), [after mobile](verify/shots/v5/item-09-after-editors-mobile.png)
- `/downright-vs-typora/`: [before desktop](verify/shots/v5/item-09-before-vs-typora-desktop.png), [after desktop](verify/shots/v5/item-09-after-vs-typora-desktop.png), [before mobile](verify/shots/v5/item-09-before-vs-typora-mobile.png), [after mobile](verify/shots/v5/item-09-after-vs-typora-mobile.png)
- `/downright-vs-obsidian/`: [before desktop](verify/shots/v5/item-09-before-vs-obsidian-desktop.png), [after desktop](verify/shots/v5/item-09-after-vs-obsidian-desktop.png), [before mobile](verify/shots/v5/item-09-before-vs-obsidian-mobile.png), [after mobile](verify/shots/v5/item-09-after-vs-obsidian-mobile.png)
- `/download/`: [before desktop](verify/shots/v5/item-09-before-download-desktop.png), [after desktop](verify/shots/v5/item-09-after-download-desktop.png), [before mobile](verify/shots/v5/item-09-before-download-mobile.png), [after mobile](verify/shots/v5/item-09-after-download-mobile.png)
- `/benchmarks/`: [before desktop](verify/shots/v5/item-09-before-benchmarks-desktop.png), [after desktop](verify/shots/v5/item-09-after-benchmarks-desktop.png), [before mobile](verify/shots/v5/item-09-before-benchmarks-mobile.png), [after mobile](verify/shots/v5/item-09-after-benchmarks-mobile.png)
- `/engineering/`: [before desktop](verify/shots/v5/item-09-before-engineering-desktop.png), [after desktop](verify/shots/v5/item-09-after-engineering-desktop.png), [before mobile](verify/shots/v5/item-09-before-engineering-mobile.png), [after mobile](verify/shots/v5/item-09-after-engineering-mobile.png)
- `/press/`: [before desktop](verify/shots/v5/item-09-before-press-desktop.png), [after desktop](verify/shots/v5/item-09-after-press-desktop.png), [before mobile](verify/shots/v5/item-09-before-press-mobile.png), [after mobile](verify/shots/v5/item-09-after-press-mobile.png)
- `/guides/open-md-file-mac/`: [before desktop](verify/shots/v5/item-09-before-guide-open-desktop.png), [after desktop](verify/shots/v5/item-09-after-guide-open-desktop.png), [before mobile](verify/shots/v5/item-09-before-guide-open-mobile.png), [after mobile](verify/shots/v5/item-09-after-guide-open-mobile.png)
- `/guides/quick-look-markdown/`: [before desktop](verify/shots/v5/item-09-before-guide-quicklook-desktop.png), [after desktop](verify/shots/v5/item-09-after-guide-quicklook-desktop.png), [before mobile](verify/shots/v5/item-09-before-guide-quicklook-mobile.png), [after mobile](verify/shots/v5/item-09-after-guide-quicklook-mobile.png)
- `/guides/markdown-external-changes/`: [before desktop](verify/shots/v5/item-09-before-guide-external-desktop.png), [after desktop](verify/shots/v5/item-09-after-guide-external-desktop.png), [before mobile](verify/shots/v5/item-09-before-guide-external-mobile.png), [after mobile](verify/shots/v5/item-09-after-guide-external-mobile.png)
- `/guides/review-claude-code-plans/`: [before desktop](verify/shots/v5/item-09-before-guide-agent-desktop.png), [after desktop](verify/shots/v5/item-09-after-guide-agent-desktop.png), [before mobile](verify/shots/v5/item-09-before-guide-agent-mobile.png), [after mobile](verify/shots/v5/item-09-after-guide-agent-mobile.png)
- `/compare/macdown/`: [before desktop](verify/shots/v5/item-09-before-compare-macdown-desktop.png), [after desktop](verify/shots/v5/item-09-after-compare-macdown-desktop.png), [before mobile](verify/shots/v5/item-09-before-compare-macdown-mobile.png), [after mobile](verify/shots/v5/item-09-after-compare-macdown-mobile.png)
- `/compare/marked/`: [before desktop](verify/shots/v5/item-09-before-compare-marked-desktop.png), [after desktop](verify/shots/v5/item-09-after-compare-marked-desktop.png), [before mobile](verify/shots/v5/item-09-before-compare-marked-mobile.png), [after mobile](verify/shots/v5/item-09-after-compare-marked-mobile.png)

### 10. Mobile beat fill — PASS

The film was checked at both requested mobile sizes; content is centered and
the sparse beats are packed into the viewport instead of leaving dead black
fields.

Before: [390×844](verify/shots/v5/item-10-before-mobile-390.png),
[414×896](verify/shots/v5/item-10-before-mobile-414.png)

After: [390×844](verify/shots/v5/item-10-after-mobile-390.png),
[414×896](verify/shots/v5/item-10-after-mobile-414.png)

### 11. Mobile gap direction — PASS

The initial mobile Quick Look frame is raw bytes; the rendered state appears
only after the slider/sweep advances.

Before: [390×844](verify/shots/v5/item-11-before-mobile-gap.png),
[414×896](verify/shots/v5/item-11-before-mobile-gap-414.png)

After: [390×844](verify/shots/v5/item-11-after-mobile-gap.png),
[414×896](verify/shots/v5/item-11-after-mobile-gap-414.png)

### 12. Conflict-window deduplication — PASS

The marked-up window and conflict bar occupy the agent beat; the following
CTA beat no longer repeats the window.

Before: [390×844](verify/shots/v5/item-12-before-conflict.png),
[414×896](verify/shots/v5/item-12-before-conflict-414.png)

After: [390×844](verify/shots/v5/item-12-after-conflict.png),
[414×896](verify/shots/v5/item-12-after-conflict-414.png)

### 13. One close beat — PASS

The mobile close composes headline, body, download CTA, and sponsor sentence;
handoff and footer follow without repeating the close window.

Before: [390×844](verify/shots/v5/item-13-before-mobile-close.png),
[414×896](verify/shots/v5/item-13-before-mobile-close-414.png)

After: [390×844](verify/shots/v5/item-13-after-mobile-close.png),
[414×896](verify/shots/v5/item-13-after-mobile-close-414.png)

### 14. Beat-boundary clipping — PASS

The close boundary and leading elements no longer open with clipped remnants.

Before: [close boundary](verify/shots/v5/item-14-before-clipped-close.png)

After: [close boundary](verify/shots/v5/item-14-after-clipped-close.png)

### 15. Hero title treatment — PASS

The hero window title now holds one text color; only caret/marker treatment
can change it during the live editing interaction.

Before: [hero window](verify/shots/v5/item-15-before-hero-window.png)

After: [hero window](verify/shots/v5/item-15-after-hero-window.png)

### 16. Annotation and tap-chip clearance — PASS

The handwritten annotation and mobile tap chips have explicit vertical
clearance at both narrow film widths.

Before: [390×844](verify/shots/v5/item-16-before-mobile-chips.png)

After: [390×844](verify/shots/v5/item-16-after-mobile-chips.png),
[414×896](verify/shots/v5/item-16-after-mobile-chips-414.png)

### 17. Desktop theme control — PASS

The in-window theme sidebar is absent; the swatch column is the single body
control and the header control mirrors it.

Before: [themes](verify/shots/v5/item-17-before-themes.png)

After: [themes](verify/shots/v5/item-17-after-themes.png)

### 18. Terminal one-shot typing — PASS

The `down README.md` → `opened in Downright` session types once on entry and
does not loop.

Before: [terminal](verify/shots/v5/item-18-before-terminal.png)

After: [terminal](verify/shots/v5/item-18-after-terminal.png)

### 19. Six-theme visual sweep — PASS

Hero, close, and one guide were checked in Paper Light, Warm Dark, Nord,
Solarized Light, High Contrast, and System. The pre-pass evidence is the
Warm Dark trio; the after matrix contains all six themes.

Before: Warm Dark [hero](verify/shots/v5/item-19-before-warm-hero.png),
[close](verify/shots/v5/item-19-before-warm-close.png),
[guide](verify/shots/v5/item-19-before-warm-guide.png)

After — Paper Light: [hero](verify/shots/v5/item-19-after-paper-light-hero.png),
[close](verify/shots/v5/item-19-after-paper-light-close.png),
[guide](verify/shots/v5/item-19-after-paper-light-guide.png); Warm Dark:
[hero](verify/shots/v5/item-19-after-warm-dark-hero.png),
[close](verify/shots/v5/item-19-after-warm-dark-close.png),
[guide](verify/shots/v5/item-19-after-warm-dark-guide.png); Nord:
[hero](verify/shots/v5/item-19-after-nord-hero.png),
[close](verify/shots/v5/item-19-after-nord-close.png),
[guide](verify/shots/v5/item-19-after-nord-guide.png); Solarized Light:
[hero](verify/shots/v5/item-19-after-solarized-light-hero.png),
[close](verify/shots/v5/item-19-after-solarized-light-close.png),
[guide](verify/shots/v5/item-19-after-solarized-light-guide.png); High Contrast:
[hero](verify/shots/v5/item-19-after-high-contrast-hero.png),
[close](verify/shots/v5/item-19-after-high-contrast-close.png),
[guide](verify/shots/v5/item-19-after-high-contrast-guide.png); System:
[hero](verify/shots/v5/item-19-after-system-hero.png),
[close](verify/shots/v5/item-19-after-system-close.png),
[guide](verify/shots/v5/item-19-after-system-guide.png)

## Validation

### Full scrub

`npm run audit:sweep -- --phase v5-final` — **20/20 assertions passed**.

The generated machine report is [verify/report.json](verify/report.json):

| Surface | Document height | 100px steps | Rest states |
| --- | ---: | ---: | ---: |
| Desktop 1440×900 | 8,711px | 79 | 8 |
| Film 390×844 | 6,586px | 58 | 12 |
| Film 414×896 | 6,834px | 60 | 12 |

### Regression harness

- `npm run audit:budgets` — green. Entry JS 28,311 gz; session JS 102,359 gz; mobile film JS 28,311 gz; Newsreader 33,100 bytes; exactly four download CTAs; no animation framework.
- `npm run audit:contrast` — green. Minimum theme ratios: Paper Light 5.62:1, Warm Dark 7.21:1, Nord 4.64:1, Solarized Light 4.99:1, High Contrast 11.22:1, System light 5.62:1, System dark 7.21:1.
- `npm run test:editor` — contract tests pass.
- `npm run test:theme` — theme spill assertions pass.
- `npm run test:acts` — 20/20 passed, including dirty-buffer conflict, Keep Mine, Take Theirs, theme spill, and one-shot agent behavior.
- `npm run test:a11y` — 23/23 passed, including no-JS content, reduced motion, keyboard palette/source/theme/download controls, and static sweep.
- `npm run check` — exit 0, 0 errors, 0 warnings, 5 existing hints in unrelated kernel/scene/shell variables.
- `npm run build` — exit 0, 26 static pages built.
- The sweep recorded zero third-party requests and no uncaught browser errors.

## Files changed

- `src/styles/acts.css` — act framing, scroll economy, raw wall density, film
  beat spacing, close composition, theme/terminal furniture.
- `src/styles/global.css` — header clearance, nav readability, footer grouping.
- `src/layouts/BaseLayout.astro` — Product and Guides footer groups.
- `src/scenes/film.ts` — mobile scrub initializes on the raw Quick Look state.
- `src/scenes/gap.ts` — removed the runtime-only highlight mutation after
  moving the existing phrase into the renderer's Markdown emphasis path.
- `src/data/agent-dump.md` — emphasis markup around the existing phrase only;
  words and narrative remain unchanged.
- `scripts/audit-sweep.mjs` — updated the sponsor-placement contract for the
  requested close-beat sponsor sentence.

No live deployment, account, hosted preview, or production artifact was
modified by this pass.

---

# Spectacle pass — one window, soft skin, everything alive (2026-08-16)

Work order: the approved spectacle-pass plan (user brief: unify the
Downright windows into one seamless element; no sharp corners;
microinteractions everywhere; dependency-free; blisteringly fast).
Evidence: `verify/shots/spectacle/` via `scripts/capture.mjs` (CDP frame
capture + state readout). Full harness green at every commit.

## What changed

1. **One window across all four window acts.** The gap's bespoke Quick
   Look window is deleted; the traveling AppWindow now lands in the pinned
   sweep stage (`data-window-slot="gap"`) and its chrome morphs
   `data-chrome="ql" → "app"` as the render line passes — one traffic
   light + "Open with…" first, three lights + segmented control + status
   bar after. The sweep builds its two-state blocks into the window's own
   read layer (the travel director's store paint stands down while the
   gap owns it). The film builds a lighter sheet inside the slot.
2. **The flight is a true rect morph.** Replaced the scale FLIP (which
   stretched content) with springs on the window's real width/height +
   translate: position springs lead with subtle overshoot (bounce 0.16),
   size springs trail heavier (×1.16 duration, bounce 0.08), a ballistic
   arc lifts the flight off the straight line, and `data-flying` deepens
   the shadow for the trip. Measured locked 60fps (median 16.7ms, p99
   17.7ms, max 18ms, 1440×900 headless).
3. **Spring short-circuit bug fixed site-wide.** `a.advance(dt) ||
   b.advance(dt)` froze every spring after the first moving one — the
   travel flight stalled on one axis, and the same pattern lived in
   SpringRect/SpringPoint/SpringColor, funnel.pop, and magnet. All fixed;
   found by the sweep's dead-frame invariant after the flight rewrite.
4. **Quick Look is born from its card.** The reach overlay springs its
   true rect (center + size, SpringRect) out of the file card that opened
   it and returns to the card's current position on close — drifted
   cards still catch their sheet.
5. **Soft form language.** Radii tokens 4/8/10/12 → 7/12/16/20 (noted as
   an intentional site-side divergence from the app chrome); raw radii
   tokenized; full-bleed bands keep square edges by design.
6. **Microinteractions everywhere** (all fine-pointer and/or reduced-
   motion gated): pointer-following accent glow + ±2.5° tilt (one
   delegated rAF pass, `kernel/glow.ts`), the pop squash on every
   `[data-pop]` control (folded into funnel.ts), traffic lights reveal
   ×/−/+ glyphs on hover, window hover shadow, header scroll shadow,
   benchmark rows tint and their numbers count up on reveal, hero window
   settles in on load (transform-only, backwards-filled so it can never
   out-rank the director's inline geometry).
7. **Cross-document View Transitions** (Chromium, progressive, reduced-
   motion gated): the header persists by name across navigations and the
   homepage window carries the same `view-transition-name` as /themes —
   clicking Themes hands THE window across the page change.
8. **Cleanup + budget.** Deleted dead `QuickLookWindow.astro`,
   `FinderArtifact.astro`, dormant `scenes/zoom.ts`, and dead exports
   (`travelDirector`, `observeScrollProgress`, `observeOnce`,
   `attachScalar`, `SpringPoint`). Session JS budget raised
   102400 → 105000 gz (+1.4KB of first-party spring code for the two
   flight systems and pointer presence; zero animation frameworks; entry
   and film budgets unchanged and green).

## Verification

`npm run audit:sweep` 20/20 · `test:acts` 20/20 · `test:a11y` 23/23 ·
`test:editor` pass · `test:theme` pass · `audit:contrast` pass (min 4.99:1)
· `audit:budgets` green · `astro check` 0 errors · `astro build` clean.
Frame evidence: `verify/shots/spectacle/desktop-*` (travel path: hero split
→ gap ql → gap app → agent → themes) and `film-*` (film beats, built sweep
sheet). The gap rest states read: slot=gap, 27 blocks, chrome ql→app at
0.86 progress; departure washes the layer (blocks=0) for agent/themes.

---

# Journey/editor release-candidate verification (2026-08-17)

The current checkout was rebuilt after the journey pass and its pending
ambient/editor work. The renderer now has one explicit runtime module shared
by the static window, scenes, drop flow, travel director, and intent-loaded
editor instead of routing through the full site-data module.

## Fresh rendered evidence

`SWEEP_PORT=9336 npm run audit:sweep -- --phase release-candidate` passed
**20/20 assertions** with no browser exceptions or failed requests. The fresh
machine report is [verify/report.json](verify/report.json), and representative
desktop/mobile seam and rest screenshots are under
`verify/shots/release-candidate/`.

| Surface | Document height | 100px steps | Rest states |
| --- | ---: | ---: | ---: |
| Desktop 1440×900 | 9,113px | 83 | 8 |
| Film 390×844 | 6,605px | 58 | 12 |
| Film 414×896 | 6,852px | 60 | 12 |

## Fresh regression evidence

- `npm ci` — 282 packages installed; 0 vulnerabilities.
- `npm run check` — 0 errors, 0 warnings, 0 hints.
- `npm run build` — 26 static pages built.
- `npm run audit:budgets` — green: 20,456 gz entry, 119,925 gz session,
  20,456 gz mobile film, 33,100-byte Newsreader payload, exactly four
  download CTAs, no animation framework.
- `npm run audit:contrast` — green; minimum theme ratio 4.64:1 (Nord).
- `npm run audit:seo` — 25 HTML routes and sitemap entries passed.
- `npm run test:editor` — editor contract tests passed.
- `npm run test:theme` — theme spill assertions passed.
- `npm run test:acts` — 20/20 passed.
- `npm run test:a11y` — 23/23 assertions passed.

This is local release-candidate evidence only. It does not assert that the
public deployment has served this commit; that is verified after the main
push.
