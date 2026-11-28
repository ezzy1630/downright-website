/** Native sharing with a clipboard fallback and an explicit email option. */

import { toast } from "./toast";

export interface ShareTargets {
  title: string;
  text: string;
}

export function initShare(): void {
  for (const button of document.querySelectorAll<HTMLButtonElement>("[data-share]")) {
    button.dataset.shareLabel = button.textContent ?? "";
    button.addEventListener("click", async () => {
      const kind = button.dataset.share;
      const page = new URL(window.location.href);
      page.hash = "";
      page.searchParams.delete("film");
      const url = page.href;
      const payload: ShareTargets = {
        title: "Downright — the native Markdown app for macOS",
        text: "Downright renders Markdown exactly, reviews agent writes live, and never touches your bytes.",
      };
      if (kind === "share" && typeof navigator.share === "function") {
        try {
          await navigator.share({ ...payload, url });
          return;
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") return;
        }
      }
      if (kind === "copy" || kind === "share") {
        if (!navigator.clipboard) {
          note(button, "Copy unavailable");
          toast("<strong>Copy link unavailable.</strong><span>Use your browser's address bar instead.</span>");
          return;
        }
        try {
          await navigator.clipboard.writeText(url);
          note(button, "Link copied");
        } catch {
          note(button, "Copy failed");
          toast("<strong>Copy link failed.</strong><span>Use your browser's address bar instead.</span>");
        }
        return;
      }
      if (kind === "mail") {
        window.location.href = `mailto:?subject=${encodeURIComponent(payload.title)}&body=${encodeURIComponent(`${payload.text}\n\n${url}`)}`;
      }
    });
  }
}

const noteTimers = new WeakMap<HTMLButtonElement, number>();

function note(button: HTMLButtonElement, text: string): void {
  const label = button.dataset.shareLabel ?? button.textContent ?? "";
  button.textContent = text;
  window.clearTimeout(noteTimers.get(button));
  noteTimers.set(button, window.setTimeout(() => {
    button.textContent = label;
    noteTimers.delete(button);
  }, 1600));
}
