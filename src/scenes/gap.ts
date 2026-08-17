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
  const section = document.querySelector<HTMLElement>("[data-sweep-stage]");
  // The sweep surface is the traveling window's read pane — the same node the
  // hero showed, re-parented into the pinned stage. The sweep owns that layer
  // while the window is parked here (the travel director's store paint stands
  // down for it), and hands it back washed when the window flies on.
  const appWindow = document.querySelector<HTMLElement>("[data-editor-window]");
  if (!stage || !section || !appWindow) return;

  const blocks: SweepBlock[] = [];
  const notes: Annotation[] = [];
  const line = document.createElement("i");
  line.className = "sweep__line";
  line.setAttribute("aria-hidden", "true");
  // Paint state, hoisted: build() resets `last` so the first paint after a
  // take-over runs even when progress itself has not moved — without this,
  // the pane scroll and block opacities freeze at whatever the previous
  // owner's last paint left behind.
  let last = -1;

  const readPane = (): HTMLElement | null =>
    appWindow.querySelector<HTMLElement>("[data-document-read]");
  const surface = (): HTMLElement | null =>
    appWindow.querySelector<HTMLElement>("[data-document-read] [data-static-document]");

  const bindAnnotations = (): void => {
    notes.length = 0;
    for (const note of document.querySelectorAll<HTMLElement>("[data-annotation]")) {
      const selector = note.dataset.annotation;
      if (!selector) continue;
      const index = blocks.findIndex((block) => block.rendered.querySelector(selector));
      if (index < 0) continue;
      notes.push({ note, at: blocks[index].at + BLOCK_RAMP * 0.6, fired: false });
    }
  };

  const build = (): void => {
    if (appWindow.dataset.slot !== "gap") return;
    const pane = surface();
    if (!pane) return;
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
    pane.replaceChildren(fragment);
    readPane()?.append(line);
    bindAnnotations();
    last = -1;
    window.dispatchEvent(new Event("scroll"));
  };

  // Reduced motion gets a static composed frame: the first half stays raw,
  // the rest stays rendered, so the before/after reads top-to-bottom with
  // zero motion.
  const applyStatic = (): void => {
    stage.dataset.sweepStatic = "true";
    blocks.forEach((block, index) => {
      const done = index >= Math.floor(blocks.length / 2);
      block.raw.style.opacity = done ? "0" : "1";
      block.rendered.style.opacity = done ? "1" : "0";
    });
    stage.style.setProperty("--sweep-progress", "1");
    const pane = readPane();
    if (pane) pane.scrollTop = (pane.scrollHeight - pane.clientHeight) * 0.5;
    appWindow.dataset.chrome = "app";
    for (const note of notes) note.note.classList.add("is-bloomed", "is-static");
  };

  // The window's arrival is the sweep's cue: the travel director re-parents it
  // into the gap slot and sets data-slot, and this observer takes the read
  // layer over on the same microtask — no frame ever shows the plain document
  // inside the pinned stage. Departure washes the layer back to the plain
  // document (the director's store paint), so the sweep drops its references
  // and pulls the render line out of the pane.
  new MutationObserver(() => {
    if (appWindow.dataset.slot === "gap") {
      if (blocks.length) return;
      build();
      if (reducedMotion()) applyStatic();
    } else if (blocks.length) {
      blocks.length = 0;
      line.remove();
    }
  }).observe(appWindow, { attributeFilter: ["data-slot"] });
  // A deep link can land the window in the gap before this scene mounts.
  if (appWindow.dataset.slot === "gap" && !blocks.length) {
    build();
    if (reducedMotion()) applyStatic();
  }

  doc.subscribe(build);

  if (reducedMotion()) {
    if (blocks.length) applyStatic();
    return;
  }

  let running = false;

  const paint = (progress: number): void => {
    if (Math.abs(progress - last) < 0.0008) return;
    last = progress;
    stage.style.setProperty("--sweep-progress", progress.toFixed(4));
    if (appWindow.dataset.slot === "gap") {
      appWindow.dataset.chrome = progress >= CHROME_AT ? "app" : "ql";
    }

    // The pane follows the line. The document runs ~3x the visible sheet, so
    // without this the later turns happen below the fold, out of sight, and
    // the line drifts away from the very block it is turning. Same mapping
    // the film's thumb scrub uses; a pure function of progress, so scrubbing
    // backwards retraces it exactly.
    const pane = readPane();
    if (pane) {
      const total = pane.scrollHeight - pane.clientHeight;
      if (total > 0) {
        pane.scrollTop = Math.min(1, Math.max(0, (progress - 0.32) / 0.6)) * total;
      }
      line.style.translate = `0 ${(Math.min(1, Math.max(0, (progress - 0.35) / 0.58)) * pane.clientHeight).toFixed(1)}px`;
    }

    for (const block of blocks) {
      const turn = Math.min(1, Math.max(0, (progress - block.at) / BLOCK_RAMP));
      // A hard hand-off, not a crossfade: the raw half leaves at the midpoint
      // and the rendered half arrives on the next frame. The line still
      // travels continuously, but two readings can never stack into a double
      // image when the scroll lands between animation frames.
      const handedOff = turn >= 0.5;
      block.raw.style.opacity = handedOff ? "0" : "1";
      block.rendered.style.opacity = handedOff ? "1" : "0";
      block.rendered.style.transform = `translateY(${handedOff ? "0" : "7"}px)`;
      block.raw.style.transform = `translateY(${handedOff ? "-7" : "0"}px)`;
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
