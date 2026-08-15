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

  // One filter graph: the precomputed map feeds the displacement, the
  // specular lighting reads the source alpha as a lens height for the rim,
  // and the composite masks it back to the surface shape. All primitives
  // must live inside the SAME filter — feDisplacementMap's `in2` resolves
  // within its own filter only, so a sibling filter's `result` is invisible.
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

  const specular = document.createElementNS("http://www.w3.org/2000/svg", "feSpecularLighting");
  specular.setAttribute("in", "SourceAlpha");
  specular.setAttribute("surfaceScale", "1.4");
  specular.setAttribute("specularConstant", "0.55");
  specular.setAttribute("specularExponent", "20");
  specular.setAttribute("lighting-color", "#ffffff");
  specular.setAttribute("result", "specular");
  const light = document.createElementNS("http://www.w3.org/2000/svg", "fePointLight");
  light.setAttribute("x", "120");
  light.setAttribute("y", "60");
  light.setAttribute("z", "140");
  specular.append(light);

  const compose = document.createElementNS("http://www.w3.org/2000/svg", "feComposite");
  compose.setAttribute("in", "specular");
  compose.setAttribute("in2", "SourceAlpha");
  compose.setAttribute("operator", "in");

  apply.append(feImage, refraction, specular, compose);

  // T2 owned-backdrop: the window chrome sits over content we render
  // ourselves, so it refracts with a regular filter (no backdrop sampling).
  // A gentler scale keeps the title bar's labels legible; specular only.
  const chrome = document.createElementNS("http://www.w3.org/2000/svg", "filter");
  chrome.id = "glass-chrome";
  chrome.setAttribute("x", "-20%");
  chrome.setAttribute("y", "-20%");
  chrome.setAttribute("width", "140%");
  chrome.setAttribute("height", "140%");
  chrome.setAttribute("color-interpolation-filters", "sRGB");
  const chromeImage = feImage.cloneNode(true) as SVGElement;
  const chromeRefract = refraction.cloneNode(true) as SVGElement;
  chromeRefract.setAttribute("scale", "7");
  const chromeSpecular = specular.cloneNode(true) as SVGElement;
  chromeSpecular.setAttribute("specularConstant", "0.35");
  const chromeCompose = compose.cloneNode(true) as SVGElement;
  chrome.append(chromeImage, chromeRefract, chromeSpecular, chromeCompose);

  svg.append(apply, chrome);
  document.body.append(svg);
  document.documentElement.dataset.glass = "t1";
}

export function initGlass(): void {
  document.documentElement.dataset.glass = glassTier();
  const idle = (window as Window & { requestIdleCallback?: (callback: () => void) => void }).requestIdleCallback;
  if (typeof idle === "function") idle(ensureGlassFilter);
  else window.setTimeout(ensureGlassFilter, 400);
}
