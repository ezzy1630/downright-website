/**
 * Structural zoom: the living document morphs through the app's five
 * semantic levels — headings → +first sentences → +artifacts → +full text →
 * everything — with the anchor held (the block nearest the reading line
 * never leaves the screen) and blocks FLIPping on springs. Reader-driven:
 * segmented control, keys 1–5, arrows, trackpad pinch (ctrl+wheel), touch
 * pinch. morphCut logic for leaving/arriving content.
 */

import { MOTION, SpringScalar } from "../kernel/springs";
import { ticker } from "../kernel/ticker";
import { reducedMotion } from "../kernel/switchboard";
import { doc } from "../kernel/store";
import { renderSampleMarkdown } from "../data/site";
import { sound } from "../kernel/sound";

export const ZOOM_LEVELS = [1, 2, 3, 4, 5] as const;
export type ZoomLevel = (typeof ZOOM_LEVELS)[number];

interface Block {
  element: HTMLElement;
  level: number; // minimum zoom level at which this block appears
  opacity: SpringScalar;
  scale: SpringScalar;
  present: boolean;
}

/**
 * morphCut staging (the app's 0.30/0.35/0.75 logic, scaled to zoom): leaving
 * blocks fade on `standard`; arriving blocks wait one `floatingContentRevealLead`
 * (0.08s) then land on `structural` — the material reads continuous.
 */
const LEAVE = MOTION.durations.standard;
const ARRIVE_DELAY = 0.08;

