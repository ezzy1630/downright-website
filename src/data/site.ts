import themesPayload from "./app/themes.json";
import factsPayload from "./app/facts.json";
import benchmarksPayload from "./app/benchmarks.json";
import changelogPayload from "./app/changelog.json";
import motionPayload from "./app/motion.json";
import sampleMarkdown from "./app/sample.md?raw";

export type AppTheme = (typeof themesPayload.themes)[number] & { id: string };
export type BenchmarkPayload = typeof benchmarksPayload;
export interface ChangelogEntry { version: string; date: string; kind: string; summary: string; }
export interface ChangelogPayload { source: string; entries: ChangelogEntry[]; sourceCommit: string; generatedAt: string; }
export type FactsPayload = typeof factsPayload;

export const themes = themesPayload.themes as AppTheme[];
export const facts = factsPayload as FactsPayload;
export const benchmarks = benchmarksPayload as BenchmarkPayload;
export const changelog = changelogPayload as ChangelogPayload;
export const motion = motionPayload;
export { sampleMarkdown };

export const entityDescription = "Downright is a free, open-source, native Markdown editor and viewer for macOS. It renders files exactly, reviews agent rewrites live, never modifies your bytes, uses no WebView, and is MIT licensed.";

export const sections = [
  { id: "hero", label: "Start", detail: "The native Markdown app" },
  { id: "gap", label: "The difference", detail: "What macOS shows you, and what Downright shows you" },
  { id: "agent", label: "Agent writes", detail: "See what changed, then decide" },
  { id: "speed", label: "Speed", detail: "Every number has a limit beside it" },
  { id: "architecture", label: "How it works", detail: "Your text stays in charge" },
  { id: "reach", label: "Everywhere", detail: "Finder, Quick Look, the terminal" },
  { id: "themes", label: "Themes", detail: "Six themes, one document" },
  { id: "close", label: "Free and open", detail: "MIT, no account" },
] as const;

export const copy = {
  title: "Downright | The native Markdown app for macOS",
  description: entityDescription,
  hero: {
    heading: "The native Markdown app for macOS.",
    body: "Your coding agents write too much Markdown. Downright renders it exactly, reviews rewrites live, and never touches your bytes.",
    micro: "Free · MIT · macOS 14+ · no WebView",
  },
  gap: {
    eyebrow: "The difference",
    lede: "Press Space on a Markdown file today. This is what macOS shows you.",
    capture: "The same bytes above are live DOM — no uploaded image, no detour.",
    closing: "Same file. Same bytes. Downright just renders them.",
    annotation: "same bytes ↑",
    beatTwoHeading: "There is more of it every day.",
    beatTwoLine: "Your agents wrote 3,000 words while you read this sentence. One of them matters. Good luck finding it.",
  },
  render: {
    heading: "Every part of the file renders.",
    body: "Scroll, and the document scrolls with you. Math, diagrams, tables, callouts, tasks, footnotes, and code all render — no plugins, no setup.",
    closing: "Downright decorates your text. It never rewrites it.",
    aside: "Long file? Structural Zoom collapses it to headings, then to first sentences, and back — ⌃⌥⌘1–5, in the app.",
  },
  speed: {
    heading: "Every number here has a limit beside it.",
    body: "These are the app's own measurements. The corpus, the date, and the things we did not measure are all listed below the table.",
  },
  architecture: {
    heading: "Your text stays in charge.",
    body: "One window handles reading, editing, and source. Downright adds styling on top of your file. It never changes what is in it.",
    punctuation: "This page keeps its source too. Press ⌘⇧E.",
  },
  reach: {
    heading: "It opens your files from anywhere.",
    body: "Open a file from Finder. Preview it with Space. Flick a card and it slides — the cards have real weight. Or pipe a file through the down command.",
  },
  themes: {
    heading: "Six themes. One document.",
    body: "This page uses the app's theme engine. Pick a theme and the whole page changes with it.",
  },
  agent: {
    heading: "The file changes while you are reading it.",
    body: "An agent writes to the file you have open. Downright marks every word that changed and waits for you to decide what to keep.",
    contextual: "That is what reviewing agent work should feel like.",
  },
  close: {
    heading: "Free. Open source. MIT. No account.",
    body: "No telemetry, no cookies, no server. This page has none of them. Your Markdown stays on your Mac.",
  },
} as const;

