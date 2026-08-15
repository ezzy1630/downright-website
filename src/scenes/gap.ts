/**
 * The gap, doubled. Beat one: two comparison cards — the honest Quick Look
 * capture beside the same file rendered live from the store. Beat two: a slow
 * wall of real agent-generated Markdown scrolling under one stark line. The
 * wall is DOM text, not an image.
 */

import agentDump from "../data/agent-dump.md?raw";
import { ticker } from "../kernel/ticker";
import { reducedMotion } from "../kernel/switchboard";
import { renderSampleMarkdown } from "../data/site";
import { doc } from "../kernel/store";

export function initGap(): void {
  initCompare();
  initWall();
}

/**
 * Beat one is a two-card comparison: the honest Quick Look capture beside the
 * same bytes rendered live. The right card is real DOM from the kernel store —
 * a hero edit shows up here — but deliberately NOT the app window: exactly one
 * window exists on the page, and the gap gets its own surface.
 */
function initCompare(): void {
  const surface = document.querySelector<HTMLElement>("[data-gap-render]");
  if (!surface) return;
  const paint = (): void => {
    surface.innerHTML = renderSampleMarkdown(doc.current.text);
  };
  paint();
  doc.subscribe(paint);
}

function initWall(): void {
  const wall = document.querySelector<HTMLElement>("[data-agent-wall]");
  if (!wall) return;

  // Real text, rendered by the same renderer the page trusts.
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
    // Static wall: the line reads, the wall stands. Complete, zero motion.
    wall.dataset.static = "true";
    return;
  }

  // Slow, constant drift — one viewport of text per ~40s of dwell.
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