export function initZoom(): void {
  const stage = document.querySelector<HTMLElement>("[data-zoom-stage]");
  const surface = document.querySelector<HTMLElement>("[data-zoom-surface]");
  if (!stage || !surface) return;
  if (stage.dataset.zoomReady === "true") return;

  const holder = surface.querySelector<HTMLElement>("[data-static-document]");
  if (!holder) return;
  stage.dataset.zoomReady = "true";

  let blocks: Block[] = [];

  // Classify blocks from the rendered document; repeatable, because the
  // store may replace the text (drop, paste, agent resolution) and the
  // surface re-renders under us.
  const classifyBlocks = (): void => {
    blocks = [];
    for (const element of [...holder.children] as HTMLElement[]) {
      const level = classify(element);
      element.dataset.zoomLevel = String(level);
      element.style.removeProperty("display");
      element.style.removeProperty("opacity");
      element.style.removeProperty("transform");
      blocks.push({
        element,
        level,
        opacity: new SpringScalar(1, LEAVE),
        scale: new SpringScalar(1, LEAVE),
        present: true,
      });
    }
  };

  const renderOwn = (): void => {
    holder.innerHTML = renderSampleMarkdown(doc.current.text);
    classifyBlocks();
  };
  renderOwn();

  let level: ZoomLevel = 5;
  let morphing = false;

  const applyLevel = (next: ZoomLevel, options: { anchor?: boolean } = {}): void => {
    level = next;
    stage.dataset.zoomLevel = String(next);
    for (const control of stage.querySelectorAll<HTMLButtonElement>("[data-zoom-level]")) {
      control.setAttribute("aria-pressed", String(Number(control.dataset.zoomLevel) === next));
    }

    if (reducedMotion()) {
      for (const block of blocks) {
        block.present = block.level <= next;
        if (block.present) {
          block.element.style.removeProperty("display");
          block.element.style.removeProperty("opacity");
        } else {
          block.element.style.display = "none";
        }
      }
      return;
    }

    // FLIP — First: record the anchor block's position.
    const anchor = options.anchor === false ? null : anchorBlock(blocks);
    const anchorBefore = anchor?.element.getBoundingClientRect();

    // Last + Invert: toggle presence, then measure the anchor's shift.
    for (const block of blocks) {
      const shouldShow = block.level <= next;
      if (shouldShow === block.present) continue;
      block.present = shouldShow;
      if (shouldShow) {
        // Arriving: hold at zero for the morphCut lead, then land.
        block.element.style.removeProperty("display");
        block.element.style.opacity = "0";
        block.opacity = new SpringScalar(0, MOTION.durations.deliberate);
        block.scale = new SpringScalar(0.94, MOTION.durations.deliberate);
        block.opacity.setTarget(1);
        block.scale.setTarget(1);
      } else {
        // Leaving: fade now, on `standard`.
        block.opacity = new SpringScalar(block.opacity.value, LEAVE);
        block.scale = new SpringScalar(block.scale.value, LEAVE);
        block.opacity.setTarget(0);
        block.scale.setTarget(0.97);
      }
    }

    morphing = true;
    if (anchor && anchorBefore) {
      const anchorAfter = anchor.element.getBoundingClientRect();
      const shift = anchorAfter.top - anchorBefore.top;
      if (Math.abs(shift) > 1) {
        // Play: hold the anchor steady, spring the compensation to zero.
        const settle = new SpringScalar(-shift, MOTION.durations.deliberate);
        settle.setTarget(0);
        ticker.add((dt) => {
          const moving = settle.advance(dt);
          surface.style.translate = `0 ${settle.value.toFixed(2)}px`;
          if (!moving) surface.style.removeProperty("translate");
          return moving;
        });
      }
    }

    // The morph job: leaving blocks fade immediately; arriving blocks wait
    // one ARRIVE_DELAY so the material reads continuous, not crossfaded.
    const elapsed = { value: 0 };
    ticker.add((dt) => {
      elapsed.value += dt;
      let moving = false;
      for (const block of blocks) {
        const staged = block.present && block.opacity.target === 1 && block.opacity.value === 0 && elapsed.value < ARRIVE_DELAY;
        if (!staged) {
          if (block.opacity.advance(dt)) moving = true;
          if (block.scale.advance(dt)) moving = true;
        } else {
          moving = true;
        }
        block.element.style.opacity = block.opacity.value.toFixed(3);
        block.element.style.transform = `scale(${block.scale.value.toFixed(4)})`;
        if (!block.present && block.opacity.value < 0.01) block.element.style.display = "none";
      }
      if (!moving) {
        morphing = false;
        for (const block of blocks) {
          if (!block.present) block.element.style.display = "none";
          else {
            block.element.style.removeProperty("opacity");
            block.element.style.removeProperty("transform");
          }
        }
      }
      return moving;
    });
    sound.whoosh();
  };

  // Controls: segmented buttons, keys, arrows.
  for (const control of stage.querySelectorAll<HTMLButtonElement>("[data-zoom-level]")) {
    control.addEventListener("click", () => applyLevel(Number(control.dataset.zoomLevel) as ZoomLevel));
  }
  stage.addEventListener("keydown", (event) => {
    if (/^[1-5]$/.test(event.key)) {
      applyLevel(Number(event.key) as ZoomLevel);
      return;
    }
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
    event.preventDefault();
    applyLevel(
      Math.min(5, Math.max(1, level + (event.key === "ArrowRight" || event.key === "ArrowUp" ? 1 : -1))) as ZoomLevel,
    );
  });

  // Trackpad pinch arrives as ctrl+wheel; touch pinch as two pointers.
  let pinchDistance = 0;
  stage.addEventListener(
    "wheel",
    (event) => {
      if (!event.ctrlKey) return;
      event.preventDefault();
      const grow = event.deltaY < 0;
      applyLevel(Math.min(5, Math.max(1, level + (grow ? 1 : -1))) as ZoomLevel);
    },
    { passive: false },
  );
  const pointers = new Map<number, { x: number; y: number }>();
  stage.addEventListener("pointerdown", (event) => {
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  });
  stage.addEventListener("pointermove", (event) => {
    if (!pointers.has(event.pointerId)) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size !== 2) return;
    const [a, b] = [...pointers.values()];
    const distance = Math.hypot(a.x - b.x, a.y - b.y);
    if (pinchDistance && Math.abs(distance - pinchDistance) > 24) {
      applyLevel(Math.min(5, Math.max(1, level + (distance > pinchDistance ? 1 : -1))) as ZoomLevel);
      pinchDistance = distance;
    } else if (!pinchDistance) {
      pinchDistance = distance;
    }
  });
  const endPinch = (event: PointerEvent): void => {
    pointers.delete(event.pointerId);
    if (pointers.size < 2) pinchDistance = 0;
  };
  stage.addEventListener("pointerup", endPinch);
  stage.addEventListener("pointercancel", endPinch);

  // The store may replace the text under us (drop, paste, agent resolution):
  // re-render, re-classify, hold the reader's current level. Keystrokes in
  // the hero also touch the store, so coalesce behind a short debounce.
  let rerenderHandle = 0;
  doc.subscribe(() => {
    window.clearTimeout(rerenderHandle);
    rerenderHandle = window.setTimeout(() => {
      renderOwn();
      applyLevel(level, { anchor: false });
    }, 300);
  });

  applyLevel(5, { anchor: false });
}

function anchorBlock(blocks: Block[]): Block | null {
  const line = window.innerHeight / 2;
  let best: Block | null = null;
  let bestDistance = Infinity;
  for (const block of blocks) {
    if (block.level > 1) continue; // the anchor should survive every level
    const rect = block.element.getBoundingClientRect();
    if (!rect.height) continue;
    const distance = Math.abs(rect.top + rect.height / 2 - line);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = block;
    }
  }
  return best ?? blocks[0] ?? null;
}

/** The minimum zoom level at which a rendered block type appears. */
function classify(element: HTMLElement): number {
  const tag = element.tagName.toLowerCase();
  if (/^h[1-6]$/.test(tag)) return 1;
  if (tag === "pre" || tag === "table" || element.classList.contains("mermaid-figure") || element.classList.contains("doc-math--block")) return 3;
  if (element.classList.contains("doc-callout") || element.classList.contains("doc-footnote")) return 4;
  if (tag === "p" || tag === "ul" || tag === "aside") return 4;
  return 5;
}
