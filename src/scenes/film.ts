/**
 * The mobile film. It is a seven-beat reading sequence, not a shrunken
 * desktop: hero, raw-to-render sweep, agent visit, compact benchmark CTA,
 * theme re-ink, free/open close, and the AirDrop handoff.
 *
 * The hero's single `.app-window` travels into the agent and theme slots.
 * The gap uses its own raw/rendered sweep surface because that is the point
 * of the beat; it never creates a second app window. Desktop scenes remain in
 * the document for progressive enhancement but are hidden by the film CSS.
 */

import { doc } from "../kernel/store";
import { renderSampleMarkdown, renderSampleBlocks, themes, facts } from "../data/site";
import { reducedMotion } from "../kernel/switchboard";
import { switchTheme, currentTheme } from "../shell/spill";

const FILM_QUERY = "(max-width: 900px) and (pointer: coarse)";

export function isFilm(): boolean {
  if (new URLSearchParams(window.location.search).has("film")) return true;
  return window.matchMedia(FILM_QUERY).matches;
}

export function initFilm(): void {
  if (!isFilm()) return;
  document.documentElement.dataset.film = "true";

  buildFilmAgentBeat();
  buildFilmCtaBeat();
  buildFilmThemeBeat();
  buildFilmHandoffBeat();
  initFilmActiveBeat();
  initFilmWindowTravel();
  initTapToType();
  initInsertEditChip();
  initSweepThumb();
  initFilmSpill();
}

function initFilmActiveBeat(): void {
  const beats = ["hero", "gap", "film-agent", "film-cta", "film-theme", "close", "film-handoff"]
    .map((id) => document.getElementById(id))
    .filter((element): element is HTMLElement => Boolean(element));
  if (!beats.length) return;
  const paint = (): void => {
    const reference = window.scrollY + window.innerHeight * 0.46;
    let active = beats[0];
    for (const beat of beats) {
      const top = beat.offsetTop;
      if (top <= reference) active = beat;
    }
    for (const beat of beats) beat.dataset.filmActive = String(beat === active);
  };
  window.addEventListener("scroll", paint, { passive: true });
  window.addEventListener("resize", paint, { passive: true });
  paint();
}

function buildFilmAgentBeat(): void {
  const section = document.getElementById("agent");
  if (!section || document.getElementById("film-agent")) return;
  const beat = document.createElement("section");
  beat.className = "film-beat film-beat--agent";
  beat.id = "film-agent";
  beat.dataset.rest = "film-agent";
  beat.setAttribute("aria-label", "Agent visit");
  beat.innerHTML = `
    <p class="film-beat__kicker">Agent visit</p>
    <h2 class="film-beat__title">See the rewrite. Keep the file.</h2>
    <p class="film-beat__line">The document stays open while an agent writes. Every changed word is marked before you choose.</p>
    <div class="film-agent-stage" data-agent-stage>
      <div class="film-agent-stage__window" data-agent-document data-film-window-slot="agent"></div>
      <div class="conflict-bar" data-conflict-bar role="region" aria-label="External write needs review" hidden>
        <strong>Agent changed this file.</strong>
        <button type="button" data-conflict-action="review" data-conflict-focus>Review</button>
        <button type="button" data-conflict-action="mine">Keep Mine</button>
        <button type="button" data-conflict-action="theirs">Take Theirs</button>
      </div>
      <div class="change-toast glass" data-change-toast role="status" aria-live="polite">
        <strong>External write</strong><span data-change-summary>…</span>
      </div>
      <div class="review-panel" data-review-panel aria-hidden="true"></div>
    </div>`;
  section.before(beat);
}

