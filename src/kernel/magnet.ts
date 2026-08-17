/**
 * Magnetized controls: interactive elements translate 2–4px toward the
 * pointer on springs and take the iPad-style lift (scale 1.02 + warm shadow),
 * settling on leave. `(pointer: fine)` only; keyboard focus gets the same
 * lift. The real cursor is never hidden or replaced.
 */

import { MOTION, SpringScalar } from "./springs";
import { ticker } from "./ticker";

const MAGNET_RADIUS = 96;
const MAGNET_AMPLITUDE = 4;

interface MagnetState {
  x: SpringScalar;
  y: SpringScalar;
  active: boolean;
}

export function magnetize(root: ParentNode = document): () => void {
  if (!window.matchMedia("(pointer: fine)").matches) return () => undefined;

  const controls = new Map<HTMLElement, MagnetState>();
  let running = false;

  const ensure = (element: HTMLElement): MagnetState => {
    let state = controls.get(element);
    if (!state) {
      state = {
        x: new SpringScalar(0, MOTION.durations.quick),
        y: new SpringScalar(0, MOTION.durations.quick),
        active: false,
      };
      controls.set(element, state);
    }
    return state;
  };

  const run = (): void => {
    if (running) return;
    running = true;
    ticker.add((dt) => {
      let moving = false;
      for (const [element, state] of controls) {
        const movingX = state.x.advance(dt);
        const movingY = state.y.advance(dt);
        const elementMoving = movingX || movingY;
        element.style.setProperty("--magnet-x", `${state.x.value.toFixed(2)}px`);
        element.style.setProperty("--magnet-y", `${state.y.value.toFixed(2)}px`);
        if (elementMoving) moving = true;
        else if (!state.active) controls.delete(element);
      }
      return moving;
    });
  };

  const track = (element: HTMLElement, event: PointerEvent): void => {
    const rect = element.getBoundingClientRect();
    const dx = event.clientX - (rect.left + rect.width / 2);
    const dy = event.clientY - (rect.top + rect.height / 2);
    const distance = Math.hypot(dx, dy) || 1;
    const reach = Math.max(rect.width, rect.height) / 2 + MAGNET_RADIUS;
    const pull = distance < reach ? 1 - distance / reach : 0;
    const state = ensure(element);
    state.active = pull > 0;
    state.x.setTarget((dx / distance) * pull * MAGNET_AMPLITUDE);
    state.y.setTarget((dy / distance) * pull * MAGNET_AMPLITUDE);
    if (pull > 0 && !element.classList.contains("is-lifted")) {
      element.classList.add("is-lifted");
    }
    run();
  };

  const release = (element: HTMLElement): void => {
    const state = controls.get(element);
    if (!state) return;
    state.active = false;
    state.x.setTarget(0);
    state.y.setTarget(0);
    if (document.activeElement !== element) {
      element.classList.remove("is-lifted");
    }
    run();
  };

  let hovered: HTMLElement | null = null;
  const onPointerMove = (event: Event): void => {
    const pointer = event as PointerEvent;
    const target = (pointer.target as Element | null)?.closest<HTMLElement>("[data-magnet]") ?? null;
    if (target === hovered) {
      if (target) track(target, pointer);
      return;
    }
    if (hovered) release(hovered);
    hovered = target;
    if (target) track(target, pointer);
  };

  const onFocusIn = (event: FocusEvent): void => {
    const target = (event.target as Element | null)?.closest<HTMLElement>("[data-magnet]");
    if (target) target.classList.add("is-lifted");
  };
  const onFocusOut = (event: FocusEvent): void => {
    const target = (event.target as Element | null)?.closest<HTMLElement>("[data-magnet]");
    if (target) target.classList.remove("is-lifted");
  };

  root.addEventListener("pointermove", onPointerMove, { passive: true });
  document.addEventListener("focusin", onFocusIn);
  document.addEventListener("focusout", onFocusOut);

  return () => {
    root.removeEventListener("pointermove", onPointerMove);
    document.removeEventListener("focusin", onFocusIn);
    document.removeEventListener("focusout", onFocusOut);
    for (const [element] of controls) {
      element.style.removeProperty("--magnet-x");
      element.style.removeProperty("--magnet-y");
    }
    controls.clear();
  };
}
