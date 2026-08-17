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

type SourceToken = { from: number; to: number; className: string };

const sourceInlinePatterns: ReadonlyArray<readonly [RegExp, string]> = [
  [/`[^`\n]+`/g, "cm-source-code"],
  [/\$[^$\n]+\$/g, "cm-source-math"],
  [/\*\*[^*\n]+\*\*/g, "cm-source-strong"],
  [/\[\[[^\]\n]+\]\]/g, "cm-source-link"],
  [/\[[^\]\n]+\]\([^)]+\)/g, "cm-source-link"],
];

function sourceMark(className: string): Decoration {
  return Decoration.mark({ class: className });
}

function overlaps(left: SourceToken, right: SourceToken): boolean {
  return left.from < right.to && right.from < left.to;
}

function addSourceInlineTokens(
  ranges: Range<Decoration>[],
  text: string,
  offset: number,
): void {
  const tokens: SourceToken[] = [];
  for (const [pattern, className] of sourceInlinePatterns) {
    const matcher = new RegExp(pattern.source, pattern.flags);
    for (const match of text.matchAll(matcher)) {
      const value = match[0];
      const localOffset = match.index ?? 0;
      tokens.push({
        from: offset + localOffset,
        to: offset + localOffset + value.length,
        className,
      });
    }
  }

  tokens.sort((left, right) => left.from - right.from || right.to - left.to);
  const accepted: SourceToken[] = [];
  for (const token of tokens) {
    if (token.from === token.to || accepted.some((existing) => overlaps(existing, token))) continue;
    accepted.push(token);
    ranges.push(sourceMark(token.className).range(token.from, token.to));
  }
}

/**
 * Source mode keeps the bytes and their visual grammar visible while the
 * editor hydrates.  The prerendered source pane already establishes this
 * contract; using the live-document decorations here would hide markers and
 * restyle headings on the first click before the visitor has typed anything.
 */
export function decorateSourceState(state: EditorState): { ranges: Range<Decoration>[]; ms: number } {
  const start = performance.now();
  const ranges: Range<Decoration>[] = [];
  let fenced = false;

  for (let number = 1; number <= state.doc.lines; number += 1) {
    const line = state.doc.line(number);
    const text = line.text;

    if (/^```/.test(text)) {
      ranges.push(sourceMark("cm-source-fence").range(line.from, line.to));
      fenced = !fenced;
      continue;
    }
    if (fenced) {
      ranges.push(sourceMark("cm-source-fenced").range(line.from, line.to));
      continue;
    }

    const heading = /^(#{1,6})(\s+)(.*)$/.exec(text);
    if (heading) {
      ranges.push(sourceMark("cm-source-hash").range(line.from, line.from + heading[1].length));
      const titleFrom = line.from + heading[1].length + heading[2].length;
      ranges.push(sourceMark("cm-source-heading").range(titleFrom, line.to));
      continue;
    }

    if (text.startsWith("|")) {
      ranges.push(sourceMark("cm-source-table").range(line.from, line.to));
      continue;
    }
    if (text.startsWith("> ")) {
      ranges.push(sourceMark("cm-source-quote").range(line.from, line.to));
      continue;
    }
    if (text.startsWith("- ")) {
      ranges.push(sourceMark("cm-source-marker").range(line.from, line.from + 1));
      const task = /^- \[([ xX])\]( ?)(.*)$/.exec(text);
      if (task) {
        const taskFrom = line.from + 2;
        ranges.push(sourceMark("cm-source-task").range(taskFrom, taskFrom + 3));
        addSourceInlineTokens(ranges, task[3], line.from + task[0].length - task[3].length);
      } else {
        addSourceInlineTokens(ranges, text.slice(2), line.from + 2);
      }
      continue;
    }
    if (text.startsWith("[^")) {
      ranges.push(sourceMark("cm-source-link").range(line.from, line.to));
      continue;
    }

    addSourceInlineTokens(ranges, text, line.from);
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

const sourceDecorations = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = Decoration.set(decorateSourceState(view.state).ranges, true);
    }

    update(update: ViewUpdate): void {
      if (update.docChanged || update.selectionSet || update.viewportChanged) {
        this.decorations = Decoration.set(decorateSourceState(update.view.state).ranges, true);
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

export function sourceEditor(): Extension[] {
  return [sourceDecorations, boldKeymap];
}
