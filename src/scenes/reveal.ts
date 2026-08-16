/**
 * Mark the act at the reading line without taking neighboring acts out of
 * document flow. The marker powers the rail and scene choreography; native
 * scrolling owns continuity between scenes.
 */

const READING_LINE = 0.46;

export function initReveal(): void {
  const sections = [...document.querySelectorAll<HTMLElement>("[data-act]")];
  if (!sections.length) return;

  // The mobile film owns its own seven-beat composition and has no desktop
  // act ownership to resolve.
  if (document.documentElement.dataset.film === "true") return;

  const paint = (): void => {
    const reference = window.innerHeight * READING_LINE;
    let active = sections[0];
    for (const section of sections) {
      const rect = section.getBoundingClientRect();
      if (rect.top <= reference && rect.bottom > reference) active = section;
    }
    for (const section of sections) {
      const isActive = section === active;
      section.dataset.active = String(isActive);
      section.style.setProperty("--act-reveal", isActive ? "1" : "0");
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
