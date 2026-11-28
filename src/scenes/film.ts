/** Phone layout for the live Markdown demo and its companion previews. */

import { doc } from "../kernel/store";
import { benchmarks, themes } from "../data/site";
import { renderSampleMarkdown, renderSampleBlocks, renderSourceMarkdown } from "../kernel/renderer";
import { setWindowView } from "../shell/flip";
import { switchTheme, currentTheme } from "../shell/spill";

export function initFilm(): void {
  const forcedFilm = new URLSearchParams(window.location.search).has("film");
  const compact = window.matchMedia("(max-width: 900px)").matches;
  const windowEl = document.querySelector<HTMLElement>(".hero [data-editor-window]");
  if (!windowEl || (!compact && !forcedFilm)) return;
  document.documentElement.dataset.film = "true";

  windowEl.dataset.slot = "hero";
  windowEl.querySelector<HTMLButtonElement>('[data-view-button="split"]')?.setAttribute("hidden", "");
  setWindowView(windowEl, "document");

  buildFilmVideoBeat();
  buildFilmAgentBeat();
  buildFilmCtaBeat();
  buildFilmThemeBeat();
  initInsertEditChip();
  initSweepThumb();
  initFilmSpill();
  initDeliberateScroll();

  // Each preview reads the same store as the hero. The agent scene owns its
  // own marks while a rewrite or review is in progress.
  const theme = document.querySelector("[data-film-theme-preview]");
  const agent = document.querySelector("#film-agent [data-static-document]");
  const hero = windowEl.querySelector("[data-static-document]");
  const source = windowEl.querySelector("[data-static-source]");
  let lastText: string | undefined;
  doc.subscribe((state) => {
    const text = doc.editableText;
    if (text === lastText) return;
    lastText = text;
    const html = renderSampleMarkdown(text);
    if (theme) theme.innerHTML = html;
    if (agent && state.agent !== "conflict" && state.agent !== "streaming") agent.innerHTML = html;
    if (hero && !windowEl.querySelector('[data-editor-mounted="true"]')) {
      hero.innerHTML = html;
      if (source) source.innerHTML = renderSourceMarkdown(text);
    }
  });
}

