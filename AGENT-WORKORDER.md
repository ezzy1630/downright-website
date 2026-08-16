# Downright website — agent work order (v3, 2026-08-15)

You are an autonomous coding agent working in `/Volumes/Neural/downright-website`
(Astro 5, plain TypeScript, no framework runtime). Your job: take the current
build of downright.app — a scroll-driven marketing site for a native macOS
Markdown app — from "ambitious but visibly broken" to **jaw-dropping,
screen-recordable, launch-ready**. This document is your complete brief. It
supersedes `HANDOFF.md` (historical) and wins over `plan.md` wherever they
conflict; `plan.md` remains useful reference for intent, tokens, and copy.

You do not ask for approval between steps. You work until the Definition of
Done (§12) is met. You commit per phase with descriptive messages.

---

## 1. The product and the mission

**Downright** is a free, MIT-licensed, native macOS Markdown app (Swift 6 /
AppKit, no WebView). Pitch: coding agents generate more Markdown than anyone
can read, and macOS renders it badly; Downright renders files exactly, shows
word-level diffs live when an agent rewrites a file you have open, and never
modifies your bytes. Repo: https://github.com/ezzy1630/Downright

Site goals, in order:
1. Visitor clicks **Download for macOS** (the DMG is real:
   `https://github.com/ezzy1630/Downright/releases/latest/download/Downright.dmg`
   — the `Downright.dmg` asset exists on the latest release; wire it hot).
2. Visitor stars / visits the GitHub repo.
3. Visitor sponsors the developer: **https://github.com/sponsors/ezzy1630**
   (live). Monetization spec in §8.
4. Phone visitor (can't install) leaves remembering the app, with a one-tap
   handoff to their Mac.

The audience is developers with the highest taste on earth — people who live
in Linear, Raycast, and terminals. One dropped frame or one broken-looking
transition costs more credibility than any set piece earns. The site must not
look like a template or "AI slop"; it must look like the app's own craft
extended to the web.

## 2. Hard facts — never contradict these

From `src/data/app/facts.json` and the app repo at `/Volumes/Neural/Downright`
(read-only source of truth for tokens/claims):

- Version 1.0.16 · macOS 14.0+ · MIT · free · no account · no telemetry ·
  no WebView. Benchmarks dated 2026-08-06, must keep their qualifications.
- Six real themes from the app's JSON: Paper Light (ground `#f7f4ee`, accent
  `#307afe`), Warm Dark (ground `#171614`, accent `#6ea8ff`), Nord, Solarized
  Light, High Contrast, System. **Warm Dark is the site default.** Never navy,
  never amber, never purple.
- Motion constants in `src/data/app/motion.json` (durations .06–.38s, stagger
  .04s, spring windup 4.744, OKLab color interpolation, `pop()` 1.06
  overshoot). Every animation on the site uses these — no ad-hoc easings.
- Never invent features. No fake UI (no chat panel, sync, plugins, App Store
  badge). Screenshots of the real app only where already present under
  `public/assets/native/`.

Update `facts.json` generation (`scripts/generate-app-data.ts`) or the
consuming code so `downloadUrl` resolves to the latest-release DMG URL above;
the DownloadButton is currently gated on the empty string.

## 3. What exists and what to protect

The repo contains real, working machinery. **Protect it; do not rewrite it
casually:**

- `src/kernel/` — spring ticker, OKLab springs, document store (shared
  `sample.md` state all scenes read/write), pointer/magnetism, switchboard
  for reduced-motion/-transparency, word-diff engine.
- `src/editor/` — trimmed CodeMirror 6 live-Markdown editor; the hero window
  is genuinely typeable, markers elide, edits persist across scenes.
- `src/shell/` — ⌘K palette (26 actions), ⌘⇧E 3D flip to source, theme spill
  (radial OKLab re-ink of the whole page), drop-your-own-.md, toast, share.
- `src/scenes/` — per-act choreography. `src/scenes/film.ts` — the mobile
  film (<900px). `src/scenes/zoom.ts` is intentionally unwired; leave it.
- Six-theme engine, honest benchmark payload, `.md` mirrors, OG generation,
  zero third-party requests, self-hosted fonts.
- The verification harness: `scripts/test-acts.mjs` contains a working CDP
  class that drives headless Chrome (`--remote-debugging-port`) — reuse it.
