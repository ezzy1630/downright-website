# Downright website — work order v4 for a VISION-CAPABLE agent (2026-08-15)

You are GPT 5.6 Luna Max working in `/Volumes/Neural/downright-website`
(Astro 5, plain TypeScript, no framework). You have vision. That is the
reason you were hired: the last two build rounds were done by blind agents
who could pass geometry tests while shipping pages that *look* broken. Your
core loop is: change → screenshot → **actually look at it** → judge → fix →
repeat. Never mark anything done that you have not seen with your own eyes
at 1440×900 and 390×844.

Read first, in order: this file · `AGENT-WORKORDER.md` (v3 — its §2 facts,
§6 choreography laws, §10 invariant sweep, and §11 interaction contracts
all still bind; its defect list is historical) · `plan.md` (reference for
intent and tokens; this file wins conflicts). The verification harness
already exists: `npm run audit:sweep` (invariants A–H, writes
`verify/report.json` + `verify/shots/`), plus `audit:contrast`,
`audit:budgets`, `test:editor`, `test:theme`, `test:acts`, `test:a11y`.
Keep them all green; they are your regression net, not your judge. Your
judge is your eyes.

Owner's verdict on the current build: "an improvement for sure but still
just not great … not shippable." The bar remains: a site developers
screen-record, worthy of comparison to Raycast/Linear/Ghostty pages. The
app's **UI/UX is its main selling point** — the owner uses it daily chiefly
because it feels so good. The site must transmit that feeling.

Work autonomously through all phases. No approval-seeking between phases.
Commit per phase. Dev server: `npm run dev`, port 4321. `?film` forces the
mobile film at any width.

---

## 1. Defect audit — round 2 (sighted review of your predecessor's build)

These were observed by eye on the current build. Reproduce each visually
before fixing; screenshot after fixing.

**Transitions still leak (P0).** The hard-cut system exists but fails at
several seams: the architecture headline "Your text stays in charge."
renders OVER the header nav mid-transition; frame 18's "Free. Open
source." headline is clipped behind the header; hero→gap still shows the
hero's download button + brew chip colliding with the QL window; themes→
close leaks the showcase window under the close act's headline; the reach
act's terminal appears twice in consecutive rest states (14 and 15).
Suspect the transition-band declarations are too wide and sticky release
points are wrong. Fix until a slow full-page scrub at both widths shows
ZERO frames where two acts' text coexists or anything intersects the
header.

**Dead space (P0).** Desktop frames 13 and 15 are >60% empty. Mobile is
worse: beats 03–04 (a lone "Tap to type" chip floating in black), 10–14
(the agent CTA, theme grid, and close each stranded in a mostly-empty
viewport). Every rest frame must be a composed frame — if a beat has one
small element, the element grows, gains support, or the beat merges into a
neighbor. The mobile film should be 6–8 dense beats, not 18 sparse ones.

