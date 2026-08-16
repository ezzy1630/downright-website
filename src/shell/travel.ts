/**
 * The traveling window — the Living Document made literal. Exactly one app
 * window exists on the page. It starts in the hero (prerendered, the LCP),
 * and as the visitor scrolls it FLIP-morphs between the acts that want it:
 * hero → gap → agent → themes. In the gap it poses as macOS's plain Quick
 * Look sheet (data-chrome="ql") and grows its full chrome back as the render
 * line passes — the sweep scene owns that morph. The window is a single DOM
 * node, so the editor, the undo stack, and the caret all survive the journey,
 * and every act renders the same bytes from the kernel store — no static
 * duplicates, ever.
 *
 * Flight rules:
 *  - First (before moving), Last (after re-parenting), Invert, Play — sprung
 *    on the app's own closed-form integrator, as a true rect morph: the
 *    window translates AND genuinely resizes, so content keeps its
 *    proportions the whole flight (a scale FLIP would stretch the text).
 *  - Position springs lead with a whisper of overshoot; size springs trail
 *    heavier; a ballistic arc lifts the flight off the straight line; the
 *    shadow deepens for the trip (data-flying) and settles on landing.
 *  - Reduced motion = teleport. The window lands in its slot with no travel.
 *  - Only the hero slot is editable. Every other slot forces read mode.
 */

import { MOTION, SpringScalar } from "../kernel/springs";
import { ticker } from "../kernel/ticker";
import { reducedMotion } from "../kernel/switchboard";
import { doc } from "../kernel/store";
import { renderSampleMarkdown } from "../data/site";

export type SlotId = "hero" | "gap" | "agent" | "theme";

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

/**
 * Flight timing. Distance-driven like a spring scroll, but floored higher:
 * a window is heavy, and a 150ms hop reads as a snap-cut, not a travel. The
 * ceiling stays short of half a second even for cross-page flights.
 */
function flightDuration(distance: number): number {
  return CLAMP(0.0125 * Math.sqrt(distance), 0.26, 0.6);
}

