/**
 * The mobile film (§9): purpose-built for a phone inside the X or Reddit
 * app — not a reduced desktop. Same URL, same living document; below 900px
 * (or under ?film) the page's own sections become six vertical beats that
 * auto-play compressed set pieces and open to the thumb.
 *
 *   1 Hero — the document window fills the frame; an auto-typed line demos
 *      Live mode; "tap to type" opens the real CM6 editor with the keyboard.
 *   2 The gap — the render-line sweep, scrubbed by a full-width thumb track.
 *   3 Zoom — pinch the document through the five structural levels.
 *   4 The agent visit — streams on entry (once); Keep Mine / Take Theirs are
 *      big thumb targets and the reader still wins the conflict.
 *   5 Theme spill — six swatches; a tap re-inks the whole film through OKLab.
 *   6 The handoff — AirDrop the page to your Mac (navigator.share), copy
 *      link, mailto. No email capture, no server.
 *
 * One-window rule: the film never builds a second .app-window. Beats are
 * scenes on the same shared store; the chrome window stays the hero's and
 * keeps travelling. Physics and magnetism stay off; springs are reserved for
 * the set pieces. Works with JS partially blocked — the document still reads.
 */

import { doc } from "../kernel/store";
import { renderSampleMarkdown, renderSampleBlocks, themes } from "../data/site";
import { reducedMotion } from "../kernel/switchboard";
import { switchTheme, currentTheme } from "../shell/spill";

const FILM_QUERY = "(max-width: 900px) and (pointer: coarse)";

export function isFilm(): boolean {
  // ?film forces the choreography from a desktop window — same code path,
  // useful to preview the film before launch.
  if (new URLSearchParams(window.location.search).has("film")) return true;
  return window.matchMedia(FILM_QUERY).matches;
}

const ZOOM_NAMES = ["Headings", "Leads", "Artifacts", "Full text", "Everything"];

export function initFilm(): void {
  if (!isFilm()) return;
  document.documentElement.dataset.film = "true";

  initTapToType();
  initInsertEditChip();
  initSweepThumb();
  initFilmZoom();
  initFilmSpill();
}

/* ── Beat 1 · hero ─────────────────────────────────────────────────────── */

function initTapToType(): void {
  const windowEl = document.querySelector<HTMLElement>("[data-editor-window]");
  if (!windowEl) return;
  const body = windowEl.querySelector<HTMLElement>("[data-window-body]");
  if (!body) return;

  // Auto-typed invitation, one line, then it clears the stage for the reader.
  const caption = document.querySelector<HTMLElement>("[data-film-invite]");
  if (caption && !reducedMotion()) {
    const line = "This window is real. Type in it.";
    let index = 0;
    const type = (): void => {
      if (index <= line.length) {
        caption.textContent = line.slice(0, index);
        index += 1;
        window.setTimeout(type, 52 + Math.random() * 58);
      } else {
        window.setTimeout(() => caption.classList.add("is-settled"), 1500);
      }
    };
    window.setTimeout(type, 700);
  } else if (caption) {
    caption.textContent = "This window is real. Type in it.";
    caption.classList.add("is-settled");
  }

  const openEditor = (): void => {
    void import("../editor/mount").then(({ mountEditor }) => {
      if (body.dataset.editorMounted) return;
      mountEditor(windowEl, body);
      requestAnimationFrame(() => body.querySelector<HTMLElement>(".cm-content")?.focus());
    });
  };
  document.querySelector<HTMLButtonElement>("[data-film-type]")?.addEventListener("click", openEditor);
}

/** The keyboard-averse still dirty the buffer — the agent act needs them too. */
function initInsertEditChip(): void {
  const chip = document.querySelector<HTMLButtonElement>("[data-film-insert]");
  if (!chip) return;
  chip.addEventListener("click", () => {
    doc.edit(`${doc.current.text}\n\n- [ ] tapped from the phone — the Mac gets the real thing`);
    const surface = document.querySelector<HTMLElement>("[data-document-read] [data-static-document]");
    if (surface) surface.innerHTML = renderSampleMarkdown(doc.current.text);
    const label = chip.textContent ?? "";
    chip.textContent = "inserted ✓";
    window.setTimeout(() => {
      chip.textContent = label;
    }, 1600);
  });
}

/* ── Beat 2 · the gap, by thumb ────────────────────────────────────────── */

