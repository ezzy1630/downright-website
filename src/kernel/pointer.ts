/**
 * Pointer velocity tracking from coalesced events. Feeds flicks (verlet file
 * cards, divider), magnetism amplitude, and velocity-aware stagger pacing.
 */

export interface PointerVelocity {
  x: number;
  y: number;
  speed: number;
}

export class PointerTracker {
  private lastX = 0;
  private lastY = 0;
  private lastTime = 0;
  private vx = 0;
  private vy = 0;

  /** Coalesced pointer events give sub-frame samples; average them. */
  update(event: PointerEvent): PointerVelocity {
    const events = typeof event.getCoalescedEvents === "function" ? event.getCoalescedEvents() : [event];
    for (const point of events.length ? events : [event]) {
      const time = point.timeStamp / 1000;
      if (this.lastTime && time > this.lastTime) {
        const dt = time - this.lastTime;
        this.vx = (point.clientX - this.lastX) / dt;
        this.vy = (point.clientY - this.lastY) / dt;
      }
      this.lastX = point.clientX;
      this.lastY = point.clientY;
      this.lastTime = time;
    }
    return this.velocity;
  }

  get velocity(): PointerVelocity {
    return { x: this.vx, y: this.vy, speed: Math.hypot(this.vx, this.vy) };
  }
}

let scrollSample = 0;
let scrollLastY = window.scrollY;
let scrollLastTime = 0;

window.addEventListener(
  "scroll",
  () => {
    const now = performance.now();
    const y = window.scrollY;
    if (scrollLastTime && now > scrollLastTime) {
      const sample = (y - scrollLastY) / ((now - scrollLastTime) / 1000);
      scrollSample = scrollSample * 0.7 + sample * 0.3;
    }
    scrollLastY = y;
    scrollLastTime = now;
  },
  { passive: true },
);

/** Smoothed scroll speed in px/s, decaying to zero after scrolling stops. */
export function scrollSpeed(): number {
  const idle = performance.now() - scrollLastTime;
  return idle > 120 ? 0 : Math.abs(scrollSample) * Math.exp(-idle / 200);
}
