/**
 * The gap — the page's signature scroll mechanic.
 *
 * One pinned stage, ~2 viewport heights, scrubbed by native scroll (no wheel
 * interception, ever). Beat one is the thing every Mac developer already
 * knows: press Space on a .md file and macOS hands you the raw bytes — `#`
 * headings, `**asterisks**`, `| pipe | rows |`, `$math$` — in a drab plain
 * sheet. Beat two is a render line travelling down that sheet; every block it
 * passes turns, in place, into the finished page. Same bytes, decorated.
 *
 * How it stays at 60fps: every block ships BOTH halves stacked in one grid
 * cell, so the surface's height is fixed from first paint and the scrub never
 * triggers layout. The loop writes opacity and translate and nothing else —
 * no reads, no measurement, no DOM construction. The paint is a pure function
 * of progress, so scrubbing backwards retraces it exactly. Reduced motion gets
 * a static before/after pair instead.
 */

import agentDump from "../data/agent-dump.md?raw";
import { ticker } from "../kernel/ticker";
import { reducedMotion } from "../kernel/switchboard";
import { renderSampleMarkdown, renderSampleBlocks } from "../data/site";
import { doc } from "../kernel/store";

/** The sweep occupies this slice of stage progress; before it, pure Quick Look. */
const SWEEP_START = 0.35;
/** How much progress one block spends mid-turn. Kept tight on purpose: a wide
 *  ramp puts seven blocks in flight at once and the two halves, sharing a grid
 *  cell, read as a double image. At 0.05 roughly two blocks are ever turning. */
const BLOCK_RAMP = 0.05;
/** The chrome changes hands over the last of the sweep. */
const CHROME_AT = 0.86;

export function initGap(): void {
  // The film (§9) re-choreographs this act for the thumb: it builds the same
  // two-state blocks but drives the render line with a scrubber instead of
  // the pinned scroll. Building both would stack two sets of blocks on one
  // surface, so the desktop sweep stands down when the film is active.
  if (document.documentElement.dataset.film === "true") {
    initWall();
    return;
  }
  initSweep();
  initWall();
}

function smoothstep(value: number): number {
  const t = Math.min(1, Math.max(0, value));
  return t * t * (3 - 2 * t);
}

interface SweepBlock {
  raw: HTMLElement;
  rendered: HTMLElement;
  /** Progress at which this block starts turning. */
  at: number;
}

interface Annotation {
  note: HTMLElement;
  /** Progress at which this capability has finished rendering. */
  at: number;
  fired: boolean;
}