function buildFilmCtaBeat(): void {
  const section = document.getElementById("speed");
  if (!section || document.getElementById("film-cta")) return;
  const beat = document.createElement("section");
  beat.className = "film-beat film-beat--cta";
  beat.id = "film-cta";
  beat.dataset.rest = "film-cta";
  beat.dataset.fingerprint = "film-cta";
  beat.setAttribute("aria-label", "Download Downright");
  beat.innerHTML = `
    <p class="film-beat__kicker">A small engine</p>
    <h2 class="film-beat__title">Fast enough to stay with the thought.</h2>
    <div class="film-compact-benchmark" aria-label="Compact local benchmark">
      <div><span>Parse 100 KB</span><strong>12.078 ms</strong></div>
      <div><span>Source edit</span><strong>0.146 ms</strong></div>
      <div><span>Text diff</span><strong>2.099 ms</strong></div>
    </div>
    <p class="film-beat__line">Native measurements, with the limit beside each number. The source stays yours while the page keeps up.</p>
    <button type="button" class="button button--primary download-button" data-download data-download-url="${facts.downloadUrl}" data-artifact="${facts.artifactName}" data-magnet aria-label="Download for macOS">Download for macOS</button>`;
  section.before(beat);
}

function buildFilmThemeBeat(): void {
  const section = document.getElementById("themes");
  if (!section || document.getElementById("film-theme")) return;
  const beat = document.createElement("section");
  beat.className = "film-beat film-beat--theme";
  beat.id = "film-theme";
  beat.dataset.rest = "film-theme";
  beat.setAttribute("aria-label", "Theme re-ink");
  beat.innerHTML = `
    <p class="film-beat__kicker">Themes</p>
    <h2 class="film-beat__title">One tap re-inks the page.</h2>
    <p class="film-beat__line">The same document, six source-derived palettes. Tap a swatch and watch the ink travel from the point of your thumb.</p>
    <div class="film-theme-stage">
      <div class="film-spill" role="group" aria-label="Choose a theme">
        ${themes.filter((theme) => theme.id !== "system").map((theme) => `<button type="button" data-film-theme="${theme.id}" aria-pressed="${theme.id === currentTheme()}"><span class="swatch" style="background:${theme.palette.background};border-color:${theme.palette.accent}"></span>${theme.name}</button>`).join("")}
      </div>
      <div class="film-theme-window" data-film-window-slot="theme" aria-label="Re-inked document window"></div>
    </div>`;
  section.before(beat);
}

function buildFilmHandoffBeat(): void {
  const footer = document.querySelector(".site-footer");
  if (!footer || document.getElementById("film-handoff")) return;
  const beat = document.createElement("section");
  beat.className = "film-beat film-beat--handoff";
  beat.id = "film-handoff";
  beat.dataset.rest = "film-handoff";
  beat.setAttribute("aria-label", "Send this page to your Mac");
  beat.innerHTML = `
    <p class="film-beat__kicker">AirDrop handoff</p>
    <h2 class="film-beat__title">The page comes with you.</h2>
    <div class="film-handoff" data-fingerprint="handoff">
      <p class="film-handoff__line">Downright lives on your Mac. Send it there.</p>
      <button type="button" class="film-handoff__primary" data-share="share">AirDrop this page to your Mac</button>
      <div class="film-handoff__row">
        <button type="button" data-share="copy">Copy link</button>
        <button type="button" data-share="mail">Mail it to yourself</button>
        ${facts.repository ? `<a href="${facts.repository}" target="_blank" rel="noreferrer">★ Star</a>` : ""}
        ${facts.sponsorsUrl ? `<a href="${facts.sponsorsUrl}" target="_blank" rel="noreferrer">♥ Sponsor</a>` : ""}
      </div>
      <p class="film-handoff__note">No email, no server. On iPhone the first option in the share sheet is AirDrop.</p>
    </div>`;
  footer.before(beat);
}

/* ── The living window travels through beats 1, 3, and 5. ─────────────── */