export class WindowDirector {
  readonly window: HTMLElement;
  private readonly slots: Slot[];
  private current: SlotId | null = null;
  private flying = false;
  private cancelFlight: (() => void) | null = null;

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
        id: "gap",
        section: "gap",
        host: () => document.querySelector<HTMLElement>("[data-window-slot=gap]"),
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
    // repaint erases them. The gap scene owns it the same way: its two-state
    // blocks (raw | rendered halves stacked) live in the read layer, and the
    // sweep rebuilds them itself through the store subscription.
    const agentOwns = doc.current.agent !== "idle" && this.current === "agent";
    const gapOwns = this.current === "gap";
    if (!agentOwns && !gapOwns) {
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
    this.cancelFlight?.();
    this.cancelFlight = null;
    this.flying = false;
    delete this.window.dataset.flying;
    this.window.style.translate = "";
    this.window.style.width = "";
    this.window.style.height = "";
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

    // The gap receives the window as macOS's plain preview sheet; the sweep
    // promotes it to full chrome as the render line passes. Every other slot
    // gets the window's own chrome back.
    if (target === "gap") this.window.dataset.chrome = "ql";
    else delete this.window.dataset.chrome;

    // Every arrival opens at the top of the document.
    const read = this.window.querySelector<HTMLElement>("[data-document-read]");
    if (read) read.scrollTop = 0;

    // A fresh document arrival always shows read mode unless it is the hero
    // and the visitor already mounted the editor there.
    if (target !== "hero") this.setMode("read");
    else if (this.window.querySelector<HTMLElement>("[data-document-editor]")?.dataset.editorMounted === "true") {
      this.setMode("edit");
    }

    // First: capture the flight origin (includes any in-flight state, so a
    // reverse claim mid-air simply bends the flight, never snaps).
    const before = this.window.getBoundingClientRect();
    const wasVisible = before.bottom > -80 && before.top < window.innerHeight + 80;

    // Last: re-parent.
    const anchor = slot.before?.() ?? null;
    if (anchor) host.insertBefore(this.window, anchor);
    else host.append(this.window);
    this.window.dataset.slot = target;

    // Invert + Play — a true rect morph, not a scale FLIP. The window glides
    // and genuinely resizes, exactly like a native window finding its new
    // context: content keeps its proportions (no stretched text), the
    // position springs lead with a whisper of overshoot, the size springs
    // trail slightly heavier, and a ballistic arc lifts the flight off the
    // straight line between slots. Perceptual, physical, never bouncy.
    const after = this.window.getBoundingClientRect();
    const dx = before.left - after.left;
    const dy = before.top - after.top;
    const dw = before.width - after.width;
    const dh = before.height - after.height;
    const noDelta = Math.abs(dx) < 1 && Math.abs(dy) < 1 && Math.abs(dw) < 1 && Math.abs(dh) < 1;

    if (reducedMotion() || !wasVisible || noDelta) {
      this.window.style.translate = "";
      this.window.style.width = "";
      this.window.style.height = "";
      return;
    }

    // Lift the slot's clip so the window is never clipped mid-flight.
    const clipped = host.closest<HTMLElement>(".render-document-viewport, .agent-stage__document, .sweep");
    const previousOverflow = clipped?.style.overflow ?? "";
    if (clipped) clipped.style.overflow = "visible";

    const distance = Math.max(Math.abs(dx), Math.abs(dy), Math.abs(dw), Math.abs(dh) * 0.6);
    const positionDuration = flightDuration(distance);
    const sizeDuration = positionDuration * 1.16;
    const arcPx = CLAMP(distance * 0.055, 6, 30);

    // Freeze the origin inline (position via translate, size via box), then
    // spring everything to the slot's own geometry.
    this.window.style.width = `${before.width.toFixed(2)}px`;
    this.window.style.height = `${before.height.toFixed(2)}px`;
    this.window.style.translate = `${dx.toFixed(2)}px ${dy.toFixed(2)}px`;

    const px = new SpringScalar(dx, positionDuration, 0.16);
    const py = new SpringScalar(dy, positionDuration, 0.16);
    const w = new SpringScalar(before.width, sizeDuration, 0.08);
    const h = new SpringScalar(before.height, sizeDuration, 0.08);
    const arc = new SpringScalar(0, positionDuration * 0.92, 0);
    px.setTarget(0);
    py.setTarget(0);
    w.setTarget(after.width);
    h.setTarget(after.height);
    arc.setTarget(1);

    // A new claim replaces this flight wholesale (see moveTo entry), so the
    // previous job must never keep writing geometry.
    this.cancelFlight?.();
    this.flying = true;
    this.window.dataset.flying = "";

    const settle = (): void => {
      this.cancelFlight = null;
      this.flying = false;
      delete this.window.dataset.flying;
      this.window.style.translate = "";
      this.window.style.width = "";
      this.window.style.height = "";
      if (clipped) clipped.style.overflow = previousOverflow;
    };

    const cancel = ticker.add((dt) => {
      const moving = px.advance(dt) || py.advance(dt) || w.advance(dt) || h.advance(dt) || arc.advance(dt);
      const lift = Math.sin(CLAMP(arc.value, 0, 1) * Math.PI) * arcPx;
      this.window.style.translate = `${px.value.toFixed(2)}px ${(py.value - lift).toFixed(2)}px`;
      this.window.style.width = `${w.value.toFixed(2)}px`;
      this.window.style.height = `${h.value.toFixed(2)}px`;
      if (!moving) settle();
      return moving;
    });
    this.cancelFlight = () => {
      cancel();
      settle();
    };
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
    this.cancelFlight?.();
    this.cancelFlight = null;
  }
}

let director: WindowDirector | null = null;

export function initTravel(): void {
  if (document.documentElement.dataset.film === "true") return;
  const windowEl = document.querySelector<HTMLElement>("[data-editor-window]");
  if (!windowEl) return;
  director = new WindowDirector(windowEl);
  director.start();
}

export function travelDirector(): WindowDirector | null {
  return director;
}
