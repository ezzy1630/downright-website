/**
 * The motion switchboard: prefers-reduced-motion, prefers-reduced-transparency,
 * Increase Contrast, and the in-page toggle (reduce ≠ remove). One source of
 * truth, mirrored on <html> data attributes so CSS can react with no JS in
 * loops. Reduced motion means teleport: scenes apply final states instantly.
 */

export interface MotionFlags {
  reduced: boolean;
  inPageReduce: boolean;
  reducedTransparency: boolean;
  increaseContrast: boolean;
}

const REDUCED_KEY = "downright-motion";
const listeners = new Set<(flags: MotionFlags) => void>();

function readFlags(): MotionFlags {
  const query = window.matchMedia;
  const media = (feature: string): boolean =>
    typeof query === "function" && window.matchMedia(feature).matches;
  let inPageReduce = false;
  try {
    inPageReduce = localStorage.getItem(REDUCED_KEY) === "reduce";
  } catch {
    /* storage blocked; system preference still applies */
  }
  return {
    reduced: media("(prefers-reduced-motion: reduce)"),
    inPageReduce,
    reducedTransparency: media("(prefers-reduced-transparency: reduce)"),
    increaseContrast: media("(prefers-contrast: more)"),
  };
}

function apply(): MotionFlags {
  const flags = readFlags();
  const root = document.documentElement;
  root.dataset.reducedMotion = String(flags.reduced || flags.inPageReduce);
  root.dataset.reducedTransparency = String(flags.reducedTransparency);
  root.dataset.increaseContrast = String(flags.increaseContrast);
  for (const listener of listeners) listener(flags);
  return flags;
}

export function motionFlags(): MotionFlags {
  return readFlags();
}

/** True when every scene must teleport to final states. */
export function reducedMotion(): boolean {
  const flags = readFlags();
  return flags.reduced || flags.inPageReduce;
}

export function onMotionChange(listener: (flags: MotionFlags) => void): () => void {
  listeners.add(listener);
  listener(readFlags());
  return () => {
    listeners.delete(listener);
  };
}

export function setInPageReduce(reduce: boolean): void {
  try {
    localStorage.setItem(REDUCED_KEY, reduce ? "reduce" : "full");
  } catch {
    /* storage blocked; the toggle still applies for this page view */
  }
  document.documentElement.dataset.inPageMotion = reduce ? "reduce" : "full";
  apply();
}

for (const feature of ["(prefers-reduced-motion: reduce)", "(prefers-reduced-transparency: reduce)", "(prefers-contrast: more)"]) {
  window.matchMedia(feature).addEventListener("change", apply);
}
apply();
