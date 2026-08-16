/**
 * The traveling window — the Living Document made literal. Exactly one app
 * window exists on the page. It starts in the hero (prerendered, the LCP),
 * and as the visitor scrolls it FLIP-morphs between the acts that want it:
 * hero → agent → themes. The window is a single DOM node, so
 * the editor, the undo stack, and the caret all survive the journey, and
 * every act renders the same bytes from the kernel store — no static
 * duplicates, ever.
 *
 * Flight rules:
 *  - First (before moving), Last (after re-parenting), Invert, Play — the
 *    classic FLIP, sprung on the app's own closed-form integrator.
 *  - The fly uses translate + scale only (compositor-friendly); the slot's
 *    overflow is lifted for the duration so the window is never clipped
 *    mid-flight, then restored.
 *  - Reduced motion = teleport. The window lands in its slot with no travel.
 *  - Only the hero slot is editable. Every other slot forces read mode.
 */

import { MOTION, SpringScalar } from "../kernel/springs";
import { ticker } from "../kernel/ticker";
import { reducedMotion } from "../kernel/switchboard";
import { doc } from "../kernel/store";
import { renderSampleMarkdown } from "../data/site";

export type SlotId = "hero" | "agent" | "theme";

interface Slot {
  id: SlotId;
  /** The section whose scroll position claims the slot. */
  section: string;
  /** The element the window is re-parented into. */
  host: () => HTMLElement | null;
  /** Where in the host to insert (before this element, if present). */
  before?: () => HTMLElement | null;
}

const CLAMP = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

function springDuration(distance: number): number {
  return CLAMP(0.0115 * Math.sqrt(distance), 0.18, 0.55);
}

export class WindowDirector {
  readonly window: HTMLElement;
  private readonly slots: Slot[];
  private current: SlotId | null = null;
  private flying = false;
  private observer: IntersectionObserver | null = null;

  constructor(windowEl: HTMLElement) {
    this.window = windowEl;
    this.slots = [
      {
        id: "hero",
        section: "hero",
        host: () => document.querySelector<HTMLElement>(".hero__window"),
        before: () => document.querySelector<HTMLElement>(".hero__annotation"),
      },
      {
        id: "agent",
        section: "agent",
        host: () => document.querySelector<HTMLElement>("[data-window-slot=agent]"),
      },
      {
        id: "theme",
        section: "themes",
        host: () => document.querySelector<HTMLElement>("[data-window-slot=theme]"),
      },
    ];
    this.paintStore();
    doc.subscribe(() => this.paintStore());
    window.addEventListener("resize", () => this.snapToCurrent(), { passive: true });
  }

  get activeSlot(): SlotId {
    return this.current ?? "hero";
  }

  /** The read layer: the rendered document every non-hero act shows. */
  private readLayer(): HTMLElement | null {
    return this.window.querySelector<HTMLElement>("[data-document-read] [data-static-document]");
  }

  /** Re-render the read layer + file labels from the store. */
  private paintStore(): void {
    // In the hero the window is SPLIT: the source pane is the editor and the
    // document pane sits beside it, so it repaints on every keystroke — that
    // live coupling is the whole demonstration.
    //
    // The one exception: the agent scene owns the read layer while the reader
    // is in its act and the visit is not idle — mid-rewrite AND after it
    // resolves, since the word-level change marks live in that markup and a
    // repaint erases them.
    const agentOwns = doc.current.agent !== "idle" && this.current === "agent";
    if (!agentOwns) {
      const surface = this.readLayer();
      if (surface) surface.innerHTML = renderSampleMarkdown(doc.current.text);
    }
    for (const label of document.querySelectorAll<HTMLElement>("[data-file-label]")) {
      label.textContent = doc.current.fileName;
    }
    const dirtyLabel = this.window.querySelector<HTMLElement>("[data-dirty-label]");
    if (dirtyLabel) dirtyLabel.hidden = !doc.current.dirty;
  }

  /** Determine which slot the viewport currently claims. */
  private resolveActive(): SlotId {
    const reference = window.scrollY + window.innerHeight * 0.45;
    let active: SlotId = "hero";
    for (const slot of this.slots) {
      const section = document.getElementById(slot.section);
      // A hidden section (display:none — the film hides the themes act) still
      // reports offsetTop 0, which would falsely claim every scroll position
      // and strand the window in an invisible slot.
      if (!section || section.offsetParent === null) continue;
      if (section.offsetTop <= reference) active = slot.id;
      else break;
    }
    return active;
  }

  private snapToCurrent(): void {
    const slot = this.slots.find((candidate) => candidate.id === this.current);
    const host = slot?.host();
    if (!host) return;
    this.window.style.transform = "none";
    host.style.overflow = "";
  }