export const supportedExtensionLine = facts.supportedExtensions.map((extension) => `.${extension}`).join(" ");

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/* ── Math ───────────────────────────────────────────────────────────────
   A TeX subset renderer, ~70 lines, no library. The app draws real math; a
   marketing page that shows `$\sqrt{x^2+y^2}$` as literal backslashes is
   advertising the opposite of the product. Variables italic serif, operators
   and function names upright, real superscripts, and a radical whose vinculum
   is a border-top over the radicand — which is how one is actually drawn. */

const MATH_LETTERS: Record<string, string> = {
  alpha: "α", beta: "β", gamma: "γ", delta: "δ", epsilon: "ε", theta: "θ",
  lambda: "λ", mu: "μ", pi: "π", rho: "ρ", sigma: "σ", tau: "τ", phi: "φ",
  omega: "ω", Delta: "Δ", Sigma: "Σ", Omega: "Ω", Pi: "Π",
};

const MATH_SYMBOLS: Record<string, string> = {
  longrightarrow: "⟶", rightarrow: "→", to: "→", mapsto: "↦",
  times: "×", cdot: "·", div: "÷", pm: "±", leq: "≤", geq: "≥", neq: "≠",
  approx: "≈", equiv: "≡", infty: "∞", partial: "∂", sum: "∑", int: "∫",
};

export function renderMath(tex: string): string {
  const source = tex;
  let index = 0;

  const readGroup = (): string => {
    if (source[index] === "{") {
      const groupStart = index + 1;
      let depth = 1;
      index += 1;
      while (index < source.length) {
        if (source[index] === "{") depth += 1;
        else if (source[index] === "}") {
          depth -= 1;
          if (depth === 0) break;
        }
        index += 1;
      }
      const inner = source.slice(groupStart, index);
      index += 1;
      return renderMath(inner);
    }
    return readAtom();
  };

  const readCommand = (): string => {
    index += 1;
    let name = "";
    while (index < source.length && /[a-zA-Z]/.test(source[index])) name += source[index++];
    if (name === "sqrt") {
      return `<span class="math-sqrt"><span class="math-radical" aria-hidden="true">√</span><span class="math-radicand">${readGroup()}</span></span>`;
    }
    if (name === "frac") {
      const over = readGroup();
      const under = readGroup();
      return `<span class="math-frac"><span>${over}</span><span>${under}</span></span>`;
    }
    // \mathrm / \mathop / \operatorname / \text — upright, never italic.
    if (name === "mathrm" || name === "mathop" || name === "operatorname" || name === "text") {
      return `<span class="math-up">${readGroup()}</span>`;
    }
    if (MATH_LETTERS[name]) return `<i class="math-var">${MATH_LETTERS[name]}</i>`;
    if (MATH_SYMBOLS[name]) return `<span class="math-op">${MATH_SYMBOLS[name]}</span>`;
    if (!name) {
      index += 1;
      return "";
    }
    return `<span class="math-up">${escapeHtml(name)}</span>`;
  };

  const readAtom = (): string => {
    const character = source[index];
    if (character === "\\") return readCommand();
    if (character === "{") return readGroup();
    index += 1;
    if (/[A-Za-z]/.test(character)) return `<i class="math-var">${character}</i>`;
    if (/[0-9.]/.test(character)) return `<span class="math-num">${character}</span>`;
    if (/\s/.test(character)) return " ";
    if (character === "-") return '<span class="math-op">−</span>';
    if ("+=<>".includes(character)) return `<span class="math-op">${escapeHtml(character)}</span>`;
    return `<span class="math-punct">${escapeHtml(character)}</span>`;
  };

  let out = "";
  while (index < source.length) {
    const character = source[index];
    if (character === "^" || character === "_") {
      index += 1;
      const body = readGroup();
      out += character === "^" ? `<sup>${body}</sup>` : `<sub>${body}</sub>`;
      continue;
    }
    out += readAtom();
  }
  return out;
}

