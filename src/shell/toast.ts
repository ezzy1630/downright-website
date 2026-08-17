/**
 * Toasts & Onboarding Companion. Two kinds, both glass, both quiet:
 * the post-download companion sheet carries the 3-step visual DMG flow,
 * terminal one-click copy, and star/sponsor actions.
 * The companion stays open until the reader dismisses it; never modal, never
 * blocking.
 */

import { brewCommand } from "../data/site";
import { sound } from "../kernel/sound";

export function toast(html: string, options: { duration?: number } = {}): void {
  const host = document.querySelector<HTMLElement>("[data-toast-host]") ?? createHost();
  const element = document.createElement("div");
  element.className = "glass-toast glass";
  element.setAttribute("role", "status");
  element.innerHTML = html;
  host.append(element);
  requestAnimationFrame(() => element.classList.add("is-open"));
  const duration = options.duration ?? 6000;
  window.setTimeout(() => {
    element.classList.remove("is-open");
    window.setTimeout(() => element.remove(), 400);
  }, duration);
}

function createHost(): HTMLElement {
  const host = document.createElement("div");
  host.className = "toast-host";
  host.dataset.toastHost = "true";
  host.setAttribute("aria-live", "polite");
  document.body.append(host);
  return host;
}

/** The post-download companion card.
 *  It confirms the browser handoff first, then keeps the Finder install path
 *  close at hand without blocking the page. It is dismissible via the close
 *  button or Escape and stays until the reader explicitly dismisses it. */
export function downloadPanel(artifactName: string, repository: string, sponsorsUrl: string): void {
  const host = document.querySelector<HTMLElement>("[data-toast-host]") ?? createHost();

  // If a companion card already exists in the host, remove it cleanly first
  const existing = host.querySelector(".glass-toast--download");
  if (existing) existing.remove();

  const element = document.createElement("div");
  element.className = "glass-toast glass-toast--download glass-toast--companion glass";
  const titleId = `download-helper-title-${Date.now()}`;
  element.setAttribute("role", "region");
  element.setAttribute("aria-live", "polite");
  element.setAttribute("aria-labelledby", titleId);

  element.innerHTML = `
    <div class="glass-toast__head">
      <div class="glass-toast__title-group">
        <img class="glass-toast__icon" src="/assets/downright-app-icon.png" width="36" height="36" alt="Downright icon" />
        <div>
          <strong id="${titleId}">Download started</strong>
          <span class="glass-toast__sub"><code>${artifactName}</code> is landing in Downloads</span>
        </div>
      </div>
      <button type="button" class="glass-toast__dismiss" data-toast-dismiss aria-label="Close download guidance" title="Close download guidance">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
    </div>

    <div class="glass-toast__install-card">
      <div class="glass-toast__install-copy">
        <span class="glass-toast__eyebrow">Next in Finder</span>
        <b>Open the DMG, then drag Downright to Applications.</b>
        <span>Keep this guide open while it downloads.</span>
      </div>
      <div class="glass-toast__route" aria-hidden="true">
        <span class="glass-toast__route-node"><b>DMG</b><small>Downloads</small></span>
        <span class="glass-toast__route-arrow">→</span>
        <span class="glass-toast__route-node glass-toast__route-node--target"><b>↳</b><small>Applications</small></span>
      </div>
    </div>

    <ol class="glass-toast__steps" aria-label="Installation steps">
      <li class="glass-toast__step">
        <div class="glass-toast__step-badge">1</div>
        <div class="glass-toast__step-info">
          <b>Open the DMG</b>
          <span>Click <code>${artifactName}</code> in Downloads</span>
        </div>
      </li>

      <li class="glass-toast__step glass-toast__step--drag">
        <div class="glass-toast__step-badge">2</div>
        <div class="glass-toast__step-info">
          <b>Drop Downright in Applications</b>
          <span>Drag the app out of the mounted disk before launching it</span>
        </div>
      </li>

      <li class="glass-toast__step">
        <div class="glass-toast__step-badge">3</div>
        <div class="glass-toast__step-info">
          <b>Eject the DMG; open it from Applications</b>
          <span>If macOS asks whether to open a download, choose Open. If it still blocks, Control-click Downright in Applications and choose Open.</span>
        </div>
      </li>
    </ol>

    <div class="glass-toast__terminal">
      <span class="glass-toast__terminal-lead">Prefer Terminal? Copy the Homebrew command.</span>
      <button type="button" class="glass-toast__copy-btn" data-companion-copy="${brewCommand}" aria-label="Copy Homebrew command">
        <code>${brewCommand}</code>
        <span class="glass-toast__copy-label" data-copy-status>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          <span>Copy</span>
        </span>
      </button>
    </div>

    <div class="glass-toast__footer">
      <div class="glass-toast__links">
        ${repository ? `<a href="${repository}" target="_blank" rel="noreferrer" class="toast-action-link">Star on GitHub ↗</a>` : ""}
        ${sponsorsUrl ? `<a href="${sponsorsUrl}" target="_blank" rel="noreferrer" class="toast-action-link">Sponsor ↗</a>` : ""}
      </div>
    </div>

  `;

  host.append(element);
  document.documentElement.dataset.downloadCompanion = "open";
  requestAnimationFrame(() => element.classList.add("is-open"));

  // Copy button interaction
  const copyBtn = element.querySelector<HTMLButtonElement>("[data-companion-copy]");
  copyBtn?.addEventListener("click", async () => {
    const cmd = copyBtn.dataset.companionCopy;
    if (!cmd) return;
    try {
      await navigator.clipboard.writeText(cmd);
      sound.tick();
      const status = copyBtn.querySelector("[data-copy-status]");
      if (status) {
        status.innerHTML = `
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          <span>Copied!</span>
        `;
        copyBtn.classList.add("is-copied");
        setTimeout(() => {
          if (copyBtn.contains(status)) {
            status.innerHTML = `
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              <span>Copy</span>
            `;
            copyBtn.classList.remove("is-copied");
          }
        }, 2200);
      }
    } catch {
      const status = copyBtn.querySelector("[data-copy-status]");
      if (status) status.textContent = "Copy unavailable";
      copyBtn.dataset.copyState = "unavailable";
    }
  });

  const dismiss = (): void => {
    window.removeEventListener("keydown", onKey);
    element.classList.remove("is-open");
    window.setTimeout(() => {
      element.remove();
      if (!host.querySelector(".glass-toast--download")) delete document.documentElement.dataset.downloadCompanion;
    }, 400);
  };

  element.querySelector("[data-toast-dismiss]")?.addEventListener("click", dismiss);

  const onKey = (event: KeyboardEvent): void => {
    if (event.key !== "Escape") return;
    dismiss();
  };
  window.addEventListener("keydown", onKey);
}
