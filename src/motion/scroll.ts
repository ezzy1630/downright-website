import { SpringScalar } from "./spring";

const clamp = (value: number, min = 0, max = 1): number => Math.min(max, Math.max(min, value));

export function reducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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

export function observeScrollProgress(target: HTMLElement, callback: (progress: number) => void): () => void {
  let frame = 0;
  let active = false;
  const update = () => {
    frame = 0;
    const travel = Math.max(1, target.offsetHeight - window.innerHeight);
    callback(clamp(-target.getBoundingClientRect().top / travel));
    if (active) frame = requestAnimationFrame(update);
  };
  const observer = new IntersectionObserver((entries) => {
    active = entries.some((entry) => entry.isIntersecting);
    if (active && !frame) frame = requestAnimationFrame(update);
    if (!active && frame) { cancelAnimationFrame(frame); frame = 0; }
  }, { threshold: 0 });
  observer.observe(target);
  return () => { observer.disconnect(); if (frame) cancelAnimationFrame(frame); };
}

export function observeOnce(targets: NodeListOf<HTMLElement>, callback: (target: HTMLElement) => void): () => void {
  const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const target = entry.target as HTMLElement;
    observer.unobserve(target);
    callback(target);
  }), { rootMargin: "0px 0px -12% 0px", threshold: 0.08 });
  targets.forEach((target) => observer.observe(target));
  return () => observer.disconnect();
}
