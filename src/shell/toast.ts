/** Small transient messages plus the post-download handoff state. */

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

/** The quiet completion state shown after the browser accepts the DMG. */
export function downloadPanel(artifactName: string, downloadUrl: string, sponsorsUrl: string): void {
  const host = document.querySelector<HTMLElement>("[data-toast-host]") ?? createHost();
  const existing = host.querySelector(".download-complete");
  if (existing) existing.remove();

  const element = document.createElement("div");
  element.className = "download-complete";
  const titleId = `download-complete-title-${Date.now()}`;
  element.setAttribute("role", "dialog");
  element.setAttribute("aria-modal", "true");
  element.setAttribute("aria-live", "polite");
  element.setAttribute("aria-labelledby", titleId);

  element.innerHTML = `
    <div class="download-complete__surface glass">
      <button type="button" class="download-complete__dismiss" data-download-dismiss aria-label="Close download confirmation" title="Close download confirmation">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
      <img class="download-complete__icon" src="/assets/downright-app-icon.png" width="56" height="56" alt="Downright icon" />
      <span class="download-complete__eyebrow">Download started</span>
      <h1 id="${titleId}">Thank you for downloading Downright</h1>
      <p class="download-complete__summary"><code>${artifactName}</code> is downloading to your Downloads folder.</p>
      <p class="download-complete__next">When it finishes, open the DMG and move Downright to Applications.</p>
      <div class="download-complete__actions">
        <a class="button button--primary download-complete__help" href="/download/#install">Installation help</a>
        ${sponsorsUrl ? `<a class="download-complete__support" href="${sponsorsUrl}" target="_blank" rel="noreferrer">Support Downright ↗</a>` : ""}
      </div>
      <p class="download-complete__fallback">If the download does not start, <a href="${downloadUrl}" target="_blank" rel="noreferrer">download it directly from GitHub ↗</a>.</p>
    </div>
  `;

  host.append(element);
  document.documentElement.dataset.downloadComplete = "open";
  requestAnimationFrame(() => element.classList.add("is-open"));

  let dismissed = false;
  const onKey = (event: KeyboardEvent): void => {
    if (event.key === "Escape") dismiss();
  };
  const dismiss = (): void => {
    if (dismissed) return;
    dismissed = true;
    window.removeEventListener("keydown", onKey);
    element.classList.remove("is-open");
    window.setTimeout(() => {
      element.remove();
      if (!host.querySelector(".download-complete")) delete document.documentElement.dataset.downloadComplete;
    }, 260);
  };

  element.querySelector("[data-download-dismiss]")?.addEventListener("click", dismiss);
  window.addEventListener("keydown", onKey);
  element.querySelector<HTMLButtonElement>("[data-download-dismiss]")?.focus();
}
