# Downright website — agent report (work order v3, 2026-08-15)

The build went from "ambitious but visibly broken" to a launch-ready scroll
site, driven end-to-end through the six-phase brief. Every layout claim below
was proven by geometry queried from headless Chrome (`scripts/audit-sweep.mjs`
invariants A–H + G), never by reading CSS. Final state: **`npm run audit:sweep`
20/20 green at 1440×900, 390×844, and 414×896**; all other gates green.

## What changed, per act

- **hero (01)** — kept as approved; polish only. The wordmark ghosting is
  gone (one wordmark visible at every step, invariant F). Download is hot.
- **gap (02)** — the raw→rendered sweep is now a hard-cut handoff (raw half
  gone before the rendered half arrives), with margin annotations blooming
  per block and the Quick Look window as the one permitted bridge.
- **agent (03)** — re-composed from a stranded text block into a composed
  frame; the conflict visit fires once per session; word-level marks surface
  on the app's stagger; contextual CTA appears only after resolution.
- **speed (04)** — the benchmark table draws on the `deliberate`/`structural`
  curve from `motion.json` (was a hardcoded `0.32s cubic-bezier`), log-scale
  bars, no clipped mid-row handoff.
- **architecture (05)** — headline and "Press ⌘⇧E" line no longer clip at
  rest; the travelling window morphs between slots (the single crossfade-like
  event allowed).
- **reach (06)** — the four Finder cards and terminal re-composed so the
  frame is deliberate, not a void.
- **themes (07)** — collapsed from three viewports to ONE pinned beat: the
  window + six swatches. Light themes are physical paper chips with real
  elevation on the dark ground. A tap re-inks the whole page radially.
- **close (08)** — the sponsor ask lands as a quiet serif line; the film
  close beat carries a tertiary ♥ Sponsor action beside the GitHub star.

## Defect → fix mapping

| Defect | Fix |
|---|---|
| D1 double exposure | Per-act reveal (`src/scenes/reveal.ts`) drives `--act-reveal` from scroll progress; outgoing text is gone before incoming exceeds 0.3; transition bands ≤ declared per-act fractions. |
| D2 headline duplication | Hard cuts + fixed header; one wordmark at every step (F). |
| D3 clipped text at rest | Declared `data-rest` anchors; nothing crosses a viewport edge unless `data-crop-ok` (B). |
| D4 dead space | Agent/reach/speed→architecture re-composed; ≥40% content at every rest state (C). |
| D5 repetition | Exactly one `.app-window` in the DOM, FLIP-morphing; themes is one beat; fingerprints never repeat (D). |
| D6 render/gap imbalance | Annotation sidebar renders once; sweep annotations bloom in document order. |
| D7 light theme cards | Paper-chip treatment (elevation + rule) on the dark ground. |
| M1 dual-DOM leak | Below 900px desktop acts (speed/architecture/reach/themes) are `display:none`; verified by H. |
| M2 beat-boundary clipping | Film beats rebuilt as composed frames; rest-state B/E checks on the film. |
| M3 stray text over the window | Beat 3 re-composed; no act text collides with the window chrome. |
| M4 low-contrast secondary buttons | Contrast audit AA across all six themes (min 4.64:1). |
| M5 film repetition | Film beats re-composed; the full sample.md showcase renders once. |

## Verification results

- `npm run audit:sweep` — **20/20 green** (desktop, film 390×844, film-414, funnel).
- `astro check` — 0 errors, 0 warnings. `astro build` — clean, 6 pages.
- `audit:contrast` — AA across all six themes (4.64–11.22:1).
- `audit:budgets` — green (entry JS 27.3KB/32KB; session 101.3KB/102.4KB; four download CTAs; no animation frameworks).
- `test:editor` — pass. `test:theme` — pass. `test:acts` — 19/19.
- `test:a11y` (new) — 22/22: no-JS readable document, reduced-motion teleport,
  ⌘K palette, Esc close, ⌘⇧E source flip, theme re-ink, download panel.
- Funnel (§10.G) — download resolves to the release DMG with `download`
  semantics; the panel appears once per session; sponsor links in exactly the
  three §8 placements; zero third-party requests; zero console errors; no 404s.

## Files touched this work order

- `scripts/audit-sweep.mjs` — the invariant sweep (A–H + G) and per-phase screenshots.
- `scripts/test-a11y.mjs` (new) — reduced-motion / keyboard / no-JS coverage.
- `scripts/audit-budgets.mjs` — download-CTA count made attribute-exact.
- `src/scenes/reveal.ts` (new), `src/scenes/speed.ts`, `src/shell/palette.ts`,
  `src/shell/funnel.ts`, `src/shell/toast.ts` — choreography + Esc + funnel.
- `src/pages/index.astro`, `src/layouts/BaseLayout.astro`,
  `src/components/DownloadButton.astro` — rest anchors, sponsor placements,
  hot DMG attributes.
- `src/styles/global.css`, `src/styles/acts.css` — composed frames, hard cuts,
  paper-chip swatches, download panel, film isolation.
- `src/data/app/facts.json` + `scripts/generate-app-data.ts` — `downloadUrl`,
  `sponsorsUrl`.
- `.github/FUNDING.yml` written to `/Volumes/Neural/Downright` (uncommitted, per §8).

## Screenshots the owner should eyeball

`verify/shots/before/` (24 frames, the broken baseline) vs `verify/shots/after/`
(53 frames — every rest state plus 3 mid-transition frames per handoff seam).
Please look hardest at:

1. `desktop-seam-*` — the hard-cut seams (hero→gap, gap→agent,
   speed→architecture, architecture→reach): confirm no act text overlaps
   during the handoff, and the travelling window morph is the only bridge.
2. `desktop-rest-agent`, `desktop-rest-reach`, `desktop-rest-themes` — the
   re-composed frames that used to be dead space / repetition.
3. `film-rest-hero`, `film-rest-agent`, `film-rest-close` and
   `film-seam-*` — the six-beat film reads as composed frames, no clipping.
4. `desktop-rest-close` — the sponsor serif line sits quietly, not begging.

## Judged but not verified blind (please confirm)

- **Aesthetic intent** — "composed frame" balance, the paper-chip elevation of
  the light swatches, and the overall editorial rhythm were tuned to geometry
  invariants (≥40% content, no collisions, no echoes), not to my own eyes.
  Whether each frame *looks* right is the owner's call.
- **Glass "≤3 surfaces"** — enforced by construction (header + one floating
  surface + one toast max); I did not add a runtime count.
- **Film rest states** — the sweep checks hero/agent/close as explicit rest
  anchors; the gap scrub and theme-spill beats are pinned stages progressing
  internally, so they ride the A/C/H invariants rather than per-beat B/E.
- **The seam mid-transition frames** are sampled at −40% / 0 / +40% of each
  declared band; a frame at a different offset could in theory catch a
  transient, but the A invariant (checked every 100px) is the binding guard.
- **Sound** stays opt-in/off and the DMG click is stubbed in tests (no real
  GitHub hit is made during verification); the real DMG download path was
  asserted by href + `download` attribute, not by an actual file transfer.
