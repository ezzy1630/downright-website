import { onMotionChange } from "./switchboard";

const FINE_POINTER_QUERY = "(hover: hover) and (pointer: fine)";
const GRID_TOKENS = [
  "#", "##", "*", "_", ">", "[", "]", "~", "`", "---", "- [ ]", "> quote",
  "**live**", "_source_", "~~stale~~", "`parse()`", "[open]", "| · |", "```", ":::",
] as const;
const ROW_HEIGHT = 68;
const COLUMN_WIDTH = 84;
const PARALLAX_FACTOR = 0.42;
const PARALLAX_PERIOD = ROW_HEIGHT * 4;
const PARALLAX_INSET = 320;
const SPOTLIGHT_RADIUS = 260;
const SNIPPET_LIT_RADIUS = 172;
const CONTENT_FADE_DISTANCE = 150;

interface Palette {
  ink: string;
  accent: string;
  font: string;
}

interface ContentRect {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

interface SnippetGeometry {
  centerX: number;
  baseCenterY: number;
  width: number;
  height: number;
}

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

function rectDistance(x: number, y: number, rect: ContentRect): number {
  const dx = Math.max(rect.left - x, 0, x - rect.right);
  const dy = Math.max(rect.top - y, 0, y - rect.bottom);
  return Math.hypot(dx, dy);
}

function rectFade(x: number, y: number, rects: ContentRect[]): number {
  return rects.reduce((fade, rect) => {
    const distance = rectDistance(x, y, rect);
    return Math.max(fade, 1 - clamp(distance / CONTENT_FADE_DISTANCE, 0, 1));
  }, 0);
}

function visibleRect(element: Element | null): ContentRect | null {
  if (!(element instanceof HTMLElement)) return null;
  const rect = element.getBoundingClientRect();
  if (!rect.width || !rect.height) return null;
  return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
}

function contentRects(): ContentRect[] {
  return [
    visibleRect(document.querySelector(".hero__copy")),
    visibleRect(document.querySelector(".hero__window")),
  ].filter((rect): rect is ContentRect => Boolean(rect));
}

function readPalette(): Palette {
  const styles = getComputedStyle(document.documentElement);
  return {
    ink: styles.getPropertyValue("--text-secondary").trim() || "#aca297",
    accent: styles.getPropertyValue("--accent").trim() || "#6ea8ff",
    font: styles.getPropertyValue("--font-mono").trim() || "ui-monospace, monospace",
  };
}

/**
 * Draws the ambient syntax field without owning any page interaction. The
 * canvas does the repeated low-contrast work; only the small snippet cells
 * below need DOM transitions for the rendered-on-hover beat.
 */
export function initAmbientBackdrop(): void {
  const host = document.querySelector<HTMLElement>("[data-ambient-backdrop]");
  if (!host) return;
  const canvas = host.querySelector<HTMLCanvasElement>("[data-ambient-grid]");
  const spotlight = host.querySelector<HTMLElement>("[data-ambient-spotlight]");
  if (!canvas || !spotlight) return;
  const hostElement: HTMLElement = host;
  const spotlightElement: HTMLElement = spotlight;

  const context = canvas.getContext("2d", { alpha: true, desynchronized: true });
  if (!context) return;

  const snippets = [...host.querySelectorAll<HTMLElement>("[data-ambient-snippet]")];
  const pointerQuery = window.matchMedia(FINE_POINTER_QUERY);
  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  let palette = readPalette();
  let paletteDirty = false;
  let canvasWidth = 0;
  let canvasHeight = 0;
  let canvasLeft = 0;
  let canvasBaseTop = -PARALLAX_INSET;
  let deviceScale = 1;
  let frame = 0;
  let dirty = true;
  let geometryDirty = true;
  let parallaxPhase = 0;
  let cachedContentRects: ContentRect[] = [];
  let snippetGeometry: SnippetGeometry[] = [];
  const snippetLit = snippets.map(() => false);
  let hidden = document.hidden;
  let interactive = pointerQuery.matches && !reducedMotionQuery.matches && document.documentElement.dataset.reducedMotion !== "true";
  let hasPointer = false;
  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;

  const clearSnippetState = (): void => {
    for (let index = 0; index < snippets.length; index += 1) {
      if (!snippetLit[index]) continue;
      snippetLit[index] = false;
      snippets[index].classList.remove("is-lit");
    }
  };

  const stopSpotlight = (): void => {
    hasPointer = false;
    spotlightElement.style.opacity = "0";
    clearSnippetState();
    schedule();
  };

  const schedule = (): void => {
    dirty = true;
    if (!hidden && !frame) frame = requestAnimationFrame(tick);
  };

  const resize = (): void => {
    const rect = canvas.getBoundingClientRect();
    canvasWidth = rect.width;
    canvasHeight = rect.height;
    canvasLeft = rect.left;
    canvasBaseTop = rect.top + parallaxPhase;
    deviceScale = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(canvasWidth * deviceScale));
    canvas.height = Math.max(1, Math.round(canvasHeight * deviceScale));
    geometryDirty = true;
    dirty = true;
    schedule();
  };