function initFilmWindowTravel(): void {
  const windowEl = document.querySelector<HTMLElement>("[data-editor-window]");
  if (!windowEl) return;
  const slots = [
    { id: "hero", section: "hero", host: () => document.querySelector<HTMLElement>(".hero__window") },
    { id: "agent", section: "film-agent", host: () => document.querySelector<HTMLElement>("[data-film-window-slot=agent]") },
    { id: "theme", section: "film-theme", host: () => document.querySelector<HTMLElement>("[data-film-window-slot=theme]") },
  ] as const;
  type FilmSlot = (typeof slots)[number];
  let current: (typeof slots)[number]["id"] = "hero";

  const setWindowMode = (mode: "split" | "document"): void => {
    windowEl.dataset.view = mode;
    windowEl.style.setProperty("--segment-index", mode === "split" ? "1" : "0");
    for (const button of windowEl.querySelectorAll<HTMLButtonElement>("[data-view-button]")) {
      button.setAttribute("aria-selected", String(button.dataset.viewButton === mode));
    }
  };

  const moveTo = (target: (typeof slots)[number]): void => {
    const host = target.host();
    if (!host || current === target.id) return;
    const before = windowEl.getBoundingClientRect();
    host.append(windowEl);
    windowEl.dataset.slot = target.id;
    setWindowMode(target.id === "hero" ? "split" : "document");
    const after = windowEl.getBoundingClientRect();
    const dx = before.left - after.left;
    const dy = before.top - after.top;
    if (reducedMotion() || !before.width || !after.width) {
      windowEl.style.transform = "none";
    } else {
      windowEl.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) scale(${(before.width / after.width).toFixed(4)})`;
      requestAnimationFrame(() => {
        windowEl.style.transition = "transform 320ms cubic-bezier(.2,.8,.2,1)";
        windowEl.style.transform = "none";
        window.setTimeout(() => windowEl.style.removeProperty("transition"), 360);
      });
    }
    current = target.id;
  };

  const settle = (): void => {
    const reference = window.scrollY + window.innerHeight * 0.44;
    let target: FilmSlot = slots[0];
    for (const slot of slots) {
      const section = document.getElementById(slot.section);
      if (section && section.offsetParent !== null && section.offsetTop <= reference) target = slot;
    }
    moveTo(target);
  };
  window.addEventListener("scroll", settle, { passive: true });
  window.addEventListener("resize", settle, { passive: true });
  requestAnimationFrame(settle);
}

/* ── Beat 1: type into the real hero window. ──────────────────────────── */

function initTapToType(): void {
  const windowEl = document.querySelector<HTMLElement>("[data-editor-window]");
  const body = windowEl?.querySelector<HTMLElement>("[data-window-body]");
  if (!windowEl || !body) return;
  const caption = document.querySelector<HTMLElement>("[data-film-invite]");
  if (caption) {
    caption.textContent = "This window is real. Type in it.";
    caption.classList.add("is-settled");
  }
  document.querySelector<HTMLButtonElement>("[data-film-type]")?.addEventListener("click", () => {
    void import("../editor/mount").then(({ mountEditor }) => {
      if (body.dataset.editorMounted) return;
      mountEditor(windowEl, body);
      requestAnimationFrame(() => body.querySelector<HTMLElement>(".cm-content")?.focus());
    });
  });
}

function initInsertEditChip(): void {
  const chip = document.querySelector<HTMLButtonElement>("[data-film-insert]");
  if (!chip) return;
  chip.addEventListener("click", () => {
    doc.edit(`${doc.current.text}\n\n- [ ] tapped from the phone - the Mac gets the real thing`);
    const surface = document.querySelector<HTMLElement>("[data-document-read] [data-static-document]");
    if (surface) surface.innerHTML = renderSampleMarkdown(doc.current.text);
    const label = chip.textContent ?? "";
    chip.textContent = "inserted ✓";
    window.setTimeout(() => { chip.textContent = label; }, 1600);
  });
}

/* ── Beat 2: the raw-to-render sweep, driven by a thumb. ──────────────── */

function initSweepThumb(): void {
  const sweep = document.querySelector<HTMLElement>("[data-sweep]");
  const surface = document.querySelector<HTMLElement>("[data-sweep-surface]");
  if (!sweep || !surface || surface.dataset.filmSweep === "built") return;
  surface.dataset.filmSweep = "built";
  const source = renderSampleBlocks(doc.current.text);
  const fragment = document.createDocumentFragment();
  const blocks: { raw: HTMLElement; rendered: HTMLElement; at: number }[] = [];
  source.forEach((block, index) => {
    const element = document.createElement("div");
    element.className = "sweep-block";
    const raw = document.createElement("pre");
    raw.className = "sweep-block__raw";
    raw.textContent = block.raw;
    const rendered = document.createElement("div");
    rendered.className = "sweep-block__rendered document-content";
    rendered.innerHTML = block.html;
    element.append(raw, rendered);
    fragment.append(element);
    blocks.push({ raw, rendered, at: 0.2 + (index / Math.max(1, source.length)) * 0.7 });
  });
  surface.append(fragment);
  const track = document.createElement("div");
  track.className = "film-scrub";
  track.innerHTML = `<div class="film-scrub__track" role="slider" tabindex="0" aria-label="Scrub the render" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div class="film-scrub__fill"></div><div class="film-scrub__thumb"></div></div><div class="film-scrub__label"><span>raw bytes</span><span>rendered</span></div>`;
  sweep.append(track);
  const slider = track.querySelector<HTMLElement>(".film-scrub__track")!;
  const paint = (progress: number): void => {
    track.style.setProperty("--scrub", progress.toFixed(4));
    slider.setAttribute("aria-valuenow", String(Math.round(progress * 100)));
    for (const block of blocks) {
      const turn = Math.min(1, Math.max(0, (progress - block.at) / 0.08));
      block.raw.style.opacity = String(1 - Math.min(1, turn * 2));
      block.rendered.style.opacity = String(Math.max(0, (turn - 0.5) * 2));
    }
    const total = surface.scrollHeight - surface.clientHeight;
    if (total > 0) surface.scrollTop = Math.min(1, Math.max(0, (progress - 0.18) / 0.82)) * total;
  };
  let scrubbing = false;
  const setFromClient = (clientX: number): void => {
    const rect = slider.getBoundingClientRect();
    paint(Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)));
  };
  slider.addEventListener("pointerdown", (event) => { scrubbing = true; slider.setPointerCapture(event.pointerId); setFromClient(event.clientX); });
  slider.addEventListener("pointermove", (event) => { if (scrubbing) setFromClient(event.clientX); });
  const end = (): void => { scrubbing = false; };
  slider.addEventListener("pointerup", end);
  slider.addEventListener("pointercancel", end);
  slider.addEventListener("keydown", (event) => {
    const current = Number(slider.getAttribute("aria-valuenow") ?? "0") / 100;
    if (event.key === "ArrowRight" || event.key === "ArrowUp") { event.preventDefault(); paint(Math.min(1, current + 0.05)); }
    if (event.key === "ArrowLeft" || event.key === "ArrowDown") { event.preventDefault(); paint(Math.max(0, current - 0.05)); }
  });
  if (reducedMotion()) paint(1);
  else {
    let played = false;
    const observer = new IntersectionObserver((entries) => {
      if (played || !entries.some((entry) => entry.isIntersecting)) return;
      played = true;
      observer.disconnect();
      const start = performance.now();
      const run = (now: number): void => {
        const t = Math.min(1, (now - start) / 1600);
        paint(1 - Math.pow(1 - t, 3));
        if (t < 1 && !scrubbing) requestAnimationFrame(run);
      };
      requestAnimationFrame(run);
    }, { threshold: 0.35 });
    observer.observe(surface);
  }
}

/* ── Beat 5: real theme controls, same theme engine as the header. ────── */

function initFilmSpill(): void {
  const beat = document.getElementById("film-theme");
  if (!beat) return;
  beat.querySelectorAll<HTMLButtonElement>("[data-film-theme]").forEach((button) => {
    button.addEventListener("click", (event) => {
      const id = button.dataset.filmTheme ?? "warm-dark";
      switchTheme(id, { x: (event as MouseEvent).clientX, y: (event as MouseEvent).clientY });
      beat.querySelectorAll<HTMLButtonElement>("[data-film-theme]").forEach((other) => other.setAttribute("aria-pressed", String(other === button)));
    });
  });
}

export function filmShareMounted(): boolean {
  return Boolean(document.querySelector("#film-handoff [data-share]"));
}
