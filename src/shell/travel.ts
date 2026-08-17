/**
 * The traveling window — the Living Document made literal. Exactly one app
 * window exists on the page. It starts in the hero (prerendered, the LCP),
 * and as the visitor scrolls it FLIP-morphs between the acts that want it:
 * hero → gap → agent → themes, docking as a compact live document between
 * owned acts. In the gap it poses as macOS's plain Quick
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
import { springScrollTo } from "../motion/scroll";
import { toast } from "../shell/toast";

export type SlotId = "hero" | "gap" | "agent" | "theme" | "dock";

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
      {
        // The dock is not claimed by any section (empty section id): it is
        // where the window parks between owned acts so the journey never
        // leaves the visitor. resolveActive never returns it.
        id: "dock",
        section: "",
        host: () => document.querySelector<HTMLElement>("[data-window-dock]"),
      },
    ];
    this.paintStore();
    doc.subscribe(() => this.paintStore());
    window.addEventListener("resize", () => this.snapToCurrent(), { passive: true });
    this.wireDockControls();
  }

  /* ── The dock: a real mini window, not a shrunken prop ───────────────────
     The lights work in this state — close dismisses the dock until the next
     act, minimise folds it to the title bar, zoom opens a readable document
     pane — and the face carries a minimap of the document's skeleton plus a
     journey caption instead of unreadable micro-prose. */

  private dockHost(): HTMLElement | null {
    return document.querySelector<HTMLElement>("[data-window-dock]");
  }

  private lightBars(): HTMLElement[] {
    return [...(this.window.querySelector(".traffic-lights")?.querySelectorAll<HTMLElement>("i") ?? [])];
  }

  private wireDockControls(): void {
    const labels = ["Dismiss until the next act", "Minimise", "Zoom"];
    const act = (index: number): void => {
      if (this.current !== "dock") return;
      const dock = this.dockHost();
      if (!dock) return;
      if (index === 0) {
        dock.classList.add("is-dismissed");
        toast("<strong>Window dismissed.</strong><span>It rejoins the story at the next act.</span>");
      } else if (index === 1) {
        dock.classList.toggle("is-collapsed");
        dock.classList.remove("is-zoomed");
        delete this.window.dataset.dockZoom;
      } else if (index === 2) {
        const zoomed = dock.classList.toggle("is-zoomed");
        dock.classList.remove("is-collapsed");
        if (zoomed) this.window.dataset.dockZoom = "true";
        else delete this.window.dataset.dockZoom;
      }
    };
    this.window.querySelector(".traffic-lights")?.addEventListener("click", (event) => {
      const bar = (event.target as Element | null)?.closest("i");
      if (!bar) return;
      event.stopPropagation();
      act(this.lightBars().indexOf(bar));
    });
    this.window.querySelector(".traffic-lights")?.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      const index = this.lightBars().indexOf(event.target as HTMLElement);
      if (index < 0) return;
      event.preventDefault();
      event.stopPropagation();
      act(index);
    });
    void labels;
  }

  /** The lights become real controls while docked; plain chrome elsewhere. */
  private paintDockControls(on: boolean): void {
    const labels = ["Dismiss the docked window until the next act", "Minimise the docked window", "Zoom the docked window"];
    this.lightBars().forEach((bar, index) => {
      if (on) {
        bar.setAttribute("role", "button");
        bar.setAttribute("aria-label", labels[index] ?? "Window control");
        bar.setAttribute("title", labels[index] ?? "");
        bar.tabIndex = 0;
      } else {
        bar.removeAttribute("role");
        bar.removeAttribute("aria-label");
        bar.removeAttribute("title");
        bar.removeAttribute("tabindex");
      }
    });
  }

  /** Dress the dock face: the document's skeleton and the journey caption. */
  private dressDockFace(): void {
    const minimap = this.window.querySelector<HTMLElement>("[data-minimap]");
    if (minimap && !minimap.childElementCount) {
      const rows = doc.current.text.split("\n").map((line) => line.trim()).filter(Boolean).slice(0, 44);
      minimap.replaceChildren(...rows.map((line) => {
        const bar = document.createElement("i");
        bar.dataset.kind = line.startsWith("#") ? "h"
          : line.startsWith("```") ? "c"
          : line.startsWith(">") ? "q"
          : line.startsWith("- ") || line.startsWith("* ") || /^\d+\./.test(line) ? "l"
          : "p";
        bar.style.setProperty("--w", `${Math.round(Math.min(100, Math.max(16, line.length * 1.6)))}%`);
        return bar;
      }));
    }
    const caption = this.window.querySelector<HTMLElement>("[data-dock-caption]");
    if (!caption) return;
    const pending = doc.current.agent !== "idle";
    const next = this.slots.find((slot) => {
      if (!slot.section) return false;
      const section = document.getElementById(slot.section);
      return !!section && section.offsetTop > window.scrollY + window.innerHeight * 0.5;
    });
    const label = next ? (document.getElementById(next.section)?.dataset.sectionLabel ?? null) : null;
    caption.classList.toggle("is-alert", pending);
    const key = `${pending ? "pending" : "following"}|${label ?? "end"}`;
    if (caption.dataset.key === key) return;
    caption.dataset.key = key;
    caption.replaceChildren();
    const strong = document.createElement("strong");
    strong.textContent = pending ? "external write" : "following";
    const span = document.createElement("span");
    span.textContent = pending
      ? "review pending · click to return"
      : label
        ? `next: ${label} · click to jump`
        : "the story ends here · click for the top";
    caption.append(strong, span);
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
    // An explicitly requested face (the architecture act's Document/Source
    // hand-off) rides the flight and survives the arrival.
    const viewLock = this.window.dataset.viewLock;
    this.window.dataset.view = viewLock ?? (target === "hero" ? "split" : "document");
    if (viewLock) {
      this.window.style.setProperty("--segment-index", String(["document", "split", "source"].indexOf(viewLock)));
      for (const button of this.window.querySelectorAll<HTMLButtonElement>("[data-view-button]")) {
        button.setAttribute("aria-selected", String(button.dataset.viewButton === viewLock));
      }
      delete this.window.dataset.viewLock;
    }

    // The gap receives the window as macOS's plain preview sheet; the sweep
    // promotes it to full chrome as the render line passes. Every other slot
    // gets the window's own chrome back.
    if (target === "gap") {
      this.window.dataset.chrome = "ql";
    } else if (target === "dock") {
      this.window.dataset.chrome = "dock";
      this.paintDockControls(true);
      this.dressDockFace();
    } else {
      this.paintDockControls(false);
      const dock = this.dockHost();
      dock?.classList.remove("is-collapsed", "is-zoomed", "is-dismissed");
      delete this.window.dataset.dockZoom;
      // The agent scene wears its own chrome and can win the race against
      // this arrival (the observer fires on the same scroll); never strip it
      // on the way INTO the agent act. Leaving for any other slot clears it.
      if (!(target === "agent" && this.window.dataset.chrome === "agent")) {
        delete this.window.dataset.chrome;
      }
    }

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

    // The afterimage: on real flights, two accent outlines trail the window,
    // each chasing the same geometry on slower springs. Pure decoration —
    // the screen-record bait — removed the moment the flight ends.
    const ghosts: HTMLElement[] = [];
    if (distance > 260) {
      for (let index = 0; index < 2; index++) {
        const ghost = document.createElement("div");
        ghost.className = "window-ghost";
        ghost.style.setProperty("--ghost-opacity", (0.24 - index * 0.09).toFixed(2));
        document.body.append(ghost);
        ghosts.push(ghost);
      }
    }
    const ghostSprings = ghosts.map((_, index) => {
      const duration = positionDuration * (1.45 + index * 0.45);
      const gx = new SpringScalar(dx, duration, 0.16);
      const gy = new SpringScalar(dy, duration, 0.16);
      const gw = new SpringScalar(before.width, duration, 0.08);
      const gh = new SpringScalar(before.height, duration, 0.08);
      gx.setTarget(0);
      gy.setTarget(0);
      gw.setTarget(after.width);
      gh.setTarget(after.height);
      return { gx, gy, gw, gh };
    });
    const scrollAtLaunch = window.scrollY;
    const releaseGhosts = (): void => {
      for (const ghost of ghosts) {
        ghost.style.opacity = "0";
        window.setTimeout(() => ghost.remove(), 240);
      }
      ghosts.length = 0;
    };

    const settle = (): void => {
      this.cancelFlight = null;
      this.flying = false;
      delete this.window.dataset.flying;
      this.window.style.translate = "";
      this.window.style.width = "";
      this.window.style.height = "";
      if (clipped) clipped.style.overflow = previousOverflow;
      releaseGhosts();
    };

    const cancel = ticker.add((dt) => {
      // Advance every spring before OR-ing: `a.advance(dt) || b.advance(dt)`
      // short-circuits and freezes b for as long as a is still moving — the
      // flight stalls on one axis (the y spring sat at its origin forever).
      const movingPx = px.advance(dt);
      const movingPy = py.advance(dt);
      const movingW = w.advance(dt);
      const movingH = h.advance(dt);
      const movingArc = arc.advance(dt);
      const lift = Math.sin(CLAMP(arc.value, 0, 1) * Math.PI) * arcPx;
      this.window.style.translate = `${px.value.toFixed(2)}px ${(py.value - lift).toFixed(2)}px`;
      this.window.style.width = `${w.value.toFixed(2)}px`;
      this.window.style.height = `${h.value.toFixed(2)}px`;
      // Ghosts fly in viewport space; the window flies in document space, so
      // any scroll during the flight is folded back in. They fade once they
      // have caught up, while the window may still be settling.
      const scrolled = window.scrollY - scrollAtLaunch;
      let ghostsMoving = false;
      for (let index = 0; index < ghosts.length; index++) {
        const ghost = ghosts[index];
        const springs = ghostSprings[index];
        ghostsMoving = springs.gx.advance(dt) || ghostsMoving;
        ghostsMoving = springs.gy.advance(dt) || ghostsMoving;
        ghostsMoving = springs.gw.advance(dt) || ghostsMoving;
        ghostsMoving = springs.gh.advance(dt) || ghostsMoving;
        ghost.style.left = `${(after.left + springs.gx.value).toFixed(1)}px`;
        ghost.style.top = `${(after.top + springs.gy.value - scrolled).toFixed(1)}px`;
        ghost.style.width = `${springs.gw.value.toFixed(1)}px`;
        ghost.style.height = `${springs.gh.value.toFixed(1)}px`;
      }
      if (!ghostsMoving && ghosts.length) releaseGhosts();
      if (!(movingPx || movingPy || movingW || movingH || movingArc)) settle();
      return movingPx || movingPy || movingW || movingH || movingArc;
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
    const dockHost = document.querySelector<HTMLElement>("[data-window-dock]");
    const closeSection = document.getElementById("close");

    /** A slot is on stage while its host crosses the viewport's middle
     *  band. When the claimed act's stage has left (the wall beat after the
     *  sweep, the dark bands between agent and themes), the window docks
     *  instead of parking somewhere invisible — the journey never breaks. */
    const slotOnStage = (id: SlotId): boolean => {
      const slot = this.slots.find((candidate) => candidate.id === id);
      const host = slot?.host();
      if (!host) return false;
      const rect = host.getBoundingClientRect();
      return rect.top < window.innerHeight * 0.78 && rect.bottom > window.innerHeight * 0.22;
    };

    const jumpFromDock = (): void => {
      const ahead = this.slots.find((slot) => {
        if (!slot.section) return false;
        const section = document.getElementById(slot.section);
        return !!section && section.offsetTop > window.scrollY + window.innerHeight * 0.5;
      });
      const section = ahead ? document.getElementById(ahead.section) : null;
      if (section) springScrollTo(section.offsetTop - 72, 480);
      else springScrollTo(0, 520);
    };
    this.window.addEventListener("click", () => {
      // Zoomed, the dock is a reader — let them scroll the document in peace.
      if (this.current === "dock" && this.window.dataset.dockZoom !== "true") jumpFromDock();
    });
    this.window.addEventListener("keydown", (event) => {
      if (this.current !== "dock") return;
      if (event.key === "Enter" && this.window.dataset.dockZoom !== "true") jumpFromDock();
      if (event.key === "Escape") this.dockHost()?.classList.add("is-dismissed");
    });

    const settle = (): void => {
      if (!ticking) return;
      ticking = false;
      const active = this.resolveActive();
      if (active !== this.current) this.moveTo(active);
      // Re-check AFTER the move: an instant jump can teleport into a slot
      // whose stage is already gone (hero → far below in one scroll), and
      // no further settle fires until the next scroll event. The dock must
      // engage in this same pass.
      if (this.current === active && active !== "dock" && !slotOnStage(active)) this.moveTo("dock");
      if (this.current === "dock") this.dressDockFace();
      // Over the close act the story ends: the docked window retires instead
      // of hovering over the footer.
      if (dockHost) {
        dockHost.classList.toggle(
          "is-retired",
          this.current === "dock" && !!closeSection && closeSection.offsetTop <= window.scrollY + window.innerHeight * 0.9,
        );
      }
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
