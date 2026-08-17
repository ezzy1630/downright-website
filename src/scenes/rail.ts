/**
 * The density rail: a native-style stack of quiet horizontal marks. It is a
 * document map, not a second scrollbar: the stack stays centred, the current
 * section is one brighter mark, and proximity makes neighbouring marks breathe,
 * shrink and grow, and dynamically interact with pointer movement and clicks.
 * Hover raises the section preview HUD; click jumps and drag scrubs. Below 900px
 * it stands down for the mobile film.
 */

import { MOTION, SpringScalar } from "../kernel/springs";
import { ticker } from "../kernel/ticker";
import { PointerTracker } from "../kernel/pointer";
import { springScrollTo } from "../motion/scroll";

const CHASE_RADIUS = 40;
const FIELD_RADIUS = 90;
const FOCUS_RADIUS = 30;
const BASE_LENGTH = 14;
const ACTIVE_LENGTH = 22;
const HOVER_PEAK_LENGTH = 30;
const COMPRESSED_LENGTH = 7.5;
const BASE_WIDTH = 2;
const ACTIVE_WIDTH = 2.5;
const HOVER_WIDTH = 3;
const NEIGHBOR_REPEL = 3.4;
const VELOCITY_SCALE = 1100;
const HUD_EDGE_INSET = 52;
const JUMP_KICK = 480;
const TRACK_INSET = 28;
const MAX_STACK_FRACTION = 0.5;
const MIN_PITCH = 7;
const MAX_PITCH = 11;
const MAGNETIC_PULL = 1.2;

interface Tick {
  id: string;
  label: string;
  detail: string;
  preview: string;
  element: HTMLElement;
  y: number;
  offset: SpringScalar;
  lean: SpringScalar;
  scale: SpringScalar;
  thickness: SpringScalar;
  alpha: SpringScalar;
  glow: SpringScalar;
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
  let pointerTracker = new PointerTracker();
  let pointerVelocityX = 0;
  let pointerVelocityY = 0;
  let hudIndex = -1;
  let hudSwap = 0;
  let width = 0;
  let height = 0;
  let dpr = 1;
  let stackTop = 0;
  let stackBottom = 0;
  const hudY = new SpringScalar(0, MOTION.durations.standard, 0.04);

