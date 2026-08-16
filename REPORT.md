# Downright website execution report

Status: complete for all six website phases in the local checkout. The site is built and verified locally; no production deployment, release upload, or repository push was performed.

## Governing decision: no screenshots on the website

The final website publishes live HTML, CSS, generated Markdown payload data, and text/geometric SVG social cards. It does not publish product screenshots.

- Removed the changelog screenshot surface and its screenshot styling.
- Removed all screenshot references from routes, generated HTML, OG generation, mirrors, and copy.
- Removed twelve legacy screenshot files from `public/assets` so they are not directly addressable in a build. They were preserved at `/Volumes/Neural/downright-website-unpublished-assets-2026-08-16`.
- Kept only the Downright app icon in `public/assets`; it is branding, not a product screenshot.
- Replaced screenshot-based OG cards with text/geometric SVGs. The built OG files contain no `<image href>` elements.
- Local QA screenshots remain under the gitignored `verify/` directory only. They are evidence for review and are not website assets.

## Six-phase ledger

### Phase 1 — one act at a time

Commit `76a3851` — `Phase 1: compose one act at a time`.

Re-cut the homepage into a seven-beat film, established the initial reveal system, solid header, live architecture window, single travelling app-window behavior, and simplified close act. The initial hard-cut ownership model was replaced in Phase 6 with continuous native scroll flow after live visual QA exposed a teleport at act boundaries.

### Phase 2 — native payload grounding

Commit `d199f67` — `Phase 2: ground the story in the native payload`.

Authorized `/Volumes/Neural/Downright/Docs/sample.md` renderer-showcase content and regenerated the website payload. The live surface now demonstrates headings, inline styles, links, math, tables, callouts, tasks, code, Mermaid, and footnotes from the native source.

### Phase 3 — editor reliability and screenshot removal

Commit `0875712` — `Phase 3: harden editor and remove screenshot embeds`.

Fixed mobile duplicate editor mounting, source-to-document repaint drift, first-click caret placement, and false-positive audit collisions. Removed the screenshot capture component, screenshot links, capture CSS, and screenshot-facing copy.

### Phase 4 — CTA and mobile polish

Commit `6f8c6a2` — `Phase 4: simplify CTAs and tighten mobile polish`.

Made the visible CTA exactly `Download for macOS`, removed the CTA micro-suffix and dead stat-tile styling, restored contrast on mobile handoff actions, and prevented the film invite/chip overlap.

### Phase 5 — answerability and entity surface

Commit `737ce64` — `Phase 5: make the site answerable`.

Added the canonical product description across page metadata, RSS, Markdown mirrors, `humans.txt`, and `llms.txt`; added `SoftwareApplication` JSON-LD and an `FAQPage` schema; added `robots.txt`, sitemap `lastmod` values, guide navigation, Markdown twins, and five concise answer routes:

- `/markdown-viewer-mac`
- `/markdown-editor-mac-free`
- `/downright-vs-typora`
- `/downright-vs-obsidian`
- `/faq`

