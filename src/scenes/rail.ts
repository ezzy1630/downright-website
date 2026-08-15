/**
 * The density rail: a canvas of ticks, one per act, whose fill tracks scroll
 * and whose ticks chase the pointer through springs — chase radius 36px,
 * breathe 1.08, neighbor dim 0.82, jump kick 480pt/s, the app's constants.
 * Hover raises a glass outline HUD (title first, detail one stagger later).
 * Drag scrubs and settles under the hand; arrows + Enter for keyboard. Below
 * 900px it stands down for the mobile film's own progress system.
 */

import { MOTION, SpringScalar } from "../kernel/springs";
import { ticker } from "../kernel/ticker";
import { springScrollTo } from "../motion/scroll";

const CHASE_RADIUS = 36;
const BREATHE = 1.08;
const NEIGHBOR_DIM = 0.82;
const JUMP_KICK = 480;
const TOP_INSET = 96;
const BOTTOM_INSET = 96;

interface Tick {
  id: string;
  label: string;
  detail: string;
  element: HTMLElement;
  y: number;
  /** 0–1: how much document this act carries. Drives the tick's length. */
  weight: number;
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

  const measure = (): void => {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    width = rail.clientWidth;
    height = rail.clientHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    for (const tick of ticks) tick.y = TOP_INSET + (tick.element.offsetTop / maxSectionTop()) * (height - TOP_INSET - BOTTOM_INSET);
    // Weight is the act's own scroll length: the rail reads as a density map
    // of the page, which is what the app's sidebar does with a document.
    let heaviest = 1;
    for (const tick of ticks) heaviest = Math.max(heaviest, tick.element.offsetHeight);
    for (const tick of ticks) tick.weight = tick.element.offsetHeight / heaviest;
  };

  const maxSectionTop = (): number => {
    let max = 1;
    for (const tick of ticks) max = Math.max(max, tick.element.offsetTop);
    return max;
  };

  for (const section of document.querySelectorAll<HTMLElement>("[data-rail-section]")) {
    ticks.push({
      id: section.id,
      label: section.dataset.sectionLabel ?? section.id,
      detail: section.dataset.sectionDetail ?? "",
      element: section,
      y: 0,
      weight: 0,
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
    ticks.forEach((tick, index) => {
      const distance = Math.abs(tick.y - (TOP_INSET + currentProgress() * (height - TOP_INSET - BOTTOM_INSET)));
      if (distance < bestDistance) {
        bestDistance = distance;
        best = index;
      }
    });
    return best;
  };

  let lastProgress = -1;
  let active = true;

  // The act number: the reader's place in the sequence, stated once.
  const numberEl = rail.querySelector<HTMLElement>("[data-rail-number]");
  let lastNumber = -1;
  const paintNumber = (index: number): void => {
    if (!numberEl || index === lastNumber) return;
    lastNumber = index;
    numberEl.textContent = String(index + 1).padStart(2, "0");
  };

  const draw = (): void => {
    const styles = getComputedStyle(document.documentElement);
    const ink = styles.getPropertyValue("--rail-tick").trim() || styles.getPropertyValue("--secondary").trim() || "#888";
    const current = styles.getPropertyValue("--rail-tick-current").trim() || styles.getPropertyValue("--ink").trim() || "#222";
    const accent = styles.getPropertyValue("--accent").trim() || "#307afe";
    ctx.clearRect(0, 0, width, height);

    const travel = height - TOP_INSET - BOTTOM_INSET;
    const progress = currentProgress();
    const headY = TOP_INSET + progress * travel;

    // Fill line: tracks scroll exactly, no spring — it is the page's motion.
    ctx.strokeStyle = current;
    ctx.globalAlpha = 0.85;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(width / 2, TOP_INSET);
    ctx.lineTo(width / 2, headY);
    ctx.stroke();

    ctx.strokeStyle = ink;
    ctx.globalAlpha = 0.28;
    ctx.beginPath();
    ctx.moveTo(width / 2, headY);
    ctx.lineTo(width / 2, height - BOTTOM_INSET);
    ctx.stroke();

    const nearest = nearestTick();
    paintNumber(nearest);
    const centre = width / 2;
    ticks.forEach((tick, index) => {
      const scale = tick.scale.value;
      const alpha = tick.alpha.value * (index === nearest ? 1 : 0.72);
      const passed = index <= nearest;
      // Ticks, not dots: the length is the act's weight, so the rail reads as
      // a density map of the page rather than a row of identical pips.
      const length = (7 + tick.weight * 11) * scale * (index === nearest ? 1.18 : 1);
      ctx.globalAlpha = Math.min(1, alpha);
      ctx.strokeStyle = passed ? current : ink;
      ctx.lineWidth = index === nearest ? 2 : 1.5;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(centre - length / 2, tick.y);
      ctx.lineTo(centre + length / 2, tick.y);
      ctx.stroke();

      if (tick.changed) {
        // A change mark hangs off the tick's leading edge after the agent
        // visit — the app marks a changed region the same way.
        ctx.globalAlpha = Math.min(1, alpha);
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centre + length / 2 + 4, tick.y);
        ctx.lineTo(centre + length / 2 + 9, tick.y);
        ctx.stroke();
      }
    });
    ctx.globalAlpha = 1;
  };

  const job = (dt: number): boolean => {
    if (!active) return false;
    let moving = false;
    for (const tick of ticks) {
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
    ticks.forEach((tick, index) => {
      const distance = Math.hypot(x - width / 2, pointerY - tick.y);
      const chase = distance < CHASE_RADIUS;
      tick.scale.setTarget(chase ? BREATHE : 1);
      tick.alpha.setTarget(chase ? 1 : NEIGHBOR_DIM);
      if (chase && !dragScrubbing && hudIndex !== index) showHud(index);
      if (!chase && hudIndex === index) hideHud();
    });
    active = true;
    ticker.add(job);
  };

  const releaseTicks = (): void => {
    for (const tick of ticks) {
      tick.scale.setTarget(1);
      tick.alpha.setTarget(1);
    }
  };

  let hudStagger = 0;
  const showHud = (index: number): void => {
    hudIndex = index;
    const tick = ticks[index];
    hud.innerHTML = `<strong>${tick.label}</strong><span>${tick.detail}</span>`;
    hud.style.setProperty("--hud-y", `${tick.y}px`);
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
      const distance = Math.abs(tick.y - y);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = index;
      }
    });
    jumpTo(best);
  });

  // Drag scrubs the page; the fill settles under the hand.
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
    const progress = Math.min(1, Math.max(0, (y - TOP_INSET) / (height - TOP_INSET - BOTTOM_INSET)));
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
