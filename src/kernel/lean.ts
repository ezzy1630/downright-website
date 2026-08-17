/**
 * The window leans into the scroll. A fast flick tips it up to ~0.7° against
 * the motion — the page gains suspension — and it settles flat at rest. One
 * passive scroll listener feeds a velocity estimate; one spring, resident on
 * the shared ticker only while moving, writes the lean. Stands entirely down
 * under reduced motion, and never while the travel director is flying the
 * window (two transforms fighting over one body reads as a glitch).
 */

import { SpringScalar } from "./springs";
import { ticker } from "./ticker";

const MAX_DEG = 0.7;
/** px/s of scroll that leans the window the full allowance. */
const FULL_SPEED = 4200;

export function initLean(): void {
  const target = document.querySelector<HTMLElement>("[data-editor-window]");
  if (!target) return;

  let lastY = window.scrollY;
  let lastT = performance.now();
  let velocity = 0;
  const lean = new SpringScalar(0, 0.3, 0.18);
  let job: (() => void) | null = null;

  const reduced = (): boolean => document.documentElement.dataset.reducedMotion === "true";
  const flying = (): boolean => target.dataset.flying !== undefined;

  window.addEventListener("scroll", () => {
    const now = performance.now();
    const dt = Math.max(0.008, (now - lastT) / 1000);
    const instant = (window.scrollY - lastY) / dt;
    lastY = window.scrollY;
    lastT = now;
    velocity = velocity * 0.7 + instant * 0.3;
    if (Math.abs(velocity) < 40) velocity = 0;
    if (reduced()) return;
    const degrees = Math.max(-MAX_DEG, Math.min(MAX_DEG, velocity / FULL_SPEED));
    lean.setTarget(degrees);
    if (job || flying()) return;
    job = ticker.add((dtTick) => {
      if (reduced() || flying()) {
        target.style.removeProperty("--lean");
        job = null;
        return false;
      }
      const moving = lean.advance(dtTick);
      target.style.setProperty("--lean", lean.value.toFixed(3));
      if (!moving) {
        target.style.removeProperty("--lean");
        job = null;
      }
      return moving;
    });
  }, { passive: true });
}
