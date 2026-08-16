/**
 * The hydration gate for the living document. The hero ships prerendered
 * (the LCP is DOM text); the CodeMirror chunk loads only on the first
 * pointer or key event aimed at the hero window. No editor JS before
 * interaction. The window is tabbable: Enter or Space opens the editor for
 * keyboard users, pointerdown for everyone else.
 */

import type { MountedWindow } from "./mount";

export function hydrateOnIntent(windowEl: HTMLElement, onMount?: (mounted: MountedWindow) => void): void {
  const body = windowEl.querySelector<HTMLElement>("[data-window-body]");
  if (!body) return;

  const isMounted = (): boolean => body.querySelector<HTMLElement>("[data-document-editor]")?.dataset.editorMounted === "true";

  let loading = false;
  const activate = (event: Event): void => {
    if (isMounted() || loading) return;
    // Only the hero slot is editable — the window is read-only elsewhere.
    if (windowEl.dataset.slot !== "hero") return;
    if (event instanceof KeyboardEvent) {
      if (event.key !== "Enter" && event.key !== " ") return;
      if (document.activeElement !== windowEl && !windowEl.contains(document.activeElement)) return;
      event.preventDefault();
    }
    const pointer = event instanceof MouseEvent ? { x: event.clientX, y: event.clientY } : null;
    loading = true;
    cleanup();
    import("./mount").then(({ mountEditor }) => {
      const mounted = mountEditor(windowEl, body);
      requestAnimationFrame(() => {
        mounted.view.focus();
        if (!pointer) return;
        const position = mounted.view.posAtCoords(pointer);
        if (position == null) return;
        mounted.view.dispatch({ selection: { anchor: position }, scrollIntoView: true });
      });
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
