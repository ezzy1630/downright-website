/**
 * The funnel, exactly four asks: header (quiet, persistent) · hero · the one
 * contextual CTA earned after the agent conflict resolves · the close. The
 * press is the moment. The download button uses a restrained press, short
 * progress state, and a companion DMG helper.
 */

import { facts } from "../data/site";
import { downloadPanel } from "./toast";
import { MOTION, SpringScalar } from "../kernel/springs";
import { ticker } from "../kernel/ticker";
import { sound } from "../kernel/sound";

export function initDownloadFunnel(): void {
  for (const button of document.querySelectorAll<HTMLButtonElement | HTMLAnchorElement>("[data-download]")) {
    button.addEventListener("pointerdown", () => {
      pop(button as HTMLElement, true);
    });

    button.addEventListener("click", (event) => {
      const downloadUrl = button.dataset.downloadUrl || facts.downloadUrl;
      if (!downloadUrl) {
        event.preventDefault();
        // The signed DMG gate: the ask is honest about not being live yet.
        const status = document.querySelector<HTMLElement>("[data-release-status]");
        if (status) {
          status.hidden = false;
          status.classList.add("is-open");
        }
        return;
      }

      // A second press while the first download is transitioning should not
      // open duplicate panels or queue another browser download.
      if (button.dataset.downloadState === "starting" || button.dataset.downloadState === "started") {
        event.preventDefault();
        return;
      }

      // Keep the visitor on the site while the browser handles the real
      // cross-origin GitHub asset. The server-rendered anchor remains the
      // no-JS fallback; appending the enhanced anchor makes the browser honor
      // the download gesture consistently across Safari and Chromium.
      event.preventDefault();
      sound.whoosh();
      animateDownloadButton(button as HTMLElement);

      const anchor = document.createElement("a");
      anchor.href = downloadUrl;
      anchor.rel = "noreferrer";
      anchor.download = facts.artifactName;
      anchor.style.display = "none";
      document.body.append(anchor);
      anchor.click();
      anchor.remove();

      downloadPanel(facts.artifactName, facts.repository, facts.sponsorsUrl);
    });
  }
}

/** Keep the page's feedback in step with the browser's download handoff:
 *  1. Starting, with a short progress sweep and spinner.
 *  2. Started, with a checkmark while the companion guidance stays open.
 *  3. Ready again, so a retry is always available without a reload. */
function animateDownloadButton(button: HTMLElement): void {
  const labelEl = button.querySelector<HTMLElement>("[data-download-label]");
  const originalLabel = button.dataset.defaultLabel || labelEl?.textContent || "Download for macOS";
  const originalAriaLabel = button.dataset.defaultAriaLabel || button.getAttribute("aria-label") || originalLabel;

  // Prevent stacked triggers while animating.
  if (button.dataset.downloadState === "starting" || button.dataset.downloadState === "started") return;

  button.dataset.downloadState = "starting";
  button.setAttribute("aria-busy", "true");
  button.setAttribute("aria-disabled", "true");
  button.setAttribute("aria-label", `${originalLabel}, starting`);
  if (button instanceof HTMLButtonElement) button.disabled = true;
  if (labelEl) labelEl.textContent = "Starting download";

  window.setTimeout(() => {
    button.dataset.downloadState = "started";
    button.removeAttribute("aria-busy");
    button.setAttribute("aria-label", `${originalLabel}, download started`);
    if (labelEl) labelEl.textContent = "Download started";
    sound.tick();

    window.setTimeout(() => {
      button.dataset.downloadState = "ready";
      button.removeAttribute("aria-disabled");
      button.setAttribute("aria-label", originalAriaLabel);
      if (button instanceof HTMLButtonElement) button.disabled = false;
      if (labelEl) labelEl.textContent = originalLabel;
      window.setTimeout(() => {
        button.removeAttribute("data-download-state");
      }, 400);
    }, 2400);
  }, 680);
}

/** pop(): 1.06 / ~0.973 squash-stretch, with radius ×1.15 on the download. */
export function pop(element: HTMLElement, withRadius = false): void {
  if (document.documentElement.dataset.reducedMotion === "true") return;
  // Windup below 1, settle with bounce: the squash reads as a press.
  const scale = new SpringScalar(0.955, MOTION.durations.pressOut, 0.6);
  scale.setTarget(1);
  const swell = withRadius ? new SpringScalar(1.15, MOTION.durations.pressOut, 0.3) : null;
  swell?.setTarget(1);
  ticker.add((dt) => {
    const movingScale = scale.advance(dt);
    const movingSwell = swell ? swell.advance(dt) : false;
    element.style.setProperty("--pop-scale", scale.value.toFixed(4));
    if (swell) element.style.setProperty("--pop-radius", swell.value.toFixed(3));
    const moving = movingScale || movingSwell;
    if (!moving) {
      element.style.removeProperty("--pop-scale");
      if (swell) element.style.removeProperty("--pop-radius");
    }
    return moving;
  });
}

/** The same squash & haptic sound for every [data-pop] control, touch included. */
export function initPop(): void {
  document.addEventListener("pointerdown", (event) => {
    const element = (event.target as Element | null)?.closest<HTMLElement>("[data-pop], .button");
    if (element && !element.hasAttribute("data-download")) {
      pop(element);
    }
  }, { passive: true });

  document.addEventListener("click", (event) => {
    const element = (event.target as Element | null)?.closest<HTMLElement>("[data-pop], .button, .palette-trigger, .terminal-install__trigger, .terminal-install__option, .film-chip");
    if (element && !element.hasAttribute("data-download")) {
      sound.tick();
    }
  }, { passive: true });
}
