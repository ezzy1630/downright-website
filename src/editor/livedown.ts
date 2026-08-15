/**
 * Live-mode decorations for the living document editor, in the app's spirit:
 * markers elide except on the caret line; `# ` renders as a serif heading as
 * you type; `- [ ]` becomes a real checkbox you can click; the source stays
 * exact underneath so ⌘Z and copy behave on raw bytes. Hand-rolled line
 * decorations over CM6's view layer — no markdown parser runtime, keeping
 * the editor inside its ~55KB budget.
 */

import { EditorSelection, EditorState } from "@codemirror/state";
import type { Extension, Range } from "@codemirror/state";
import {
  Decoration,
  type DecorationSet,
  EditorView,
  ViewPlugin,
  WidgetType,
  keymap,
  type ViewUpdate,
} from "@codemirror/view";

class TaskCheckbox extends WidgetType {
  readonly checked: boolean;
  readonly markerFrom: number;

  constructor(checked: boolean, markerFrom: number) {
    super();
    this.checked = checked;
    this.markerFrom = markerFrom;
  }

  eq(other: TaskCheckbox): boolean {
    return other.checked === this.checked && other.markerFrom === this.markerFrom;
  }

  toDOM(view: EditorView): HTMLElement {
    const box = document.createElement("button");
    box.className = `live-task${this.checked ? " is-checked" : ""}`;
    box.setAttribute("role", "checkbox");
    box.setAttribute("aria-checked", String(this.checked));
    box.setAttribute("aria-label", this.checked ? "Mark task open" : "Mark task done");
    box.addEventListener("mousedown", (event) => {
      event.preventDefault();
      const flip = this.checked ? "[ ]" : "[x]";
      view.dispatch({ changes: { from: this.markerFrom, to: this.markerFrom + 3, insert: flip } });
    });
    return box;
  }

  ignoreEvent(): boolean {
    return false;
  }
}

function classifyHeading(line: string): number {
  const match = /^(#{1,6})(\s+)(.*)$/.exec(line);
  return match ? match[1].length : 0;
}

const headingLine = [1, 2, 3, 4, 5, 6].map((level) => Decoration.line({ class: `live-h${level}` }));
const listLine = Decoration.line({ class: "live-list" });
const quoteLine = Decoration.line({ class: "live-quote" });
const codeLine = Decoration.line({ class: "live-code" });
const mathLine = Decoration.line({ class: "live-math" });
const fenceLine = Decoration.line({ class: "live-fence" });
const elide = () => Decoration.mark({ class: "live-elided" });
const strikeMark = Decoration.mark({ class: "live-strike" });

/**
 * One decoration pass over the document state. Returns the ranges plus the
 * pass duration so the honesty meter reports a real measurement. Takes state
 * (not view) so the pass is unit-testable headless.
 */
export function decorateState(state: EditorState): { ranges: Range<Decoration>[]; ms: number } {
  const start = performance.now();
  const ranges: Range<Decoration>[] = [];
  const caretLines = new Set<number>();
  for (const range of state.selection.ranges) {
    caretLines.add(state.doc.lineAt(range.head).number);
  }

  let inFence = false;
  let inMath = false;

  for (let number = 1; number <= state.doc.lines; number += 1) {
    const line = state.doc.line(number);
    const text = line.text;
    const caretHere = caretLines.has(number);

    if (text.startsWith("```")) {
      inFence = !inFence;
      ranges.push(fenceLine.range(line.from));
      continue;
    }
    if (inFence) {
      ranges.push(codeLine.range(line.from));
      continue;
    }

    if (text.trim() === "$$") {
      inMath = !inMath;
      ranges.push(mathLine.range(line.from));
      continue;
    }
    if (inMath) {
      ranges.push(mathLine.range(line.from));
      continue;
    }

    const level = classifyHeading(text);
    if (level > 0) {
      ranges.push(headingLine[level - 1].range(line.from));
      if (!caretHere) {
        ranges.push(elide().range(line.from, line.from + level + 1));
      }
      continue;
    }

    const task = /^(\s*)- \[([ xX])\]( |)(\S.*)$/.exec(text);
    if (task) {
      ranges.push(listLine.range(line.from));
      if (!caretHere) {
        const markerFrom = line.from + task[1].length;
        const checked = task[2] !== " ";
        ranges.push(elide().range(markerFrom, markerFrom + 2));
        ranges.push(
          Decoration.replace({ widget: new TaskCheckbox(checked, markerFrom + 2) }).range(markerFrom + 2, markerFrom + 5),
        );
        if (task[3]) ranges.push(elide().range(markerFrom + 5, markerFrom + 6));
        if (checked) ranges.push(strikeMark.range(markerFrom + 6, line.to));
      }
      continue;
    }

    if (/^\s*- /.test(text)) {
      ranges.push(listLine.range(line.from));
    } else if (/^>\s?/.test(text)) {
      ranges.push(quoteLine.range(line.from));
    }
  }

  return { ranges, ms: performance.now() - start };
}

const liveDecorations = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = Decoration.set(decorateState(view.state).ranges, true);
    }

    update(update: ViewUpdate): void {
      if (update.docChanged || update.selectionSet || update.viewportChanged) {
        this.decorations = Decoration.set(decorateState(update.view.state).ranges, true);
      }
    }
  },
  { decorations: (plugin) => plugin.decorations },
);

/** ⌘B toggles **bold** around the selection, like the app's Live mode. */
const boldKeymap = keymap.of([
  {
    key: "Mod-b",
    preventDefault: true,
    run: (view: EditorView): boolean => {
      const { state } = view;
      const changes = state.changeByRange((range) => {
        const text = state.sliceDoc(range.from, range.to);
        const already = /^\*\*[\s\S]*\*\*$/.test(text);
        const insert = already ? text.slice(2, -2) : `**${text}**`;
        return {
          changes: { from: range.from, to: range.to, insert },
          range: EditorSelection.range(range.from, range.from + insert.length),
        };
      });
      view.dispatch(changes, { scrollIntoView: true });
      return true;
    },
  },
]);

export function livedown(): Extension[] {
  return [liveDecorations, boldKeymap];
}
