/**
 * The render act: the living document pins while page scroll drives the
 * document's own scroll in exact proportion — offset tracks bidirectionally,
 * zero wheel interception. As each real capability passes (math, Mermaid,
 * tables, callouts, footnotes, code), a margin annotation blooms exactly
 * once, its hairline connector drawing on the structural curve. Reduced
 * motion: full-length document, static annotations.
 */

import { reducedMotion } from "../kernel/switchboard";
import { repaintSurface } from "../shell/drop";
import { doc } from "../kernel/store";

interface Annotation {
  target: HTMLElement;
  note: HTMLElement;
  fired: boolean;
}

export function initRender(): void {
  const stage = document.querySelector<HTMLElement>("[data-render-stage]");
  const viewport = document.querySelector<HTMLElement>("[data-render-viewport]");
  const scroller = document.querySelector<HTMLElement>("[data-render-scroller]");
  if (!stage || !viewport || !scroller) return;

  repaintSurface(scroller.querySelector("[data-static-document]"));
  const surface = scroller.querySelector<HTMLElement>("[data-static-document]");
  if (!surface) return;

  const annotations: Annotation[] = [];
  for (const note of [...stage.querySelectorAll<HTMLElement>("[data-annotation]")]) {
    const selector = note.dataset.annotation;
    const target = selector ? surface.querySelector<HTMLElement>(selector) : null;
    if (target) annotations.push({ target, note, fired: false });
  }

  if (reducedMotion()) {
    for (const { note } of annotations) note.classList.add("is-bloomed", "is-static");
    return;
  }

  let lastProgress = -1;

  const tick = (): void => {
    const rect = stage.getBoundingClientRect();
    const travel = rect.height - window.innerHeight;
    // Exact proportion: stage progress drives document scroll 1:1.
    const progress = Math.min(1, Math.max(0, -rect.top / Math.max(1, travel)));
    if (Math.abs(progress - lastProgress) < 0.0002) return;
    lastProgress = progress;

    const maxScroll = scroller.scrollHeight - viewport.clientHeight;
    scroller.scrollTop = progress * maxScroll;
    stage.style.setProperty("--stage-progress", progress.toFixed(4));

    // Annotations bloom once, when their target crosses the reading line.
    const readingLine = viewport.getBoundingClientRect().top + viewport.clientHeight * 0.42;
    for (const entry of annotations) {
      if (entry.fired) continue;
      const targetRect = entry.target.getBoundingClientRect();
      if (targetRect.top < readingLine && targetRect.bottom > viewport.getBoundingClientRect().top) {
        entry.fired = true;
        entry.note.classList.add("is-bloomed");
      }
    }
  };

  window.addEventListener("scroll", () => requestAnimationFrame(tick), { passive: true });
  window.addEventListener("resize", () => requestAnimationFrame(tick), { passive: true });
  tick();

  doc.subscribe(() => {
    lastProgress = -1;
    tick();
  });
}
