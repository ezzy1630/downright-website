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

import { ticker } from "../kernel/ticker";
import { reducedMotion } from "../kernel/switchboard";
import { renderSampleBlocks } from "../kernel/renderer";
import { doc } from "../kernel/store";
import { springScrollTo } from "../motion/scroll";

/** The sweep occupies this slice of stage progress; before it, pure Quick Look. */
const SWEEP_START = 0.20;
const SWEEP_END = 0.90;
/** A block gets enough distance to read as a handoff, not a flash. */
const BLOCK_RAMP_MAX = 0.06;
const BLOCK_RAMP_MIN = 0.018;
/** The chrome changes hands with the closing line, after the document is made. */
const CHROME_ON = 0.90;
const CHROME_OFF = 0.84;

let teardownGap: (() => void) | null = null;

export function initGap(): void {
  teardownGap?.();
  teardownGap = null;
  // The film (§9) re-choreographs this act for the thumb: it builds the same
  // two-state blocks but drives the render line with a scrubber instead of
  // the pinned scroll. Building both would stack two sets of blocks on one
  // surface, so the desktop sweep stands down when the film is active.
  if (document.documentElement.dataset.film === "true") {
    teardownGap = initWall();
    return;
  }
  const cleanups = [initSweep(), initWall()];
  teardownGap = () => cleanups.forEach((cleanup) => cleanup());
}

interface SweepBlock {
  raw: HTMLElement;
  rendered: HTMLElement;
  /** Progress at which this block starts turning. */
  at: number;
  /** Last stable/active phase painted; stable phases need no repeat writes. */
  phase: -1 | 0 | 1 | 2 | 3 | 4;
}

interface Annotation {
  note: HTMLElement;
  /** Progress at which this capability has finished rendering. */
  at: number;
  fired: boolean;
}