/** The real app on a real Mac: the vertical launch film, loaded only on tap. */
function buildFilmVideoBeat(): void {
  const section = document.getElementById("gap");
  if (!section || document.getElementById("film-video")) return;
  const beat = document.createElement("section");
  beat.className = "film-beat film-beat--video";
  beat.id = "film-video";
  beat.dataset.rest = "film-video";
  beat.setAttribute("aria-label", "The app on a Mac");
  beat.innerHTML = `
    <p class="eyebrow">On a Mac</p>
    <h2 class="film-beat__title">The real app, in 33 seconds.</h2>
    <p class="film-beat__line">An agent edit landing live, Quick Look in Finder, and the built-in themes.</p>
    <video class="film-video" controls playsinline preload="none" width="1600" height="900" poster="/assets/downright-launch-film-poster.jpg" aria-label="Downright launch film">
      <source src="/assets/downright-launch-film.mp4" type="video/mp4">
    </video>`;
  section.before(beat);
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
    <p class="eyebrow">Agent visit</p>
    <h2 class="film-beat__title">See the rewrite. Keep the file.</h2>
    <p class="film-beat__line">The document stays open while an agent writes. Every changed word is marked before you choose. Try an external edit.</p>
    <div class="film-agent-stage" data-agent-stage>
      <div class="film-preview" data-agent-document>
        <div class="film-preview__bar"><b>sample.md</b><span>Live changes</span></div>
        <div class="film-preview__body">
          <div class="film-preview__read" data-document-read tabindex="0" aria-label="External edit preview">
            <div class="document-content" data-static-document></div>
          </div>
          <div class="conflict-bar" data-conflict-bar role="region" aria-label="External write needs review" hidden>
            <strong>You have edits in this file.</strong>
            <button type="button" data-conflict-action="review" data-conflict-focus>Review</button>
            <button type="button" data-conflict-action="mine">Keep Mine</button>
            <button type="button" data-conflict-action="theirs">Take Theirs</button>
          </div>
        </div>
      </div>
      <div class="film-agent-stage__actions">
        <button type="button" class="film-chip" data-film-rewrite disabled>Try an external edit</button>
        <span class="film-agent-stage__summary" data-change-toast role="status" aria-live="polite"><span data-change-summary></span></span>
      </div>
      <dialog class="review-panel" data-review-panel aria-label="Review the external edit"></dialog>
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
  beat.setAttribute("aria-label", "Performance");
  beat.innerHTML = `
    <p class="eyebrow">A small engine</p>
    <h2 class="film-beat__title">Less time. Less memory.</h2>
    <div class="film-compact-benchmark" aria-label="Performance benchmarks">
      ${benchmarks.pipeline.rows.filter((row) => ["Full parse", "Text diff", "Typing/storage"].includes(row.measurement)).map((row) => `<div><span>${row.measurement}</span><strong>${row.after}</strong></div>`).join("")}
    </div>
    <p class="film-beat__line">p95 latency on Apple M4. <a href="/benchmarks/">All benchmarks and test conditions</a>.</p>`;
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
    <p class="eyebrow">Themes</p>
    <h2 class="film-beat__title">One tap re-inks the page.</h2>
    <p class="film-beat__line">Try the app’s six themes on the same Markdown file.</p>
    <div class="film-theme-stage">
      <div class="film-spill" role="group" aria-label="Choose a theme">
        ${themes.map((theme) => `<button type="button" data-film-theme="${theme.id}" aria-pressed="${theme.id === currentTheme()}"><span class="swatch" style="background:${theme.palette.background};border-color:${theme.palette.accent}"></span>${theme.name}</button>`).join("")}
      </div>
      <div class="film-preview film-preview--theme">
        <div class="film-preview__bar"><b>sample.md</b><span>Theme preview</span></div>
        <div class="film-preview__read" tabindex="0" aria-label="Theme preview">
          <div class="document-content" data-film-theme-preview></div>
        </div>
      </div>
    </div>`;
  section.before(beat);
}

/**
 * A preview pane scrolls on its own only after the visitor picks it: a tap,
 * focus, or one of its controls. Until then a thumb resting on a preview
 * moves the page, like on any other document.
 */
function initDeliberateScroll(): void {
  const demos: [demo: string, scroller: string][] = [
    [".hero__window", ".app-window__read"],
    ["[data-agent-stage]", ".film-preview__read"],
    [".film-theme-stage", ".film-preview__read"],
    [".gap-section .sweep", ".sweep__surface"],
  ];
  for (const [demoSelector, scrollerSelector] of demos) {
    const demo = document.querySelector<HTMLElement>(demoSelector);
    if (!demo) continue;
    const engage = (): void => {
      for (const scroller of demo.querySelectorAll<HTMLElement>(scrollerSelector)) scroller.dataset.scrollEngaged = "true";
    };
    for (const type of ["click", "focusin", "input"]) demo.addEventListener(type, engage, { once: true });
  }
}

function initInsertEditChip(): void {
  const chip = document.querySelector<HTMLButtonElement>("[data-film-insert]");
  if (!chip) return;
  chip.addEventListener("click", () => {
    doc.edit(`${doc.editableText}

- [ ] Try Downright on my Mac`);
    chip.textContent = "Edit inserted";
    const read = document.querySelector<HTMLElement>(".hero [data-document-read]");
    if (read && read.getClientRects().length) read.scrollTop = read.scrollHeight;
  }, { once: true });
}

/* ── Beat 2: the raw-to-render sweep, driven by a thumb. ──────────────── */

function initSweepThumb(): void {
  const sweep = document.querySelector<HTMLElement>("[data-sweep]");
  const slot = document.querySelector<HTMLElement>("[data-window-slot=gap]");
  if (!sweep || !slot || slot.dataset.filmSweep === "built") return;
  slot.dataset.filmSweep = "built";
  // The lede keeps the desktop's framing; the drag hint ships in the markup.
  // The desktop re-parents THE window into this slot; the film has no travel,
  // so it builds the simpler sheet inline — same chrome story (Quick Look
  // first, Downright after the line passes), lighter bones.
  slot.innerHTML = `<div class="sweep__window" data-sweep-window data-fingerprint="sweep" data-crop-ok>
    <div class="sweep__bar">
      <span class="traffic-lights traffic-lights--ql" aria-hidden="true"><i></i></span>
      <span class="traffic-lights traffic-lights--app" aria-hidden="true"><i></i><i></i><i></i></span>
      <span class="sweep__title">sample.md</span>
      <span class="sweep__action sweep__action--ql">Quick Look</span>
      <span class="sweep__action sweep__action--app">Downright</span>
    </div>
    <div class="sweep__surface" data-sweep-surface>
      <i class="sweep__line" data-sweep-line aria-hidden="true"></i>
    </div>
  </div>`;
  const surface = slot.querySelector<HTMLElement>("[data-sweep-surface]");
  if (!surface) return;
  const source = syntaxSlice(renderSampleBlocks(doc.current.text));
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
    blocks.push({ raw, rendered, at: 0.08 + (index / Math.max(1, source.length)) * 0.84 });
  });
  surface.append(fragment);
  const windowEl = surface.closest<HTMLElement>("[data-sweep-window]");
  if (windowEl) windowEl.dataset.chrome = "ql";
  const track = document.createElement("div");
  track.className = "film-scrub";
  track.innerHTML = `<input class="film-scrub__track" type="range" min="0" max="100" value="0" aria-label="Markdown rendering"><div class="film-scrub__label" aria-hidden="true"><span>Markdown</span><span>Rendered</span></div>`;
  sweep.append(track);
  const slider = track.querySelector<HTMLInputElement>("input")!;
  const paint = (): void => {
    const progress = slider.valueAsNumber / 100;
    slider.style.setProperty("--scrub", slider.value + "%");
    slider.setAttribute("aria-valuetext", progress === 0 ? "Markdown" : progress === 1 ? "Rendered" : `${slider.value}% rendered`);
    if (windowEl) windowEl.dataset.chrome = progress >= 0.86 ? "app" : "ql";
    for (const block of blocks) {
      const handedOff = progress >= block.at;
      block.raw.toggleAttribute("inert", handedOff);
      block.raw.style.visibility = handedOff ? "hidden" : "visible";
      block.rendered.toggleAttribute("inert", !handedOff);
      block.rendered.style.visibility = handedOff ? "visible" : "hidden";
    }
  };
  slider.addEventListener("input", paint);
  paint();
}

/**
 * The opening prose looks nearly the same raw and rendered, so the slider
 * starts at the syntax-heavy run (inline marks through the task list) where
 * the difference is obvious. Falls back to every block if the sample changes.
 */
function syntaxSlice<T extends { raw: string }>(blocks: T[]): T[] {
  const start = blocks.findIndex((block) => block.raw.startsWith("**Inline**"));
  if (start < 0) return blocks;
  let end = start + 1;
  while (end < blocks.length && !blocks[end].raw.startsWith("```") && !blocks[end].raw.startsWith("**Syntax**")) end += 1;
  return blocks.slice(start, end);
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
