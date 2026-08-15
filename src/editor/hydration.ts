/**
 * The hydration gate for the living document. The hero ships prerendered
 * (the LCP is DOM text); the CodeMirror chunk loads only on the first
 * pointer or key event aimed at a window. No editor JS before interaction.
 */

import type { MountedWindow } from "./mount";

export function hydrateOnIntent(windowEl: HTMLElement, onMount?: (mounted: MountedWindow) => void): void {
  const body = windowEl.querySelector<HTMLElement>("[data-window-body]");
  if (!body) return;

  let loading = false;
  const activate = (event: Event): void => {
    if (body.dataset.editorMounted || loading) return;
    if (event instanceof KeyboardEvent && document.activeElement !== windowEl && !windowEl.contains(document.activeElement)) {
      return;
    }
    loading = true;
    cleanup();
    import("./mount").then(({ mountEditor }) => {
      body.replaceChildren();
      const mounted = mountEditor(windowEl, body);
      requestAnimationFrame(() => mounted.view.focus());
      onMount?.(mounted);
    });
  };

  const cleanup = (): void => {
    windowEl.removeEventListener("pointerdown", activate);
    windowEl.removeEventListener("keydown", activate);
  };
  windowEl.addEventListener("pointerdown", activate);
  windowEl.addEventListener("keydown", activate);
}