  /** Move the window into a slot and FLIP-morph it there. */
  moveTo(target: SlotId): void {
    if (this.current === target) return;
    const slot = this.slots.find((candidate) => candidate.id === target);
    const host = slot?.host();
    if (!slot || !host) return;

    // Claim the slot BEFORE anything repaints. setMode() below runs a store
    // paint, and if `current` still named the previous slot that paint did not
    // recognise the agent's ownership and wiped its change marks on arrival.
    this.current = target;

    // The hero is the only split slot; every other act receives the same
    // window as a document-only surface, so no two acts repeat a composition.
    this.window.dataset.view = target === "hero" ? "split" : "document";

    // Every arrival opens at the top of the document.
    const read = this.window.querySelector<HTMLElement>("[data-document-read]");
    if (read) read.scrollTop = 0;

    // A fresh document arrival always shows read mode unless it is the hero
    // and the visitor already mounted the editor there.
    if (target !== "hero") this.setMode("read");
    else if (this.window.querySelector<HTMLElement>("[data-document-editor]")?.dataset.editorMounted === "true") {
      this.setMode("edit");
    }

    // First: capture the flight origin.
    const before = this.window.getBoundingClientRect();
    const wasVisible = before.bottom > 0 && before.top < window.innerHeight;

    // Last: re-parent.
    const anchor = slot.before?.() ?? null;
    if (anchor) host.insertBefore(this.window, anchor);
    else host.append(this.window);
    this.window.dataset.slot = target;

    // Invert + Play.
    const after = this.window.getBoundingClientRect();
    const dx = before.left - after.left;
    const dy = before.top - after.top;
    const sx = after.width > 0 ? before.width / after.width : 1;
    const sy = after.height > 0 ? before.height / after.height : 1;

    if (reducedMotion() || !wasVisible || (Math.abs(dx) < 1 && Math.abs(dy) < 1 && Math.abs(sx - 1) < 0.001 && Math.abs(sy - 1) < 0.001)) {
      this.window.style.transform = "none";
      return;
    }

    // Lift the slot's clip so the window is never clipped mid-flight.
    const clipped = host.closest<HTMLElement>(".render-document-viewport, .agent-stage__document");
    const previousOverflow = clipped?.style.overflow ?? "";
    if (clipped) clipped.style.overflow = "visible";

    const distance = Math.max(Math.abs(dx), Math.abs(dy));
    const duration = springDuration(distance);
    const tx = new SpringScalar(dx, duration);
    const ty = new SpringScalar(dy, duration);
    const rx = new SpringScalar(sx, duration);
    const ry = new SpringScalar(sy, duration);
    tx.setTarget(0);
    ty.setTarget(0);
    rx.setTarget(1);
    ry.setTarget(1);
    this.flying = true;
    this.window.style.transformOrigin = "top left";

    ticker.add((dt) => {
      const moving = tx.advance(dt) || ty.advance(dt) || rx.advance(dt) || ry.advance(dt);
      this.window.style.transform = `translate(${tx.value.toFixed(2)}px, ${ty.value.toFixed(2)}px) scale(${rx.value.toFixed(4)}, ${ry.value.toFixed(4)})`;
      if (!moving) {
        this.window.style.transform = "none";
        this.flying = false;
        if (clipped) clipped.style.overflow = previousOverflow;
      }
      return moving;
    });
  }

  setMode(mode: "read" | "edit"): void {
    this.window.dataset.mode = mode;
    if (mode === "read") this.paintStore();
  }

  start(): void {
    // Claim the hero on load (the window already sits there statically).
    this.current = "hero";
    this.window.dataset.slot = "hero";

    // A scroll read shared by the rail, the agent arming, and the pinning
    // stages; throttle through rAF so we read geometry at most once a frame.
    let ticking = false;
    const settle = (): void => {
      if (!ticking) return;
      ticking = false;
      const active = this.resolveActive();
      if (active !== this.current) this.moveTo(active);
    };
    const onScroll = (): void => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(settle);
      // rAF is throttled to zero in background tabs, in low-power mode, and in
      // several in-app webviews. Without this timer a single stalled frame
      // latches `ticking` forever and the window never travels again — the
      // page silently loses its connective tissue.
      window.setTimeout(settle, 250);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    // Deep links and scroll restoration can land before any scroll event.
    requestAnimationFrame(onScroll);
    window.addEventListener("load", onScroll);

    // Redundancy: an IntersectionObserver on each slot's host is not needed
    // for travel (scroll geometry owns it), but a late hash jump to an act
    // still resolves through the rAF + load listeners above.
  }

  destroy(): void {
    this.observer?.disconnect();
  }
}

let director: WindowDirector | null = null;

export function initTravel(): void {
  const windowEl = document.querySelector<HTMLElement>("[data-editor-window]");
  if (!windowEl) return;
  director = new WindowDirector(windowEl);
  director.start();
}

export function travelDirector(): WindowDirector | null {
  return director;
}
