# Downright website — the plan, v2.1: THE LIVING DOCUMENT

**Status:** v2.1 — current. Supersedes v1 and v2. Adds: goals/funnel
architecture, audience doctrine, the hybrid lead story (acts reordered), the
purpose-built mobile film, and the brand identity workstream. Source of
truth for every token, claim, and motion value remains the native app at
`/Volumes/Neural/Downright`. **Launch is timed to a signed, notarized DMG at
a verified URL — every CTA is hot from day one.**

---

## 0. Why v2 — the v1 postmortem (read before building anything)

The v1 build implemented the plan's *skeleton* (sections, token CSS, data
payload — keep all of that) and downgraded every experience to its cheapest
static stand-in: "structural zoom" was five fading paragraphs, "the render
stage" was a JPEG in a sticky div, the hero was a hand-drawn static mock,
the only motion was `data-reveal` fades (~390 lines of JS total), and it
reintroduced a banned pattern (numbered 01/02/03 feature list).

**The rule that fixes this:** every set piece below is a *behavioral
contract* with acceptance tests a static page cannot pass (§18). A build
that renders the right layout but fails the interaction contracts is a
failed build. There is no "reveal-only" path except under
`prefers-reduced-motion`.

---

## 1. Goals, audience, funnel

### The one metric
**Primary goal: the visitor clicks Download for macOS.** Secondary: they
star/visit the GitHub repo. Tertiary (mobile): they remember hard enough to
come back on a Mac — measured by the handoff actions (§9). Everything on the
page either builds the desire to download or is the proof that earns it.

### The audience doctrine
We are impressing **developers with the highest expectations on earth** —
people who live in Linear, Raycast, and terminals all day, smell marketing
from orbit, and screenshot craft when they see it. Consequences, all
binding:

- **Zero jank tolerance.** One dropped frame during a set piece costs more
  credibility than the set piece earns. Every wow moment gets a performance
  trace before it ships.
- **Every number is verifiable.** Benchmarks carry corpus/date/machine;
  in-page meters measure honestly (§8.1); nothing rounds up.
