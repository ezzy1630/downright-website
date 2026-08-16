/**
 * Pure OKLab color math and the color spring — no DOM, no ticker — so the
 * mid-transition chroma assertion can run headless. Springs a hex color
 * through OKLab so midpoints never desaturate (the app's own converter).
 */

import { SpringScalar } from "./spring.ts";

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

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

  constructor(hex: string, duration = 0.2, bounce = 0) {
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

  snap(hex: string): void {
    const [l, aa, bb] = rgbToOklab(hexToRgb(hex));
    this.L.snap(l);
    this.a.snap(aa);
    this.b.snap(bb);
  }

  advance(dt: number): boolean {
    // Advance every channel before OR-ing: a bare `||` chain freezes the
    // channels after the first one still moving.
    const movingL = this.L.advance(dt);
    const movingA = this.a.advance(dt);
    const movingB = this.b.advance(dt);
    return movingL || movingA || movingB;
  }
}
