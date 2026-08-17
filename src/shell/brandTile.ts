/**
 * Interactive 3D Brand Tile Physics
 * Gives the tactile Downright brand squircle live mouse-tracking 3D tilt,
 * 2.5D layer parallax, and spring return.
 */

import { MOTION, SpringScalar } from "../kernel/springs";
import { ticker } from "../kernel/ticker";
import { sound } from "../kernel/sound";

interface TileState {
  rotX: SpringScalar;
  rotY: SpringScalar;
  liftZ: SpringScalar;
  parallaxX: SpringScalar;
  parallaxY: SpringScalar;
  active: boolean;
}

export function initBrandTile(root: ParentNode = document): () => void {
  if (typeof window === "undefined" || !window.matchMedia("(pointer: fine)").matches) {
    return () => undefined;
  }

  const elements = root.querySelectorAll<HTMLElement>("[data-brand-tilt]");
  if (!elements.length) return () => undefined;

  const states = new Map<HTMLElement, TileState>();
  let isRunning = false;

  const getOrCreateState = (el: HTMLElement): TileState => {
    let state = states.get(el);
    if (!state) {
      state = {
        rotX: new SpringScalar(0, MOTION.durations.quick, 0.12),
        rotY: new SpringScalar(0, MOTION.durations.quick, 0.12),
        liftZ: new SpringScalar(0, MOTION.durations.quick, 0.1),
        parallaxX: new SpringScalar(0, MOTION.durations.quick, 0.12),
        parallaxY: new SpringScalar(0, MOTION.durations.quick, 0.12),
        active: false,
      };
      states.set(el, state);
    }
    return state;
  };

  const startLoop = (): void => {
    if (isRunning) return;
    isRunning = true;

    ticker.add((dt) => {
      let anyMoving = false;

      for (const [el, state] of states) {
        const mRotX = state.rotX.advance(dt);
        const mRotY = state.rotY.advance(dt);
        const mLift = state.liftZ.advance(dt);
        const mParX = state.parallaxX.advance(dt);
        const mParY = state.parallaxY.advance(dt);

        const moving = mRotX || mRotY || mLift || mParX || mParY;

        const card = el.querySelector<HTMLElement>(".brand-symbol__card");
        const pills = el.querySelector<HTMLElement>(".brand-pills");

        if (card) {
          card.style.setProperty("--tilt-x", `${state.rotX.value.toFixed(2)}deg`);
          card.style.setProperty("--tilt-y", `${state.rotY.value.toFixed(2)}deg`);
          card.style.setProperty("--lift-z", `${state.liftZ.value.toFixed(2)}px`);
        }

        if (pills) {
          pills.style.setProperty("--parallax-x", `${state.parallaxX.value.toFixed(2)}px`);
          pills.style.setProperty("--parallax-y", `${state.parallaxY.value.toFixed(2)}px`);
        }

        if (moving) {
          anyMoving = true;
        } else if (!state.active) {
          states.delete(el);
        }
      }

      if (!anyMoving) {
        isRunning = false;
      }
      return anyMoving;
    });
  };

  const handlePointerMove = (el: HTMLElement, e: PointerEvent) => {
    const rect = el.getBoundingClientRect();
    const nx = Math.max(-1, Math.min(1, ((e.clientX - rect.left) / rect.width - 0.5) * 2));
    const ny = Math.max(-1, Math.min(1, ((e.clientY - rect.top) / rect.height - 0.5) * 2));

    const state = getOrCreateState(el);
    state.active = true;
    state.rotX.setTarget(-ny * 16);
    state.rotY.setTarget(nx * 16);
    state.liftZ.setTarget(6);
    state.parallaxX.setTarget(nx * 1.6);
    state.parallaxY.setTarget(ny * 1.2);

    startLoop();
  };

  const handlePointerLeave = (el: HTMLElement) => {
    const state = states.get(el);
    if (!state) return;
    state.active = false;
    state.rotX.setTarget(0);
    state.rotY.setTarget(0);
    state.liftZ.setTarget(0);
    state.parallaxX.setTarget(0);
    state.parallaxY.setTarget(0);

    startLoop();
  };

  const handlePointerDown = (el: HTMLElement) => {
    const state = getOrCreateState(el);
    state.liftZ.setTarget(-3);
    sound.tick();
    startLoop();
  };

  const handlePointerUp = (el: HTMLElement) => {
    const state = states.get(el);
    if (state && state.active) {
      state.liftZ.setTarget(6);
      startLoop();
    }
  };

  const cleanups: Array<() => void> = [];

  elements.forEach((el) => {
    const onMove = (e: PointerEvent) => handlePointerMove(el, e);
    const onLeave = () => handlePointerLeave(el);
    const onDown = () => handlePointerDown(el);
    const onUp = () => handlePointerUp(el);

    el.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerleave", onLeave);
    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);

    cleanups.push(() => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
    });
  });

  return () => {
    cleanups.forEach((fn) => fn());
    states.clear();
  };
}
