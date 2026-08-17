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
import { initPointerPresence } from "../kernel/glow";
import { initLean } from "../kernel/lean";
import { sound } from "../kernel/sound";
import { setInPageReduce } from "../kernel/switchboard";
import { initRail, type RailController } from "../scenes/rail";
import { initDownloadFunnel, initPop } from "../shell/funnel";
import { initFilm } from "../scenes/film";
import { initTravel } from "../shell/travel";
import { initReveal } from "../scenes/reveal";
import { hydrateOnIntent } from "../editor/hydration";
import { springScrollTo } from "../motion/scroll";
import { initAmbientBackdrop } from "../kernel/ambient";
import { initBrandTile } from "../shell/brandTile";

sound.restore();

// Diagnostics that respect view-source: the first uncaught error is recorded
// on <html data-error> so a broken scene is visible without a console.
const markError = (message: string): void => {
  const root = document.documentElement;
  if (!root.dataset.error) root.dataset.error = message;
};
window.addEventListener("error", (event) => markError(event.message));

initThemeEngine();
// Build the mobile beats before share/download wiring so dynamically-created
// handoff and CTA controls use the same handlers as the desktop controls.
initFilm();
initGlass();
initFlip();
initWindowControls();
initDrop();
initPalette();
initShare();
initDownloadFunnel();
magnetize();
initPop();
initBrandTile();
initPointerPresence();
initAmbientBackdrop();
// Film detection precedes lazy scene mounting: gap and travel otherwise build
// desktop choreography into the seven-beat mobile composition.
initTravel();
initReveal();
initLean();

const rail: RailController | null = initRail();

/**
 * Mount a scene when its section approaches. The direct geometry check stays
 * on scroll, hashchange, and load; there is no idle polling loop. Scroll
 * restoration and deep-link jumps still reach the same check without forcing
 * the page to read four distant section rects on every frame.
 */

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
    window.removeEventListener("load", run);
    mount();
  };

  window.addEventListener("scroll", run, { passive: true });
  window.addEventListener("hashchange", run);
  window.addEventListener("load", run, { once: true });
  run();
}

const reportSceneLoad = (error: unknown): void => {
  markError(error instanceof Error ? error.message : String(error));
};

whenNear("gap", () => {
  void import("../scenes/gap").then(({ initGap }) => initGap()).catch(reportSceneLoad);
});
whenNear("agent", () => {
  void import("../scenes/agent").then(({ initAgent }) => initAgent(rail)).catch(reportSceneLoad);
});
whenNear("reach", () => {
  void import("../scenes/reach").then(({ initReach }) => initReach()).catch(reportSceneLoad);
});
whenNear("speed", () => {
  void import("../scenes/speed").then(({ initSpeed }) => initSpeed()).catch(reportSceneLoad);
});

for (const control of document.querySelectorAll<HTMLButtonElement>("[data-architecture-view]")) {
  control.addEventListener("click", () => {
    const windowEl = document.querySelector<HTMLElement>("[data-window]");
    const view = control.dataset.architectureView;
    if (!windowEl || (view !== "document" && view !== "source")) return;
    windowEl.dataset.view = view;
    windowEl.dataset.viewLock = view;
    windowEl.style.setProperty("--segment-index", view === "source" ? "2" : "0");
    for (const sibling of document.querySelectorAll<HTMLButtonElement>("[data-architecture-view]")) {
      sibling.setAttribute("aria-selected", String(sibling === control));
    }
    // The window lives acts below (hero · gap · agent · themes), parked in
    // the themes slot while this band is on screen — a bare view flip here
    // was invisible. The click now hands off: the page springs to where the
    // window is, arriving already flipped to the requested face.
    const themes = document.getElementById("themes");
    if (themes) springScrollTo(themes.offsetTop - 72, 480);
  });
}

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
      menu.classList.remove("is-open");
      window.setTimeout(() => {
        if (toggle.getAttribute("aria-expanded") !== "true") menu.hidden = true;
      }, 120);
    };
    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") === "true";
      if (open) {
        close();
        return;
      }
      toggle.setAttribute("aria-expanded", "true");
      menu.hidden = false;
      requestAnimationFrame(() => menu.classList.add("is-open"));
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
