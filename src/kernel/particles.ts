/**
 * Particle celebration burst for download and milestone interactions.
 * Self-contained, zero-dependency canvas renderer that spawns ~36 physics
 * particles (sparkles + confetti petals) that fountain from the button,
 * decelerate with gravity/drag, and self-terminate.
 */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  vRot: number;
  alpha: number;
  color: string;
  shape: "circle" | "rect" | "star";
}

export function burstCelebration(source: HTMLElement | { x: number; y: number }): void {
  if (typeof document === "undefined" || document.documentElement.dataset.reducedMotion === "true") return;

  let originX: number;
  let originY: number;

  if (source instanceof HTMLElement) {
    const rect = source.getBoundingClientRect();
    originX = rect.left + rect.width / 2;
    originY = rect.top + rect.height / 2;
  } else {
    originX = source.x;
    originY = source.y;
  }

  const canvas = document.createElement("canvas");
  canvas.style.position = "fixed";
  canvas.style.inset = "0";
  canvas.style.width = "100vw";
  canvas.style.height = "100vh";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "99999";
  canvas.width = window.innerWidth * Math.min(window.devicePixelRatio || 1, 2);
  canvas.height = window.innerHeight * Math.min(window.devicePixelRatio || 1, 2);

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  ctx.scale(dpr, dpr);
  document.body.appendChild(canvas);

  const style = getComputedStyle(document.documentElement);
  const accentColor = style.getPropertyValue("--accent").trim() || "#307afe";
  const ctaColor = style.getPropertyValue("--cta-fill").trim() || accentColor;

  const palette = [
    accentColor,
    ctaColor,
    "#ffffff",
    "color-mix(in oklab, " + accentColor + " 70%, white)",
    "color-mix(in oklab, " + accentColor + " 40%, #ffc107)",
    "#60a5fa",
  ];

  const particles: Particle[] = [];
  const count = 36;

  for (let i = 0; i < count; i++) {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * (Math.PI * 0.85);
    const speed = 4.5 + Math.random() * 7.5;
    particles.push({
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1.5,
      size: 4 + Math.random() * 5.5,
      rotation: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.25,
      alpha: 1,
      color: palette[Math.floor(Math.random() * palette.length)],
      shape: Math.random() > 0.5 ? "circle" : (Math.random() > 0.5 ? "rect" : "star"),
    });
  }

  let startTime: number | null = null;
  const duration = 1350; // ms

  function render(time: number) {
    if (!startTime) startTime = time;
    const elapsed = time - startTime;
    const progress = elapsed / duration;

    if (progress >= 1 || !ctx) {
      canvas.remove();
      return;
    }

    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.22; // Gravity
      p.vx *= 0.975; // Drag
      p.vy *= 0.975;
      p.rotation += p.vRot;
      p.alpha = Math.max(0, 1 - progress * progress * 1.1);

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);

      if (p.shape === "circle") {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === "rect") {
        ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.7);
      } else {
        // 4-point sparkle star
        const r = p.size * 0.7;
        ctx.beginPath();
        ctx.moveTo(0, -r);
        ctx.quadraticCurveTo(0, 0, r, 0);
        ctx.quadraticCurveTo(0, 0, 0, r);
        ctx.quadraticCurveTo(0, 0, -r, 0);
        ctx.quadraticCurveTo(0, 0, 0, -r);
        ctx.fill();
      }

      ctx.restore();
    }

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}
