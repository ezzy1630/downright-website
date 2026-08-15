/**
 * Drop or paste your own Markdown: drag any .md over the page and the ground
 * dims, the hero window opens as a target — "Drop it. Nothing uploads — this
 * page has no server." — and the file becomes the living document everywhere.
 * Paste works too. Raw HTML inside the file never renders: the payload
 * renderer escapes everything on its way through.
 */

import { doc } from "../kernel/store";
import { renderSampleMarkdown } from "../data/site";

const ACCEPT = /\.(md|markdown|mdown|mkd|mdx|mdc|qmd|rmd)$/i;

async function ingest(file: File): Promise<void> {
  if (!ACCEPT.test(file.name) && file.type !== "text/markdown") return;
  const text = await file.text();
  doc.replaceFile(text, file.name);
  repaintDocumentSurfaces();
}

/** Every rendered instance of the document follows the store. */
export function repaintDocumentSurfaces(): void {
  const state = doc.current;
  for (const surface of document.querySelectorAll<HTMLElement>("[data-static-document]")) {
    surface.innerHTML = renderSampleMarkdown(state.text);
  }
  for (const label of document.querySelectorAll<HTMLElement>("[data-file-label]")) {
    label.textContent = state.fileName;
  }
}

/**
 * Repaint one scene's own surface. Scenes that classify the document into
 * blocks (zoom, agent) own their DOM; a global repaint would swap the nodes
 * out from under them, so they never call this — they re-render themselves.
 */
export function repaintSurface(surface: HTMLElement | null | undefined): void {
  if (!surface) return;
  surface.innerHTML = renderSampleMarkdown(doc.current.text);
}

export function initDrop(): void {
  const veil = document.createElement("div");
  veil.className = "drop-veil";
  veil.setAttribute("aria-hidden", "true");
  veil.innerHTML = '<p>Drop it. Nothing uploads — this page has no server.</p>';

  let depth = 0;
  const showVeil = (): void => {
    if (!veil.isConnected) document.body.append(veil);
    requestAnimationFrame(() => veil.classList.add("is-open"));
  };
  const hideVeil = (): void => {
    veil.classList.remove("is-open");
    window.setTimeout(() => veil.remove(), 200);
  };

  window.addEventListener(
    "dragenter",
    (event) => {
      if (![...(event.dataTransfer?.types ?? [])].includes("Files")) return;
      event.preventDefault();
      depth += 1;
      showVeil();
    },
  );
  window.addEventListener("dragover", (event) => {
    if ([...(event.dataTransfer?.types ?? [])].includes("Files")) event.preventDefault();
  });
  window.addEventListener("dragleave", () => {
    depth = Math.max(0, depth - 1);
    if (depth === 0) hideVeil();
  });
  window.addEventListener("drop", async (event) => {
    if (!event.dataTransfer?.files.length) return;
    event.preventDefault();
    depth = 0;
    hideVeil();
    const file = [...event.dataTransfer.files].find((candidate) => ACCEPT.test(candidate.name) || candidate.type === "text/markdown");
    if (file) await ingest(file);
  });

  window.addEventListener("paste", (event) => {
    const text = event.clipboardData?.getData("text/plain");
    if (!text || !looksLikeMarkdown(text)) return;
    doc.replaceFile(text, "pasted.md");
    repaintDocumentSurfaces();
  });
}

function looksLikeMarkdown(text: string): boolean {
  return /(^|\n)\s*(#{1,6}\s|[-*]\s|\d+\.\s|```|\|)/.test(text);
}
