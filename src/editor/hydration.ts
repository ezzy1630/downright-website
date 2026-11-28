/**
 * The hydration gate for the living document. The hero ships prerendered
 * (the LCP is DOM text); the CodeMirror chunk loads only on the first
 * pointer or key event aimed at the hero window. No editor JS before
 * interaction. The window is tabbable: Enter or Space opens the editor for
 * keyboard users, pointerdown for everyone else.
 */

import { setWindowView } from "../shell/flip";
import type { MountedWindow } from "./mount";

export function hydrateOnIntent(windowEl: HTMLElement, onMount?: (mounted: MountedWindow) => void): void {
  const body = windowEl.querySelector<HTMLElement>("[data-window-body]");
  if (!body) return;

  const isMounted = (): boolean => body.querySelector<HTMLElement>("[data-document-editor]")?.dataset.editorMounted === "true";

  const compact = document.documentElement.dataset.film === "true";
  const editButton = compact ? document.querySelector<HTMLButtonElement>("[data-film-type]") : null;
  let loading = false;
  const activate = (event: Event): void => {
    if (loading) return;
    // Only the hero slot is editable — the window is read-only elsewhere.
    if (windowEl.dataset.slot !== "hero") return;
    if (event.type === "pointerdown") {
      const target = event.target;
      if (!(target instanceof Element) || !target.closest("[data-window-body]")) return;
      if (compact || windowEl.dataset.view === "document" || target.closest("a, button, input")) return;
    }
    if (event instanceof KeyboardEvent) {
      if (event.key !== "Enter" && event.key !== " ") return;
      if (event.target !== windowEl) return;
      event.preventDefault();
    }
    if (compact || windowEl.dataset.view === "document") setWindowView(windowEl, "source");
    if (isMounted()) {
      body.querySelector<HTMLElement>(".cm-content")?.focus();
      return;
    }
    const pointer = event.type === "pointerdown" && event instanceof MouseEvent ? { x: event.clientX, y: event.clientY } : null;
    loading = true;
    editButton?.setAttribute("aria-busy", "true");
    import("./mount").then(({ mountEditor }) => {
      const mounted = mountEditor(windowEl, body);
      windowEl.querySelector("[data-type-invite]")?.remove();
      if (!compact) cleanup();
      requestAnimationFrame(() => {
        mounted.view.focus();
        if (!pointer) return;
        const position = mounted.view.posAtCoords(pointer);
        if (position == null) return;
        mounted.view.dispatch({ selection: { anchor: position }, scrollIntoView: true });
      });
      if (editButton) editButton.textContent = "Edit Markdown";
      onMount?.(mounted);
    }).catch(() => {
      if (editButton) editButton.textContent = "Retry loading editor";
    }).finally(() => {
      loading = false;
      editButton?.removeAttribute("aria-busy");
    });
  };

  const cleanup = (): void => {
    windowEl.removeEventListener("pointerdown", activate);
    windowEl.removeEventListener("keydown", activate);
  };
  editButton?.addEventListener("click", activate);
  windowEl.addEventListener("pointerdown", activate);
  windowEl.addEventListener("keydown", activate);
}
