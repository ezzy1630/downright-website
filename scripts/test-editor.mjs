/**
 * Headless contract tests for the live-decoration pass (§18.1): runs the
 * real CM6 state through decorateState and asserts on the decoration ranges.
 *   node scripts/test-editor.mjs   (Node ≥ 23 strips types natively)
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { EditorState } from "@codemirror/state";

const here = dirname(fileURLToPath(import.meta.url));
const { decorateState, decorateSourceState } = await import("../src/editor/livedown.ts");
const { Decoration } = await import("@codemirror/view");

const sample = readFileSync(join(here, "../src/data/app/sample.md"), "utf8");

const failures = [];
const check = (name, ok) => {
  if (ok) console.log(`  ok  ${name}`);
  else {
    failures.push(name);
    console.error(`FAIL  ${name}`);
  }
};

const doc = `# Downright renderer showcase

**Inline** · **bold**

- [x] Code · math
- [ ] ship it

\`\`\`swift
func render() {}
\`\`\`

$$
read(source)
$$
`;

const caretElsewhere = EditorState.create({ doc, selection: { anchor: doc.length } });
const caretOnHeading = EditorState.create({ doc, selection: { anchor: 1 } });
const caretOnTask = EditorState.create({ doc, selection: { anchor: doc.indexOf("- [x]") + 2 } });

// 1. Heading: styled, markers elided, one pass. (Line decorations are point
// ranges carrying spec.class; mark decorations span a range.)
const pass1 = decorateState(caretElsewhere);
const lineClasses = pass1.ranges.filter((r) => r.from === r.to).map((r) => r.value.spec.class).filter(Boolean);
check("heading line styled live-h1", lineClasses.includes("live-h1"));
check("heading markers elided", pass1.ranges.some((r) => r.value.spec.class === "live-elided" && r.from === 0 && r.to === 2));

// 2. Caret on the heading line: markers revealed.
const pass2 = decorateState(caretOnHeading);
check("caret reveals markers", !pass2.ranges.some((r) => r.value.spec.class === "live-elided" && r.from === 0));

// 3. Task: checkbox widget replaces the marker, strike when checked.
const tasks = pass1.ranges.filter((r) => r.value.spec.widget?.constructor.name === "TaskCheckbox");
check("task checkbox widgets (2)", tasks.length === 2);
check("checked task struck", pass1.ranges.some((r) => r.value.spec.class === "live-strike"));
const caretTaskPass = decorateState(caretOnTask);
const caretTaskWidgets = caretTaskPass.ranges.filter((r) => r.value.spec.widget?.constructor.name === "TaskCheckbox");
check("caret on task shows raw marker (widget for the other line only)", caretTaskWidgets.length === 1);

// 4. Fence and math line styling.
check("code fence styled", lineClasses.includes("live-code") && lineClasses.includes("live-fence"));
check("math block styled", lineClasses.includes("live-math"));

// 5. The real sample: pass runs, measures honestly, set stays valid.
const samplePass = decorateState(EditorState.create({ doc: sample, selection: { anchor: sample.length } }));
check(`sample pass measured (${samplePass.ms.toFixed(2)} ms)`, samplePass.ms >= 0);
check("sample h2 styled", samplePass.ranges.some((r) => r.from === r.to && r.value.spec.class === "live-h2"));
let setOk = true;
try {
  Decoration.set(samplePass.ranges, true);
} catch {
  setOk = false;
}
check("decoration set valid for the full sample", setOk);

// 6. Hydrating the hero's source pane keeps source presentation stable. The
// editor may own the caret, but it must not switch to live-mode typography or
// hide the Markdown markers on the first click.
const sourcePass = decorateSourceState(EditorState.create({ doc, selection: { anchor: doc.length } }));
const sourceClasses = sourcePass.ranges
  .map((range) => range.value.spec.class)
  .filter(Boolean);
check("source mode keeps heading markers visible", sourceClasses.includes("cm-source-hash"));
check("source mode keeps heading syntax coloured", sourceClasses.includes("cm-source-heading"));
check("source mode never elides raw Markdown", !sourceClasses.includes("live-elided"));
let sourceSetOk = true;
try {
  Decoration.set(sourcePass.ranges, true);
} catch {
  sourceSetOk = false;
}
check("source decoration set valid for the full sample", sourceSetOk);

if (failures.length) {
  console.error(`\n${failures.length} failure(s)`);
  process.exit(1);
}
console.log("\neditor contract tests pass");
