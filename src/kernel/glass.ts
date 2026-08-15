/**
 * Liquid glass in three tiers (§6). Glass belongs only to things that float:
 * the header, the ⌘K palette, the Quick Look overlay, the change toast, the
 * theme morph panel, and the Tasks-panel demo — never behind body text.
 *
 *   T1 Refraction  — Chromium: precomputed Snell's-law displacement map fed
 *                    through feImage + feDisplacementMap, with a specular rim
 *                    via backdrop-filter: url(#glass).
 *   T2 Owned       — window chrome whose backdrop we render ourselves:
 *                    plain filter: url() on the content layer.
 *   T3 Blur+spec   — Safari/Firefox and every fallback: blur(12px)
 *                    saturate(1.5), inset hairline, specular edge.
 *
 * The map is geometry-static; only filter scale and transform ever animate.
 */

export type GlassTier = "t1" | "t2" | "t3";

function isChromium(): boolean {
  const chrome = (window as { chrome?: unknown }).chrome;
  return Boolean(chrome) || /Chrom(e|ium)|Edg\//.test(navigator.userAgent);
}

export function glassTier(): GlassTier {
  const supported = typeof CSS !== "undefined" && typeof CSS.supports === "function" && CSS.supports("backdrop-filter", "blur(1px)");
  if (!supported) return "t3";
  if (isChromium()) return "t1";
  return "t3";
}

/**
 * Builds the shared SVG filter graph once: a displacement map image plus the
 * feDisplacementMap chain every T1 surface references. ~4KB, computed at
 * idle, appended as a hidden <svg> so all glass shares one map.
 */
export function ensureGlassFilter(): void {
  if (document.getElementById("glass-refraction")) return;
  if (glassTier() !== "t1") return;

  const size = 160;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.id = "glass-refraction";
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("width", "0");
  svg.setAttribute("height", "0");
  svg.style.position = "absolute";

  // Snell's-law style lens: displacement grows toward the rim, zero at the
  // center, encoded in the red/green channels (dx, dy). Precomputed per
  // pixel, then referenced as an feImage so the browser caches the map.
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const image = ctx.createImageData(size, size);
  const half = size / 2;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const dx = (x - half) / half;
      const dy = (y - half) / half;
      const radius = Math.hypot(dx, dy);
      // Lens falloff: no displacement at the center, bending only in the
      // outer rim band, squared so the transition stays smooth.
      const rim = Math.max(0, Math.min(1, (radius - 0.42) / 0.58));
      const strength = rim * rim * 0.5;
      const index = (y * size + x) * 4;
      image.data[index] = Math.round(128 + dx * strength * 255 * 0.5);
      image.data[index + 1] = Math.round(128 + dy * strength * 255 * 0.5);
      image.data[index + 2] = 128;
      image.data[index + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);

  const dataUrl = canvas.toDataURL();

  // One filter graph: the precomputed map bends the backdrop at the rim and
  // nothing else. There is deliberately no specular pass — a point light on a
  // 1440px header renders as an off-centre bright blob, which is a decorative
  // gradient by another name (§3). The specular edge is a CSS inset hairline.
  // All primitives must live inside the SAME filter: feDisplacementMap's `in2`
  // resolves within its own filter only.
  const apply = document.createElementNS("http://www.w3.org/2000/svg", "filter");
  apply.id = "glass";
  apply.setAttribute("x", "-20%");
  apply.setAttribute("y", "-20%");
  apply.setAttribute("width", "140%");
  apply.setAttribute("height", "140%");
  apply.setAttribute("color-interpolation-filters", "sRGB");

  const feImage = document.createElementNS("http://www.w3.org/2000/svg", "feImage");
  feImage.setAttribute("href", dataUrl);
  feImage.setAttribute("result", "map");

  const refraction = document.createElementNS("http://www.w3.org/2000/svg", "feDisplacementMap");
  refraction.setAttribute("in", "SourceGraphic");
  refraction.setAttribute("in2", "map");
  refraction.setAttribute("scale", "18");
  refraction.setAttribute("xChannelSelector", "R");
  refraction.setAttribute("yChannelSelector", "G");

  // Clip the bent backdrop back to the surface's own shape so the filter
  // region (-20%/140%) can never paint outside the glass.
  const clip = document.createElementNS("http://www.w3.org/2000/svg", "feComposite");
  clip.setAttribute("in", "refracted");
  clip.setAttribute("in2", "SourceAlpha");
  clip.setAttribute("operator", "in");

  refraction.setAttribute("result", "refracted");

  apply.append(feImage, refraction, clip);

  svg.append(apply);
  document.body.append(svg);
  document.documentElement.dataset.glass = "t1";
}

export function initGlass(): void {
  document.documentElement.dataset.glass = glassTier();
  const idle = (window as Window & { requestIdleCallback?: (callback: () => void) => void }).requestIdleCallback;
  if (typeof idle === "function") idle(ensureGlassFilter);
  else window.setTimeout(ensureGlassFilter, 400);
}
