import { SpringScalar } from "./spring";

type RGB = [number, number, number];
type Oklab = [number, number, number];

function clamp(value: number, min: number, max: number): number { return Math.min(max, Math.max(min, value)); }
function hexToRgb(value: string): RGB {
  const hex = value.replace("#", "");
  const normalized = hex.length === 3 ? hex.split("").map((part) => `${part}${part}`).join("") : hex;
  return [0, 2, 4].map((index) => Number.parseInt(normalized.slice(index, index + 2), 16) / 255) as RGB;
}
function linearize(value: number): number { return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4; }
function delinearize(value: number): number { return value <= 0.0031308 ? value * 12.92 : 1.055 * value ** (1 / 2.4) - 0.055; }
function rgbToOklab(rgb: RGB): Oklab {
  const [r, g, b] = rgb.map(linearize);
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
  const lRoot = Math.cbrt(l); const mRoot = Math.cbrt(m); const sRoot = Math.cbrt(s);
  return [0.2104542553 * lRoot + 0.793617785 * mRoot - 0.0040720468 * sRoot, 1.9779984951 * lRoot - 2.428592205 * mRoot + 0.4505937099 * sRoot, 0.0259040371 * lRoot + 0.7827717662 * mRoot - 0.808675766 * sRoot];
}
function oklabToRgb(lab: Oklab): RGB {
  const [l, a, b] = lab;
  const lRoot = l + 0.3963377774 * a + 0.2158037573 * b;
  const mRoot = l - 0.1055613458 * a - 0.0638541728 * b;
  const sRoot = l - 0.0894841775 * a - 1.291485548 * b;
  const r = 4.0767416621 * lRoot ** 3 - 3.3077115913 * mRoot ** 3 + 0.2309699292 * sRoot ** 3;
  const g = -1.2684380046 * lRoot ** 3 + 2.6097574011 * mRoot ** 3 - 0.3413193965 * sRoot ** 3;
  const blue = -0.0041960863 * lRoot ** 3 - 0.7034186147 * mRoot ** 3 + 1.707614701 * sRoot ** 3;
  return [r, g, blue].map((value) => clamp(delinearize(value), 0, 1)) as RGB;
}
function rgbCss(rgb: RGB): string { return `rgb(${rgb.map((value) => Math.round(value * 255)).join(" ")})`; }

export class SpringColor {
  private readonly l: SpringScalar;
  private readonly a: SpringScalar;
  private readonly b: SpringScalar;

  constructor(value: string, duration = 0.2) {
    const [l, a, b] = rgbToOklab(hexToRgb(value));
    this.l = new SpringScalar(l, duration); this.a = new SpringScalar(a, duration); this.b = new SpringScalar(b, duration);
  }

  setTarget(value: string): void {
    const [l, a, b] = rgbToOklab(hexToRgb(value));
    this.l.setTarget(l); this.a.setTarget(a); this.b.setTarget(b);
  }

  snap(value: string): void {
    const [l, a, b] = rgbToOklab(hexToRgb(value));
    this.l.snap(l); this.a.snap(a); this.b.snap(b);
  }

  advance(dt: number): boolean { return this.l.advance(dt) || this.a.advance(dt) || this.b.advance(dt); }
  css(): string { return rgbCss(oklabToRgb([this.l.value, this.a.value, this.b.value])); }
}