  const updateScrollPhase = (): void => {
    const phase = interactive ? (window.scrollY * PARALLAX_FACTOR) % PARALLAX_PERIOD : 0;
    parallaxPhase = phase;
    geometryDirty = true;
    hostElement.style.setProperty("--ambient-scroll-phase", `${phase.toFixed(2)}px`);
    hostElement.style.setProperty("--ambient-scroll-energy", "0");
    // Parallax is handled by the compositor. Only an active pointer needs a
    // frame here, because its spotlight and morph targets must follow the
    // translated layer; an idle scroll does not redraw the canvas or snippets.
    if (interactive && hasPointer) schedule();
  };

  const refreshGeometry = (): void => {
    if (!geometryDirty) return;
    cachedContentRects = contentRects();
    snippetGeometry = snippets.map((snippet) => {
      const rect = snippet.getBoundingClientRect();
      return {
        centerX: rect.left + rect.width / 2,
        baseCenterY: rect.top + rect.height / 2 + parallaxPhase,
        width: rect.width,
        height: rect.height,
      };
    });

    for (let index = 0; index < snippets.length; index += 1) {
      const geometry = snippetGeometry[index];
      const centerY = geometry.baseCenterY - parallaxPhase;
      const fade = rectFade(geometry.centerX, centerY, cachedContentRects);
      const alpha = Math.max(0.035, 0.22 * (1 - fade * 0.88));
      snippets[index].style.setProperty("--ambient-snippet-alpha", alpha.toFixed(3));
    }
    geometryDirty = false;
  };

  const drawGrid = (): void => {
    if (!canvasWidth || !canvasHeight) return;
    if (paletteDirty) {
      palette = readPalette();
      paletteDirty = false;
    }

    refreshGeometry();
    const rect = {
      left: canvasLeft,
      top: canvasBaseTop - parallaxPhase,
      width: canvasWidth,
      height: canvasHeight,
    };
    const fades = cachedContentRects;
    const fontSize = canvasWidth < 700 ? 10 : 11;
    const columnWidth = canvasWidth < 700 ? 62 : COLUMN_WIDTH;
    const rowHeight = canvasWidth < 700 ? 54 : ROW_HEIGHT;
    const startColumn = Math.floor(-rect.left / columnWidth) - 1;
    const endColumn = Math.ceil((window.innerWidth - rect.left) / columnWidth) + 1;
    const startRow = Math.floor(-rect.top / rowHeight) - 1;
    const endRow = Math.ceil((window.innerHeight - rect.top) / rowHeight) + 1;

    context.setTransform(deviceScale, 0, 0, deviceScale, 0, 0);
    context.clearRect(0, 0, canvasWidth, canvasHeight);
    context.font = `500 ${fontSize}px ${palette.font}`;
    context.textAlign = "center";
    context.textBaseline = "middle";

    for (let row = startRow; row <= endRow; row += 1) {
      for (let column = startColumn; column <= endColumn; column += 1) {
        const x = rect.left + column * columnWidth + columnWidth / 2;
        const y = rect.top + row * rowHeight + rowHeight / 2;
        if (x < -columnWidth || x > window.innerWidth + columnWidth || y < -rowHeight || y > window.innerHeight + rowHeight) continue;
        if (snippetGeometry.some((snippet) => Math.abs(x - snippet.centerX) < Math.max(24, snippet.width / 2) && Math.abs(y - (snippet.baseCenterY - parallaxPhase)) < Math.max(18, snippet.height / 2))) continue;

        const seed = Math.abs(column * 17 + row * 29);
        const spotlightDistance = interactive && hasPointer ? Math.hypot(x - currentX, y - currentY) : Number.POSITIVE_INFINITY;
        const spotlightStrength = spotlightDistance < SPOTLIGHT_RADIUS
          ? Math.pow(1 - spotlightDistance / SPOTLIGHT_RADIUS, 2)
          : 0;
        const contentFade = rectFade(x, y, fades);
        const baseAlpha = 0.078 + (seed % 5) * 0.009;
        const alpha = baseAlpha * Math.max(0.04, 1 - contentFade * 0.96) * (1 + spotlightStrength * 2.25);
        if (alpha < 0.004) continue;

        context.globalAlpha = alpha;
        context.fillStyle = spotlightStrength > 0.18 || seed % 11 === 0 ? palette.accent : palette.ink;
        const token = GRID_TOKENS[seed % GRID_TOKENS.length];
        context.fillText(token, x - rect.left, y - rect.top);
      }
    }

    context.globalAlpha = 1;
  };

