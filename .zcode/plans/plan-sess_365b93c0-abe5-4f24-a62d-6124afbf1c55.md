# Downright site — spectacle pass: one window, soft skin, everything alive

## What exists (and what we build on)

The site already has the right bones: **one persistent AppWindow node** already travels hero → agent → themes via a spring-FLIP "WindowDirector" (`src/shell/travel.ts`), a shared rAF spring kernel (`src/kernel/`), pointer magnetism (`magnet.ts`), squash-stretch press (`funnel.ts pop()`), an OKLab theme-spill wave (`spill.ts`), and velocity-aware stagger (`pacing.ts`). The gaps: the gap act uses a **second, bespoke window** with a hard-cut chrome swap; reach's Quick Look overlay pops in with no lineage; the radius scale (4/8/10/12px) reads sharp; microinteractions cover only a few elements. The overhaul extends the existing machinery — no new dependencies (CI-enforced: audit:budgets bans animation frameworks; entry JS ≤32KB gz).

## Phase 0 — Commit the finished framing pass
The working tree holds the completed v5 framing pass (REPORT.md says complete, diff is small and coherent). Commit it as its own commit first so this pass stays reviewable.

## Phase 1 — Soft form language (tokens + sweep)
- Retune `tokens.css` radii: chip 4→7, button 8→12, panel 10→16, window 12→20 (add a divergence note to the "traced to Motion.swift" comment — site now intentionally runs softer than the app chrome).
- Sweep all raw radii in `acts.css`/`global.css` so every **discrete object** (cards, chips, marks, badges, segmented control, toasts, terminal, gutter elements) reads from the token scale. Full-bleed edge-to-edge bands (gap wall, conflict bar desktop) keep square edges — their corners bleed off-screen.
- Ensure window body/status-bar corners clip to the face radius (overflow discipline).

## Phase 2 — One window everywhere (the centerpiece)
- **Gap act joins the travel roster**: replace the bespoke `.sweep__window` (index.astro:110-121, dual-chrome hard cut) with the traveling AppWindow claimed by a new `gap` slot inside the pinned sweep stage. The WindowDirector gains slot "gap" between hero and agent.
- **Chrome morph states instead of hard cuts**: `data-chrome="ql" | "app"` on the window — Quick Look state hides segmented control / dirty label / status bar and shows the single-light cool bar; app state restores full chrome. Both crossfade on `--motion-standard` (replaces `@keyframes chrome-in` cut). The sweep's raw/render blocks become the window's existing source/read panes (doc store already repaints them).
- **Quick Look overlay lineage (reach)**: overlay morphs from the clicked/dropped file card's rect using the currently-unused `SpringRect` kernel primitive (scale+translate birth instead of fade-in).
- Respect the framing-pass laws: window appears in hero/gap/agent/themes only; terminal stays a distinct artifact in reach; architecture act keeps driving the window's view remotely.
- Mobile film keeps its simpler CSS-FLIP travel; it inherits the rounded tokens automatically.

## Phase 3 — Microinteractions everywhere (soft + alive)
Built on the existing kernel, one new tiny module (~1KB unminified) plus CSS:
- **Pointer-glow**: single delegated rAF-throttled pointermove listener writes `--px/--py` on window/cards/panels; CSS renders a soft accent wash + border light that follows the cursor (fine-pointer only).
- **Press everywhere**: generalize `pop()` (squash-stretch + radius swell) to segmented tabs, theme options, architecture mode buttons, terminal-install options, film chips.
- **Window chrome life**: traffic lights reveal ×/−/+ glyphs on hover (CSS-only); window hover = shadow deepen + 1px lift; status-bar meters tick with springs.
- **Card tilt**: file cards and annotation notes get ≤3deg spring-settled tilt + lift on hover.
- **Header condense**: `has-scrolled` class (already exists) drives a height/shadow transition.
- **Entrances**: hero window settle-in (transform/opacity only, LCP-safe), act reveals staggered via `pacedStagger`, benchmark numbers count up on first reveal (springs).
- All gated by `prefers-reduced-motion` + the existing in-page Motion toggle; hover effects behind `(pointer: fine)`.

## Phase 4 — Browser-native spectacle (progressive, ~0 bytes)
- Cross-document **View Transitions** (`@view-transition { navigation: auto }`) with a shared `view-transition-name` on the homepage and /themes windows — clicking "Themes" morphs the window across the page navigation in Chromium; Safari/Firefox get normal loads. Disabled under reduced motion.

## Phase 5 — Cleanup + harness green
- Delete dead code freed by unification: `QuickLookWindow.astro`, `FinderArtifact.astro`, dormant `zoom.ts` staging we don't reuse (its FLIP patterns get folded into the director), dead exports (`travelDirector`, `attachScalar`, `observeScrollProgress`, `observeOnce`, `SpringPoint`).
- Update `audit-sweep.mjs` fingerprints for the unified window (invariants stay: exactly one `.app-window` per scroll step — now truer than ever — unique rest-state fingerprints, no collisions, ≥40% composed frames).
- Keep every contractual hook: `data-view`, `data-slot`, `data-chrome`, `live-*` classes, exactly 4 download CTAs, `--band-bg: #f7f4ee` on light themes, theme spill must stay animated (test:acts).

## Verification loop (per the workorder discipline)
Reproduce → screenshot → fix → screenshot → look, for every phase, at 1440×900 + 390×844. Keep green throughout: `npm run audit:sweep`, `audit:contrast`, `audit:budgets`, `test:editor`, `test:theme`, `test:acts`, `test:a11y`, `astro build`. Commit in small described steps; finish with an updated REPORT.md section covering this pass with before/after shots in `verify/shots/`.