/**
 * Window modes — the app's real adaptive surface, stated visibly.
 *
 *   Document · Split · Source
 *
 * One segmented control, three labelled segments, and ⌘⇧E as a shortcut to
 * Source. There is deliberately no hidden gesture: the old build toggled the
 * source face on double-click, which no visitor would ever discover and which
 * was the only path to a headline feature. Standing rule — every affordance
 * is visibly labelled, and a shortcut is never the sole route to a behaviour.
 */

import { doc } from "../kernel/store";
import { sound } from "../kernel/sound";

export type WindowView = "document" | "split" | "source";

const ORDER: WindowView[] = ["document", "split", "source"];

export function windowView(windowEl: HTMLElement): WindowView {
  const value = windowEl.dataset.view;
  return ORDER.includes(value as WindowView) ? (value as WindowView) : "document";
}

export function setWindowView(windowEl: HTMLElement, view: WindowView): void {
  if (windowView(windowEl) === view) return;
  windowEl.dataset.view = view;
  const index = ORDER.indexOf(view);
  windowEl.style.setProperty("--segment-index", String(index));
  paintTabs(windowEl, view);
  sound.whoosh();
}

/** The full tabs pattern: selected segment is the tab stop, its siblings are
 *  reachable by arrow keys (selection follows focus, automatic activation). */
function paintTabs(windowEl: HTMLElement, view: WindowView): void {
  for (const button of windowEl.querySelectorAll<HTMLButtonElement>("[data-view-button]")) {
    const selected = button.dataset.viewButton === view;
    button.setAttribute("aria-selected", String(selected));
    button.tabIndex = selected ? 0 : -1;
  }
}

/** ⌘⇧E toggles Source against whatever mode the window was showing. */
export function initFlip(): void {
  let previous: WindowView = "split";
  window.addEventListener("keydown", (event) => {
    if (!(event.metaKey || event.ctrlKey) || !event.shiftKey) return;
    if (event.key.toLowerCase() !== "e") return;
    const windowEl = document.querySelector<HTMLElement>("[data-window]");
    if (!windowEl) return;
    event.preventDefault();
    const current = windowView(windowEl);
    if (current === "source") setWindowView(windowEl, previous);
    else {
      previous = current;
      setWindowView(windowEl, "source");
    }
  });

  // The source pane is prerendered; once the editor mounts, CM6 owns it and
  // the store keeps the two in step. Nothing else to mirror.
  void doc;
}

export function initWindowControls(): void {
  for (const windowEl of document.querySelectorAll<HTMLElement>("[data-window]")) {
    windowEl.style.setProperty("--segment-index", String(ORDER.indexOf(windowView(windowEl))));
    paintTabs(windowEl, windowView(windowEl));
    for (const button of windowEl.querySelectorAll<HTMLButtonElement>("[data-view-button]")) {
      button.addEventListener("click", () => {
        const view = button.dataset.viewButton as WindowView;
        if (ORDER.includes(view)) setWindowView(windowEl, view);
      });
    }
    // Arrow keys walk the tablist; selection follows focus and activates.
    const segmented = windowEl.querySelector<HTMLElement>(".app-window__segmented");
    segmented?.addEventListener("keydown", (event) => {
      const tabs = [...segmented.querySelectorAll<HTMLButtonElement>("[data-view-button]")];
      const current = tabs.findIndex((tab) => tab.dataset.viewButton === windowView(windowEl));
      let next = -1;
      if (event.key === "ArrowRight") next = (current + 1) % tabs.length;
      else if (event.key === "ArrowLeft") next = (current - 1 + tabs.length) % tabs.length;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = tabs.length - 1;
      if (next < 0 || !tabs[next]) return;
      event.preventDefault();
      tabs[next].focus();
      const view = tabs[next].dataset.viewButton as WindowView;
      if (ORDER.includes(view)) setWindowView(windowEl, view);
    });
  }
}
