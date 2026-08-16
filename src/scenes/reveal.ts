/**
 * The hard-cut entrance. Act text is not a crossfade: each act's content
 * stays below the readability floor (opacity < 0.3) until the previous act's
 * text has scrolled clear of the viewport, then it steps in over a short
 * band. The mechanism is the same one the sweep already uses — native scroll
 * drives a per-act progress value, and CSS maps that value to opacity. No
 * wheel interception, no IntersectionObserver timing jitter, works backwards.
 *
 * The reveal is scoped to `.act-reveal` descendants of `[data-act]`, so the
 * pinned stages (the sweep) and the hero keep their own choreography.
 */

import { reducedMotion } from "../kernel/switchboard";

// Full at the seam (top = 0) so each act is composed at its rest position;
// the 0.3-opacity crossing lands ~0.2vh before the seam, inside every act's
// declared [data-band], so the outgoing act's tail and the incoming act's
// first line may only co-exist within the seam's band.
const REVEAL_FROM = 0.3;
const REVEAL_BAND = 0.3;

export function initReveal(): void {
  const sections = [...document.querySelectorAll<HTMLElement>("[data-act]")];
  if (!sections.length) return;

  // Reduced motion = every act fully composed, no entrance.
  if (reducedMotion()) {
    for (const section of sections) section.style.setProperty("--act-reveal", "1");
    return;
  }

  const paint = (): void => {
    const vh = window.innerHeight;
    for (const section of sections) {
      if (section.id === "hero") continue;
      const rect = section.getBoundingClientRect();
      const top = rect.top;
      const value = Math.min(1, Math.max(0, (REVEAL_FROM * vh - top) / (REVEAL_BAND * vh)));
      // Cheap equality: only write when it changed enough to matter.
      const previous = parseFloat(section.style.getPropertyValue("--act-reveal") || "0");
      if (Math.abs(previous - value) < 0.005) continue;
      section.style.setProperty("--act-reveal", value.toFixed(4));
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