- **View-source is a page.** Devs will read the source. Ship a crafted HTML
  comment masthead, one tasteful console line (the mark + "This page is
  also Markdown: /index.md"), clean readable markup, `llms.txt`,
  `humans.txt`. The source code is part of the design surface.
- **No dark patterns, stated proudly:** no cookie banner (no cookies), no
  newsletter modal, no exit-intent popup, no chat widget, no analytics
  (none at all). The footer says so in one line — for this audience that
  line converts.
- **Keyboard is a first-class journey:** ⌘K, ⌘⇧E, Space, 1–5, arrows —
  discoverable via a `?` shortcut sheet in the palette.

### CTA architecture
- **Cadence, exactly four:** header (persistent, quiet) · hero · one
  contextual CTA immediately after the agent-conflict resolution (§8.5 —
  the moment of maximum belief: *"That's what reviewing agent work should
  feel like."*) · the close. Nothing else asks.
- **The press is the moment:** the download button carries the site's one
  `pop()` (squash-stretch, radius swell). Click → download starts
  immediately (no interstitial page) + a quiet glass toast: *"Downloading
  Downright-1.0.0.dmg · While it lands: ★ star the repo · follow the
  changelog."* That toast is the entire GitHub ask — the star request lives
  only in the moment after conversion.
- **GitHub elsewhere:** one quiet header link, one footer link. Never a
  star-count badge chase.
- Button microcopy states the promise: "Download for macOS · free · 4 MB".
  (Verify the real DMG size from the artifact; small is a flex.)

### The teaching thread (secondary goal, structural)
The page teaches by **pain → shown fix → named feature**, in that order,
every act: first you *feel* the problem (an honest ugly Quick Look, a
3,000-word agent dump), then you *watch or operate* the fix, then one line
names it ("This is Structural Zoom · ⌃⌥⌘1–5"). Naming last means the
feature list assembles itself in the visitor's head. By the close, a
first-time visitor can say what Downright is (native Markdown app), why
they need it now (agents write more Markdown than anyone can read, and
macOS handles it badly), and what makes it different (exact bytes, live
review, no WebView) — without ever having read a feature grid.

---

## 2. The concept

**One governing metaphor, executed everywhere: the page is one living
Markdown document.**

There is a single document on this site — the app's real `sample.md` — held
in one shared client-side store. Every act is a scene that happens **to
that same document**: you type into it in the hero (a real editor), scroll
through it in the render act, collapse it through five semantic levels,
watch an agent rewrite it — and resolve the conflict if you'd edited it —
measure it, re-ink it through six themes, flip it to its own source, and
replace it with your own `.md` by dropping a file anywhere. Your edits
persist between scenes. One file, seven scenes, your hands allowed on it
the whole time. That continuity is the spectacle, and it's only possible
because Downright's product is a document and a web page is a document.

**Spectacle doctrine:** every wow must be a product truth made tangible. We
build an **operable specimen** (the Monaspace pattern), not a WebGL
showreel — award-tier research is unambiguous that typography-led spectacle
has its own lane and that juries reward the cheapest tech that achieves the
feeling. People screen-record things *they did*.

---

## 3. The constitution (bans + bars)

All v1 bans stand: no under-glows, no two-tone accent headlines, no accent
eyebrow labels, no icon-card grids, no numbered feature lists, no sections
floating in rounded containers, no navy dark, no decorative gradients /
parallax / particles / noise, no vague copy, no fake UI (no chat panel,
vault, graph, sync UI, plugin store, App Store badge — absences are product
positions), no scroll hijacking (native scroll always; `position: sticky`
pinning only).

v2 additions, all standing:

11. **No static stand-ins.** Screenshots only where §17 explicitly calls
    for a capture. Every demo listed as live is live.
12. **One motion system.** One spring kernel, one rAF ticker, the app's
    curves, CSS scroll-driven animations as the scroll backbone. No GSAP,
    Lenis, three.js, or Framer Motion.
13. **Physics carries real state** — position, velocity, or resistance of
    something the user affects. Never idle wobble.
14. **The downgrade flex.** If CSS achieves the feeling, WebGL is wrong.
15. **Delight-Impact curve:** frequent actions subtle, rare actions
    memorable. Exuberance frequency inversely proportional to action
    frequency.
16. **No dark patterns** (§1). The absence list ships in the footer.

---

## 4. Foundations (carried, already built — do not regress)

- **Color:** all tokens from the app's six theme JSONs via the payload.
  Paper Light ground `#f7f4ee` / accent `#307afe`; Warm Dark `#171614` /
  `#6ea8ff`; never navy, never amber. First visit follows
  `prefers-color-scheme`; choice persists.
- **Type:** Newsreader variable (opsz; display + document serif, preloaded
  subset) · system SF Pro stack with lazy Inter var fallback · SF Mono
  stack with lazy JetBrains Mono NL fallback. Tracking −0.01em @28px →
  −0.022em @56px+; body 16px/1.55. Document surfaces use the app's real
  system: serif 16px on a 26px line, scale 1.25, heading exponents
  [3, 2, 1.25, 0.5, −0.5, −0.75], mono 0.88×. Measure 68–72ch wherever
  prose lives. Metric-matched fallbacks; zero CLS.
- **Space/radius/rules:** rhythm 96→144px; radii 4/8/10/12; hairlines in
  theme `rule`, 0.5px retina; shadows only on floating things, warm, low.
- **Motion constants** (`Motion.swift` → payload): durations
  .06/.07/.10/.11/.12/.15/.20/.32/.38, stagger .04; curves decelerate
  (0.22,0.82,0.28,1) / snap / structural / easeOut; spring windup 4.744,
  bounce 0–1, OKLab color; `pop()` 1.06 / ~0.973 / radius ×1.15; scroll
  `clamp(0.0115·√d, .18, .55)`; morphCut 0.30/0.35/0.75; live-drag settles
  immediately; Reduce Motion = teleport.
- **Data honesty:** pinned app payload (v1.0.0, macOS 14+, MIT, benchmarks
  2026-08-06 with qualifications), gated DownloadButton, `.md` mirrors +
  `llms.txt`, OG/sitemap/RSS generators.
- Dark bands (Warm Dark scope) only for Speed and Architecture.

---

## 5. The interaction kernel (build first)

`src/kernel/` — ~6KB gz, `client:idle`:

- **Ticker:** one rAF loop owning every spring; springs sleep on settle;
  batched writes; `transform`/`opacity`/custom-props only; pauses on
  `document.hidden`.
- **Springs:** the app's closed-form integrator (extend
  `src/motion/spring.ts`): scalar, point, size (center+size, never four
  edges), OKLab color. ≤80 moving DOM springs; denser goes to canvas.
- **Pointer:** velocity tracker (coalesced events) feeding flicks and
  magnetism.
- **Magnetized controls** (never a fake cursor; real cursor never hidden):
  interactive elements translate 2–4px toward the pointer on springs, take
  the iPad-style lift (scale 1.02 + shadow), settle on leave. `(pointer:
  fine)` only; keyboard focus gets the same lift.
- **Document store:** shared `sample.md` state every scene reads/writes.
  Plain TS pub/sub.
- **Velocity-aware pacing:** staggers collapse at high scroll velocity.
- **Sound (opt-in):** Web Audio on first gesture; key-thock (editor), tick
  (checkbox), whoosh (morph/flip); OFF by default, visible toggle,
  persisted. First cut under pressure.
- **Motion switchboard:** `prefers-reduced-motion` (teleport; static
  composed frames; page reads top-to-bottom), `prefers-reduced-transparency`
  (zero blur), Increase Contrast (secondary/faint/rule ⅓ toward text), plus
  an in-page motion toggle (reduce ≠ remove).

---

## 6. Materials: liquid glass, three tiers

Glass only on things that float: header, ⌘K palette, Quick Look overlay,
change toast, theme morph panel, Tasks-panel demo. Never behind body text.

| tier | who | what |
|---|---|---|
| **T1 Refraction** | Chromium | kube.io technique: precomputed Snell's-law displacement map → `feImage` + `feDisplacementMap` + specular rim via `backdrop-filter: url(#glass)`. Geometry static; animate only filter scale + transform. Ref: shuding/liquid-glass. ~4KB |
| **T2 Owned-backdrop** | all engines | window chrome only (we render the backdrop): refraction via regular `filter: url()` |
| **T3 Blur + specular** | Safari/Firefox backdrops, all fallbacks | `blur(12px) saturate(1.5)` + inset hairline + specular edge |

≤3 concurrent surfaces. Reduce Transparency → solid. Touch fixed elements →
T3 solid (iOS jank).

---

## 7. The app shell (the site behaves like the app)

All lazy-loaded on first use:

- **⌘K palette** — hand-rolled `<dialog>`, glass, fuzzy filter, full
  keyboard nav. Actions: jump to any act (sprung distance-scaled scroll),
  switch theme, flip to source, toggle sound/motion, copy brew command,
  download, changelog/themes/GitHub, reset document, `?` shortcut sheet.
  ~5KB.
- **⌘⇧E flip to source** — the window 3D-flips (two faces, `preserve-3d`,
  compositor-only) to its own raw Markdown with line numbers. Also via the
  window's Document/Source segmented control (sprung indicator). ~30 lines.
- **Space Quick Look** — only when a file card has focus/hover; glass
  overlay; Esc/click paths; narrow interception.
- **Drop / paste your own Markdown** — drag any `.md` over the page: ground
  dims, hero window opens as target (*"Drop it. Nothing uploads — this page
  has no server."*). Your file becomes the living document everywhere.
  Paste works. Raw HTML disabled. ~2KB.
- **Share/handoff** — `navigator.share` where available (on iPhone this
  means **AirDrop the page to your Mac** — the Apple-native handoff, §9),
  plus copy-link and prefilled mailto. No server, no shortening.
- **Cross-document View Transitions** — the app window morphs across
  routes via `view-transition-name`; Firefox gets normal navigation;
  disabled under reduced motion.

---

## 8. The homepage — acts in v2.1 order (~14 screens)

Order reflects the hybrid story: craft leads, the agent-era problem is
named in the hero and *felt* by act 2, the agent set piece is the mid-page
climax at act 5, speed sprinkles as proof throughout.

### 8.1 Hero — "It's real. Type in it." (1 screen, 100svh)
Full-bleed. Left ~38%: serif display H1 — **"The native Markdown app for
macOS."** — over the hybrid subhead (draft): *"Your coding agents write
more Markdown than you'll ever read — and macOS opens it badly. Downright
renders it exactly, reviews it live, and never touches your bytes."* CTA
(hot DMG, `pop()` on press) + brew copy-chip + microline "Free · MIT ·
macOS 14+ · no WebView". Right ~62%: **the living document** — real
trimmed-CM6 editor styled as the app window (1020×728 proportions, bottom
cropped by the fold), prerendered static HTML at first paint (the LCP),
hydrating on first pointer/keydown/visibility.

Faithful Live mode: markers elide except at the caret; `# ` becomes a serif
H1 as you type; `- [ ]` becomes a checkbox with the 14%-alpha accent field;
⌘Z works. Caption: *"This window is real. Type in it."* Status bar carries
the **honesty meter**: measured decoration pass per keystroke
(`performance.now()`, labeled *parse*, typically 0.1–0.8ms) with the
16ms-measurement-floor footnote; never labeled paint latency. Headline
glyphs (<30, build-time split, `aria-hidden` spans + `aria-label`) give
opsz/wght micro-response to pointer proximity — amplitude so low it reads
as lighting.
**Contract:** real selectable text; `# Hello` → elided-marker H1 within one
frame; caret reveals markers; checkbox undoable; edits persist downstream;
no editor JS before interaction.

### 8.2 The gap — 1.5 screens · the pain, doubled
Two beats, teaching thread begins. **Beat one — it opens badly:** the same
file in macOS default Quick Look (honest capture) vs Downright's (live
render), sprung draggable divider, keyboard operable. **Beat two — and
there's more of it than ever:** a single stark line over a slow-scrolling
wall of real agent-generated Markdown (mono, faded): *"Your agents wrote
3,000 words while you read this sentence. Somewhere in there is the one
claim that matters."* No fix offered yet — the next three acts are the
fix.
**Contract:** divider physics real; right pane is live DOM; the wall is
real text, not an image.

### 8.3 The render — 2.5 screens, pinned · fix №1: it reads finished
The living document (your edits included) pins; page scroll drives the
document's own scroll in exact proportion. As each real capability passes —
math, Mermaid, tables, callouts, footnotes, code in true theme syntax —
a margin annotation blooms once, hairline connector drawn on the
`structural` curve. Closing line names it: *"Exact-source rendering. Your
bytes, decorated — never rewritten."*
**Contract:** offset tracks scroll bidirectionally, zero wheel
interception; annotations never re-fire; reduced-motion = full-length
document, static annotations.

### 8.4 Structural zoom — 1 screen, pinned, operable · fix №2: read at any altitude
Explicitly the answer to beat two of the gap. The living document morphs
through the app's five semantic levels — headings → +first sentences →
+artifacts → full text — anchor held, blocks FLIPping on springs, morphCut
logic for leaving/arriving content. Reader-driven: segmented control, keys
1–5, arrows, **trackpad pinch** (ctrl+wheel — the app's own gesture; touch
pinch on mobile). Named last: *"Structural Zoom · ⌃⌥⌘1–5. The 3,000 words,
at the altitude you need."*
**Contract:** anchor never jumps; 60fps morph; pinch works
Chromium+Safari; keyboard complete; content is the living document.

### 8.5 The agent visit — 2 screens · the climax (moved up)
Arms on entry; fires **once per session, ever**. The living document
receives an external write: words rewrite in place, streaming; word-level
marks in changeModified/changeAdded; scroll held; glass toast ("2 rewritten
· 1 added"); a change mark hangs off the rail tick; marks dim after >1.5s
dwell, exactly like the app.

**The branch that makes it unforgettable:** if the reader typed in the hero,
the buffer is dirty — they get the real thing: the non-modal conflict bar,
**Review · Keep Mine · Take Theirs, all three genuinely working** (Review =
side-by-side word diff; Keep Mine restores their words; Take Theirs applies
the agent's). The reader resolves an agent conflict about *their own words*
on a marketing page. Screen two: version timeline (capture/clip) +
first-run setup story. Then the page's one contextual CTA: *"That's what
reviewing agent work should feel like. — Download for macOS."*
**Contract:** fires exactly once; dirty branch verified (type in hero →
scroll → conflict bar; both resolutions round-trip exact text); clean
branch holds scroll; reduced-motion applies final state with a static diff
summary; contextual CTA appears only after the moment completes.

### 8.6 Speed — 1.5 screens · dark band №1
Native benchmarks with budgets beside them, corpus, date, machine caveat,
what isn't measured — verbatim honesty. Budget bars draw once
(`deliberate`, log scale). The reader's own session joins the table:
*"Your median parse this visit: 0.4ms. The native engine's budget for a
full keystroke: 8ms. It spends 0.146ms."* Web/native distinction explicit.
**Contract:** every number traces to the payload; bars animate once.

### 8.7 Architecture — 1 screen · dark band №2
The manifesto at pull-quote scale: raw text as the only source of truth ·
one adaptive surface · no WebView anywhere · exact byte identity · full
reparse, incremental restyle. The punctuation: *"This page keeps its source
too. Press ⌘⇧E."* Repo link.

### 8.8 System reach — 1.5 screens
Finder-styled surface of `.md` file cards with **verlet physics** (~4KB;
flick, collide, settle with character, sleep at rest). Space Quick-Looks a
focused card; drag one anywhere → it becomes the living document. Real
terminal types once: `down README.md` · `printf '# Draft' | down` · `down
outline --json` · `down check --target github`. Spotlight claim qualified.
**Contract:** real inertia; Space/Esc/click all work; touch =
tap-to-Quick-Look.

### 8.9 Themes — 1 screen, pinned · the theme spill
Six cards drive the site's real theme engine: every token springs through
OKLab with a radial stagger from the clicked control (whole wave within one
`deliberate` 0.32s) — ink across paper, no muddy midpoints. The header
control is the same engine; its popover is the site's **one morphCut**.
Persists; first visit follows system.
**Contract:** wave visibly radial; mid-transition pixel not desaturated;
section cards and header drive identical state; six themes AA.

### 8.10 Price & close — 1 screen
Serif, enormous, on paper: **Free. Open source. MIT. No account.** The
download CTA with its `pop()`; requirement + brew lines; the post-download
toast (§1) carries the star ask. Footer: repo · changelog · themes ·
privacy · licence · the no-dark-patterns line · "this page is also
Markdown → `curl downright.app/index.md`" · llms.txt · sound/motion
toggles.

### The density rail (persistent)
Canvas-rendered ticks, one per act; fill tracks scroll; ticks chase the
pointer through springs (radius 36px, breathe 1.08, neighbor dim 0.82 —
the app's constants). Hover: glass outline HUD (0.04s stagger). Click:
sprung distance-scaled jump, 480pt/s kick. Drag scrubs, settling under the
hand. Change marks after the agent visit. Keyboard: arrows + Enter. Below
900px it yields to the mobile film's progress system.

---

## 9. The mobile film (purpose-built — not a reduced desktop)

**Job:** a phone visitor inside the X or Reddit app, holding the phone for
45–90 seconds, must leave *remembering* Downright and carrying a one-tap
way to reach it from their Mac. They cannot install. The mobile site is a
**film they can touch**, same URL, swapped choreography below 900px.

### Form
Vertical acts, each ~100svh (`svh`/`dvh` units only — in-app webviews lie
about viewport), native scroll, no hover dependence anywhere. The living
document remains the star, full-width. Set pieces re-choreographed for
touch, auto-playing compressed versions on visibility with tap-to-interact:

1. **Hero:** the document window fills the frame; a short auto-typed line
   demonstrates Live mode (marker elision visible); "tap to type" opens the
   real editor with the keyboard (plus an "insert an edit" chip for the
   keyboard-averse — this dirties the buffer for act 5).
2. **The gap:** divider drag by thumb; the agent-dump wall scrolls itself.
3. **Zoom:** **pinch the document** (native touch pinch) through the five
   levels; a level pill mirrors it for tap.
4. **The agent visit:** the rewrite streams on entry (once); the conflict
   bar's Keep Mine / Take Theirs are big thumb targets; the reader still
   wins the conflict.
5. **Theme spill:** six swatches, tap = radial re-ink of the whole film.
6. **The close — the handoff:** *"Downright lives on your Mac. Send it
   there."* Primary: **AirDrop this page to your Mac** via
   `navigator.share` (on iOS the share sheet's first target IS AirDrop —
   the page opens on the Mac with the download button waiting). Secondary:
   copy link · mail yourself the link (prefilled mailto). Tertiary quiet:
   star on GitHub. No email capture, no server.

### Engineering for hostile webviews
Test matrix: iOS Safari · X app iOS (WKWebView) · Reddit app iOS · Android
Chrome · X app Android. Rules: LCP <1.5s on throttled 4G; total mobile
payload <1.5MB; no `backdrop-filter` on fixed elements (T3 solid); tap
targets ≥44px; `playsinline muted` on any media; no permission prompts of
any kind; film works with JS partially blocked (falls back to the readable
document); physics/magnetism off; springs reserved for the set pieces
above; `content-visibility` aggressive. The film must feel *lighter* than
the desktop site, not like a desktop site squeezed.

**Contract (§18.11):** on a real iPhone inside the X app: loads <1.5s on
4G; all six beats operable by touch; pinch-zoom works; conflict resolvable
with thumbs; AirDrop share sheet opens; the whole film is experienced in
under 90 seconds.

---

## 10. Scroll system

CSS scroll-driven animations (`animation-timeline: view()/scroll()` —
Chrome/Edge/Safari 26, off-main-thread) behind `@supports`, one rAF
scroll-progress fallback for Firefox, both driving the same custom
properties. Pinning via `position: sticky` (stages 1.5–2.5 viewport
heights), content readable top-to-bottom with JS off. Velocity-aware
pacing on all staggers. No smooth-scroll library, no wheel interception,
no snap points. `content-visibility: auto` below the fold.

## 11. Capability & fallback matrix

| context | experience |
|---|---|
| Chromium desktop | everything, glass T1 |
| Safari desktop | everything, glass T3 (T2 window chrome), VT 18.2+ |
| Firefox | everything, rAF scroll fallback, glass T3, plain navigations |
| Phone / in-app webviews | **the mobile film (§9)** |
| Tablet | desktop layout with touch substitutions (tap QL, pinch zoom, no magnetism) |
| `prefers-reduced-motion` | teleport; static composed frames; agent visit applies final state + static diff; in-page toggle mirrors |
| `prefers-reduced-transparency` | zero blur, solid surfaces |
| No JS | complete, beautiful, readable document; static hero markup; captures where live demos stood; all copy and numbers intact |

## 12. Performance engineering

- First paint: static HTML + CSS + fonts. Hero prerendered — DOM-text LCP.
  **≤10KB JS before idle.**
- `client:idle`: kernel ~6KB. Visibility/interaction: editor ~55KB ·
  palette ~5KB · glass mapgen ~4KB · verlet ~4KB · drop ~2KB · sound ~2KB.
  **Desktop session ≤100KB gz; mobile film ≤60KB gz; no framework runtime.**
- CI-gated budgets: Lighthouse ≥98/100/100/100 throttled mobile · LCP <1.0s
  desktop, <1.5s mobile-4G · CLS 0 · INP <200ms · no long task >50ms during
  scroll · 60fps scroll trace mid-tier hardware · fonts ≤90KB initial (0KB
  sans/mono on Apple hardware) · mobile payload <1.5MB.
- Discipline: transform/opacity/custom-props only; springs sleep; one
  ticker; no layout reads in loops; canvas for dense elements; workers only
  if a measured canvas scene exceeds ~2ms/frame.

## 13. Accessibility

Keyboard-complete: rail, zoom, divider, palette, conflict bar, file cards
(tab + Space QL), shortcut sheet on `?`. Split-glyph headline:
`aria-hidden` spans + `aria-label`; split text containing links keeps an
unsplit hidden duplicate. Space interception only on focused/hovered
cards. The editor is real text with real focus; the canvas rail mirrors a
visually-hidden nav list. Contrast AA in all six themes (audit Solarized
secondary). Focus ring `color-mix(in oklab, var(--accent) 40%,
transparent)`, 2px offset, everywhere. Reduced-motion/-transparency per
§5; the conflict bar and all CTAs fully operable with AT.

## 14. Copy & voice

Calm, exact, fast. Short declaratives; specific or cut. Teaching thread
per §1: pain → shown fix → named feature, name always last, one line, with
its real shortcut. Interactive invitations quiet, not carnival: *"This
window is real. Type in it." · "Drop it. Nothing uploads — this page has
no server." · "Press ⌘⇧E."* Numbers always qualified. Never name
competitors; never "AI-powered." Price at header/hero/close/footer. §8
drafts are floors. Ban list applies to every line.

## 15. Secondary pages

- **/themes** — the living document across six themes, real JSON tokens in
  mono tables, same spill engine, window morphs in via VT.
- **/changelog** — generated from payload, image per major entry, RSS,
  `.md` mirror.
- **/privacy** — three true paragraphs (and the no-dark-patterns list).
- **/404** — `downright.app/this-page:404` in mono with the app's red
  dotted missing-path underline. One line, link home.

## 16. Brand identity workstream (approved: redesign)

The current knot mark reads close to an OpenAI flower — fatal for a
proudly native, no-chat-panel Mac app. One deliberate identity pass,
scheduled early (Phase 1 parallel track) because favicon/OG/social assets
block launch:

- **Territory:** the document itself — ink, glyph, folded page, the `#`
  (Markdown's most iconic mark) drawn with the app's optical care, or a
  form derived from the existing app icon. Explicitly banned: knots,
  flowers, orbits, sparkles, anything AI-company-shaped.
- **Constraints:** must read at 16px; must work single-color in
  `currentColor` stroke; must sit in the app-window traffic-light row;
  must pair with a wordmark set in the site serif or sans (test both).
- **Deliverables:** canonical `mark.svg` (replacing both divergent
  redraws) · wordmark · favicon set (SVG/ICO/apple-touch) · OG template set
  · social avatars · a one-page usage note. App icon alignment noted for a
  later app-side pass.

## 17. Asset plan (small — the live engine replaced most captures)

Real app only, 2× Retina, macOS 26, pointer hidden, app themes, measure
held: Quick Look **before** capture (the honest half of §8.2) · version
timeline capture/clip (§8.5) · first-run setup still · renderer showcase
(verification reference + OG) · optional cold-launch clip. Everything else
is live DOM. Record OS version per asset.

---

## 18. Acceptance tests (the "cannot fake it" gate)

Scripted QA walkthrough; every item passes literally before its phase
closes:

1. **Editor:** `# Hello` → serif H1, marker elided, one frame; caret
   reveals `#`; `- [ ] ship` → checkbox; tick → strike; ⌘Z restores;
   select-all/copy yields raw source.
2. **Persistence:** hero edit visible in the zoom act; reload resets.
3. **Zoom:** anchor stays on screen at every level; no layout thrash in
   trace; pinch works (trackpad desktop, touch mobile); keys 1–5.
4. **Agent:** fires exactly once; dirty buffer → conflict bar; Keep Mine /
   Take Theirs round-trip exact text; clean rewrite holds scroll;
   contextual CTA only after completion.
5. **Rail:** drag-scrub settles under the hand; HUD <100ms; springs
   respond inside 36px; change mark appears post-visit.
6. **Theme spill:** radial wave from the clicked control; mid-transition
   pixel not desaturated; persists; morphCut empty-glass beat visible.
7. **Shell:** ⌘K <100ms, fuzzy filter, every action works; ⌘⇧E flips at
   60fps, source matches document state byte-for-byte; Space QL on focused
   card; dropped `.md` renders with zero network requests.
8. **Glass:** T1 refraction on Chromium; T3 on Safari; Reduce Transparency
   solid; ≤3 concurrent.
9. **Budgets:** §12 green in CI on the deployed preview.
10. **Reduced motion:** every scene complete with zero motion.
11. **Mobile film:** on a real iPhone in the X app — loads <1.5s on 4G;
    six beats operable by touch; pinch works; conflict resolvable with
    thumbs; AirDrop sheet opens; full film <90s. Repeat on Reddit iOS +
    Android Chrome.
12. **Funnel:** download click starts the DMG immediately + shows the
    star toast; exactly four CTA instances on the page; no cookie banner,
    no third-party requests at all (verify network panel).

---

## 19. Build plan

**Phase 0 — Kernel & materials.** Keep v1 skeleton (tokens/payload/pages).
Build `src/kernel/`, glass tiers, sound stub. *Gate: kernel demo passes
tests 5-partial/8; budgets green on skeleton.*

**Phase 1 — The living document** (+ brand track starts). CM6 trimmed
editor with Live-mode decorations (crib codemirror-rich-markdoc /
codemirror-live-markdown); prerendered hero; document store; honesty
meter; drop/paste; ⌘⇧E. Brand: mark exploration → decision. *Gate: tests
1, 2, 7 (editor/flip/drop); mark chosen.*

**Phase 2 — The acts.** Gap (divider + dump wall); render scroll-sync +
annotations; zoom FLIP + pinch; theme spill + morphCut; rail canvas; speed
bars; reach verlet + Space QL. *Gate: tests 3, 5, 6 + QL.*

**Phase 3 — The agent visit + funnel.** Word-diff engine, streaming
rewrite, conflict bar with real resolution, toast, rail marks, session
arming; contextual CTA; download toast + star ask. *Gate: tests 4, 12.*

**Phase 4 — The mobile film.** Six-beat vertical choreography, touch
pinch, thumb conflict bar, AirDrop/share handoff, webview hardening.
*Gate: test 11 on real devices.*

**Phase 5 — Shell polish & pages.** ⌘K; view transitions; secondary pages
+ 404; sound; velocity pacing; magnetism tune; view-source masthead +
console line + humans.txt; copy pass. *Gate: tests 7 (palette), 10; full
§18 sweep.*

**Phase 6 — Launch.** §17 captures; brand deliverables shipped; OG set;
channel exports (PH 1270×760, X loops, HN architecture link, Reddit
stills); load test; **signed/notarized DMG verified at the config URL on a
clean machine — launch does not happen without it.** *Gate: full §18 +
§12 on production + launch checklist.*

## 20. Definition of done

1. Every product visual is a real capture or a payload-driven live
   rendering verified against one.
2. Every color traces to a theme JSON; every duration/curve to
   `Motion.swift`; a reviewer can diff both.
3. §12 budgets green on production.
4. Six themes AA; reduced-motion/-transparency/keyboard complete.
5. Nothing on the §3 ban list appears anywhere.
6. The funnel: hot DMG in one click; star ask only post-download; four CTA
   instances; zero third-party requests.
7. A first-time trackpad visitor can, unprompted: type into the hero and
   watch it render; get rewritten by the agent and win the conflict; spill
   a theme; flip the page to source; drop their own file on it — each a
   moment worth screen-recording. "Watch it" without "do it" = not done.
8. A phone visitor inside the X app experiences the six-beat film in
   under 90 seconds and can AirDrop the page to their Mac.
9. A developer who opens view-source or the console finds craft, not
   shame.

## 21. Decision log

| item | decision |
|---|---|
| Launch timing | tied to signed/notarized DMG at verified URL; all CTAs hot day one (Ezzy, 2026-08-15) |
| Lead story | hybrid: craft-led H1, agent-era problem in hero subhead and act 2, agent climax moved up to act 5, speed as woven proof (Ezzy, 2026-08-15) |
| Mobile | purpose-built six-beat film with AirDrop handoff; not a reduced desktop (Ezzy, 2026-08-15) |
| Brand mark | full redesign approved; knot retired (Ezzy, 2026-08-15) |
| Email capture | none — AirDrop/copy/mailto handoff instead; no forms anywhere |
| GitHub ask | post-download toast + quiet header/footer links only |
| Analytics | none, stated in footer |
| Editor engine | trimmed CodeMirror 6, live-preview decorations; hand-rolling and ProseMirror-family rejected |
| Spectacle tech | no WebGL/three.js; DOM/CSS/small-canvas + one spring kernel |
| Cursor | magnetize controls; never replace the cursor |
| Glass | kube.io displacement (Chromium) / owned-backdrop (chrome) / blur+specular (rest); geometry static |
| Physics | hand verlet for file cards; Matter.js/Rapier rejected |
| Scroll | CSS scroll-driven + rAF fallback; no GSAP/Lenis |
| Palette | hand-rolled `<dialog>` |
| Flip | contained 3D transform on the window element |
| Latency claims | in-page numbers labeled "parse" only; 16ms floor stated; native numbers in the table |
| Sound | opt-in, off by default, first cut |
| v1 salvage | keep tokens.css, payload + generators, spring/color modules, section skeleton, mirrors/OG/RSS; rebuild every experience layer |

Open (Ezzy): domain confirmation · final DMG URL + size · Homebrew cask ·
public repo address · brand-mark direction pick once explorations exist.
