/**
 * Pointer presence, site-wide. One delegated, rAF-throttled pointermove pass
 * writes two custom-property families; the CSS turns them into the effect:
 *
 *   [data-glow] — --px/--py, the cursor's position inside the element: a soft
 *     accent wash that follows the pointer (hover only, opacity-faded).
 *   [data-tilt] — --tilt-x/--tilt-y, ±2.5° of perspective tilt toward the
 *     cursor, settled by a CSS spring-curve transition when the pointer
 *     leaves. Tilt is geometry, so it stands down under reduced motion; the
 *     glow is positional feedback and stays.
 *
 * Fine pointers only — touch never sees either. One listener for the whole
 * site, zero work when the pointer is over neither family.
 */

export function initPointerPresence(): void {
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  let frame = 0;
  let lastX = 0;
  let lastY = 0;
  let lastTarget: Element | null = null;

  const reduced = (): boolean => document.documentElement.dataset.reducedMotion === "true";

  const apply = (): void => {
    frame = 0;
    const root = lastTarget;
    if (!root) return;

    const glow = root.closest("[data-glow]");
    if (glow) {
      const rect = glow.getBoundingClientRect();
      (glow as HTMLElement).style.setProperty("--px", `${(lastX - rect.left).toFixed(1)}px`);
      (glow as HTMLElement).style.setProperty("--py", `${(lastY - rect.top).toFixed(1)}px`);
      // Normalized cursor position (-1..1) — the titlebar's filename leans a
      // few pixels toward the pointer off this; the wash above uses the px.
      (glow as HTMLElement).style.setProperty("--cursor-nx", (rect.width > 0 ? ((lastX - rect.left) / rect.width) * 2 - 1 : 0).toFixed(3));

      // The hero has a second, quieter layer behind the window. Reuse the
      // same pointer sample so the static halo and cursor wash feel like one
      // restrained surface rather than two unrelated effects.
      const heroWindow = glow.closest<HTMLElement>(".hero__window");
      if (heroWindow) {
        const heroRect = heroWindow.getBoundingClientRect();
        heroWindow.style.setProperty("--hero-px", `${(lastX - heroRect.left).toFixed(1)}px`);
        heroWindow.style.setProperty("--hero-py", `${(lastY - heroRect.top).toFixed(1)}px`);
      }
    }

    if (!reduced()) {
      const tilt = root.closest("[data-tilt]");
      if (tilt) {
        const rect = tilt.getBoundingClientRect();
        const nx = rect.width > 0 ? ((lastX - rect.left) / rect.width - 0.5) * 2 : 0;
        const ny = rect.height > 0 ? ((lastY - rect.top) / rect.height - 0.5) * 2 : 0;
        (tilt as HTMLElement).style.setProperty("--tilt-x", `${(ny * -1.6).toFixed(2)}deg`);
        (tilt as HTMLElement).style.setProperty("--tilt-y", `${(nx * 2).toFixed(2)}deg`);
      }
    }
  };

  window.addEventListener("pointermove", (event) => {
    lastX = event.clientX;
    lastY = event.clientY;
    lastTarget = event.target as Element | null;
    if (!frame) frame = requestAnimationFrame(apply);
  }, { passive: true });

  document.addEventListener("pointerout", (event) => {
    const tilt = (event.target as Element | null)?.closest("[data-tilt]");
    if (tilt && !tilt.contains(event.relatedTarget as Node | null)) {
      (tilt as HTMLElement).style.setProperty("--tilt-x", "0deg");
      (tilt as HTMLElement).style.setProperty("--tilt-y", "0deg");
    }
  }, { passive: true });
}
