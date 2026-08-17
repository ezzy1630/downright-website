/**
 * Mark the act at the reading line without taking neighboring acts out of
 * document flow. The marker powers the rail and scene choreography; native
 * scrolling owns continuity between scenes.
 */

import { reducedMotion } from "../kernel/switchboard";

const READING_LINE = 0.46;

export function initReveal(): void {
  const sections = [...document.querySelectorAll<HTMLElement>("[data-act]")];
  if (!sections.length) return;

  // The mobile film owns its own seven-beat composition and has no desktop
  // act ownership to resolve.
  if (document.documentElement.dataset.film === "true") return;

  let activeSection: HTMLElement | null = null;

  const paint = (): void => {
    const reference = window.innerHeight * READING_LINE;
    let active = sections[0];
    for (const section of sections) {
      const rect = section.getBoundingClientRect();
      if (rect.top <= reference && rect.bottom > reference) active = section;
    }
    if (active !== activeSection) {
      activeSection = active;
      for (const section of sections) {
        const isActive = section === active;
        section.dataset.active = String(isActive);
        section.style.setProperty("--act-reveal", isActive ? "1" : "0");
      }
    }
    for (const section of sections) {
      const rect = section.getBoundingClientRect();
      const fadeStart = reference;
      const fadeEnd = window.innerHeight * 0.1;
      const handoff = reducedMotion()
        ? 1
        : rect.bottom < fadeStart
          ? Math.min(1, Math.max(0, (rect.bottom - fadeEnd) / (fadeStart - fadeEnd)))
          : rect.top > fadeStart
            ? Math.min(1, Math.max(0, (window.innerHeight - rect.top) / (window.innerHeight - fadeStart)))
            : 1;
      for (const element of section.querySelectorAll<HTMLElement>(".act-reveal")) {
        element.style.opacity = handoff.toFixed(3);
      }
    }
  };

  let ticking = false;
  const onScroll = (): void => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      paint();
    });
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  paint();
}
