/**
 * The site orchestrator. Loads with the page (small: kernel + shell), wires
 * the global behaviors, and mounts each act's scene when its section
 * approaches. The editor (CodeMirror) never loads until the visitor means
 * to type — the hero window ships as prerendered HTML.
 */

import { initThemeEngine } from "../shell/spill";
import { initFlip, initWindowControls } from "../shell/flip";
import { initDrop } from "../shell/drop";
import { initPalette } from "../shell/palette";
import { initShare } from "../shell/share";
import { initGlass } from "../kernel/glass";
import { magnetize } from "../kernel/magnet";
import { sound } from "../kernel/sound";
import { setInPageReduce } from "../kernel/switchboard";
import { initRail, type RailController } from "../scenes/rail";
import { initGap } from "../scenes/gap";
import { initRender } from "../scenes/render";
import { initAgent } from "../scenes/agent";
import { initReach } from "../scenes/reach";
import { initSpeed } from "../scenes/speed";
import { initDownloadFunnel } from "../shell/funnel";
import { initFilm } from "../scenes/film";
import { initTravel } from "../shell/travel";
import { hydrateOnIntent } from "../editor/hydration";

sound.restore();

// Diagnostics that respect view-source: the first uncaught error is recorded
// on <html data-error> so a broken scene is visible without a console.
window.addEventListener("error", (event) => {
  const root = document.documentElement;
  if (!root.dataset.error) {
    root.dataset.error = `${event.message} @ ${(event.filename ?? "").split("/").pop()}:${event.lineno}`;
  }
});
window.addEventListener("unhandledrejection", (event) => {
  const root = document.documentElement;
  if (!root.dataset.error) root.dataset.error = `promise: ${String(event.reason).slice(0, 140)}`;
});

initThemeEngine();
initGlass();
initFlip();
initWindowControls();
initDrop();
initPalette();
initShare();
initDownloadFunnel();
magnetize();
initTravel();

const rail: RailController | null = initRail();

/**
 * Mount a scene when its section approaches. Direct geometry on scroll and
 * hashchange, plus one rAF loop while sections are still pending — covers
 * deep-link hash jumps and scroll restoration, which can both land before
 * any listener attaches. The loop self-terminates when nothing is pending.
 */
const pendingSections = new Set<() => void>();

function whenNear(sectionId: string, mount: () => void): void {
  const section = document.getElementById(sectionId);
  if (!section) return;
  let mounted = false;
  const AHEAD = 600;

  const near = (): boolean => {
    const rect = section.getBoundingClientRect();
    return rect.top < window.innerHeight + AHEAD && rect.bottom > -AHEAD;
  };

  const run = (): void => {
    if (mounted || !near()) return;
    mounted = true;
    window.removeEventListener("scroll", run);
    window.removeEventListener("hashchange", run);
    pendingSections.delete(run);
    mount();
  };

  pendingSections.add(run);
  window.addEventListener("scroll", run, { passive: true });
  window.addEventListener("hashchange", run);
  run();
}

function drivePendingSections(): void {
  if (!pendingSections.size) return;
  for (const run of [...pendingSections]) run();
  if (pendingSections.size) requestAnimationFrame(drivePendingSections);
}
requestAnimationFrame(drivePendingSections);

whenNear("gap", initGap);
whenNear("render", initRender);
whenNear("agent", () => initAgent(rail));
whenNear("reach", initReach);
whenNear("speed", initSpeed);
initFilm();

// The living document: real the moment the visitor means to touch it.
for (const heroWindow of document.querySelectorAll<HTMLElement>("[data-editor-window]")) {
  hydrateOnIntent(heroWindow);
}

document.documentElement.dataset.enhanced = "true";

// ── Small chrome wiring ──────────────────────────────────────────────────

function setupChrome(): void {
  const header = document.querySelector<HTMLElement>("[data-site-header]");
  const toggle = document.querySelector<HTMLButtonElement>("[data-menu-toggle]");
  const menu = document.querySelector<HTMLElement>("[data-mobile-menu]");
  if (header && toggle && menu) {
    const close = () => {
      toggle.setAttribute("aria-expanded", "false");
      menu.hidden = true;
    };
    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      menu.hidden = open;
    });
    menu.querySelectorAll("a").forEach((link) => link.addEventListener("click", close));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") close();
    });
  }

  document.addEventListener("scroll", () => {
    header?.classList.toggle("has-scrolled", window.scrollY > 8);
  }, { passive: true });

  document.querySelector<HTMLButtonElement>("[data-palette-trigger]")?.addEventListener("click", () => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
  });

  const brew = document.querySelector<HTMLButtonElement>("[data-brew]");
  brew?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText("brew install --cask downright");
      const label = brew.textContent;
      brew.textContent = "copied ✓";
      window.setTimeout(() => {
        brew.textContent = label;
      }, 1400);
    } catch {
      /* clipboard blocked; the command is visible to copy by hand */
    }
  });

  const soundToggle = document.querySelector<HTMLButtonElement>("[data-sound-toggle]");
  if (soundToggle) {
    const paint = () => {
      soundToggle.textContent = `Sound: ${sound.enabled ? "on" : "off"}`;
    };
    paint();
    soundToggle.addEventListener("click", () => {
      sound.setEnabled(!sound.enabled);
      paint();
    });
  }

  const motionToggle = document.querySelector<HTMLButtonElement>("[data-motion-toggle]");
  if (motionToggle) {
    const paint = () => {
      motionToggle.textContent = `Motion: ${document.documentElement.dataset.reducedMotion === "true" ? "reduced" : "full"}`;
    };
    paint();
    motionToggle.addEventListener("click", () => {
      setInPageReduce(document.documentElement.dataset.reducedMotion !== "true");
      paint();
    });
  }

  const status = document.querySelector<HTMLElement>("[data-release-status]");
  status?.querySelector("[data-release-dismiss]")?.addEventListener("click", () => {
    status.hidden = true;
    status.classList.remove("is-open");
  });
}

setupChrome();
