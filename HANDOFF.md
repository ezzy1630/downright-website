# Handoff: audit findings + next work order (2026-08-15)

You are continuing work on the Downright marketing site. Read
`/Volumes/Neural/downright-website/plan.md` (v2.1, "The Living Document") in
full first — it is the spec, and §18's acceptance tests are your judge. This
document is the audited state of the current build and your work order. The
bar is unchanged: a jaw-dropping, unforgettable, beautiful site that
developers screen-record. The previous agent built real machinery; your job
is to make it *true*, then make it *sing*.

## A. Audited state (verified by driving the real page)

**Genuinely working — protect these:**
- The CM6 editor mounts on real pointerdown and typing `# Hello world`
  renders a 31.25px New York H1 with the typed marker elided. (test 1 ~60%)
- ⌘⇧E flip works, 3D matrix applied, and the source face shows the *current*
  document including user edits, with line numbers. (test 7 partial ✓)
- ⌘K palette opens with 26 wired actions and focused input. (✓)
- Structural zoom: anchor held to the pixel (480→480), real FLIP (24
  elements in flight), collapses correctly. Level buttons work. (test 3 core ✓)
- Hero edit persists into the zoom surface (store partially real). (test 2 partial ✓)
- 4 CTAs, zero third-party requests, self-hosted fonts, honest benchmark
  payload, `data-error` diagnostics on `<html>`, humans.txt/llms.txt. (✓)

**Broken — fix in this order:**
1. **The agent visit never fires** (`src/scenes/agent.ts`). Section centered
   in viewport 3.5s → no rewrite, no marks, empty sessionStorage. The
   conflict bar and toast exist in DOM but never activate. This is the
   page's climax and it is dead. Make arming robust: IntersectionObserver
   AND a geometry fallback on the shared scroll read; fire on first
   entry with the document ≥50% visible; test with dirty and clean buffers.
2. **The five-clone window problem** — the direct cause of the owner's
   complaint ("the same img shows up every scroll, none interactable").
   `AppWindow` is instantiated 5× (hero/gap/render/agent/themes) with
   IDENTICAL static content; only the hero is `data-editor-window`; the
   agent/render/theme windows do NOT reflect store edits (verified: hero
   edit absent from agent window). Fix architecturally, choose one:
   (a) ONE real window that travels between act slots via FLIP morph
   (measure slot → spring transform; the window visibly flies to the next
   act as you scroll — this is the unforgettable option and matches the
   Living Document metaphor), or (b) per-act windows that are *different
   views* (gap shows QL chrome, render shows a taller reading view, agent
   shows the same buffer) — but ALL rendering live from `kernel/store`, no
   two acts visually identical. Either way: every window subscribes to the
   store; kill all static duplicate bodies.
3. **Theme cards don't switch the theme** (`src/shell/spill.ts`). Clicking
   Nord in #themes: 37 sampled frames, zero change. Direct
   `switchTheme('nord', origin)` works (root → `#2e3440`). Suspects: the
   kernel ticker not running/resuming (check `switchboard` pause logic and
   `document.hidden` resume), listeners bound before scene DOM exists, or
   double-module-instance hazards. Also verify the wave actually staggers
   radially (hero and close zones must differ mid-transition) and add the
   §18.6 OKLab mid-transition assertion to `scripts/` as a test.
4. **Marker elision only decorates edited lines** (`src/editor/livedown.ts`).
   Pre-existing document lines show raw `# ` markers (verified in DOM:
   line 1 got `.live-elided`, line 2 didn't). Decorations must cover the
   whole visible range on mount, not only changed ranges.
5. **Keyboard path to the editor is dead**: the hero window has no
   `tabindex`, so the keydown hydration branch can never fire and keyboard
   users cannot reach the page's headline feature. Add `tabindex="0"`,
   visible focus ring, Enter-to-edit. Also: after mount, `view.focus()`
   appears not to land — verify and fix.
6. **Render stage**: machinery exists (`--stage-progress` reaches 1.0) but
   with all windows showing identical static content the sync is invisible,
   and the annotation blooms need verification + choreography polish
   (connector hairline drawing on the structural curve per plan §8.3).
   After fix #2, verify document scroll visibly tracks page scroll and
   annotations bloom exactly once at the reading line.
7. **Glass is T3-only everywhere** (`palette: blur(12px) saturate(1.5)`).
   Implement T1 displacement refraction for Chromium per plan §6 (kube.io
   technique; crib shuding/liquid-glass) on palette, toast, theme popover;
   owned-backdrop T2 on the window chrome. Keep geometry static.
8. **The mobile film is a stub** (`src/scenes/film.ts`: beats 1 + fragments;
   0 film-beat elements in DOM at mobile width). Build the full six-beat
   film per plan §9: gap divider thumb-drag · pinch-the-zoom (touch) ·
   agent visit with thumb-sized conflict bar · tap theme spill · the
   AirDrop/share/copy/mailto handoff close. `?film` preview param exists —
   use it. Then §18.11 on real devices.
9. **Pinning**: only the render stage is sticky. Zoom and themes acts are
   specced as pinned stages (§8.4, §8.9) — implement, with pin distances
   1.5–2.5 viewport heights and top-to-bottom readability with JS off.
10. **Not a git repository.** `git init` + an initial commit before you
    touch anything, then commit per phase. Also delete the three stray
    `ChatGPT Image *.png` files at repo root.

## B. After it's true: make it beautiful (the polish pass)

The owner's verdict on the current build: "not properly designed, UI
elements overdone." Audit and fix with taste, using plan §3–4 tokens only:
- **Kill repetition**: after fix A2 there should be exactly one full app
  window visible per viewport, ever. Acts without the window get their own
  distinct visual life (the agent-dump wall, the benchmark table, the
  Finder surface, the terminal).
- **Hierarchy pass over every act**: one serif display line per act, one
  supporting paragraph, then the demo. Cut every third element that
  competes. The 951-line acts.css needs a spacing/rhythm audit against the
  96→144px scale and the 68–72ch measure.
- **Motion pass**: every entrance uses the app's curves/durations from
  `src/data/app/motion.json`; staggers 0.04s; nothing reveals twice;
  velocity-aware pacing (kernel/pacing.ts exists — wire it everywhere).
- **Magnetism**: subtle (2–4px). Verify it's not on body text or the
  document surface — controls only.
- **The hero composition**: window cropped by the fold right edge per plan
  §8.1; headline glyph proximity response amplitude barely perceptible;
  check dark themes don't break the paper shadow.
- Run `npm run audit:contrast` across all six themes and fix failures.

## C. Definition of this work order being done

Every §18 test (1–12) passes literally, run as scripts where possible and
by hand where not; `astro build` clean; budgets green (`npm run
audit:budgets`); all six themes AA; reduced-motion/-transparency verified;
the five-clone problem is gone; the agent visit fires and is resolvable;
the mobile film exists at `?film` and on a real phone viewport; the repo
is a git repository with per-phase commits. Then do one full slow
scroll-through at 1440px and one at 390px and ask: would a Linear engineer
screen-record this? If any act makes you hesitate, polish that act before
declaring done.

Do not ask for approval between fixes. Verify each fix in the running
browser (dev server: `npm run dev`, port 4321) the way the audit did —
type, press, click, sample — not by reading your own code.
