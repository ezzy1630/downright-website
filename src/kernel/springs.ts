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

// --- OKLab color spring -----------------------------------------------------

export interface Rgb { r: number; g: number; b: number }

export function hexToRgb(hex: string): Rgb {
  const value = hex.replace("#", "");
  const full = value.length === 3 ? [...value].map((c) => c + c).join("") : value;
  return {
    r: parseInt(full.slice(0, 2), 16) / 255,
    g: parseInt(full.slice(2, 4), 16) / 255,
    b: parseInt(full.slice(4, 6), 16) / 255,
  };
}

const srgbToLinear = (channel: number): number =>
  channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
const linearToSrgb = (channel: number): number =>
  channel <= 0.0031308 ? channel * 12.92 : 1.055 * channel ** (1 / 2.4) - 0.055;

export function rgbToOklab({ r, g, b }: Rgb): [number, number, number] {
  const lr = srgbToLinear(r);
  const lg = srgbToLinear(g);
  const lb = srgbToLinear(b);
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

export function oklabToRgb(L: number, a: number, b: number): Rgb {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;
  return {
    r: linearToSrgb(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    g: linearToSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    b: linearToSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  };
}

const toHexChannel = (channel: number): string =>
  Math.round(Math.min(1, Math.max(0, channel)) * 255)
    .toString(16)
    .padStart(2, "0");

export function oklabToHex(L: number, a: number, b: number): string {
  const { r, g, b: blue } = oklabToRgb(L, a, b);
  return `#${toHexChannel(r)}${toHexChannel(g)}${toHexChannel(blue)}`;
}

/** Springs a hex color through OKLab so midpoints never desaturate. */
export class SpringColor {
  private readonly L: SpringScalar;
  private readonly a: SpringScalar;
  private readonly b: SpringScalar;

  constructor(hex: string, duration: number = MOTION.durations.deliberate, bounce = 0) {
    const [l, aa, bb] = rgbToOklab(hexToRgb(hex));
    this.L = new SpringScalar(l, duration, bounce);
    this.a = new SpringScalar(aa, duration, bounce);
    this.b = new SpringScalar(bb, duration, bounce);
  }

  get value(): string {
    return oklabToHex(this.L.value, this.a.value, this.b.value);
  }

  setTarget(hex: string): void {
    const [l, aa, bb] = rgbToOklab(hexToRgb(hex));
    this.L.setTarget(l);
    this.a.setTarget(aa);
    this.b.setTarget(bb);
  }

  advance(dt: number): boolean {
    const moving = this.L.advance(dt);
    return this.a.advance(dt) || this.b.advance(dt) || moving;
  }
}

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
