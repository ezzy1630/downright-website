/**
 * The pinned-rect flight: springs an element's real left/top/width/height
 * (position: fixed) from a source rect to a target rect, so overlays are
 * BORN from the control that summoned them — the Quick Look sheet grows out
 * of its file card, the review diff out of its Review button. Content keeps
 * its proportions for the whole flight; a scale tween would stretch it.
 */

import { MOTION, SpringRect } from "./springs";
import { ticker } from "./ticker";

export interface FlyOptions {
  duration?: number;
  bounce?: number;
  /** Runs when the flight settles naturally (inline geometry cleared first). */
  onSettle?: () => void;
}

/** Freeze an element at a viewport rect (position: fixed, explicit box). */
export function pinRect(el: HTMLElement, rect: DOMRect): void {
  el.style.position = "fixed";
  el.style.margin = "0";
  el.style.left = `${rect.left}px`;
  el.style.top = `${rect.top}px`;
  el.style.width = `${rect.width}px`;
  el.style.height = `${rect.height}px`;
}

/** Spring a pinned element from one rect to another. Returns a cancel that
 *  detaches the flight and clears the inline geometry (no onSettle). */
export function flyPinnedRect(el: HTMLElement, from: DOMRect, to: DOMRect, options: FlyOptions = {}): () => void {
  const duration = options.duration ?? MOTION.durations.deliberate;
  const flight = new SpringRect(
    from.left + from.width / 2,
    from.top + from.height / 2,
    from.width,
    from.height,
    duration,
    options.bounce ?? 0.14,
  );
  flight.setTarget(to.left + to.width / 2, to.top + to.height / 2, to.width, to.height);
  const clear = (): void => {
    el.style.left = "";
    el.style.top = "";
    el.style.width = "";
    el.style.height = "";
    el.style.position = "";
    el.style.margin = "";
  };
  const cancel = ticker.add((dt) => {
    const moving = flight.advance(dt);
    el.style.left = `${(flight.x.value - flight.width.value / 2).toFixed(2)}px`;
    el.style.top = `${(flight.y.value - flight.height.value / 2).toFixed(2)}px`;
    el.style.width = `${flight.width.value.toFixed(2)}px`;
    el.style.height = `${flight.height.value.toFixed(2)}px`;
    if (!moving) {
      clear();
      options.onSettle?.();
    }
    return moving;
  });
  return () => {
    cancel();
    clear();
  };
}