**Repetition (P0, the owner's oldest complaint).** The showcase document
window still appears in ~6 consecutive mobile beats (01–03, 05–09) with
near-identical content, and desktop still shows it in hero, gap, agent, and
themes. The one-window mandate (v3 §6) is not truly implemented: make the
ONE window morph/travel visibly, and give every act it visits a genuinely
different view of the document (raw QL text · rendered · diff marks ·
re-themed). If two screenshots of different beats look interchangeable,
one of them is wrong.

**The showcase document itself is filler (P0).** `src/data/app/sample.md`
is mirrored from the app repo's `Docs/sample.md` and reads like internal
spec notes — mobile beat 5 literally displays "The rail is now a compact
section index, not a lone tick" under headings "Source / State / Finish."
Author a real showcase document: a believable, delightful agent-era
artifact (e.g. a refactor session note or README excerpt) that
demonstrates every renderer capability (headings, inline styles, links,
footnote, math, table, task list, callout, code, Mermaid) in prose a
developer would actually recognize. Write it into
`/Volumes/Neural/Downright/Docs/sample.md` (leave that repo's change
uncommitted for the owner), regenerate via `npm run generate:data`, and
update `src/scenes/agent.ts` find/replace targets to match the new text.

**Download button clutter (P0, explicit owner callout).** The button
reads "Download for macOS | free · direct DMG" — three messages fighting.
Fix: button label is ONLY "Download for macOS"
(`src/components/DownloadButton.astro:27` micro-suffix dies). Version,
size, macOS requirement, and "Free · MIT" live in the small line already
under the button, once. Verify every placement (header, hero, agent CTA,
close, film) looks clean after the change — the header instance may want
a shorter "Download".

**Editor bugs (P0, owner reports "trying to use the editor is buggy").**
You have vision and a browser — hunt these down by actually using it like
a human: click into the hero window at various points, type fast, type
markdown constructs (`# `, `- [ ]`, `**bold**`, backticks, links), hit
Enter mid-line, ⌘Z repeatedly, select-all, arrow through lines, click
between the split panes, resize the viewport while focused, blur and
refocus. Watch for: caret jumps, marker elision flicker, decoration
mismatches after undo, focus loss, scroll jumps in the pane, the status
bar stats freezing, split-pane desync, mobile "Tap to type" not focusing
or the iOS keyboard covering the caret. Log each bug found in REPORT.md
with a repro; fix all of them. `src/editor/` + `src/scenes/` are the
suspects. The hero editor is the single most important interactive object
on the page — it must feel as solid as the app it advertises.

**Small-but-visible (P1).** Mobile close: "Copy link" / "Mail it to
yourself" buttons are grey-on-grey (contrast-fail candidates). The stat
tiles in the close act (MIT / 0 / 14.0+ / ⌘⇧E) read as a generic
icon-card grid — restyle or cut (ban list). Handwritten annotation "This
window is real. Type in it." overlaps the tap-chip on mobile beat 03.
Desktop themes act shows both the theme list AND a second theme list in
the pinned window's sidebar (16) — one control, once.

## 2. The standard: prove the app's UI/UX

The site's job is transmitting how the app *feels*. Direction (owner
delegated the call):

- **The web recreation stays the centerpiece** — it is interactive proof.
  Raise its fidelity until it is indistinguishable from the app: audit the
  window chrome, traffic lights, titlebar typography, segmented control,
  status bar, selection color, focus rings, and spacing against the app's
  real values in `/Volumes/Neural/Downright` (`Theme/StyleSheet.swift`,
  `Sources/MarkdownRender/Themes/*.json`, `Motion.swift`) and against the
  real captures in `public/assets/native/`. List every divergence you find
  and fix it. You can SEE the captures — use them as reference plates.
