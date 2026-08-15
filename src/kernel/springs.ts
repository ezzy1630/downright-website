/**
 * Spring vocabulary for the site: the app's closed-form integrator
 * (src/motion/spring.ts, mirroring Sources/MarkdownRender/Motion.swift)
 * driven by the single kernel ticker, plus the color and size springs the
 * set pieces need. Durations speak Motion.swift's three-duration system.
 */

import { SpringScalar } from "../motion/spring";
import { ticker } from "./ticker";

export { SpringScalar, SpringPoint } from "../motion/spring";

export const MOTION = {
  durations: {
    quick: 0.12,
    standard: 0.2,
    deliberate: 0.32,
    liquidSettle: 0.38,
    hover: 0.1,
    pressIn: 0.07,
    pressOut: 0.11,
    selection: 0.15,
    emphasis: 0.11,
    stagger: 0.04,
  },
  curves: {
    decelerate: "cubic-bezier(0.22, 0.82, 0.28, 1)",
    snap: "cubic-bezier(0.16, 1, 0.3, 1)",
    structural: "cubic-bezier(0.3, 0.3, 0.2, 1)",
    easeOut: "ease-out",
  },
} as const;

/** A scalar spring that drives a DOM write through the shared ticker. */
export function attachScalar(
  spring: SpringScalar,
  write: (value: number) => void,
  onSettle?: () => void,
): () => void {
  let detach: (() => void) | null = null;
  const job = (dt: number): boolean => {
    const moving = spring.advance(dt);
    write(spring.value);
    if (!moving) {
      if (onSettle) onSettle();
      return false;
    }
    return true;
  };
  detach = ticker.add(job);
  return () => {
    if (detach) detach();
  };
}

// --- OKLab color spring (pure math lives in src/motion/oklab.ts) ---------
export { SpringColor, hexToRgb, rgbToOklab, oklabToRgb, oklabToHex } from "../motion/oklab";
export type { Rgb } from "../motion/oklab";

/** Springs center + size (never four edges) for morphing rectangles. */
export class SpringRect {
  readonly x: SpringScalar;
  readonly y: SpringScalar;
  readonly width: SpringScalar;
  readonly height: SpringScalar;

  constructor(x = 0, y = 0, width = 0, height = 0, duration: number = MOTION.durations.deliberate, bounce = 0) {
    this.x = new SpringScalar(x, duration, bounce);
    this.y = new SpringScalar(y, duration, bounce);
    this.width = new SpringScalar(width, duration, bounce);
    this.height = new SpringScalar(height, duration, bounce);
  }

  setTarget(x: number, y: number, width: number, height: number): void {
    this.x.setTarget(x);
    this.y.setTarget(y);
    this.width.setTarget(width);
    this.height.setTarget(height);
  }

  advance(dt: number): boolean {
    const moving = this.x.advance(dt) || this.y.advance(dt) || this.height.advance(dt);
    return this.width.advance(dt) || moving;
  }
}
