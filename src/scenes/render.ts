/**
 * The render act: the living document (the traveling window) pins while page
 * scroll drives the document's own scroll in exact proportion — offset tracks
 * bidirectionally, zero wheel interception. As each real capability passes
 * (math, Mermaid, tables, callouts, footnotes, code), a margin annotation
 * blooms exactly once, its hairline connector drawing on the structural
 * curve. A rAF loop runs only while the stage is near the viewport, so the
 * sync survives the window's FLIP arrival and any late layout. Reduced
 * motion: full-length document, static annotations.
 */

import { reducedMotion } from "../kernel/switchboard";
import { doc } from "../kernel/store";

interface Annotation {
  selector: string;
  note: HTMLElement;
}

export function initRender(): void {
  const stage = document.querySelector<HTMLElement>("[data-render-stage]");
  const viewport = document.querySelector<HTMLElement>("[data-render-viewport]");
  const readLayer = document.querySelector<HTMLElement>("[data-document-read]");
  if (!stage || !viewport || !readLayer) return;

  const notes: Annotation[] = [];
  for (const note of [...stage.querySelectorAll<HTMLElement>("[data-annotation]")]) {
    const selector = note.dataset.annotation;
    if (selector) notes.push({ selector, note });
  }

  // The surface re-renders when the store changes, so resolve targets lazily.
  const surface = (): HTMLElement | null => readLayer.querySelector<HTMLElement>("[data-static-document]");

  if (reducedMotion()) {
    for (const { note } of notes) note.classList.add("is-bloomed", "is-static");
    return;
  }

  const fired = new Set<string>();
  let running = false;

  const tick = (): boolean => {
    const rect = stage.getBoundingClientRect();
    const near = rect.top < window.innerHeight + 600 && rect.bottom > -600;
    if (!near) return false;

    // The read layer belongs to the ONE travelling window, so this loop must
    // only drive it while the window is actually parked in this act. Without
    // the guard the stage kept scrolling the document after the window had
    // flown on, and the agent act opened halfway down the file.
    if (!viewport.contains(readLayer)) return true;

    // Exact proportion: stage progress drives document scroll 1:1. Applied
    // every frame — the read layer's scroll geometry can change independently
    // of progress (the window FLIPs in), so a change guard would stall it.
    const travel = rect.height - window.innerHeight;
    const progress = Math.min(1, Math.max(0, -rect.top / Math.max(1, travel)));
    const maxScroll = readLayer.scrollHeight - readLayer.clientHeight;
    readLayer.scrollTop = progress * maxScroll;
    stage.style.setProperty("--stage-progress", progress.toFixed(4));

    // Annotations bloom once, when their target crosses the reading line.
    const viewportRect = viewport.getBoundingClientRect();
    const readingLine = viewportRect.top + viewportRect.height * 0.42;
    for (const entry of notes) {
      if (fired.has(entry.selector)) continue;
      const target = surface()?.querySelector<HTMLElement>(entry.selector);
      if (!target) continue;
      const targetRect = target.getBoundingClientRect();
      if (targetRect.top < readingLine && targetRect.bottom > viewportRect.top) {
        fired.add(entry.selector);
        entry.note.classList.add("is-bloomed");
      }
    }
    return true;
  };

  const loop = (): void => {
    if (!running) return;
    if (tick()) requestAnimationFrame(loop);
    else running = false;
  };
  const start = (): void => {
    if (!running) {
      running = true;
      loop();
    }
  };

  window.addEventListener("scroll", start, { passive: true });
  window.addEventListener("resize", start, { passive: true });
  doc.subscribe(start);
  start();
}
