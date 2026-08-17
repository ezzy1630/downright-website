import { SpringScalar } from "./spring";
import { reducedMotion as switchboardReducedMotion } from "../kernel/switchboard";

const clamp = (value: number, min = 0, max = 1): number => Math.min(max, Math.max(min, value));

export function reducedMotion(): boolean {
  return switchboardReducedMotion();
}

export function springScrollTo(target: number, kick = 0): void {
  const destination = Math.max(0, target);
  if (reducedMotion()) { window.scrollTo(0, destination); return; }
  const distance = destination - window.scrollY;
  const duration = clamp(0.0115 * Math.sqrt(Math.abs(distance)), 0.18, 0.55);
  const spring = new SpringScalar(window.scrollY, duration);
  spring.setTarget(destination);
  if (kick) spring.kick(Math.sign(distance || 1) * kick);
  let last = performance.now();
  const tick = (now: number) => {
    const moving = spring.advance(Math.min(0.05, (now - last) / 1000));
    last = now;
    window.scrollTo(0, spring.value);
    if (moving) requestAnimationFrame(tick); else window.scrollTo(0, destination);
  };
  requestAnimationFrame(tick);
}
