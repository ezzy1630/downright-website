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

/** The download moment: file lands, star ask rides along, nothing else asks. */
export function downloadToast(artifactName: string, repository: string): void {
  toast(
    `<strong>Downloading ${artifactName}</strong>
     <span>While it lands: <a href="${repository}" target="_blank" rel="noreferrer">★ star the repo</a> · <a href="/changelog">follow the changelog</a></span>`,
    { duration: 9000 },
  );
}
