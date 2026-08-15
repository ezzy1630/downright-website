/**
 * ⌘⇧E flip to source: the app window 3D-flips (two faces, preserve-3d,
 * compositor-only transforms) to its own raw Markdown with line numbers.
 * Also driven by the window's Document/Source segmented control. The source
 * face always mirrors the living document byte-for-byte.
 */

import { doc } from "../kernel/store";
import { sound } from "../kernel/sound";
import { reducedMotion } from "../kernel/switchboard";

function renderSourceFace(target: HTMLElement, text: string): void {
  const lines = text.split("\n");
  const fragment = document.createDocumentFragment();
  lines.forEach((line, index) => {
    const row = document.createElement("div");
    row.className = "source-row";
    const number = document.createElement("span");
    number.className = "source-row__number";
    number.textContent = String(index + 1).padStart(3, " ");
    const content = document.createElement("span");
    content.className = "source-row__text";
    content.textContent = line || " ";
    row.append(number, content);
    fragment.append(row);
  });
  target.replaceChildren(fragment);
}

export function initFlip(): void {
  const flipKeys = (event: KeyboardEvent): void => {
    if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === "e") {
      event.preventDefault();
      toggleAnyWindow();
    }
  };
  window.addEventListener("keydown", flipKeys);

  const unsubscribe = doc.subscribe(() => {
    for (const source of document.querySelectorAll<HTMLElement>("[data-source-face]")) {
      if (source.closest<HTMLElement>("[data-window]")?.dataset.face === "source") renderSourceFace(source, doc.current.text);
    }
  });
  void unsubscribe;
}

function toggleAnyWindow(): void {
  const windowEl = document.querySelector<HTMLElement>("[data-flip-window]");
  if (windowEl) setFace(windowEl, windowEl.dataset.face === "source" ? "document" : "source");
}

export function setFace(windowEl: HTMLElement, face: "document" | "source"): void {
  if (windowEl.dataset.face === face) return;
  const source = windowEl.querySelector<HTMLElement>("[data-source-face]");
  if (face === "source" && source) renderSourceFace(source, doc.current.text);
  windowEl.dataset.face = face;
  if (reducedMotion() && source) renderSourceFace(source, doc.current.text);
  sound.whoosh();
  const segmented = windowEl.querySelectorAll<HTMLButtonElement>("[data-face-button]");
  for (const button of segmented) button.setAttribute("aria-selected", String(button.dataset.faceButton === face));
}

/** Wire the segmented Document/Source control with its sprung indicator. */
export function initWindowControls(): void {
  for (const windowEl of document.querySelectorAll<HTMLElement>("[data-flip-window]")) {
    for (const button of windowEl.querySelectorAll<HTMLButtonElement>("[data-face-button]")) {
      button.addEventListener("click", () => setFace(windowEl, button.dataset.faceButton === "source" ? "source" : "document"));
    }
    windowEl.addEventListener("dblclick", (event) => {
      if ((event.target as HTMLElement).closest("[data-face-button]")) return;
      setFace(windowEl, windowEl.dataset.face === "source" ? "document" : "source");
    });
  }
}
