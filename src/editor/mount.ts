/**
 * Hydration for the living document windows. The hero window ships as
 * prerendered HTML (the LCP); the CM6 editor mounts on the first pointer or
 * key event aimed at it, and only then does editor JS cost anything. The
 * status bar carries the honesty meter: the decoration pass per keystroke,
 * measured with performance.now(), labeled "parse" — never paint latency.
 */

import { EditorState } from "@codemirror/state";
import type { Extension } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { history, historyKeymap } from "@codemirror/commands";
import { livedown, decorateState } from "./livedown";
import { recordParse } from "./stats";
import { doc } from "../kernel/store";
import { sound } from "../kernel/sound";

export interface MountedWindow {
  view: EditorView;
  destroy: () => void;
}

function editorExtensions(onParse: (ms: number) => void): Extension[] {
  return [
    history(),
    // Native contenteditable carries caret motion and select-all; the keymap
    // adds undo plus the Cmd-arrow jumps, which must not fall through to
    // native page scrolling while the editor has focus.
    keymap.of([
      ...historyKeymap,
      {
        key: "Mod-ArrowDown",
        preventDefault: true,
        run: (view) => {
          view.dispatch({ selection: { anchor: view.state.doc.length }, scrollIntoView: true });
          return true;
        },
      },
      {
        key: "Mod-ArrowUp",
        preventDefault: true,
        run: (view) => {
          view.dispatch({ selection: { anchor: 0 }, scrollIntoView: true });
          return true;
        },
      },
    ]),
    livedown(),
    EditorView.updateListener.of((update) => {
      if (!update.docChanged) return;
      // The honest measure: one full decoration pass on the resulting doc.
      onParse(decorateState(update.view.state).ms);
      doc.edit(update.state.doc.toString());
      sound.thock();
    }),
    EditorView.theme({
      "&": { height: "100%", fontSize: "16px" },
      ".cm-scroller": { fontFamily: "var(--font-document)", lineHeight: "26px", overflow: "auto" },
      ".cm-content": { paddingBottom: "35vh", caretColor: "var(--accent)" },
      ".cm-line": { padding: "0 10px 0 22px" },
    }),
  ];
}

/**
 * Mount a CM6 view inside a window's body element, replacing its static
 * markup. The static markup is remembered so a document reset can restore it.
 */
export function mountEditor(
  windowEl: HTMLElement,
  bodyEl: HTMLElement,
  options: { onParse?: (ms: number) => void } = {},
): MountedWindow {
  const meter = windowEl.querySelector<HTMLElement>("[data-honesty-meter]");
  const report = (ms: number): void => {
    recordParse(ms);
    if (meter) meter.textContent = `parse ${Math.max(0.05, ms).toFixed(1)} ms`;
    options.onParse?.(ms);
  };

  const view = new EditorView({
    state: EditorState.create({ doc: doc.current.text, extensions: editorExtensions(report) }),
    parent: bodyEl,
  });
  const staticHtml = bodyEl.innerHTML;
  bodyEl.dataset.editorMounted = "true";
  windowEl.dataset.dirty = String(doc.current.dirty);
  doc.subscribe((state) => {
    if (state.text === view.state.doc.toString()) return;
    // External changes (agent resolution, dropped file, reset) land here.
    view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: state.text } });
  });
  return {
    view,
    destroy: () => {
      view.destroy();
      delete bodyEl.dataset.editorMounted;
      bodyEl.innerHTML = staticHtml;
    },
  };
}

/**
 * The hero window hydration gate: static until the visitor means to type.
 * No editor JS executes before this fires.
 */
export function hydrateOnIntent(windowEl: HTMLElement, onMount?: (mounted: MountedWindow) => void): void {
  const body = windowEl.querySelector<HTMLElement>("[data-window-body]");
  if (!body) return;

  const activate = (): void => {
    if (body.dataset.editorMounted) return;
    body.replaceChildren();
    const mounted = mountEditor(windowEl, body);
    requestAnimationFrame(() => mounted.view.focus());
    cleanup();
    onMount?.(mounted);
  };

  const cleanup = (): void => {
    windowEl.removeEventListener("pointerdown", activate);
    windowEl.removeEventListener("keydown", activate);
  };
  windowEl.addEventListener("pointerdown", activate);
  windowEl.addEventListener("keydown", activate);
}