  const reduceMotion = (): boolean => document.documentElement.dataset.reducedMotion === "true";
  const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));
  const setTarget = (spring: SpringScalar, target: number): void => {
    if (reduceMotion()) spring.snap(target);
    else spring.setTarget(target);
  };

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
      tick.lean.snap(0);
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
      offset: new SpringScalar(0, MOTION.durations.quick, 0.12),
      lean: new SpringScalar(0, MOTION.durations.quick, 0.15),
      scale: new SpringScalar(1, MOTION.durations.quick, 0.2),
      thickness: new SpringScalar(BASE_WIDTH, MOTION.durations.quick, 0.1),
      alpha: new SpringScalar(0.58, MOTION.durations.quick),
      glow: new SpringScalar(0, MOTION.durations.standard, 0.1),
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
    if (hudIndex >= 0) {
      hud.style.setProperty("--hud-offset", `${(hudY.value - height / 2).toFixed(2)}px`);
    }

    ticks.forEach((tick, index) => {
      const scale = tick.scale.value;
      const isCurrent = index === nearest;
      const isHovered = index === hudIndex;
      const alpha = clamp(tick.alpha.value, 0, 1);
      const glow = clamp(tick.glow.value, 0, 2);
      const thickness = clamp(tick.thickness.value, 1, 4);

      // Dynamic length calculation based on state and spring scale
      const baseLen = isHovered ? HOVER_PEAK_LENGTH : isCurrent ? ACTIVE_LENGTH : BASE_LENGTH;
      const length = Math.max(4, baseLen * scale);
      const y = tick.y + tick.offset.value;
      const lean = tick.lean.value;

      const x1 = centre - length / 2 + lean * 0.35;
      const x2 = centre + length / 2 + lean;
      const y1 = y + lean * 0.12;
      const y2 = y - lean * 0.12;

      // Soft luminous glow pass on hovered, active, or pulsed ticks
      if (glow > 0.04 || isHovered) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = accent;
        ctx.lineWidth = thickness + 3.5;
        ctx.lineCap = "round";
        ctx.globalAlpha = Math.min(0.55, alpha * (isHovered ? 0.45 : glow * 0.35));
        ctx.stroke();
        ctx.restore();
      }

      // Foreground crisp stroke
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.globalAlpha = isHovered ? 1 : isCurrent ? Math.max(0.9, alpha) : alpha;
      ctx.strokeStyle = (isHovered || glow > 0.35) ? accent : isCurrent ? current : ink;
      ctx.lineWidth = thickness;
      ctx.lineCap = "round";
      ctx.stroke();

      if (tick.changed) {
        // A change mark hangs off the tick's leading edge after the agent visit
        ctx.beginPath();
        ctx.moveTo(centre + length / 2 + lean + 3.5, y - lean * 0.12);
        ctx.lineTo(centre + length / 2 + lean + 7.5, y - lean * 0.12);
        ctx.globalAlpha = Math.min(1, alpha);
        ctx.strokeStyle = accent;
        ctx.lineWidth = Math.max(1.5, thickness * 0.85);
        ctx.stroke();
      }
    });
    ctx.globalAlpha = 1;
  };

  const job = (dt: number): boolean => {
    if (!active) return false;
    let moving = false;
    if (hudIndex >= 0 && hudY.advance(dt)) moving = true;
    for (const tick of ticks) {
      if (tick.offset.advance(dt)) moving = true;
      if (tick.lean.advance(dt)) moving = true;
      if (tick.scale.advance(dt)) moving = true;
      if (tick.thickness.advance(dt)) moving = true;
      if (tick.alpha.advance(dt)) moving = true;
      if (tick.glow.advance(dt)) moving = true;
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

  // Pointer chase: proximity springs breathe the tick, dynamic shrink/grow fisheye wave
  const onPointerMove = (event: PointerEvent): void => {
    const rect = rail.getBoundingClientRect();
    const x = event.clientX - rect.left;
    pointerY = event.clientY - rect.top;
    const velocity = pointerTracker.update(event);
    pointerVelocityX = velocity.x;
    pointerVelocityY = velocity.y;
    pointerInside = x >= -CHASE_RADIUS && x <= rect.width + CHASE_RADIUS && pointerY >= 0 && pointerY <= rect.height;

    if (!pointerInside) {
      hideHud();
      releaseTicks();
      return;
    }

    const distances = ticks.map((tick) => Math.hypot(x - width / 2, pointerY - tick.y));
    const closestIndex = distances.reduce((best, distance, index) => distance < distances[best] ? index : best, 0);
    const hoverIndex = distances[closestIndex] < CHASE_RADIUS ? closestIndex : -1;
    const velocityX = clamp(pointerVelocityX / VELOCITY_SCALE, -1, 1);
    const velocityY = clamp(pointerVelocityY / VELOCITY_SCALE, -1, 1);
    const activeY = hoverIndex >= 0 ? ticks[hoverIndex].y : pointerY;

    ticks.forEach((tick, index) => {
      const dy = pointerY - tick.y;
      const distance = distances[index];
      const focus = Math.exp(-Math.pow(dy / FOCUS_RADIUS, 2));
      const field = Math.max(0, 1 - distance / FIELD_RADIUS);
      const isHovered = index === hoverIndex;
      const side = Math.sign(tick.y - activeY);

      // Micro-interactions: Fisheye shrink & grow dynamics
      if (focus > 0.55 || isHovered) {
        // Core focus: grows gracefully with elastic spring
        const growRatio = 1.0 + focus * 0.35;
        setTarget(tick.scale, growRatio);
        setTarget(tick.thickness, HOVER_WIDTH);
        setTarget(tick.alpha, 1.0);
        setTarget(tick.glow, isHovered ? 1.0 : focus * 0.6);
      } else if (focus > 0.12) {
        // Immediate neighbors: smooth transition and lift
        const neighborScale = 0.88 + focus * 0.38;
        setTarget(tick.scale, neighborScale);
        setTarget(tick.thickness, BASE_WIDTH + (HOVER_WIDTH - BASE_WIDTH) * focus);
        setTarget(tick.alpha, 0.78 + focus * 0.22);
        setTarget(tick.glow, focus * 0.3);
      } else {
        // Non-focused lines: gently shrink to amplify the magnetic focus contrast
        const shrinkScale = COMPRESSED_LENGTH / BASE_LENGTH;
        setTarget(tick.scale, shrinkScale);
        setTarget(tick.thickness, BASE_WIDTH * 0.88);
        setTarget(tick.alpha, 0.36);
        setTarget(tick.glow, 0);
      }

      // Magnetic offset, vertical repel, horizontal pull, and velocity swish
      const magnetic = clamp(dy * field * 0.08, -MAGNETIC_PULL, MAGNETIC_PULL);
      const repel = side * focus * NEIGHBOR_REPEL;
      const velocityPush = velocityY * field * (isHovered ? 0.75 : 1.5);
      const horizontalPull = (x - width / 2) * field * 0.14 + velocityX * field * 1.5;

      setTarget(tick.offset, magnetic + repel + velocityPush);
      setTarget(tick.lean, horizontalPull + side * focus * 0.65);

      if (isHovered && !dragScrubbing && hudIndex !== index) {
        showHud(index);
      }
    });

    if (hoverIndex >= 0) {
      setTarget(hudY, clamp(pointerY, HUD_EDGE_INSET, height - HUD_EDGE_INSET));
    } else {
      hideHud();
    }

    active = true;
    ticker.add(job);
  };

  const releaseTicks = (): void => {
    const nearest = nearestTick();
    ticks.forEach((tick, index) => {
      const isCurrent = index === nearest;
      setTarget(tick.scale, 1);
      setTarget(tick.thickness, isCurrent ? ACTIVE_WIDTH : BASE_WIDTH);
      setTarget(tick.alpha, isCurrent ? 1 : 0.58);
      setTarget(tick.glow, 0);
      setTarget(tick.offset, 0);
      setTarget(tick.lean, 0);
    });
    pointerVelocityX = 0;
    pointerVelocityY = 0;
    pointerTracker = new PointerTracker();
    active = true;
    ticker.add(job);
  };

  let hudStagger = 0;
  const showHud = (index: number): void => {
    const wasOpen = hudIndex >= 0;
    const changing = wasOpen && hudIndex !== index;
    hudIndex = index;
    const tick = ticks[index];
    if (!wasOpen) hudY.snap(clamp(pointerY >= 0 ? pointerY : tick.y, HUD_EDGE_INSET, height - HUD_EDGE_INSET));
    else setTarget(hudY, clamp(pointerY, HUD_EDGE_INSET, height - HUD_EDGE_INSET));
    const title = document.createElement("strong");
    title.textContent = tick.label;
    const snippet = document.createElement("span");
    snippet.textContent = tick.preview;
    const context = document.createElement("small");
    context.textContent = tick.detail;
    if (changing) {
      hud.classList.add("is-swapping");
      window.clearTimeout(hudSwap);
      hudSwap = window.setTimeout(() => hud.classList.remove("is-swapping"), (MOTION.durations.quick / 2) * 1000);
    }
    hud.replaceChildren(title, snippet, context);
    hud.style.setProperty("--hud-offset", `${(hudY.value - height / 2).toFixed(2)}px`);
    hud.classList.add("is-open");
    hud.classList.remove("is-detail");
    window.clearTimeout(hudStagger);
    hudStagger = window.setTimeout(() => hud.classList.add("is-detail"), MOTION.durations.stagger * 1000);
  };

  const hideHud = (): void => {
    if (hudIndex === -1) return;
    hudIndex = -1;
    hud.classList.remove("is-open", "is-detail");
    hud.classList.remove("is-swapping");
  };

  const jumpTo = (index: number): void => {
    const tick = ticks[index];
    if (!tick) return;
    const target = tick.element.offsetTop - 72;
    springScrollTo(target, JUMP_KICK);

    // Dynamic tactile kick on clicked tick
    tick.scale.kick(0.95);
    tick.glow.snap(1.8);
    tick.thickness.kick(0.6);

    // Ripple wave propagation outward to adjacent ticks
    ticks.forEach((t, i) => {
      if (i === index) return;
      const d = Math.abs(i - index);
      const delay = d * 22;
      window.setTimeout(() => {
        const damp = Math.pow(0.62, d);
        t.scale.kick(0.7 * damp);
        t.offset.kick((i > index ? 2.5 : -2.5) * damp);
        t.glow.kick(0.55 * damp);
        active = true;
        ticker.add(job);
      }, delay);
    });

    active = true;
    ticker.add(job);
  };

  rail.addEventListener("pointermove", onPointerMove, { passive: true });
  rail.addEventListener("pointerleave", () => {
    pointerInside = false;
    pointerY = -1;
    pointerTracker = new PointerTracker();
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

  // Drag scrubs the page; pointer down gives tactile press compression
  rail.addEventListener("pointerdown", (event) => {
    dragScrubbing = true;
    rail.setPointerCapture(event.pointerId);
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
    if (ticks[best]) {
      ticks[best].scale.kick(-0.35);
      ticks[best].glow.snap(1.3);
      active = true;
      ticker.add(job);
    }
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
