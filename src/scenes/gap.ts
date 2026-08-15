/**
 * The gap, doubled. Beat one: a sprung divider between the honest Quick Look
 * capture (left) and the live Downright render (right) — real physics, the
 * divider follows the pointer through a spring and carries flick velocity on
 * release; keyboard operable. Beat two: a slow wall of real agent-generated
 * Markdown scrolling under one stark line. The wall is DOM text, not an image.
 */

import agentDump from "../data/agent-dump.md?raw";
import { MOTION, SpringScalar } from "../kernel/springs";
import { ticker } from "../kernel/ticker";
import { PointerTracker } from "../kernel/pointer";
import { reducedMotion } from "../kernel/switchboard";
import { renderSampleMarkdown } from "../data/site";

export function initGap(): void {
  initDivider();
  initWall();
  // The right pane is the traveling window itself — the same file the hero
  // edits. Nothing to clone: the window flies in when the gap claims it.
}

function initDivider(): void {
  const stage = document.querySelector<HTMLElement>("[data-gap-stage]");
  const divider = document.querySelector<HTMLElement>("[data-divider]");
  if (!stage || !divider) return;

  const position = new SpringScalar(50, MOTION.durations.quick);
  const tracker = new PointerTracker();
  let dragging = false;

  const write = (): void => {
    const value = Math.min(82, Math.max(18, position.value));
    stage.style.setProperty("--divider-position", `${value}%`);
    divider.setAttribute("aria-valuenow", String(Math.round(value)));
  };

  const setFromEvent = (clientX: number, event: PointerEvent): void => {
    const rect = stage.getBoundingClientRect();
    const raw = ((clientX - rect.left) / rect.width) * 100;
    const clamped = Math.min(82, Math.max(18, raw));
    position.setTarget(clamped);
    tracker.update(event);
  };

  const run = (): void => {
    ticker.add((dt) => {
      const moving = position.advance(dt);
      write();
      return moving;
    });
  };

  divider.addEventListener("pointerdown", (event) => {
    dragging = true;
    divider.setPointerCapture(event.pointerId);
    position.snap(Math.min(82, Math.max(18, position.value)));
    setFromEvent(event.clientX, event);
    run();
  });
  divider.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    setFromEvent(event.clientX, event);
    run();
  });
  const release = (event: PointerEvent): void => {
    if (!dragging) return;
    dragging = false;
    const velocity = tracker.update(event).x;
    // A flick carries: hand off pointer velocity to the spring, damped.
    const rect = stage.getBoundingClientRect();
    position.kick((velocity / rect.width) * 100 * 0.25);
    position.setTarget(Math.min(82, Math.max(18, position.target + (velocity / rect.width) * 100 * 0.25)));
    run();
  };
  divider.addEventListener("pointerup", release);
  divider.addEventListener("pointercancel", release);

  divider.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    event.preventDefault();
    position.setTarget(Math.min(82, Math.max(18, position.target + (event.key === "ArrowRight" ? 6 : -6))));
    run();
  });
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