function initSweepThumb(): void {
  const stage = document.querySelector<HTMLElement>("[data-sweep-stage]");
  const sweep = document.querySelector<HTMLElement>("[data-sweep]");
  const surface = document.querySelector<HTMLElement>("[data-sweep-surface]");
  if (!stage || !sweep || !surface) return;
  if (surface.dataset.filmSweep === "built") return;
  surface.dataset.filmSweep = "built";
  // On the film the pinned stage collapses and the desktop sweep stands down
  // (initGap checks data-film), so this thumb track is the only driver.
  stage.classList.add("sweep-stage--film");

  // Build the same two-state blocks the desktop sweep uses, then hand the
  // render line to a thumb track instead of the page's scroll.
  const source = renderSampleBlocks(doc.current.text);
  const fragment = document.createDocumentFragment();
  const blocks: { raw: HTMLElement; rendered: HTMLElement; at: number }[] = [];
  const SWEEP_START = 0.2;
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
    blocks.push({ raw, rendered, at: SWEEP_START + (index / Math.max(1, source.length)) * (1 - SWEEP_START - 0.08) });
  });
  surface.append(fragment);

  const track = document.createElement("div");
  track.className = "film-scrub";
  track.innerHTML = `
    <div class="film-scrub__track" role="slider" tabindex="0" aria-label="Scrub the render"
         aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-orientation="horizontal">
      <div class="film-scrub__fill"></div>
      <div class="film-scrub__thumb"></div>
    </div>
    <div class="film-scrub__label"><span>raw bytes</span><span>rendered</span></div>`;
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
    // Scroll the surface so the render line sits a third of the way down the
    // window — the bytes above are already rendered, the ones below still raw.
    const total = surface.scrollHeight - surface.clientHeight;
    if (total > 0) {
      const anchor = Math.min(1, Math.max(0, (progress - 0.18) / (1 - SWEEP_START)));
      surface.scrollTop = anchor * total;
    }
  };

  let scrubbing = false;
  const setFromClient = (clientX: number): void => {
    const rect = slider.getBoundingClientRect();
    paint(Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)));
  };
  slider.addEventListener("pointerdown", (event) => {
    scrubbing = true;
    slider.setPointerCapture(event.pointerId);
    setFromClient(event.clientX);
  });
  slider.addEventListener("pointermove", (event) => {
    if (scrubbing) setFromClient(event.clientX);
  });
  const end = (): void => {
    scrubbing = false;
  };
  slider.addEventListener("pointerup", end);
  slider.addEventListener("pointercancel", end);
  slider.addEventListener("keydown", (event) => {
    const current = Number(slider.getAttribute("aria-valuenow") ?? "0") / 100;
    if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      event.preventDefault();
      paint(Math.min(1, current + 0.05));
    }
    if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      event.preventDefault();
      paint(Math.max(0, current - 0.05));
    }
  });

  // The film auto-plays the sweep once on visibility so a passive scroller
  // still sees the bytes become the page; the thumb can then re-drive it.
  if (!reducedMotion()) {
    let played = false;
    const observer = new IntersectionObserver(
      (entries) => {
        if (played || !entries.some((entry) => entry.isIntersecting)) return;
        played = true;
        observer.disconnect();
        const start = performance.now();
        const run = (now: number): void => {
          const t = Math.min(1, (now - start) / 1600);
          const eased = 1 - Math.pow(1 - t, 3);
          paint(eased);
          if (t < 1 && !scrubbing) requestAnimationFrame(run);
        };
        requestAnimationFrame(run);
      },
      { threshold: 0.35 },
    );
    observer.observe(surface);
  } else {
    paint(1);
  }
}
/* ── Beat 3 · zoom: pinch the document ─────────────────────────────────── */

