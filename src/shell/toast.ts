/**
 * Toasts. Two kinds, both glass, both quiet: the post-download toast carries
 * the entire GitHub ask (star the repo · follow the changelog), and the agent
 * change toast summarizes an external write. Auto-dismiss on the app's
 * `liquidSettle` rhythm; never modal, never blocking.
 */

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

/** The post-download moment (§8.1) — the entire star + sponsor ask, riding the
   first download only. Bottom-centre, dismissible, Esc closes, ~12s, and it
   never appears twice in one session (the DMG itself always starts). */
export function downloadPanel(artifactName: string, repository: string, sponsorsUrl: string): void {
  try {
    if (sessionStorage.getItem("downright-download-panel-shown")) return;
    sessionStorage.setItem("downright-download-panel-shown", "1");
  } catch {
    /* storage unavailable — show it anyway, once per page load */
  }

  const host = document.querySelector<HTMLElement>("[data-toast-host]") ?? createHost();
  const element = document.createElement("div");
  element.className = "glass-toast glass-toast--download glass";
  element.setAttribute("role", "status");
  element.innerHTML = `
    <div class="glass-toast__head">
      <strong>Downloading ${artifactName} — free, forever.</strong>
      <button type="button" data-toast-dismiss aria-label="Dismiss">✕</button>
    </div>
    <div class="glass-toast__actions">
      <a href="${repository}" target="_blank" rel="noreferrer">★ Star the repo</a>
      <a href="${sponsorsUrl}" target="_blank" rel="noreferrer">♥ Fund the next release</a>
    </div>`;
  host.append(element);
  requestAnimationFrame(() => element.classList.add("is-open"));

  const dismiss = (): void => {
    element.classList.remove("is-open");
    window.setTimeout(() => element.remove(), 400);
  };
  element.querySelector("[data-toast-dismiss]")?.addEventListener("click", dismiss);
  const onKey = (event: KeyboardEvent): void => {
    if (event.key !== "Escape") return;
    dismiss();
    window.removeEventListener("keydown", onKey);
  };
  window.addEventListener("keydown", onKey);
  window.setTimeout(dismiss, 12000);
}