- `npm run dev` (port 4321) · `build` · `audit:contrast` · `audit:budgets` ·
  `test:editor` · `test:theme` · `test:acts`. `?film` forces the mobile film.

**You have authority to restructure any act's layout, choreography, copy
rhythm, and scroll behavior** — the machinery stays, the composition is yours
to fix. The hero (act 01) is approved as-is visually; polish only.

## 4. Your blindness, and the protocol that compensates

You cannot see pixels. Screenshots are bytes to you. Therefore:

1. **Never judge visual correctness by reading your own CSS.** Every layout
   claim must come from geometry queried out of a real headless Chrome via
   CDP (`Runtime.evaluate` → `getBoundingClientRect`, `getComputedStyle`,
   `document.elementsFromPoint`, `checkVisibility()`).
2. **Build the invariant sweep first** (§10) and run it after every change
   that touches layout or choreography. The sweep is your eyes.
3. **Capture screenshots for the human.** At the end of every phase, write
   full-page-stepped screenshots (desktop 1440×900 and mobile 390×844, every
   rest state, plus mid-transition samples) to `verify/shots/<phase>/`
   (gitignore this dir) and end your phase report with a one-paragraph list
   of which shots the owner should eyeball. The owner (Ezzy) reviews them
   and will feed corrections back to you; treat that feedback as ground
   truth over your own inferences.
4. When a defect in §5 is described visually, translate it into a geometry
   assertion before fixing it, so you can prove the fix.

## 5. Defect audit — from a sighted review of the current build (2026-08-15)

A sighted reviewer scrolled the deployed build at ~1440px and ~390px and
captured 18 frames each. These findings are ground truth; your first job
(Phase 0) is to reproduce each one as a failing geometry assertion. Act ids
match `src/data/site.ts` `sections`: hero, gap, agent, speed, architecture,
reach, themes, close.

### Desktop (~1440px)

- **D1 · Scene double-exposure (systemic, the worst defect).** During
  hero→gap, gap→agent, speed→architecture, and architecture→reach handoffs,
  *both* acts' text is simultaneously legible and overlapping: e.g. the
  hero's download button and brew chip render on top of the gap act's Quick
  Look window; the speed table is still on screen, clipped mid-row, while
  "Your text stays in charge." is already at full opacity beside it. Sticky
  elements from the outgoing act linger into the incoming act's range.
  Crossfade-style handoffs read as broken rendering, not cinema.
- **D2 · Headline duplication across the fold.** The next act's serif
  headline appears at the bottom of one viewport and again at the top of the
  next rest state ("Every number here has a limit beside it", "Six themes.
  One document." both visibly render twice in consecutive frames). Related:
  the header wordmark ghosts/doubles during transitions (two "Downright"
  wordmarks visible, one faded, plus stray act-label text overlapping the
  nav).
- **D3 · Clipped text at rest.** Multiple rest states show text cut by the
  viewport edge: "Files touched" list clipped at top (gap→agent), the
  architecture headline clipped to "stays in charge.", the "This page keeps
  its source too. Press ⌘⇧E." line stranded and clipped at the very top
  edge of its frame.
- **D4 · Dead space.** Several frames are >60% empty black: the agent act
  frame with a small text block stranded at the bottom; the reach act where
  four small file cards float in a vast void with a tiny terminal at the
  bottom; the agent→speed frame where a lone paragraph + button float with a
  minuscule timeline widget.
- **D5 · Repetition regression.** The themes act presents essentially the
  same composition (theme list + document window) in **three consecutive
  viewports**, and the same document window content appears again in gap and
  agent acts. The owner's #1 recurring complaint is "the same UI element
  every scroll" — the one-window mandate (exactly one app-window instance in
  the DOM, FLIP-morphing between act slots; no two acts visually identical)
  is partially regressed.
- **D6 · Composition imbalance in the render/gap acts.** The annotation
  sidebar (Math/Diagrams/Tables/Callouts…) renders twice in nearby frames;
  wide empty right margins; the handwritten "same bytes ↑" annotation sits
  stranded far from what it annotates.
- **D7 · Light-on-dark theme cards.** Light theme swatch cards (Paper Light,
  Solarized) sit on the dark ground with no intentional treatment — they
  read as unstyled white rectangles.

### Mobile (~390px, the film)