The comparison copy was checked against first-party publisher pricing and documentation for [Typora](https://store.typora.io/), [iA Writer](https://ia.net/writer/pricing), [Obsidian](https://obsidian.md/pricing), [MacDown](https://github.com/MacDownApp/macdown), and [Zettlr](https://www.zettlr.com/about).

### Phase 6 — final cleanup, validation, and handoff

Removed the remaining dead screenshot-only CSS selectors and completed the interaction polish pass:

- Replaced the binary `visibility: hidden` act gate with continuous document flow. `data-active` remains a focus marker for the rail/choreography, but adjacent scenes stay present long enough to hand off without a blank teleport.
- Made band backgrounds follow `var(--bg)` in every generated theme, removing the light-theme dark panel leak and the slight background flash at section boundaries while keeping cards, rules, and type hierarchy intact.
- Kept the theme spill on the full computed token palette, anchored the native theme popover in the header, and added finite hover/active/focus feedback for the theme control, nav, palette, architecture tabs, showroom, mobile menu, and install chip.
- Made the live raw/rendered sweep rebuild-safe: when the editor rebuilds its DOM, the existing scroll listener repaints the new blocks on the next frame instead of exposing raw and rendered layers together.
- Updated the geometry sweep to allow only adjacent-act handoffs; non-adjacent exposure, dead frames, clipping, collisions, and funnel regressions remain hard failures.

Rebuilt the static site, reviewed the rendered handoff at desktop width in dark and light palettes, checked the exact speed-band boundary, and reviewed the film view at both mobile widths.

## Validation evidence

Final static-preview sweep: `SWEEP_PORT=9336 npm run audit:sweep -- --phase phase-6-final` — **20/20 assertions passed**.

The final sweep verified:

- desktop geometry at 1440×900;
- film geometry at 390×844 and 414×896;
- download URL and `Downright.dmg` artifact semantics;
- the post-download panel appears once per session;
- exactly three sponsor placements when the panel is open, with no header placement;
- zero third-party requests;
- zero 404s, failed requests, and console errors on the clean final run.

Other final checks:

- `npm run check` — 0 errors, 0 warnings, 5 pre-existing hints;
- `npm run build` — 11 static routes built successfully;
- `npm run audit:contrast` — all theme minimums pass, lowest 4.64:1;
- `npm run audit:budgets` — green; entry JS 28,346 gz, session JS 102,394/102,400 gz, four CTAs;
- `npm run test:editor` — editor contract tests pass;
- `npm run test:theme` — theme spill assertions pass;
- `npm run test:acts` — 20/20 passed, including the light-theme band-ground assertion;
- `npm run test:a11y` — 23/23 passed, including no-JS, reduced-motion, keyboard, palette, native popover, theme, and download checks;
- live route DOM inspection — no screenshot references or `<picture>`/`<img>` elements on `/`, `/changelog`, `/markdown-editor-mac-free`, or `/faq`;
- built asset inventory — only `downright-app-icon.png` and `downright-app-icon.webp` remain under `dist/assets`.

The final geometry screenshots are local-only evidence, including:

- `verify/shots/phase-6-final/desktop-rest-hero.png`
- `verify/shots/phase-6-final/desktop-rest-agent.png`
- `verify/shots/phase-6-final/film-rest-film-agent.png`
- `verify/shots/phase-6-final/film-rest-film-handoff.png`
- `verify/shots/phase-6-final/film-414-rest-film-theme.png`

Earlier phase evidence remains available under `verify/shots/phase-2`, `verify/shots/phase-3`, `verify/shots/phase-4`, and `verify/shots/phase-5-clean`.

## Bugs found and fixed

- A second mobile `Tap to type` tap could mount another CodeMirror instance. Mounting is now guarded by the actual editor-mounted state.
- Source edits could leave the Document pane stale after switching views. The read layer now repaints from the current buffer after edits.
- The first desktop editor click always placed the caret at line 1. Hydration now preserves the initial pointer coordinates and positions the caret there.
- The invariant sweep reported nested heading/pre/figcaption collisions that belonged to one owner. Collision ownership is now tracked explicitly.
- The CTA suffix, mobile film handoff contrast, and invite/chip overlap were corrected from the visual review.
- The enhanced scroll reveal could remove the outgoing act before the incoming act arrived, producing a blank teleport. The act gate now preserves native flow and the sweep contract explicitly validates adjacent handoffs.
- Light themes inherited a hard-coded dark band ground. Band aliases now follow each theme's page background, and the theme test asserts the computed light ground.
- A live document rebuild could leave a fresh sweep block's raw and rendered layers at default opacity. Rebuilds now request the existing sweep paint loop immediately, eliminating the double image.

The headless environment cannot provide a real iOS keyboard; mobile keyboard behavior is therefore environment-limited, while pointer, focus, source-edit, undo, resize, blur/refocus, conflict resolution, and keyboard-command flows were exercised.

## Preserved lanes and remaining gates

Observed and intentionally preserved outside this website change:

- User edits in `public/apple-touch-icon.png`, `public/favicon.svg`, `src/assets/brand/mark.svg`, `src/components/BrandMark.astro`, `src/styles/global.css`, and the regenerated OG derivatives that follow the user-edited brand source.
- Untracked user workorders: `AGENT-WORKORDER.md`, `LUNA-WORKORDER.md`, and `MARKETING-PLAYBOOK.md`.
- Native checkout dirty state in `/Volumes/Neural/Downright`, including the authorized `Docs/sample.md` change and unrelated `.github/FUNDING.yml`; no native commit or reset was performed.

Still outside the proof completed here:

- production deployment and live-domain browser verification;
- a clean-machine download/install run against a signed, notarized, stapled DMG;
- a verified Homebrew cask;
- signed old-to-new Sparkle release evidence;
- physical iOS keyboard/device verification.

The five Astro hints are pre-existing unused declarations in `src/kernel/worddiff.ts`, `src/scenes/zoom.ts`, `src/shell/palette.ts`, and `src/shell/travel.ts`; no new errors or warnings were introduced.
