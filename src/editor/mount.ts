/**
 * Hydration for the living document window. The hero window ships as
 * prerendered HTML (the LCP); the CM6 editor mounts into a dedicated editor
 * layer on the first pointer or key event aimed at it, and only then does
 * editor JS cost anything. The status bar carries the honesty meter: the
 * decoration pass per keystroke, measured with performance.now(), labeled
 * "parse" — never paint latency.
 */

import { EditorState } from "@codemirror/state";
import type { Extension } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { history, historyKeymap } from "@codemirror/commands";
import { livedown, decorateState } from "./livedown";
import { recordParse } from "./stats";
import { doc } from "../kernel/store";
import { sound } from "../kernel/sound";
import { renderSampleMarkdown } from "../data/site";

export interface MountedWindow {
  view: EditorView;
  destroy: () => void;
}

function editorExtensions(
  onParse: (ms: number) => void,
  onSelection: (view: EditorView) => void,
  onStroke: () => void,
): Extension[] {
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
    // Keep the source surface inside the travelling window at phone widths.
    // CodeMirror's wrapping extension updates line measurements and caret
    // mapping together; CSS-only wrapping leaves long markdown lines clipped
    // while the editor still believes they occupy one horizontal row.
    EditorView.lineWrapping,
    EditorView.updateListener.of((update) => {
      if (update.selectionSet || update.docChanged) onSelection(update.view);
      if (!update.docChanged) return;
      // The honest measure: one full decoration pass on the resulting doc.
      onParse(decorateState(update.view.state).ms);
      onStroke();
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
 * Mount a CM6 view into the window's editor layer. The read layer stays in
 * the DOM (hidden in edit mode) so travel can swap back to it without losing
 * the editor's undo stack or caret.
 */
export function mountEditor(
  windowEl: HTMLElement,
  bodyEl: HTMLElement,
  options: { onParse?: (ms: number) => void } = {},
): MountedWindow {
  const meter = windowEl.querySelector<HTMLElement>("[data-honesty-meter]");
  const readLayer = windowEl.querySelector<HTMLElement>("[data-document-read]");
  const renderedDocument = readLayer?.querySelector<HTMLElement>("[data-static-document]");
  const paintReadLayer = (text: string): void => {
    if (!renderedDocument) return;
    const scrollTop = readLayer?.scrollTop ?? 0;
    renderedDocument.innerHTML = renderSampleMarkdown(text);
    if (readLayer) readLayer.scrollTop = scrollTop;
  };
  const report = (ms: number): void => {
    recordParse(ms);
    if (meter) meter.textContent = `parse ${Math.max(0.05, ms).toFixed(1)} ms`;
    options.onParse?.(ms);
  };

  // The status bar's live readouts. Both are measured, never decorative: the
  // caret position comes from the document itself, and the rate is the
  // visitor's own typing over a trailing 6s window — it reads "— wpm" until
  // there is enough of a sample to report honestly.
  const caretReadout = windowEl.querySelector<HTMLElement>("[data-caret-position]");
  const rateReadout = windowEl.querySelector<HTMLElement>("[data-wps-meter]");
  const dirtyLabel = windowEl.querySelector<HTMLElement>("[data-dirty-label]");
  const strokes: number[] = [];

  const reportCaret = (view: EditorView): void => {
    if (!caretReadout) return;
    const head = view.state.selection.main.head;
    const line = view.state.doc.lineAt(head);
    caretReadout.textContent = `Line ${line.number}, Column ${head - line.from + 1}`;
  };

  const reportRate = (): void => {
    if (!rateReadout) return;
    const now = performance.now();
    strokes.push(now);
    while (strokes.length && now - strokes[0] > 6000) strokes.shift();
    const span = (now - strokes[0]) / 1000;
    if (strokes.length < 8 || span < 1) {
      rateReadout.textContent = "— wpm";
      return;
    }
    // Five characters to a word is the standard typing-rate convention.
    rateReadout.textContent = `${Math.round((strokes.length / 5 / span) * 60)} wpm`;
  };

  let editorLayer = bodyEl.querySelector<HTMLElement>("[data-document-editor]");
  if (!editorLayer) {
    editorLayer = document.createElement("div");
    editorLayer.className = "app-window__editor";
    editorLayer.dataset.documentEditor = "true";
    (bodyEl.querySelector<HTMLElement>("[data-document-source]") ?? bodyEl).append(editorLayer);
  }
  editorLayer.hidden = false;

  const view = new EditorView({
    state: EditorState.create({ doc: doc.current.text, extensions: editorExtensions(report, reportCaret, reportRate) }),
    parent: editorLayer,
  });
  editorLayer.dataset.editorMounted = "true";
  windowEl.dataset.mode = "edit";
  windowEl.dataset.dirty = String(doc.current.dirty);
  reportCaret(view);

  const unsubscribe = doc.subscribe((state) => {
    if (dirtyLabel) dirtyLabel.hidden = !state.dirty;
    // An edited source must remain the same document when the visitor flips
    // to Document or Split. During an agent stream the scene owns this layer
    // so its word-level marks are not erased by the external-write update.
    if (state.agent !== "streaming" && state.agent !== "conflict") paintReadLayer(state.text);
    if (state.text === view.state.doc.toString()) return;
    // External changes (agent resolution, dropped file, reset) land here.
    view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: state.text } });
  });

  return {
    view,
    destroy: () => {
      unsubscribe();
      view.destroy();
      editorLayer.replaceChildren();
      editorLayer.hidden = true;
      delete editorLayer.dataset.editorMounted;
      windowEl.dataset.mode = "read";
    },
  };
}
