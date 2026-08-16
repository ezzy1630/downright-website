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
import { initAgent } from "../scenes/agent";
import { initReach } from "../scenes/reach";
import { initSpeed } from "../scenes/speed";
import { initDownloadFunnel } from "../shell/funnel";
import { initFilm } from "../scenes/film";
import { initTravel } from "../shell/travel";
import { initReveal } from "../scenes/reveal";
import { hydrateOnIntent } from "../editor/hydration";

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
initTerminalInstall();
magnetize();
// Film detection precedes lazy scene mounting: gap and travel otherwise build
// desktop choreography into the seven-beat mobile composition.
initTravel();
initReveal();

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
whenNear("agent", () => initAgent(rail));
whenNear("reach", initReach);
whenNear("speed", initSpeed);

for (const control of document.querySelectorAll<HTMLButtonElement>("[data-architecture-view]")) {
  control.addEventListener("click", () => {
    const windowEl = document.querySelector<HTMLElement>("[data-window]");
    const view = control.dataset.architectureView;
    if (!windowEl || (view !== "document" && view !== "source")) return;
    windowEl.dataset.view = view;
    windowEl.style.setProperty("--segment-index", view === "source" ? "2" : "0");
    for (const sibling of document.querySelectorAll<HTMLButtonElement>("[data-architecture-view]")) {
      sibling.setAttribute("aria-selected", String(sibling === control));
    }
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

function initTerminalInstall(): void {
  const timers = new WeakMap<HTMLButtonElement, number>();

  for (const install of document.querySelectorAll<HTMLElement>(".terminal-install")) {
    const trigger = install.querySelector<HTMLButtonElement>(".terminal-install__trigger");
    const menu = install.querySelector<HTMLElement>(".terminal-install__menu");
    if (!trigger || !menu) continue;

    const setOpen = (open: boolean): void => {
      if (open) {
        const spaceBelow = window.innerHeight - trigger.getBoundingClientRect().bottom;
        const menuHeight = menu.getBoundingClientRect().height;
        install.dataset.menuPlacement = menuHeight + 16 > spaceBelow ? "above" : "below";
        install.dataset.open = "true";
        trigger.setAttribute("aria-expanded", "true");
        menu.setAttribute("aria-hidden", "false");
        menu.removeAttribute("inert");
        return;
      }

      install.dataset.open = "false";
      trigger.setAttribute("aria-expanded", "false");
      menu.setAttribute("aria-hidden", "true");
      menu.setAttribute("inert", "");
    };

    trigger.addEventListener("click", () => setOpen(install.dataset.open !== "true"));
    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape" || install.dataset.open !== "true") return;
      setOpen(false);
      trigger.focus();
    });
  }

  for (const option of document.querySelectorAll<HTMLButtonElement>("[data-install-command]")) {
    const label = option.querySelector<HTMLElement>("[data-install-label]");
    if (!label) continue;

    const defaultLabel = label.textContent?.trim() || "Copy";
    option.addEventListener("click", async () => {
      const command = option.dataset.installCommand;
      if (!command) return;

      const previousTimer = timers.get(option);
      if (previousTimer) window.clearTimeout(previousTimer);

      if (!navigator.clipboard) {
        option.dataset.copyState = "unavailable";
        label.textContent = "Select command";
        return;
      }

      try {
        await navigator.clipboard.writeText(command);
        option.dataset.copyState = "copied";
        label.textContent = "Copied";
      } catch {
        option.dataset.copyState = "unavailable";
        label.textContent = "Try again";
      }

      timers.set(option, window.setTimeout(() => {
        delete option.dataset.copyState;
        label.textContent = defaultLabel;
      }, 1800));
    });
  }
}

setupChrome();
