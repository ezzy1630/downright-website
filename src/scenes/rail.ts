/**
 * The density rail: a native-style stack of quiet horizontal marks. It is a
 * document map, not a second scrollbar: the stack stays centred, the current
 * section is one brighter mark, and proximity makes neighbouring marks breathe
 * and gently move around the pointer. Hover raises the section preview; click
 * jumps and drag scrubs. Below 900px it stands down for the mobile film.
 */

import { MOTION, SpringScalar } from "../kernel/springs";
import { ticker } from "../kernel/ticker";
import { springScrollTo } from "../motion/scroll";

const CHASE_RADIUS = 36;
const BREATHE = 1.08;
const NEIGHBOR_DIM = 0.82;
const NEIGHBOR_LIFT = 0.92;
const NEIGHBOR_LIFT_RADIUS = 2;
const JUMP_KICK = 480;
const TRACK_INSET = 28;
const MAX_STACK_FRACTION = 0.5;
const MIN_PITCH = 7;
const MAX_PITCH = 11;
const MAGNETIC_PULL = 1.5;

interface Tick {
  id: string;
  label: string;
  detail: string;
  preview: string;
  element: HTMLElement;
  y: number;
  offset: SpringScalar;
  scale: SpringScalar;
  alpha: SpringScalar;
  changed: boolean;
}