- **M1 · Catastrophic text double-exposure in beats 9–11** (speed →
  architecture): two copies of the architecture copy render as overlapping/
  superimposed narrow columns; one frame is nearly empty with clipped text
  fragments hugging both edges. It looks like the desktop act DOM and the
  film DOM are both active below 900px. Directive: below 900px exactly one
  DOM path renders — film beats only; desktop act content must be absent or
  `display:none`, verified by the sweep.
- **M2 · Beat boundaries clip content mid-element**: the showcase window cut
  mid-word at a beat top; "Same file. Same bytes." colliding with the window
  below it; the raw/rendered slider stranded clipped at a beat top; refactor
  notes clipped at both edges; theme cards half-clipped above the "Six
  themes" headline.
- **M3 · Stray text overlapping the window** in film beat 3 ("lone tick …
  Footnotes resolve locally…" renders across the window chrome).
- **M4 · Low-contrast secondary buttons** in the close beat ("Copy link",
  "Mail it to yourself" are grey-on-grey; run them through the contrast
  audit).
- **M5 · Same repetition problem as desktop** in beats 15–17 (theme list +
  window shown three ways).

## 6. Diagnosis and the design direction (binding)

The three systemic failures behind almost every defect above:

1. **Leaky scene handoffs.** Crossfading/sticky-lingering between acts
   guarantees double exposure at some scroll offset.
2. **No composition discipline per rest state.** Acts scatter fragments
   across their scroll range instead of composing each viewport.
3. **Repetition.** The same window/list composition recurs across beats.

Adopt these choreography laws sitewide and encode each as a sweep invariant:

- **Law of exclusive ownership.** The page is a strict sequence of acts;
  each owns an exclusive scroll range. Handoffs are **hard cuts or
  transform-outs, never opacity crossfades**: the outgoing act's text is
  fully gone (opacity <0.05 or translated off-viewport) before the incoming
  act's text exceeds opacity 0.3. Transition bands ≤ 0.25 viewport heights
  of scroll. The one element allowed to bridge acts is THE app window,
  FLIP-morphing between slots — that morph is the connective tissue and the
  only crossfade-like event permitted.
- **Law of the composed frame.** Every act defines explicit **rest states**
  (declared in code as `data-rest` scroll anchors). At a rest state: nothing
  clipped by viewport edges except elements explicitly marked
  `data-crop-ok` (e.g. the hero window cropped by the fold — intentional);
  visible content occupies ≥40% of viewport area; one dominant element, one
  headline, at most one supporting paragraph. Cut every third competing
  element. Pinned stages animate *internal* progress (transforms, sweeps,
  counters) while their composition stays framed — pinning must never mean
  "static text sliding half-off."
- **Law of one window / no echoes.** Exactly one app-window instance in the
  DOM, subscribed to the shared store, morphing between acts. No two rest
  states anywhere on the page may present near-identical compositions. The
  themes act becomes ONE pinned viewport: the window + six swatches; a tap
  re-inks the entire page radially; scrolling past it is one beat, not
  three. The full sample.md showcase renders exactly once (in the window);
  every other act uses different content (agent dump, benchmark table,
  Finder cards, terminal, manifesto type).
- **Law of the film.** Below 900px the site is a purpose-built six-to-eight
  beat film, one beat per ~100svh, no hover dependence, no sticky text
  columns, tap targets ≥44px. Each beat is a composed frame under the same
  rest-state rules. The film must feel lighter than the desktop site.
- **Microinteraction floor.** Every interactive element responds: magnetized
  controls (2–4px translate toward pointer, iPad-style lift, `(pointer:
  fine)` only), sprung segmented controls, `pop()` on the download press,
  key-accurate focus rings. Frequent actions subtle, rare actions memorable.
  All curves/durations from `motion.json`. Nothing animates twice; staggers
  0.04s; velocity-aware pacing via `kernel/pacing.ts`.

Style constitution (standing bans — the "slop list"): no under-glows, no
navy, no decorative gradients/particles/noise/parallax, no two-tone accent
headlines, no accent-colored eyebrows (muted mono uppercase eyebrows are
fine), no icon-card grids, no numbered feature lists, no rounded-container
section floats, no scroll hijacking (native scroll + `position: sticky`
only), no GSAP/Lenis/three.js/Framer, no cookie banner/analytics/popups of
any kind. Serif display = Newsreader; document surfaces use the app's real
type system; measure 68–72ch for prose; hairlines 0.5px in theme `rule`.

## 7. Work plan

**Phase 0 — Eyes first.** Build `scripts/audit-sweep.mjs` (§10) reusing the
CDP class from `test-acts.mjs`. Run it on the current build at 1440×900 and
390×844; confirm it catches D1–D7/M1–M5 as failures (tune thresholds until
it does — the sighted audit is your calibration set). Commit the failing
report as the baseline. Also: capture the "before" screenshot set.

**Phase 1 — The choreography rebuild (desktop).** Re-architect act handoffs
per the laws in §6: exclusive scroll ranges, hard cuts, the single
FLIP-morphing window, declared rest states, fixed header (kill the wordmark
ghosting). Rebalance every act's composition (D3/D4/D6): the agent act, the
reach act, and speed→architecture need full re-composition — fewer
elements, bigger dominant element, dead space eliminated or made deliberate.
Collapse the themes act to one pinned beat (D5/D7: design the light swatches
as physical paper chips with real elevation on the dark ground). Sweep green
at 1440×900.

**Phase 2 — The film rebuild (mobile).** Kill the dual-DOM leak (M1), rebuild
beats as composed frames (M2/M3), one beat per concept, thumb-first
interactions preserved (divider drag, tap-to-type, conflict resolution,
theme re-ink, AirDrop close). Fix contrast (M4). Sweep green at 390×844 and
414×896.

**Phase 3 — Funnel + monetization (§8).** Hot DMG, post-download support
moment, close-act sponsor line, footer link. Verify with the funnel
invariants (§10.G).

**Phase 4 — Microinteraction & polish pass.** Magnetism audit (controls
only, never body text), `pop()` on download, annotation bloom choreography
in the render act, theme-spill radial verification, glass tier checks
(T1 refraction Chromium / T3 elsewhere, ≤3 surfaces, solid under reduced
transparency), sound stays off/opt-in. Every entrance uses `motion.json`
values — grep for hardcoded easings/durations and replace.

**Phase 5 — Full verification sweep + handoff.** Everything in §10 + §11
green; `astro build` clean; `audit:contrast` AA across all six themes;
`audit:budgets` green; reduced-motion pass (page fully readable, zero
motion); keyboard-only pass (palette, flip, divider, conflict bar, theme
control, download all operable); no-JS pass (page is a complete readable
document). Final screenshot set + a report for the owner listing what
changed per act and which shots to review.

## 8. Monetization — GitHub Sponsors (live at github.com/sponsors/ezzy1630)

Principles: the app is free forever; sponsorship is an invitation, never a
gate, never a modal, never begging. Three placements, exactly:

1. **The post-download moment (primary).** Clicking Download starts the DMG
   immediately (no interstitial page). Simultaneously a glass panel (extend
   the existing toast system; slightly larger, bottom-center, dismissible,
   Esc closes, auto-dismisses ~12s, appears at most once per session)
   shows: *"Downloading Downright.dmg — free, forever."* with two quiet
   actions side by side: **★ Star the repo** and **♥ Fund the next
   release** (→ sponsors URL, opens new tab). This panel is the entire
   star+sponsor ask on desktop. It never blocks anything.
2. **The close act.** Under "Free. Open source. MIT. No account." add one
   quiet serif line: *"Built by one person, funded by people, not
   telemetry. If Downright earns its place in your dock — sponsor it."*
   with "sponsor it" as the link. Same type scale as the body, no button, no
   badge.
3. **Footer + film close.** Footer link "Sponsor" next to Repository/
   Changelog. In the mobile film's close beat, add Sponsor as a tertiary
   quiet action next to the GitHub star.

Do not add a sponsor button to the header (keeps the four-CTA cadence
clean). No sponsor counts, no goal thermometers.

Side task (do it, don't push): write `.github/FUNDING.yml` with
`github: ezzy1630` in `/Volumes/Neural/Downright` so the repo itself grows a
Sponsor button; leave it uncommitted for the owner to review.

## 9. Copy

The copy voice in `src/data/site.ts` is approved: calm, exact, short
declaratives, pain → shown fix → named feature (feature name always last,
with its real shortcut). You may tighten lines and rewrite act support copy
where re-composition demands it, staying in voice. Numbers always qualified.
Never "AI-powered", never name competitors. The no-dark-patterns line stays
in the footer — for this audience it converts.

## 10. The invariant sweep (`scripts/audit-sweep.mjs`) — your eyes

Drive headless Chrome over CDP against the dev server. At each viewport
(1440×900, 390×844): start at scrollY=0, step by 100px to the bottom. At
every step, evaluate in-page and record; after the pass, assert:

- **A · No double exposure.** Collect visible text elements (opacity >0.15
  after computed inheritance, intersecting viewport, `checkVisibility()`
  true) grouped by owning `[data-act]`/film beat. Outside declared
  transition bands (each act declares its band; total band ≤25% of a
  viewport height), at most ONE act may have readable text on screen.
  Readable = computed opacity >0.3.
- **B · No clipping at rest.** For every declared rest state (scroll to each
  `data-rest` anchor, settle 300ms): no visible text/control element's rect
  crosses a viewport edge unless it or an ancestor has `data-crop-ok`.
- **C · No dead frames.** At every rest state, the union area of visible
  content rects ≥40% of viewport area; and across the whole scroll range no
  contiguous 0.6-viewport-height span exists where readable content covers
  <10% of the viewport.
- **D · No echoes.** Fingerprint each rest state (sorted list of visible
  major components — window, theme-list, benchmark-table, terminal, etc. via
  `data-fingerprint` attributes you add). No fingerprint may repeat in
  non-adjacent rest states; adjacent repeats allowed only for pinned stages
  progressing internally. Assert exactly ONE element matches the app-window
  selector in the entire DOM, at all times, both viewports.
- **E · No intra-act text collisions.** Within a rest state, no two text
  rects from different components overlap (>4px intersection) unless one is
  `data-annotation`.
- **F · Header integrity.** Exactly one wordmark visible at every step;
  header children never overlap each other or act content above opacity
  0.15.
- **G · Funnel.** Download anchor resolves to the release DMG URL and
  carries `download` semantics; clicking fires the support panel once per
  session (assert sessionStorage flag + panel DOM); sponsor links present in
  exactly the three §8 placements and nowhere else; zero third-party
  requests (CDP Network domain: every request URL same-origin or
  github.com/objects.githubusercontent.com from the explicit download
  click only); zero console errors/warnings across the full sweep; no
  request 404s.
- **H · Film isolation.** At 390×844: zero desktop-act text nodes visible or
  occupying layout; every tap target ≥44×44; every beat passes B/C/E.

Emit `verify/report.json` (machine) + a human summary, and screenshot every
rest state + 3 evenly spaced mid-transition frames per handoff into
`verify/shots/`. Exit nonzero on any failure. Wire as `npm run
audit:sweep`. Keep existing scripts green too.

## 11. Interaction contracts (regression gate — all currently-working, keep them)

1. Type `# Hello` in the hero → serif H1 within one frame, marker elided;
   caret reveals markers; `- [ ] ship` → working checkbox; ⌘Z; select-all
   copy yields raw source. Editor JS loads only on interaction/visibility.
2. Hero edits persist into every later scene that shows the document.
3. Agent visit fires exactly once per session when its act enters; dirty
   buffer (user typed) → conflict bar with Review / Keep Mine / Take Theirs
   all genuinely resolving; clean buffer → streaming rewrite with word-level
   marks; scroll never yanked; contextual CTA appears only after
   resolution.
4. Theme spill: clicking any swatch (act or header) re-inks the whole page
   through OKLab with a visible radial stagger; persists across reload;
   all six themes pass AA.
5. ⌘K palette <100ms, fuzzy filter, every action works. ⌘⇧E flips window to
   source matching document state byte-for-byte. Dropping a local `.md`
   replaces the living document with zero network requests.
6. Reduced motion: every scene fully readable, zero motion, agent visit
   applies final state with a static diff summary. Reduced transparency:
   solid surfaces.

## 12. Definition of done

`npm run audit:sweep` green at both viewports · §11 contracts verified via
CDP (extend `test-acts.mjs` where a contract lacks coverage) · `astro
build`, `audit:contrast`, `audit:budgets`, `test:editor`, `test:theme`,
`test:acts` all green · funnel invariants (§10.G) green · per-phase commits
pushed to `main` · `verify/shots/` populated with before/after sets · final
report written to `REPORT.md`: what changed per act, defect→fix mapping for
D1–D7/M1–M5, shots the owner should review, and anything you judged but
could not verify blind (be explicit — the owner will eyeball exactly those).

The last gate is human: the owner scrolls it once at 1440px and once on a
phone and asks "would a Linear engineer screen-record this?" Leave the site
in a state where the honest answer is yes.