  const updateSnippets = (): void => {
    refreshGeometry();
    for (let index = 0; index < snippets.length; index += 1) {
      const snippet = snippets[index];
      const geometry = snippetGeometry[index];
      const centerX = geometry.centerX;
      const centerY = geometry.baseCenterY - parallaxPhase;
      const fade = rectFade(centerX, centerY, cachedContentRects);
      const lit = interactive && hasPointer && fade < 0.9 && Math.hypot(centerX - currentX, centerY - currentY) < SNIPPET_LIT_RADIUS;
      if (snippetLit[index] === lit) continue;
      snippetLit[index] = lit;
      snippet.classList.toggle("is-lit", lit);
    }
  };

  function tick(): void {
    frame = 0;
    if (hidden) return;

    let settling = false;
    if (interactive && hasPointer) {
      const dx = targetX - currentX;
      const dy = targetY - currentY;
      currentX += dx * 0.13;
      currentY += dy * 0.13;
      spotlightElement.style.setProperty("--ambient-spot-x", `${currentX.toFixed(1)}px`);
      spotlightElement.style.setProperty("--ambient-spot-y", `${currentY.toFixed(1)}px`);
      settling = Math.abs(dx) + Math.abs(dy) > 0.35;
      if (!settling) {
        currentX = targetX;
        currentY = targetY;
      }
    }

    if (dirty || (interactive && hasPointer)) {
      drawGrid();
      updateSnippets();
      dirty = false;
    }

    if (settling) frame = requestAnimationFrame(tick);
  }

  const setInteractive = (next: boolean): void => {
    interactive = next;
    if (!interactive) {
      stopSpotlight();
    }
    updateScrollPhase();
    schedule();
  };

  const handlePointerMove = (event: PointerEvent): void => {
    if (!interactive || event.pointerType === "touch") return;
    targetX = event.clientX;
    targetY = event.clientY;
    if (!hasPointer) {
      currentX = targetX;
      currentY = targetY;
    }
    hasPointer = true;
    spotlightElement.style.opacity = "1";
    schedule();
  };

  const handleVisibility = (): void => {
    hidden = document.hidden;
    if (hidden) {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      return;
    }
    schedule();
  };

  const themeObserver = new MutationObserver(() => {
    paletteDirty = true;
    schedule();
  });

  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  document.addEventListener("pointermove", handlePointerMove, { passive: true });
  document.addEventListener("pointerout", (event) => {
    if (!event.relatedTarget) stopSpotlight();
  }, { passive: true });
  document.addEventListener("scroll", updateScrollPhase, { passive: true });
  document.addEventListener("visibilitychange", handleVisibility);
  window.addEventListener("blur", stopSpotlight, { passive: true });
  window.addEventListener("resize", resize, { passive: true });
  pointerQuery.addEventListener("change", (event) => {
    setInteractive(event.matches && !reducedMotionQuery.matches && document.documentElement.dataset.reducedMotion !== "true");
  });
  onMotionChange((flags) => {
    setInteractive(pointerQuery.matches && !flags.reduced && !flags.inPageReduce);
  });

  resize();
  updateScrollPhase();
  schedule();
}