function inlineMarkup(value: string): string {
  const stashed: string[] = [];
  const stash = (html: string): string => `\u0000${stashed.push(html) - 1}\u0000`;

  // Code spans, math, and wiki links are lifted out BEFORE escaping: their
  // bytes are literal, and entity-escaping LaTeX mangles every backslash group.
  let text = value.replace(/`([^`]+)`/g, (_, code: string) => stash(`<code>${escapeHtml(code)}</code>`));
  text = text.replace(/\$([^$\n]+)\$/g, (_, tex: string) =>
    stash(`<span class="doc-math doc-math--inline">${renderMath(tex)}</span>`));
  // [[wiki]] — the brackets are markup, so they recede; the name is the link.
  text = text.replace(/\[\[([^\]]+)\]\]/g, (_, name: string) =>
    stash(`<span class="doc-wikilink"><i aria-hidden="true">[[</i>${escapeHtml(name)}<i aria-hidden="true">]]</i></span>`));

  const html = escapeHtml(text)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/&lt;(https?:\/\/[^&]+)&gt;/g, '<a href="$1">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/~~([^~]+)~~/g, "<s>$1</s>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/_([^_]+)_/g, "<em>$1</em>")
    .replace(/\[\^([^\]]+)\]/g, '<sup class="doc-footnote-mark">$1</sup>');
  return html.replace(/\u0000(\d+)\u0000/g, (_, index: string) => stashed[Number(index)]);
}

function syntaxMarkup(value: string): string {
  let html = escapeHtml(value);
  const literals: string[] = [];
  html = html.replace(/&quot;[^&]*?&quot;/g, (match) => {
    const index = literals.push(`<span class="syntax-string">${match}</span>`) - 1;
    return `\u0001L${index}L\u0001`;
  });
  html = html
    .replace(/(@MainActor|\b(?:func|let|return)\b)/g, '<span class="syntax-keyword">$1</span>')
    .replace(/\b(String|NSImage)\b/g, '<span class="syntax-type">$1</span>')
    .replace(/\b(render|image|print|count)\b/g, '<span class="syntax-function">$1</span>')
    .replace(/\b\d+\b/g, '<span class="syntax-number">$1</span>');
  return html.replace(/\u0001L(\d+)L\u0001/g, (_, index) => literals[Number(index)]);
}

function mermaidMarkup(): string {
  return `<div class="mermaid-figure" role="img" aria-label="Markdown flows to a decision, then either stays as source or renders as a document"><div class="mermaid-node">MD</div><span class="mermaid-arrow" aria-hidden="true">→</span><div class="mermaid-node mermaid-node--decision">?</div><div class="mermaid-branches"><div><span class="mermaid-label">no</span><span class="mermaid-arrow" aria-hidden="true">→</span><div class="mermaid-node">Keep</div></div><div><span class="mermaid-label">yes</span><span class="mermaid-arrow" aria-hidden="true">→</span><div class="mermaid-node">Render</div></div></div></div>`;
}

/**
 * A document block: the exact source bytes that produced it, and the HTML
 * they render to. The gap act's sweep crossfades one into the other in
 * place, which only reads honestly if both halves come from the same walk of
 * the same string — so the renderer emits pairs and the string join is the
 * derived form, not the other way round.
 */
export interface DocumentBlock {
  raw: string;
  html: string;
}

export function renderSampleBlocks(source = sampleMarkdown): DocumentBlock[] {
  const lines = source.trim().split(/\r?\n/);
  const blocks: DocumentBlock[] = [];
  let index = 0;
  let origin = 0;
  const emit = (html: string): void => {
    blocks.push({ raw: lines.slice(origin, index).join("\n"), html });
  };

  while (index < lines.length) {
    origin = index;
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }
    if (line.startsWith("\`\`\`")) {
      const language = line.slice(3).trim();
      const body: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].startsWith("\`\`\`")) body.push(lines[index++]);
      index += 1;
      emit(language === "mermaid"
        ? mermaidMarkup()
        : `<pre class="doc-code"><span class="code-language">${escapeHtml(language || "text")}</span><code>${syntaxMarkup(body.join("\n"))}</code></pre>`);
      continue;
    }
    if (line === "$$") {
      const body: string[] = [];
      index += 1;
      while (index < lines.length && lines[index] !== "$$") body.push(lines[index++]);
      index += 1;
      emit(`<div class="doc-math doc-math--block" role="math" aria-label="read of source maps to render of surface">${renderMath(body.join(" "))}</div>`);
      continue;
    }
    if (/^#{1,6} /.test(line)) {
      const match = line.match(/^(#+) (.+)$/);
      index += 1;
      if (match) emit(`<h${match[1].length}>${inlineMarkup(match[2])}</h${match[1].length}>`);
      continue;
    }
    if (line.startsWith("> [!NOTE]")) {
      const body = lines[index + 1]?.replace(/^> /, "") ?? "";
      index += 2;
      emit(`<aside class="doc-callout"><span class="doc-callout__rule" aria-hidden="true"></span><div><strong>Note</strong><p>${inlineMarkup(body)}</p></div></aside>`);
      continue;
    }
    if (line.startsWith("|") && lines[index + 1]?.startsWith("|")) {
      const tableRows: string[] = [];
      while (index < lines.length && lines[index].startsWith("|")) tableRows.push(lines[index++]);
      const cells = (row: string) => row.split("|").slice(1, -1).map((cell) => cell.trim());
      const header = cells(tableRows[0]);
      const bodyRows = tableRows.slice(2).map(cells);
      emit(`<table class="doc-table"><thead><tr>${header.map((cell) => `<th>${inlineMarkup(cell)}</th>`).join("")}</tr></thead><tbody>${bodyRows.map((row) => `<tr>${row.map((cell) => `<td>${inlineMarkup(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table>`);
      continue;
    }
    if (/^- \[[ x]\] /.test(line)) {
      const checked = line.startsWith("- [x]");
      const text = line.slice(6);
      index += 1;
      emit(`<p class="doc-task"><span class="doc-task__check${checked ? " is-checked" : ""}" aria-hidden="true">${checked ? "✓" : ""}</span>${inlineMarkup(text)}</p>`);
      continue;
    }
    if (line.startsWith("- ")) {
      const items: string[] = [];
      while (index < lines.length && lines[index].startsWith("- ")) items.push(`<li>${inlineMarkup(lines[index++].slice(2))}</li>`);
      emit(`<ul class="doc-list">${items.join("")}</ul>`);
      continue;
    }
    if (line.startsWith("[^1]:")) {
      const text = line.slice(5).trim();
      index += 1;
      emit(`<aside class="doc-footnote"><span>1</span><p>${inlineMarkup(text)}</p></aside>`);
      continue;
    }
    index += 1;
    emit(`<p>${inlineMarkup(line)}</p>`);
  }
  return blocks;
}

export function renderSampleMarkdown(source = sampleMarkdown): string {
  return renderSampleBlocks(source).map((block) => block.html).join("\n");
}

/* ── The source pane ────────────────────────────────────────────────────
   The hero window ships split: raw bytes on the left, the rendered document
   on the right, both from the same store. This prerenders the left half —
   line numbers and Markdown syntax colour from the app's own token set — so
   the split is real at first paint and CM6 can hydrate straight into it. */

function inlineSource(value: string): string {
  return escapeHtml(value)
    // Math before code: `$PATH` holds a lone $ that would otherwise pair
    // with the closing delimiter of the preceding expression.
    .replace(/(\$[^$]+\$)/g, '<span class="s-math">$1</span>')
    .replace(/(`[^`]+`)/g, '<span class="s-code">$1</span>')
    .replace(/(\*\*[^*]+\*\*)/g, '<span class="s-strong">$1</span>')
    .replace(/(\[\[[^\]]+\]\])/g, '<span class="s-link">$1</span>')
    .replace(/(\[[^\]]+\]\([^)]+\))/g, '<span class="s-link">$1</span>');
}

