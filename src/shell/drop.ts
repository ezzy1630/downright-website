/**
 * Drop or paste your own Markdown: drag any .md over the page and the ground
 * dims, the hero window opens as a target — "Drop it. Nothing uploads — this
 * page has no server." — and the file becomes the living document everywhere.
 * Paste works too. Raw HTML inside the file never renders: the payload
 * renderer escapes everything on its way through.
 */

import { doc } from "../kernel/store";
import { renderSampleMarkdown } from "../kernel/renderer";
import { toast } from "./toast";

const ACCEPT = /\.(md|markdown|mdown|mkd|mdx|mdc|qmd|rmd)$/i;

function isMarkdownFile(file: File): boolean {
  return ACCEPT.test(file.name) || file.type === "text/markdown";
}

async function ingest(file: File): Promise<boolean> {
  if (!isMarkdownFile(file)) return false;
  const text = await file.text();
  doc.replaceFile(text, file.name);
  repaintDocumentSurfaces();
  return true;
}

/**
 * Repaint the traveling window's read layer and the file labels. The zoom
 * surface owns its own DOM (it classifies blocks), so it re-renders itself
 * through the store subscription it already holds.
 */
export function repaintDocumentSurfaces(): void {
  const state = doc.current;
  const surface = document.querySelector<HTMLElement>("[data-document-read] [data-static-document]");
  if (surface) surface.innerHTML = renderSampleMarkdown(state.text);
  for (const label of document.querySelectorAll<HTMLElement>("[data-file-label]")) {
    label.textContent = state.fileName;
  }
}

export function initDrop(): void {
  const veil = document.createElement("div");
  veil.className = "drop-veil";
  veil.setAttribute("aria-hidden", "true");
  veil.innerHTML = '<p>Drop a Markdown file. Nothing uploads — this page has no server.</p>';

  const setVeilCopy = (valid: boolean | null): void => {
    const message = valid === false
      ? "Markdown only. Drop a .md file or supported Markdown document."
      : "Drop a Markdown file. Nothing uploads — this page has no server.";
    const paragraph = veil.querySelector("p");
    if (paragraph) paragraph.textContent = message;
  };

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
      const files = [...(event.dataTransfer?.files ?? [])];
      setVeilCopy(files.length ? files.some(isMarkdownFile) : null);
      depth += 1;
      showVeil();
    },
  );
  window.addEventListener("dragover", (event) => {
    if (![...(event.dataTransfer?.types ?? [])].includes("Files")) return;
    event.preventDefault();
    const files = [...(event.dataTransfer?.files ?? [])];
    setVeilCopy(files.length ? files.some(isMarkdownFile) : null);
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
    const files = [...event.dataTransfer.files];
    const file = files.find(isMarkdownFile);
    if (file) {
      await ingest(file);
    } else {
      toast("<strong>Markdown only.</strong><span>Drop a .md file or supported Markdown document.</span>");
    }
  });

  window.addEventListener("paste", (event) => {
    if (isEditableTarget(event.target)) return;
    const text = event.clipboardData?.getData("text/plain");
    if (!text || !looksLikeMarkdown(text)) return;
    doc.replaceFile(text, "pasted.md");
    repaintDocumentSurfaces();
  });
}

function isEditableTarget(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest("input, textarea, select, [contenteditable], .cm-editor"));
}

function looksLikeMarkdown(text: string): boolean {
  return /(^|\n)\s*(#{1,6}\s|[-*]\s|\d+\.\s|```|\|)/.test(text);
}