export function initRail(): RailController | null {
  const rail = document.querySelector<HTMLElement>("[data-density-rail]");
  const hud = document.querySelector<HTMLElement>("[data-rail-hud]");
  if (!rail || !hud) return null;
  if (!window.matchMedia("(min-width: 900px)").matches) return null;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  rail.append(canvas);

  const ticks: Tick[] = [];
  let dragScrubbing = false;
  let pointerY = -1;
  let pointerInside = false;
  let hudIndex = -1;
  let width = 0;
  let height = 0;
  let dpr = 1;
  let stackTop = 0;
  let stackBottom = 0;

  const measure = (): void => {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    width = rail.clientWidth;
    height = rail.clientHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const trackTop = Math.min(TRACK_INSET, Math.max(0, height / 2));
    const trackBottom = Math.max(trackTop, height - TRACK_INSET);
    const trackHeight = Math.max(1, trackBottom - trackTop);
    const count = ticks.length;
    const pitch = count > 1
      ? Math.min(MAX_PITCH, Math.max(MIN_PITCH, (trackHeight * MAX_STACK_FRACTION) / (count - 1)))
      : 0;
    const span = pitch * Math.max(0, count - 1);
    stackTop = trackTop + Math.max(0, (trackHeight - span) / 2);
    stackBottom = stackTop + span;
    ticks.forEach((tick, index) => {
      tick.y = stackTop + (count > 1 ? (span * index) / (count - 1) : 0);
      tick.offset.snap(0);
    });
  };

  for (const section of document.querySelectorAll<HTMLElement>("[data-rail-section]")) {
    ticks.push({
      id: section.id,
      label: section.dataset.sectionLabel ?? section.id,
      detail: section.dataset.sectionDetail ?? "",
      preview: section.querySelector<HTMLElement>(".section-intro > p, .hero__copy > p, .close-section__inner > p, p:not(.eyebrow)")?.textContent?.trim().replace(/\s+/g, " ")
        ?? section.dataset.sectionDetail
        ?? "",
      element: section,
      y: 0,
      offset: new SpringScalar(0, MOTION.durations.quick),
      scale: new SpringScalar(1, MOTION.durations.quick),
      alpha: new SpringScalar(1, MOTION.durations.quick),
      changed: false,
    });
  }
  measure();

  const currentProgress = (): number => {
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    return Math.min(1, Math.max(0, window.scrollY / max));
  };

  const nearestTick = (): number => {
    let best = 0;
    let bestDistance = Infinity;
    const headY = stackTop + currentProgress() * (stackBottom - stackTop);
    ticks.forEach((tick, index) => {
      const distance = Math.abs(tick.y + tick.offset.value - headY);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = index;
      }
    });
    return best;
  };

  let lastProgress = -1;
  let active = true;

  const draw = (): void => {
    const styles = getComputedStyle(document.documentElement);
    const ink = styles.getPropertyValue("--rail-tick").trim() || styles.getPropertyValue("--secondary").trim() || "#888";
    const current = styles.getPropertyValue("--rail-tick-current").trim() || styles.getPropertyValue("--ink").trim() || "#222";
    const accent = styles.getPropertyValue("--accent").trim() || "#307afe";
    ctx.clearRect(0, 0, width, height);

    const nearest = nearestTick();
    const centre = width / 2;
    ticks.forEach((tick, index) => {
      const scale = tick.scale.value;
      const isCurrent = index === nearest;
      const alpha = tick.alpha.value * (isCurrent ? 1 : 0.72);
      const length = (isCurrent ? 28 : 22) * scale;
      const y = tick.y + tick.offset.value;
      ctx.globalAlpha = Math.min(1, alpha);
      ctx.strokeStyle = isCurrent ? current : ink;
      ctx.lineWidth = isCurrent ? 2.5 : 2;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(centre - length / 2, y);
      ctx.lineTo(centre + length / 2, y);
      ctx.stroke();

      if (tick.changed) {
        // A change mark hangs off the tick's leading edge after the agent
        // visit — the app marks a changed region the same way.
        ctx.globalAlpha = Math.min(1, alpha);
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centre + length / 2 + 4, y);
        ctx.lineTo(centre + length / 2 + 9, y);
        ctx.stroke();
      }
    });
    ctx.globalAlpha = 1;
  };

  const job = (dt: number): boolean => {
    if (!active) return false;
    let moving = false;
    for (const tick of ticks) {
      if (tick.offset.advance(dt)) moving = true;
      if (tick.scale.advance(dt)) moving = true;
      if (tick.alpha.advance(dt)) moving = true;
    }
    const progress = currentProgress();
    if (Math.abs(progress - lastProgress) > 0.0004) {
      moving = true;
      lastProgress = progress;
    }
    if (moving || pointerInside || dragScrubbing) draw();
    return moving || pointerInside || dragScrubbing;
  };
  ticker.add(job);

  // Pointer chase: proximity springs breathe the tick and dim neighbors.
  const onPointerMove = (event: PointerEvent): void => {
    const rect = rail.getBoundingClientRect();
    const x = event.clientX - rect.left;
    pointerY = event.clientY - rect.top;
    pointerInside = x >= -CHASE_RADIUS && x <= rect.width + CHASE_RADIUS && pointerY >= 0 && pointerY <= rect.height;
    if (!pointerInside) {
      hideHud();
      releaseTicks();
      return;
    }
    const distances = ticks.map((tick) => Math.hypot(x - width / 2, pointerY - tick.y));
    const closestIndex = distances.reduce((best, distance, index) => distance < distances[best] ? index : best, 0);
    const hoverIndex = distances[closestIndex] < CHASE_RADIUS ? closestIndex : -1;
    ticks.forEach((tick, index) => {
      const distance = distances[index];
      const chase = distance < CHASE_RADIUS;
      tick.scale.setTarget(chase ? BREATHE : 1);
      const neighbor = hoverIndex >= 0 && Math.abs(index - hoverIndex) <= NEIGHBOR_LIFT_RADIUS;
      tick.alpha.setTarget(index === hoverIndex ? 1 : neighbor ? NEIGHBOR_LIFT : NEIGHBOR_DIM);
      const influence = chase ? Math.max(0, 1 - distance / CHASE_RADIUS) : 0;
      const magnetic = Math.max(-MAGNETIC_PULL, Math.min(MAGNETIC_PULL, (pointerY - tick.y) * influence * 0.08));
      tick.offset.setTarget(magnetic);
      if (index === hoverIndex && !dragScrubbing && hudIndex !== index) showHud(index);
    });
    if (hoverIndex < 0) hideHud();
    active = true;
    ticker.add(job);
  };

  const releaseTicks = (): void => {
    for (const tick of ticks) {
      tick.scale.setTarget(1);
      tick.alpha.setTarget(1);
      tick.offset.setTarget(0);
    }
  };

  let hudStagger = 0;
  const showHud = (index: number): void => {
    hudIndex = index;
    const tick = ticks[index];
    const title = document.createElement("strong");
    title.textContent = tick.label;
    const snippet = document.createElement("span");
    snippet.textContent = tick.preview;
    const context = document.createElement("small");
    context.textContent = tick.detail;
    hud.replaceChildren(title, snippet, context);
    hud.style.setProperty("--hud-y", `${tick.y + tick.offset.value}px`);
    hud.classList.add("is-open");
    hud.classList.remove("is-detail");
    window.clearTimeout(hudStagger);
    hudStagger = window.setTimeout(() => hud.classList.add("is-detail"), MOTION.durations.stagger * 1000);
  };
  const hideHud = (): void => {
    if (hudIndex === -1) return;
    hudIndex = -1;
    hud.classList.remove("is-open", "is-detail");
  };

  const jumpTo = (index: number): void => {
    const tick = ticks[index];
    if (!tick) return;
    const target = tick.element.offsetTop - 72;
    springScrollTo(target, JUMP_KICK);
    tick.scale.kick(JUMP_KICK / 400);
    active = true;
    ticker.add(job);
  };

  rail.addEventListener("pointermove", onPointerMove, { passive: true });
  rail.addEventListener("pointerleave", () => {
    pointerInside = false;
    hideHud();
    releaseTicks();
  });
  rail.addEventListener("click", (event) => {
    if (dragScrubbing) return;
    const rect = rail.getBoundingClientRect();
    const y = event.clientY - rect.top;
    let best = 0;
    let bestDistance = Infinity;
    ticks.forEach((tick, index) => {
      const distance = Math.abs(tick.y + tick.offset.value - y);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = index;
      }
    });
    jumpTo(best);
  });

  // Drag scrubs the page; the compact stack settles under the hand.
  rail.addEventListener("pointerdown", (event) => {
    dragScrubbing = true;
    rail.setPointerCapture(event.pointerId);
    scrubTo(event.clientY);
  });
  rail.addEventListener("pointermove", (event) => {
    if (!dragScrubbing) return;
    scrubTo(event.clientY);
  });
  const endScrub = (): void => {
    dragScrubbing = false;
  };
  rail.addEventListener("pointerup", endScrub);
  rail.addEventListener("pointercancel", endScrub);

  const scrubTo = (clientY: number): void => {
    const rect = rail.getBoundingClientRect();
    const y = clientY - rect.top;
    const progress = Math.min(1, Math.max(0, (y - stackTop) / Math.max(1, stackBottom - stackTop)));
    const max = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo(0, progress * max);
  };

  // Keyboard: the canvas mirrors a visually-hidden list of act links.
  rail.addEventListener("keydown", (event) => {
    const target = event.target as HTMLElement;
    if (!target.matches("[data-rail-link]")) return;
    if (event.key !== "Enter") return;
    const index = ticks.findIndex((tick) => tick.id === target.dataset.railLink);
    if (index >= 0) jumpTo(index);
  });

  window.addEventListener("resize", measure, { passive: true });
  window.addEventListener("scroll", () => {
    active = true;
    ticker.add(job);
  }, { passive: true });
  draw();

  return {
    /** The agent visit hangs a change mark off its tick. */
    markChanged() {
      for (const tick of ticks) {
        if (tick.id === "agent") tick.changed = true;
      }
      active = true;
      ticker.add(job);
    },
  };
}

export interface RailController {
  markChanged(): void;
}
