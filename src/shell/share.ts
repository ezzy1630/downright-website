/**
 * Handoff without a server: navigator.share where it exists (on iOS the
 * share sheet's first target is AirDrop — the page opens on the Mac with the
 * download button waiting), copy-link and prefilled mailto elsewhere. No
 * URL shortener, no social pixel, no network request at all.
 */

import { toast } from "./toast";

export interface ShareTargets {
  title: string;
  text: string;
}

export function initShare(): void {
  for (const button of document.querySelectorAll<HTMLButtonElement>("[data-share]")) {
    button.addEventListener("click", async () => {
      const kind = button.dataset.share;
      const url = window.location.href.split("#")[0];
      const payload: ShareTargets = {
        title: "Downright — the native Markdown app for macOS",
        text: "Downright renders Markdown exactly, reviews agent writes live, and never touches your bytes.",
      };
      if (kind === "share" && typeof navigator.share === "function") {
        try {
          await navigator.share({ ...payload, url });
          return;
        } catch {
          /* user dismissed the sheet; nothing to do */
        }
      }
      if (kind === "copy" || (kind === "share" && typeof navigator.share !== "function")) {
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

function note(button: HTMLButtonElement, text: string): void {
  const label = button.dataset.shareLabel ?? button.textContent ?? "";
  button.textContent = text;
  window.setTimeout(() => {
    button.textContent = label;
  }, 1600);
}