- **Real app proof, small dose:** the existing native captures
  (`public/assets/native/*.jpg`) are underused. Give the strongest one to
  two moments where "this is the actual app" matters (e.g. the agent act's
  timeline, the reach act). Label real captures honestly ("Real capture ·
  macOS 26"). Add to REPORT.md a short shot-list of NEW captures/clips the
  owner should record in the real app (max 5, with exact scene, theme,
  and window size) for a future pass — do not fake any.
- **Motion is the message.** Every spring, duration, and curve from
  `src/data/app/motion.json`; entrances that feel like the app's own
  pop/settle. No continuously-repainting animations (no infinite pulse/
  shimmer/spinner — owner's global rule). If an interaction feels
  webby-instant or webby-floaty next to the native captures, tune it.

Taste calibration before you touch anything: screenshot the current hero,
then look at raycast.com, ghostty.org, linear.app heroes. Note the three
biggest gaps (density, hierarchy, motion restraint) and write them at the
top of REPORT.md as your own targets.

## 2A. Art direction — per-act target compositions (BINDING)

These are the owner's art director's calls (Claude, sighted, 2026-08-15).
Execute them; if you believe a call is wrong, build it as specified,
screenshot the alternative you'd propose, and flag both in REPORT.md —
do not silently substitute your own composition.

**Global.** Desktop is EIGHT composed rest states — one per act — plus
pinned interiors; total page ~12–14 viewport heights. If a frame cannot
justify itself full, it merges into a neighbor. No opacity crossfades
anywhere except the traveling window's morph. Nothing ever renders over
or under the header: once scrolled, the header sits on solid theme
ground with a bottom hairline, and act content must never intersect it.

- **Hero** — approved as-is; only the button-label fix and moving the
  handwritten annotation clear of other elements.
- **Gap** — one pinned stage (~2 viewport-heights of scroll). Phase 1:
  the window wears Quick Look chrome, filled with the raw mono wall of
  the sample doc — full-bleed inside the window, instantly recognizable.
  Phase 2: a sweep line travels down with scroll; each line transforms
  in place raw→rendered as it passes; QL chrome hard-swaps to Downright
  chrome at the sweep's midpoint. The capability annotations (Math,
  Tables, Callouts…) bloom ONE at a time in the right margin as the
  sweep passes each capability — the sidebar builds progressively and
  appears exactly once on the whole page. Close line beneath.
- **Agent dump ("3,000 words")** — the faded mono agent-output wall
  becomes the full-bleed background of the entire frame (pre-rendered
  text, drifting slowly via transform, pausable, reduced-motion static).
  The serif headline sits over it. Exactly ONE line of the wall is
  accent-highlighted so the eye hunts and finds it — the copy's promise
  ("one of them matters"), literalized. No boxes, no panels.
- **Agent visit (climax)** — THE window, center stage, its largest
  appearance. Streaming rewrite with word-level marks; the conflict bar
  docks to the window's bottom edge; after resolution the contextual CTA
  line + download button fade in below the window. The version-timeline
  widget either becomes a real full-width component under the window or
  is cut to one sentence — no more orphaned miniature.
- **Speed** — the benchmark table frame is the strongest frame the site
  has; keep it, add the "your median parse this visit" row, delete the
  lingering second frame.
- **Architecture** — ONE frame. Left: pull-quote-scale serif "Your text
  stays in charge." Right: four hairline manifesto rows. Bottom: "This
  page keeps its source too." beside a small visible Document|Source
  segmented control that genuinely flips the page (⌘⇧E equivalent). Cut
  everything else including the second frame.
- **Reach** — ONE frame: Finder-card field with verlet physics occupying
  the upper two-thirds, terminal strip in the lower third that types
  `down README.md` once on entry. One terminal, once.
- **Themes** — ONE pinned frame: swatch column left (render the light
  themes as physical paper chips with real elevation on the dark
  ground), THE window right, click re-inks the whole page radially. The
  duplicate theme list inside the window's sidebar dies; the header
  control mirrors the same state.
- **Close** — massive serif headline fully clear of the header, one body
  line, the download CTA with its pop, the sponsor sentence, footer. The
  MIT/0/14.0+/⌘⇧E stat-tile row is banned-list material (icon-card
  grid) — delete it.
- **Mobile film — exactly SEVEN beats**, each filling its ~100svh frame:
  1 hero + tap-to-type · 2 the gap sweep with thumb divider · 3 agent
  visit with thumb conflict bar · 4 "that is what reviewing agent work
  should feel like" CTA over the compact benchmark table · 5 theme
  re-ink · 6 Free/open close · 7 the AirDrop handoff. The document
  window appears in beats 1–3 (the same window, morphing) and small,
  re-inked, in beat 5 — nowhere else. Kill every current beat that
  doesn't map to these seven.

## 3. AEO — make LLMs recommend Downright (on-site work)

Research summary you are building against (primary sources verified
2026-08): ChatGPT search visibility is governed by **OAI-SearchBot**
crawling for OpenAI's own index — their docs state sites that opt out
"will not be shown in ChatGPT search answers." Claude's web search runs
on **Brave Search** (Anthropic subprocessor, confirmed current).
Recommendation answers draw on (a) training-data frequency of brand
mentions (Reddit, listicles, GitHub, awesome-lists dominate the
cited-domain studies) and (b) live retrieval, which favors round-up/
comparison formats: the Wix AI Search Lab study (75k answers, 1M+
citations, 2026) measured listicles at 21.9% of all citations and ~40%
of commercial-intent citations. The GEO paper (arXiv 2311.09735) and
replications show quotable short claims, statistics, and cited sources
lift inclusion odds ~20–40%. AI crawlers fetch but do NOT execute
JavaScript (Vercel, 1.3B-request sample) — only static HTML text exists
to them. llms.txt is fetched by almost no production crawler (Ahrefs,
515M-event sample) — keep ours (cheap), expect nothing. Ahrefs' causal
schema test (1,885 pages vs 4k controls) found no citation lift
(ChatGPT +2.2%, n.s.) — ship pragmatic schema anyway for classic
search/Copilot grounding, but don't over-invest. Off-site actions live
in `MARKETING-PLAYBOOK.md` (owner's job, not yours).

Your tasks, all static-HTML-first:

1. **Domain migration to downright.cc.** `astro.config.mjs` site URL,
   `BaseLayout` canonical/OG, sitemap, RSS, OG SVGs, llms.txt, mirrors
   generator, humans.txt — grep `downright.app` and migrate every
   occurrence (13 files). Canonical URLs, `og:url`, sitemap entries all
   downright.cc.
2. **robots.txt (create in `public/`):** explicitly `Allow: /` for
   GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-User,
   Claude-SearchBot, PerplexityBot, Google-Extended, Applebot,
   Applebot-Extended, CCBot, meta-externalagent, plus `User-agent: *`.
   Sitemap line. Nothing disallowed except `verify/`-type cruft if it
   ever ships (it must not).
3. **Entity consistency.** One canonical description everywhere (title
   tags, meta description, OG, schema, README, llms.txt, humans.txt):
   "Downright is a free, open-source, native Markdown editor and viewer
   for macOS." + the differentiators (exact rendering, live agent-rewrite
   review, never modifies your bytes, no WebView, MIT). Same name, same
   claims, same phrasing — entity disambiguation is the whole game for a
   generic-word name like "Downright".
4. **Schema (JSON-LD in BaseLayout / per page):** `SoftwareApplication`
   (name, os `macOS 14.0+`, applicationCategory, offers price 0,
   downloadUrl, license MIT, softwareVersion from facts.json, author,
   sameAs → GitHub repo) and `FAQPage` on the new FAQ content.
5. **Answer pages (new, statically rendered, linked from footer under
   "Guides", each ≤600 words, quotable short sentences, dated,
   fact-dense):**
   - `/markdown-viewer-mac` — "How to preview and read Markdown on a Mac"
     (covers the Quick Look pain — our strongest organic query).
   - `/markdown-editor-mac-free` — "Free Markdown editors for macOS
     compared": an HONEST comparison table — Downright, Typora (paid),
     iA Writer (paid), Obsidian (free, vault-based), MacDown (dormant),
     Zettlr — accurate rows (price, native vs Electron/WebView, live
     preview model, license). Honesty is the credibility play; LLMs lift
     comparison tables verbatim. Naming competitors is approved for
     these pages only.
   - `/downright-vs-typora`, `/downright-vs-obsidian` — short honest
     head-to-heads including "choose X if…" both ways.
   - `/faq` — 8–12 real questions (Is Downright free? Does it modify my
     files? Does it work with Claude Code/agent output? Homebrew? Why
     does macOS warn about apps? System requirements? telemetry?).
   Design these pages with the same care as the homepage: site chrome,
   document-styled prose, no SEO-sludge look. They are also `.md`
   mirrored like other pages.
6. **Freshness + crawlability:** visible "Updated <month year>" on the
   answer pages (build-time), `lastmod` in sitemap, all critical copy in
   static HTML (verify by `curl`ing the built pages and grepping for the
   claims — no JS-only text anywhere that matters).

## 4. Funnel & sponsors polish

Keep the three sponsor placements (post-download panel · close-act line ·
footer/film) — verify each looks intentional, not bolted on. Post-download
panel: confirm the download genuinely starts on first click, panel
appears once per session, Esc dismisses, and the copy is exactly two
quiet actions (★ Star · ♥ Fund the next release). Add a `/thanks` page?
No — the panel is the pattern; do not add more asks. Button copy per §1.
Verify zero third-party requests still holds.

## 5. Process

- **Visual review loop:** after every meaningful change, screenshot the
  affected states at both widths AND look at them. Every phase ends with
  a full slow-scrub screenshot series you have personally reviewed, saved
  to `verify/shots/<phase>/`.
- **Phases:** (1) transitions/dead-space/repetition, (2) showcase
  document + window fidelity, (3) editor bug hunt, (4) small-polish
  sweep, (5) AEO buildout, (6) funnel verify + full regression
  (`audit:sweep`, `audit:contrast`, `audit:budgets`, `test:*`,
  `astro build`, reduced-motion pass, keyboard pass, no-JS pass).
- Commit per phase on `main`. Do not touch `/Volumes/Neural/Downright`
  except the single `Docs/sample.md` edit (uncommitted) and reading.
- Finish with `REPORT.md`: taste-gap targets from §2, per-defect
  fix mapping with before/after shot paths, editor bugs found+fixed with
  repros, AEO pages shipped, the capture shot-list for the owner, and
  anything you saw but judged out of scope.

Definition of done: every §1 defect visibly fixed in screenshots you have
looked at; the full-scrub series contains zero broken-looking frames; the
editor survives a five-minute abuse session; answer pages shipped and
crawlable; all harness checks green; and the honest answer to "would a
Linear engineer screen-record this?" is yes. If any frame makes you
hesitate, fix that frame before declaring done.