function initSweep(): () => void {
  const stage = document.querySelector<HTMLElement>("[data-sweep]");
  const section = document.querySelector<HTMLElement>("[data-sweep-stage]");
  // The sweep surface is the traveling window's read pane — the same node the
  // hero showed, re-parented into the pinned stage. The sweep owns that layer
  // while the window is parked here (the travel director's store paint stands
  // down for it), and hands it back washed when the window flies on.
  const appWindow = document.querySelector<HTMLElement>("[data-editor-window]");
  if (!stage || !section || !appWindow) return () => {};

  const blocks: SweepBlock[] = [];
  const notes: Annotation[] = [];
  // Paint state, hoisted: build() resets `last` so the first paint after a
  // take-over runs even when progress itself has not moved.
  let last = -1;
  let blockRamp = BLOCK_RAMP_MAX;
  let blockCount = 0;
  let paneScrollTotal = 0;
  let paneElement: HTMLElement | null = null;
  let chromePromoted = false;
  const cleanups: Array<() => void> = [];

  const readPane = (): HTMLElement | null =>
    appWindow.querySelector<HTMLElement>("[data-document-read]");
  const surface = (): HTMLElement | null =>
    appWindow.querySelector<HTMLElement>("[data-document-read] [data-static-document]");
  const lede = stage.querySelector<HTMLElement>("[data-sweep-lede]");
  const closing = stage.querySelector<HTMLElement>("[data-sweep-closing]");
  const phase = stage.querySelector<HTMLElement>("[data-sweep-phase]");

  const blockLabel = (block: SweepBlock): string => {
    const rendered = block.rendered;
    if (rendered.querySelector(".doc-math")) return "math";
    if (rendered.querySelector(".mermaid-figure")) return "diagram";
    if (rendered.querySelector(".doc-table")) return "table";
    if (rendered.querySelector(".doc-callout")) return "callout";
    if (rendered.querySelector(".doc-footnote")) return "footnote";
    if (rendered.querySelector(".doc-code")) return "code";
    if (rendered.querySelector("h1, h2, h3, h4, h5, h6")) return "heading";
    return "prose";
  };

  const setPhase = (progress: number): void => {
    if (!phase) return;
    let next = "RAW MARKDOWN · QUICK LOOK";
    if (progress >= SWEEP_END) {
      next = "RENDERED SURFACE · SAME BYTES";
    } else if (progress > SWEEP_START && blocks.length) {
      const withinSweep = (progress - SWEEP_START) / (SWEEP_END - SWEEP_START);
      const index = Math.min(blocks.length - 1, Math.floor(withinSweep * blocks.length));
      next = `RENDERING ${blockLabel(blocks[index]).toUpperCase()} · ${String(index + 1).padStart(2, "0")} / ${String(blocks.length).padStart(2, "0")}`;
    }
    if (phase.textContent !== next) phase.textContent = next;
  };

  const bindAnnotations = (): void => {
    notes.length = 0;
    for (const note of document.querySelectorAll<HTMLElement>("[data-annotation]")) {
      const selector = note.dataset.annotation;
      if (!selector) continue;
      const index = blocks.findIndex((block) => block.rendered.querySelector(selector));
      if (index < 0) continue;
      notes.push({ note, at: blocks[index].at + blockRamp * 0.72, fired: false });
    }
  };

  const updateStageHeight = (): void => {
    const base = window.innerWidth <= 900 ? 200 : 220;
    // Longer documents earn more travel, but the cap prevents a malformed or
    // dropped document from turning the story into an endless tunnel.
    const extra = Math.max(0, blockCount - 27) * 2.5;
    section.style.setProperty("--sweep-stage-height", `${Math.min(340, base + extra)}svh`);
  };

  const build = (): void => {
    if (appWindow.dataset.slot !== "gap") return;
    const pane = surface();
    if (!pane) return;
    const source = renderSampleBlocks(doc.current.text);
    const fragment = document.createDocumentFragment();
    blocks.length = 0;
    blockCount = source.length;
    const span = SWEEP_END - SWEEP_START;
    blockRamp = Math.min(
      BLOCK_RAMP_MAX,
      Math.max(BLOCK_RAMP_MIN, (span / Math.max(1, source.length)) * 2.4),
    );
    updateStageHeight();
    chromePromoted = false;
    delete stage.dataset.sweepStatic;
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
        at: source.length <= 1
          ? SWEEP_START
          : SWEEP_START + (index / (source.length - 1)) * (span - blockRamp),
        phase: -1,
      });
    });
    pane.replaceChildren(fragment);
    paneElement = readPane();
    paneScrollTotal = Math.max(0, (paneElement?.scrollHeight ?? 0) - (paneElement?.clientHeight ?? 0));
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
    setPhase(1);
    const pane = paneElement;
    if (pane) pane.scrollTop = paneScrollTotal * 0.5;
    appWindow.dataset.chrome = "app";
    for (const note of notes) note.note.classList.add("is-bloomed", "is-static");
    closing?.setAttribute("aria-hidden", "false");
  };

  // The window's arrival is the sweep's cue: the travel director re-parents it
  // into the gap slot and sets data-slot, and this observer takes the read
  // layer over on the same microtask — no frame ever shows the plain document
  // inside the pinned stage. Departure washes the layer back to the plain
  // document (the director's store paint), so the sweep drops its references.
  const slotObserver = new MutationObserver(() => {
    if (appWindow.dataset.slot === "gap") {
      if (blocks.length) return;
      build();
      if (reducedMotion()) applyStatic();
    } else if (blocks.length) {
      blocks.length = 0;
      paneElement = null;
      last = -1;
      chromePromoted = false;
    }
  });
  slotObserver.observe(appWindow, { attributeFilter: ["data-slot"] });
  cleanups.push(() => slotObserver.disconnect());

  if (appWindow.dataset.slot === "gap" && !blocks.length) {
    build();
    if (reducedMotion()) applyStatic();
  }

  cleanups.push(doc.subscribe(build));

  // The Quick Look sheet's one action is real: "Open with…" opens the file
  // with Downright — the sweep fast-forwards to the promotion beat.
  const onQuickLookOpen = (): void => {
    if (appWindow.dataset.slot !== "gap") return;
    const travel = Math.max(1, section.offsetHeight - window.innerHeight);
    springScrollTo(section.offsetTop + 0.94 * travel, 560);
  };
  const quickLookOpen = document.querySelector("[data-ql-open]");
  quickLookOpen?.addEventListener("click", onQuickLookOpen);
  cleanups.push(() => quickLookOpen?.removeEventListener("click", onQuickLookOpen));

  if (reducedMotion()) {
    if (blocks.length) applyStatic();
    return () => cleanups.splice(0).reverse().forEach((cleanup) => cleanup());
  }

  let running = false;

  const paint = (progress: number): void => {
    if (Math.abs(progress - last) < 0.0006) return;
    last = progress;
    stage.style.setProperty("--sweep-progress", progress.toFixed(4));
    if (appWindow.dataset.slot === "gap") {
      if (progress >= CHROME_ON) chromePromoted = true;
      else if (progress <= CHROME_OFF) chromePromoted = false;
      appWindow.dataset.chrome = chromePromoted ? "app" : "ql";
    }

    setPhase(progress);

    // Headline crossfade: the conclusion arrives while the last blocks are
    // still settling, so the sentence explains the transformation in flight.
    if (lede) {
      const ledeOp = Math.min(1, Math.max(0, (0.42 - progress) * 5));
      lede.style.opacity = ledeOp.toFixed(3);
    }
    if (closing) {
      const closingOp = Math.min(1, Math.max(0, (progress - 0.42) * 5));
      closing.style.opacity = closingOp.toFixed(3);
      closing.setAttribute("aria-hidden", String(closingOp < 0.5));
    }

    // Smooth, calm document drift: continuous cubic glide through the transformation.
    const pane = paneElement;
    if (pane) {
      const total = paneScrollTotal;
      if (total > 0) {
        if (progress <= SWEEP_START) {
          pane.scrollTop = 0;
        } else if (progress >= SWEEP_END) {
          pane.scrollTop = total;
        } else {
          const t = (progress - SWEEP_START) / (SWEEP_END - SWEEP_START);
          // Smooth sine curve: (1 - cos(pi * t)) / 2
          const ease = (1 - Math.cos(Math.PI * t)) / 2;
          pane.scrollTop = ease * total;
        }
      }
    }

    // A controlled sequential dissolve keeps one representation readable at a
    // time. The neutral seam is intentionally tiny; it removes the ghosting
    // caused by different raw/rendered line boxes without snapping between
    // them.
    for (const block of blocks) {
      const turn = Math.min(1, Math.max(0, (progress - block.at) / blockRamp));
      if (turn < 0.22) {
        if (turn === 0) {
          if (block.phase === 0) continue;
          block.raw.style.opacity = "1";
          block.rendered.style.opacity = "0";
          block.raw.style.transform = "translateY(0.00px)";
          block.rendered.style.transform = "translateY(2px)";
          block.phase = 0;
          continue;
        }
        const exit = turn / 0.22;
        const easedExit = exit * exit * (3 - 2 * exit);
        block.raw.style.opacity = (1 - easedExit).toFixed(3);
        block.rendered.style.opacity = "0";
        block.raw.style.transform = `translateY(${(-2 * easedExit).toFixed(2)}px)`;
        block.rendered.style.transform = "translateY(2px)";
        block.phase = 1;
      } else if (turn > 0.24) {
        if (turn >= 1 && block.phase === 4) continue;
        const entry = (turn - 0.24) / 0.76;
        // Arrive a touch faster than the raw bytes leave: the finished type
        // should be legible during the handoff, not emerge as a faint ghost.
        const easedEntry = 1 - Math.pow(1 - entry, 4);
        block.raw.style.opacity = "0";
        block.rendered.style.opacity = easedEntry.toFixed(3);
        block.raw.style.transform = "translateY(-2px)";
        block.rendered.style.transform = `translateY(${(2 - 2 * easedEntry).toFixed(2)}px)`;
        block.phase = turn >= 1 ? 4 : 3;
      } else {
        if (block.phase === 2) continue;
        block.raw.style.opacity = "0";
        block.rendered.style.opacity = "0";
        block.raw.style.transform = "translateY(-2px)";
        block.rendered.style.transform = "translateY(2px)";
        block.phase = 2;
      }
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

  let loopFrame = 0;
  const loop = (): void => {
    if (!running) return;
    if (tick()) loopFrame = requestAnimationFrame(loop);
    else {
      running = false;
      loopFrame = 0;
    }
  };
  const start = (): void => {
    if (running) return;
    running = true;
    loop();
  };

  const onScroll = (): void => start();
  const onResize = (): void => {
    updateStageHeight();
    start();
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize, { passive: true });
  cleanups.push(() => window.removeEventListener("scroll", onScroll));
  cleanups.push(() => window.removeEventListener("resize", onResize));
  // rAF is throttled to nothing in background tabs and hostile webviews; the
  // timer keeps the scrub honest without it.
  const interval = window.setInterval(() => {
    if (!running) tick();
  }, 400);
  cleanups.push(() => window.clearInterval(interval));
  start();
  tick();

  return () => {
    running = false;
    if (loopFrame) window.cancelAnimationFrame(loopFrame);
    cleanups.splice(0).reverse().forEach((cleanup) => cleanup());
  };
}

function initWall(): () => void {
  const wall = document.querySelector<HTMLElement>("[data-agent-wall]");
  if (!wall) return () => {};

  const scroller = wall.querySelector<HTMLElement>("[data-agent-wall-scroll]") ?? wall;
  let drift = 0;
  let maxScroll = 0;
  let visible = false;

  let detachJob: (() => void) | null = null;

  if (reducedMotion()) {
    wall.dataset.static = "true";
    return () => delete wall.dataset.static;
  }

  const job = (dt: number): boolean => {
    if (!visible) {
      // The ticker removes a false-returning job itself. Clear our handle too
      // so a later IntersectionObserver entry can install a fresh job.
      detachJob = null;
      return false;
    }
    if (!maxScroll) {
      maxScroll = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
    }
    if (drift >= maxScroll - 0.5) {
      detachJob = null;
      return false;
    }
    drift = Math.min(maxScroll, drift + dt * 14);
    if (Math.abs(scroller.scrollTop - drift) > 0.5) scroller.scrollTop = drift;
    return drift < maxScroll - 0.5;
  };
  const ensureJob = (): void => {
    if (visible && !detachJob) detachJob = ticker.add(job);
  };
  const observer = new IntersectionObserver(
    (entries) => {
      visible = entries.some((entry) => entry.isIntersecting);
      if (visible) ensureJob();
      else {
        detachJob?.();
        detachJob = null;
      }
    },
    { threshold: 0.15 },
  );
  observer.observe(wall);
  const onPointerEnter = (): void => {
    maxScroll = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
    scroller.scrollTop = Math.min(maxScroll, drift);
    scroller.style.scrollBehavior = "auto";
    ensureJob();
  };
  wall.addEventListener("pointerenter", onPointerEnter);

  return () => {
    observer.disconnect();
    detachJob?.();
    detachJob = null;
    wall.removeEventListener("pointerenter", onPointerEnter);
  };
}