function initSweep(): void {
  const stage = document.querySelector<HTMLElement>("[data-sweep]");
  const surface = document.querySelector<HTMLElement>("[data-sweep-surface]");
  const windowEl = document.querySelector<HTMLElement>("[data-sweep-window]");
  const line = document.querySelector<HTMLElement>("[data-sweep-line]");
  const section = document.querySelector<HTMLElement>("[data-sweep-stage]");
  if (!stage || !surface || !windowEl || !section) return;

  const blocks: SweepBlock[] = [];

  const build = (): void => {
    const source = renderSampleBlocks(doc.current.text);
    const fragment = document.createDocumentFragment();
    blocks.length = 0;
    source.forEach((block, index) => {
      const element = document.createElement("div");
      element.className = "sweep-block";

      const raw = document.createElement("pre");
      raw.className = "sweep-block__raw";
      raw.textContent = block.raw;

      const rendered = document.createElement("div");
      rendered.className = "sweep-block__rendered document-content";
      rendered.innerHTML = block.html;

      element.append(raw, rendered);
      fragment.append(element);
      blocks.push({
        raw,
        rendered,
        at: SWEEP_START + (index / Math.max(1, source.length)) * (1 - SWEEP_START - BLOCK_RAMP),
      });
    });
    surface.replaceChildren(fragment);
    if (line) surface.append(line);
  };

  build();
  doc.subscribe(build);

  // The margin annotations name each capability at the moment the sweep
  // renders it — the act's teaching line, earned rather than asserted. Each
  // one is keyed to the block that actually contains its selector, so they
  // fire in document order and never fire twice.
  const notes: Annotation[] = [];
  for (const note of document.querySelectorAll<HTMLElement>("[data-annotation]")) {
    const selector = note.dataset.annotation;
    if (!selector) continue;
    const index = blocks.findIndex((block) => block.rendered.querySelector(selector));
    if (index < 0) continue;
    notes.push({ note, at: blocks[index].at + BLOCK_RAMP * 0.6, fired: false });
  }

  if (reducedMotion()) {
    // Static composed frame: the first half stays raw, the rest stays
    // rendered, so the before/after reads top-to-bottom with zero motion.
    stage.dataset.sweepStatic = "true";
    blocks.forEach((block, index) => {
      const done = index >= Math.floor(blocks.length / 2);
      block.raw.style.opacity = done ? "0" : "1";
      block.rendered.style.opacity = done ? "1" : "0";
    });
    stage.style.setProperty("--sweep-progress", "1");
    windowEl.dataset.chrome = "app";
    for (const note of notes) note.note.classList.add("is-bloomed", "is-static");
    return;
  }

  let running = false;
  let last = -1;

  const paint = (progress: number): void => {
    if (Math.abs(progress - last) < 0.0008) return;
    last = progress;
    stage.style.setProperty("--sweep-progress", progress.toFixed(4));
    windowEl.dataset.chrome = progress >= CHROME_AT ? "app" : "ql";

    for (const block of blocks) {
      const turn = Math.min(1, Math.max(0, (progress - block.at) / BLOCK_RAMP));
      // A hand-off, not a crossfade: the raw half is gone before the rendered
      // half arrives, so the two never stack into an unreadable double image.
      const out = smoothstep(turn / 0.5);
      const inn = smoothstep((turn - 0.5) / 0.5);
      block.raw.style.opacity = String(1 - out);
      block.rendered.style.opacity = String(inn);
      block.rendered.style.transform = `translateY(${((1 - inn) * 7).toFixed(2)}px)`;
      block.raw.style.transform = `translateY(${(out * -7).toFixed(2)}px)`;
    }

    for (const note of notes) {
      const bloomed = progress >= note.at;
      if (bloomed === note.fired) continue;
      note.fired = bloomed;
      note.note.classList.toggle("is-bloomed", bloomed);
    }
  };

  const tick = (): boolean => {
    const rect = section.getBoundingClientRect();
    const near = rect.top < window.innerHeight + 400 && rect.bottom > -400;
    if (!near) return false;
    const travel = Math.max(1, rect.height - window.innerHeight);
    paint(Math.min(1, Math.max(0, -rect.top / travel)));
    return true;
  };

  const loop = (): void => {
    if (!running) return;
    if (tick()) requestAnimationFrame(loop);
    else running = false;
  };
  const start = (): void => {
    if (running) return;
    running = true;
    loop();
  };

  window.addEventListener("scroll", start, { passive: true });
  window.addEventListener("resize", start, { passive: true });
  // rAF is throttled to nothing in background tabs and hostile webviews; the
  // timer keeps the scrub honest without it.
  window.setInterval(() => {
    if (!running) tick();
  }, 400);
  start();
  tick();
}

function initWall(): void {
  const wall = document.querySelector<HTMLElement>("[data-agent-wall]");
  if (!wall) return;

  // Real text — a different file from the one the window holds, so no two
  // surfaces on this page ever show the same content.
  wall.innerHTML = renderSampleMarkdown(agentDump);
  const scroller = wall.querySelector<HTMLElement>("[data-agent-wall-scroll]") ?? wall;
  let drift = 0;
  let visible = false;

  const observer = new IntersectionObserver(
    (entries) => {
      visible = entries.some((entry) => entry.isIntersecting);
    },
    { threshold: 0.15 },
  );
  observer.observe(wall);

  if (reducedMotion()) {
    wall.dataset.static = "true";
    return;
  }

  const job = (dt: number): boolean => {
    if (!visible) return true;
    drift += dt * 14;
    const max = scroller.scrollHeight - scroller.clientHeight;
    if (max > 0) scroller.scrollTop = Math.min(max, drift);
    return true;
  };
  ticker.add(job);
  wall.addEventListener("pointerenter", () => {
    scroller.scrollTop = Math.min(scroller.scrollHeight - scroller.clientHeight, drift);
    scroller.style.scrollBehavior = "auto";
  });
}
