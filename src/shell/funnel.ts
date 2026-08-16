/**
 * The funnel, exactly four asks: header (quiet, persistent) · hero · the one
 * contextual CTA earned after the agent conflict resolves · the close. The
 * press is the moment — the download button carries the site's signature
 * pop() (squash-stretch, radius swell), and every [data-pop] control gets
 * the same squash through initPop, so the whole page answers presses alike.
 */

import { facts } from "../data/site";
import { downloadPanel } from "./toast";
import { MOTION, SpringScalar } from "../kernel/springs";
import { ticker } from "../kernel/ticker";

export function initDownloadFunnel(): void {
  for (const button of document.querySelectorAll<HTMLButtonElement | HTMLAnchorElement>("[data-download]")) {
    button.addEventListener("pointerdown", (event) => {
      const pointer = event as PointerEvent;
      if (pointer.pointerType !== "mouse" && pointer.pointerType !== "pen") return;
      pop(button as HTMLElement, true);
    });
    button.addEventListener("click", () => {
      if (!facts.downloadUrl) {
        // The signed DMG gate: the ask is honest about not being live yet.
        const status = document.querySelector<HTMLElement>("[data-release-status]");
        if (status) {
          status.hidden = false;
          status.classList.add("is-open");
        }
        return;
      }
      const anchor = document.createElement("a");
      anchor.href = facts.downloadUrl;
      anchor.rel = "noreferrer";
      anchor.download = facts.artifactName;
      anchor.click();
      downloadPanel(facts.artifactName, facts.repository, facts.sponsorsUrl);
    });
  }
}

/** pop(): 1.06 / ~0.973 squash-stretch, with radius ×1.15 on the download. */
function pop(element: HTMLElement, withRadius = false): void {
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

/** The same squash for every [data-pop] control, touch included. */
export function initPop(): void {
  document.addEventListener("pointerdown", (event) => {
    const element = (event.target as Element | null)?.closest<HTMLElement>("[data-pop]");
    if (element) pop(element);
  }, { passive: true });
}
