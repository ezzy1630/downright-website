/**
 * The mobile film (§9): purpose-built for a phone inside the X or Reddit
 * app — not a reduced desktop. Same URL, same living document; below 900px
 * the choreography swaps to six vertical beats that auto-play compressed
 * set pieces with tap-to-interact. Physics and magnetism stay off; the
 * springs are reserved for the set pieces; the close is a handoff (AirDrop
 * the page to your Mac) because they cannot install. Works with JS partially
 * blocked — the readable document stands on its own.
 */

import { doc } from "../kernel/store";
import { renderSampleMarkdown } from "../data/site";

const FILM_QUERY = "(max-width: 900px) and (pointer: coarse)";

export function isFilm(): boolean {
  // ?film forces the choreography from a desktop window — same code path,
  // useful to preview the film before launch.
  if (new URLSearchParams(window.location.search).has("film")) return true;
  return window.matchMedia(FILM_QUERY).matches;
}

export function initFilm(): void {
  if (!isFilm()) return;
  document.documentElement.dataset.film = "true";

  initTapToType();
  initInsertEditChip();
  initLevelPillMirror();
}

/**
 * Beat 1: the document window fills the frame; a short auto-typed line
 * demonstrates Live mode, and "tap to type" opens the real editor with the
 * keyboard. The typing itself is the CM6 editor from the desktop — one
 * engine, two choreographies.
 */
function initTapToType(): void {
  const windowEl = document.querySelector<HTMLElement>("[data-editor-window]");
  if (!windowEl) return;
  const body = windowEl.querySelector<HTMLElement>("[data-window-body]");
  if (!body) return;

  // Auto-typed invitation, one line, then it clears the stage for the reader.
  const caption = document.querySelector<HTMLElement>("[data-film-invite]");
  if (caption) {
    const line = "Type in me — I'm real.";
    let index = 0;
    const type = (): void => {
      if (index <= line.length) {
        caption.textContent = line.slice(0, index);
        index += 1;
        window.setTimeout(type, 55 + Math.random() * 60);
      } else {
        window.setTimeout(() => caption.classList.add("is-settled"), 1400);
      }
    };
    window.setTimeout(type, 700);
  }

  const openEditor = (): void => {
    void import("../editor/mount").then(({ mountEditor }) => {
      if (body.dataset.editorMounted) return;
      body.replaceChildren();
      mountEditor(windowEl, body);
      requestAnimationFrame(() => body.querySelector(".cm-content")?.dispatchEvent(new Event("focus")));
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

/**
 * Beat 3: pinch the document through the five levels (the zoom stage's own
 * two-pointer pinch), with a level pill that mirrors it for tap.
 */
function initLevelPillMirror(): void {
  const stage = document.querySelector<HTMLElement>("[data-zoom-stage]");
  const pill = document.querySelector<HTMLElement>("[data-film-level]");
  if (!stage || !pill) return;
  const names = ["Headings", "Leads", "Artifacts", "Full text", "Everything"];
  const paint = (): void => {
    const level = Number(stage.dataset.zoomLevel ?? "5");
    pill.textContent = names[level - 1] ?? names[4];
  };
  paint();
  const observer = new MutationObserver(paint);
  observer.observe(stage, { attributes: true, attributeFilter: ["data-zoom-level"] });
}

/** The handoff (beat 6) mounts its share cluster; see shell/share.ts. */
export function filmShareMounted(): boolean {
  return Boolean(document.querySelector("[data-share]"));
}
