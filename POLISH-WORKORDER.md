# Downright website — the framing pass (work order v5, 2026-08-16)

You are a vision-capable agent working in `/Volumes/Neural/downright-website`
(Astro 5, dev server `npm run dev` port 4321). This is a PRECISION PASS, not
a rebuild. The content, narrative, machinery, and most compositions are now
approved. What remains is framing, rhythm, and a curated punch list. Do not
restructure acts, rewrite copy, or invent new sections. `LUNA-WORKORDER.md`
§2A remains the binding art direction; this file wins conflicts.

Your loop for every item: reproduce it on screen → screenshot → fix →
screenshot again → LOOK at both → only then move on. Keep the regression
harness green throughout (`npm run audit:sweep`, `audit:contrast`,
`audit:budgets`, `test:editor`, `test:theme`, `test:acts`, `astro build`).
Commit in small, described steps. Finish with REPORT.md listing each item
below with before/after screenshot paths.

## A. The framing law (the one systemic fix)

The page still fails at its stopping points. A sighted scrub found: the
close headline clipped behind the header; the benchmark table cut mid-row
while the architecture headline is already fully visible; architecture's
tail rows still on screen when reach's headline arrives; the terminal
visible in two consecutive rest states; the gap's annotation rail present
in three consecutive frames. Institute and verify:

1. **Header clearance, permanently.** No text or window edge may ever
   intersect the header at any scrollY, in any theme, at 1280/1440/1680
   widths. The close act's serif headline is the repeat offender — give
   every act's leading element a top clearance ≥ header height + 32px at
   its rest position, and check the first AND last viewport of every act.
   Separately: the header nav links are nearly illegible (far too faint).
   Raise them to quiet-but-readable (they must pass AA against the ground
   in all six themes — add them to the contrast audit if absent).
2. **Scroll economy.** Eighteen frames of scroll now carry ~8 acts of
   material. Tighten each act's scroll range so that between two acts
   there is at most ~0.25 viewport of transition, and no rest position
   exists where two acts' text is simultaneously readable. The specific
   straddles to eliminate: speed→architecture, architecture→reach,
   reach→themes, themes→close. After tightening, a full slow scroll at
   1440×900 should land cleanly act-by-act with zero half-frames. Record
   a scrub series (every 100px) and review it yourself frame by frame.
3. **One appearance each.** The terminal appears once (inside the reach
   frame). The gap's capability annotation rail appears once, blooming
   item-by-item as the sweep passes each capability — it must not ride
   alongside three consecutive viewports. The app window appears in
   hero, gap, agent, and themes only.

## B. Desktop punch list

4. **The raw wall must hurt.** The Quick Look beat's plain-text view is
   currently airy and double-spaced — it looks fine, which defeats it.
   Make it honest: dense 14–15px mono, tight single leading, full lines
   of real `#`/`**`/pipe/`$` clutter filling the window, exactly like
   `qlmanage` renders. The "before" has to look like the thing you hate.
5. **The dump beat's missing moment.** The faded agent-wall background
   is in, but it is too faint to read as text, and the single
   accent-highlighted line ("the one that matters") was never built.
   Raise the wall to barely-readable, put the headline block on the left
   measure (it currently floats right-of-center over a dead left half),
   and highlight exactly one plausible line in accent so the eye hunts
   and finds it. Reduced-motion: wall static.
6. **Architecture frame balance.** Everything currently hugs the right
   half; the left half is empty. Per the art direction: pull-quote serif
   headline on the LEFT measure, the four manifesto hairline rows on the
   right, the Document|Source segmented control + "This page keeps its
   source too" line beneath as one grouped unit. One frame, no tail
   spilling into reach.
7. **Agent act.** Frame with headline + marked-up window is good — keep.
   Verify the "Every change lands on a timeline…" caption belongs to a
   composed frame rather than floating in a straddle, and that the
   window's top never clips under the header at its rest.
8. **Footer link farm.** The footer now reads as flat SEO word soup
   ("Markdown viewer · Free editors · Agent workflows · Vs Typora · Vs
   Obsidian · FAQ" inline with product links). Group it: one quiet
   "Product" row (Repository · Changelog · Themes · Sponsor · Privacy ·
   MIT licence) and one labeled "Guides" row for the answer pages. Same
   type, clear hierarchy, no pill buttons.
9. **New pages QA.** `/faq`, `/markdown-viewer-mac`,
   `/markdown-editor-mac-free`, the two vs-pages, `/download`,
   `/benchmarks`, `/engineering`, `/press`, guides/ and compare/ —
   screenshot each at both widths. They must look like designed pages of
   this site (site chrome, correct type scale, measure 68–72ch, working
   theme switch, no unstyled tables). Fix what falls short; these pages
   are what LLM crawlers quote.

## C. Mobile punch list (390×844, and verify 430×932)

10. **Fill every beat.** Several beats are 40–70% empty black (the gap
    explainer, the sweep tail, the speed CTA, the theme-spill entry, the
    close). The film declares seven beats — make the rendered page match:
    each beat's content vertically centered and sized to genuinely fill
    ~100svh, adjacent beats packed tight, no beat consisting of a lone
    eyebrow or a stranded slider. If a beat cannot fill a frame, merge it
    with its neighbor rather than padding it.
11. **The mobile gap beat argues backwards.** The Quick Look chrome
    currently shows RENDERED content (typeset math, a Mermaid diagram).
    The QL frame must open showing raw plain bytes — the pain — and only
    render via the slider/sweep interaction. Verify the raw→rendered
    slider's initial state and direction.
12. **Deduplicate the conflict window.** The marked-up document window +
    conflict bar currently occupies two consecutive beats nearly
    identically. One beat: setup line, window with marks, conflict bar,
    resolution. The following beat is the CTA ("That is what reviewing
    agent work should feel like") and must not repeat the window.
13. **One close beat.** "Free. Open source. MIT. No account." currently
    smears across three sparse frames. Compose it as one full beat:
    headline, body line, download button, sponsor sentence — then the
    handoff beat, then footer.
14. **Beat-boundary clipping.** No beat may open with clipped remnants of
    the previous beat (the meta line, the swatch row, and the body-text
    fragments all currently clip at beat tops). Same header-clearance rule
    as desktop.

## D. Small visible defects (fix all, 30 min sweep)

15. Hero/window title renders its last line ("stays readable") in a
    dimmed gray — looks like an accidental half-applied decoration.
    Title text is one color unless the caret is revealing markers.
16. The handwritten annotation and the tap-chips overlap on narrow
    widths — give them explicit clearance.
17. Desktop themes act: confirm the in-window sidebar theme list is gone
    (one control: the swatch column; the header control mirrors it).
18. Terminal content: the session (`down README.md` → "opened in
    Downright") is good; make sure it types once on entry, never loops.
19. Sweep the six themes at the hero + close + one guide page: check the
    nav, hairlines, button pair, and paper-chip swatches all hold up in
    Paper Light and High Contrast, not just Warm Dark.

## E. Done means

- A recorded 100px-step scrub at 1440×900 and 390×844 that YOU have
  reviewed frame-by-frame contains zero frames you would not ship: no
  header intersections, no dual-act text, no >40%-empty rests, no
  clipped headlines, no duplicate compositions.
- Every numbered item above: fixed, with before/after shots in
  `verify/shots/v5/` and a line in REPORT.md.
- Harness green; six themes AA including the nav links; reduced-motion
  and keyboard passes still clean; zero third-party requests.
- The honest answer to "does any frame make you hesitate?" is no.