function initFilmZoom(): void {
  const section = document.getElementById("agent");
  if (!section) return;

  // A dedicated film beat inserted before the agent visit. It renders the
  // shared document into its own touch surface — a scene, not a window.
  const beat = document.createElement("section");
  beat.className = "film-beat";
  beat.id = "film-zoom";
  beat.setAttribute("aria-label", "Structural zoom");
  beat.innerHTML = `
    <p class="film-beat__kicker">Structural zoom</p>
    <h2 class="film-beat__title">Read at any altitude.</h2>
    <p class="film-beat__line">Pinch the document — or tap a level — and it collapses from full text to headings. The line you were reading stays put.</p>
    <div class="film-beat__stage">
      <div class="film-zoom" data-film-zoom>
        <div class="film-zoom__doc document-content" data-film-zoom-doc></div>
        <div class="film-zoom__levels" role="group" aria-label="Zoom level">
          ${[1, 2, 3, 4, 5].map((n) => `<button type="button" data-zoom-level="${n}" aria-pressed="${n === 5}">${n}</button>`).join("")}
        </div>
      </div>
      <p class="film-beat__hint">Structural Zoom · ⌃⌥⌘1–5 in the app · <span class="film-level-pill" data-film-level>Everything</span></p>
    </div>`;
  section.before(beat);

  const docEl = beat.querySelector<HTMLElement>("[data-film-zoom-doc]")!;
  const stageEl = beat.querySelector<HTMLElement>("[data-film-zoom]")!;
  const pill = beat.querySelector<HTMLElement>("[data-film-level]");

  const render = (): void => {
    docEl.innerHTML = renderSampleMarkdown(doc.current.text);
  };
  render();
  doc.subscribe(render);

  let current = 5;
  const setLevel = (level: number): void => {
    current = Math.min(5, Math.max(1, level));
    stageEl.dataset.zoomLevel = String(current);
    const blocks = [...docEl.children] as HTMLElement[];
    for (const block of blocks) {
      const tag = block.tagName.toLowerCase();
      const isHeading = /^h[1-6]$/.test(tag);
      const isArtifact = tag === "pre" || tag === "table" || block.classList.contains("mermaid-figure") || block.classList.contains("doc-math--block");
      const min = isHeading ? 1 : isArtifact ? 3 : 4;
      block.style.display = min <= current ? "" : "none";
    }
    for (const button of beat.querySelectorAll<HTMLButtonElement>("[data-zoom-level]")) {
      button.setAttribute("aria-pressed", String(Number(button.dataset.zoomLevel) === current));
    }
    if (pill) pill.textContent = ZOOM_NAMES[current - 1];
  };

  beat.querySelectorAll<HTMLButtonElement>("[data-zoom-level]").forEach((button) => {
    button.addEventListener("click", () => setLevel(Number(button.dataset.zoomLevel)));
  });

  // Touch pinch: two pointers on the stage change the level.
  const pointers = new Map<number, { x: number; y: number }>();
  let pinchDistance = 0;
  stageEl.addEventListener("pointerdown", (event) => {
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  });
  stageEl.addEventListener("pointermove", (event) => {
    if (!pointers.has(event.pointerId)) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size !== 2) return;
    const [a, b] = [...pointers.values()];
    const distance = Math.hypot(a.x - b.x, a.y - b.y);
    if (pinchDistance && Math.abs(distance - pinchDistance) > 26) {
      setLevel(current + (distance > pinchDistance ? 1 : -1));
      pinchDistance = distance;
    } else if (!pinchDistance) {
      pinchDistance = distance;
    }
  });
  const endPinch = (event: PointerEvent): void => {
    pointers.delete(event.pointerId);
    if (pointers.size < 2) pinchDistance = 0;
  };
  stageEl.addEventListener("pointerup", endPinch);
  stageEl.addEventListener("pointercancel", endPinch);

  setLevel(5);
}

/* ── Beat 5 · theme spill ──────────────────────────────────────────────── */

function initFilmSpill(): void {
  const themesSection = document.getElementById("themes");
  if (!themesSection) return;

  const beat = document.createElement("section");
  beat.className = "film-beat";
  beat.id = "film-spill";
  beat.setAttribute("aria-label", "Theme spill");
  beat.innerHTML = `
    <p class="film-beat__kicker">Themes</p>
    <h2 class="film-beat__title">One tap re-inks the page.</h2>
    <p class="film-beat__line">The whole film runs on the app's real theme engine. Pick one and the ink pours across the paper.</p>
    <div class="film-beat__stage">
      <div class="film-spill" role="group" aria-label="Choose a theme">
        ${themes
          .filter((theme) => theme.id !== "system")
          .map(
            (theme) => `
          <button type="button" data-film-theme="${theme.id}" aria-pressed="${theme.id === currentTheme()}">
            <span class="swatch" style="background:${theme.palette.background};border-color:${theme.palette.accent}"></span>
            ${theme.name}
          </button>`,
          )
          .join("")}
      </div>
    </div>`;
  themesSection.before(beat);

  beat.querySelectorAll<HTMLButtonElement>("[data-film-theme]").forEach((button) => {
    button.addEventListener("click", (event) => {
      const id = button.dataset.filmTheme ?? "warm-dark";
      switchTheme(id, { x: (event as MouseEvent).clientX, y: (event as MouseEvent).clientY });
      for (const other of beat.querySelectorAll<HTMLButtonElement>("[data-film-theme]")) {
        other.setAttribute("aria-pressed", String(other.dataset.filmTheme === id));
      }
    });
  });
}

/** The handoff (beat 6) mounts its share cluster; see shell/share.ts. */
export function filmShareMounted(): boolean {
  return Boolean(document.querySelector("[data-share]"));
}