export function renderSourceMarkdown(source = sampleMarkdown): string {
  const lines = source.replace(/\s+$/, "").split(/\r?\n/);
  let fenced = false;
  return lines
    .map((line, position) => {
      let body: string;
      if (/^```/.test(line)) {
        fenced = !fenced;
        body = `<span class="s-fence">${escapeHtml(line)}</span>`;
      } else if (fenced) {
        body = `<span class="s-fenced">${escapeHtml(line)}</span>`;
      } else if (/^#{1,6} /.test(line)) {
        const heading = line.match(/^(#{1,6}) (.*)$/)!;
        body = `<span class="s-hash">${heading[1]}</span> <span class="s-heading">${escapeHtml(heading[2])}</span>`;
      } else if (line.startsWith("|")) {
        body = `<span class="s-table">${escapeHtml(line)}</span>`;
      } else if (line.startsWith("> ")) {
        body = `<span class="s-quote">${escapeHtml(line)}</span>`;
      } else if (line.startsWith("- ")) {
        const rest = line.slice(2);
        const task = rest.match(/^\[([ x])\] (.*)$/);
        body = task
          ? `<span class="s-marker">-</span> <span class="s-task">[${task[1]}]</span> ${inlineSource(task[2])}`
          : `<span class="s-marker">-</span> ${inlineSource(rest)}`;
      } else if (line.startsWith("[^")) {
        body = `<span class="s-link">${escapeHtml(line)}</span>`;
      } else {
        body = inlineSource(line);
      }
      return `<span class="source-line"><span class="source-line__n" aria-hidden="true">${position + 1}</span><span class="source-line__t">${body || "&#8203;"}</span></span>`;
    })
    .join("");
}

export const sourceHtml = renderSourceMarkdown();

export const sampleHtml = renderSampleMarkdown();
export const themeColorEntries = (theme: AppTheme) => Object.entries(theme.palette);
