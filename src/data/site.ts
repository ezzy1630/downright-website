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

export const sections = [
  { id: "hero", label: "Start", detail: "The native Markdown app" },
  { id: "gap", label: "The gap", detail: "It opens badly, and there is more of it than ever" },
  { id: "render", label: "The render", detail: "Your bytes, decorated — never rewritten" },
  { id: "zoom", label: "Structural zoom", detail: "The 3,000 words, at the altitude you need" },
  { id: "agent", label: "The agent visit", detail: "Review the write, win the conflict" },
  { id: "speed", label: "Speed", detail: "Measured with a budget beside it" },
  { id: "architecture", label: "Architecture", detail: "Raw text stays in charge" },
  { id: "reach", label: "System reach", detail: "Finder, Quick Look, terminal" },
  { id: "themes", label: "Themes", detail: "Six palettes, one document" },
  { id: "close", label: "Free and open", detail: "MIT, no account" },
] as const;

export const copy = {
  title: "Downright | The native Markdown app for macOS",
  description: "Downright is a native Markdown reader and editor for macOS. Your coding agents write more Markdown than you'll ever read — Downright renders it exactly, reviews it live, and never touches your bytes.",
  hero: {
    heading: "The native Markdown app for macOS.",
    body: "Your coding agents write more Markdown than you'll ever read — and macOS opens it badly. Downright renders it exactly, reviews it live, and never touches your bytes.",
    micro: "Free · MIT · macOS 14+ · no WebView",
  },
  gap: {
    beatOneHeading: "It opens badly.",
    beatOneBody: "The same file, in macOS Quick Look and in Downright. Drag the divider. One of these is a finished page; the other is the file.",
    beatTwoLine: "Your agents wrote 3,000 words while you read this sentence. Somewhere in there is the one claim that matters.",
  },
  render: {
    heading: "It reads finished.",
    body: "Scroll. The page drives the document in exact proportion, and every capability passes your eyes: math, Mermaid, tables, callouts, tasks, footnotes, code in true theme syntax.",
    closing: "Exact-source rendering. Your bytes, decorated — never rewritten.",
  },
  zoom: {
    heading: "Read at any altitude.",
    body: "The same document, five resolutions: headings, first sentences, artifacts, full text, everything. The anchor under your eyes never moves.",
    closing: "Structural Zoom · ⌃⌥⌘1–5. The 3,000 words, at the altitude you need.",
  },
  speed: {
    heading: "The limit belongs beside the number.",
    body: "These are the app's current baselines, with the corpus, date, and missing measurements stated in the same breath.",
  },
  architecture: {
    heading: "Raw text stays in charge.",
    body: "One adaptive surface moves between Read, Live, and Source Focus. The renderer decorates. It never rewrites the bytes.",
    punctuation: "This page keeps its source too. Press ⌘⇧E.",
  },
  reach: {
    heading: "The document follows the work.",
    body: "Open it from Finder, preview it with Space, flick the cards — they have real weight — or send it through the down command.",
  },
  themes: {
    heading: "Six palettes. One document.",
    body: "The theme engine on this page is the same engine in the app. Choose a palette and watch the ink pour.",
  },
  agent: {
    heading: "The file changes while you read it.",
    body: "What you are about to see is the moment agents make ordinary: an external write lands on the document. Watch the marks, then decide.",
    contextual: "That's what reviewing agent work should feel like.",
  },
  close: {
    heading: "Free. Open source. MIT. No account.",
    body: "No telemetry, no cookies, no server — this page has none. Your Markdown stays on your Mac.",
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

export function renderSampleMarkdown(source = sampleMarkdown): string {
  const lines = source.trim().split(/\r?\n/);
  const html: string[] = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) { index += 1; continue; }
    if (line.startsWith("```")) {
      const language = line.slice(3).trim();
      const block: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].startsWith("```")) block.push(lines[index++]);
      index += 1;
      html.push(language === "mermaid"
        ? mermaidMarkup()
        : `<pre class="doc-code"><span class="code-language">${escapeHtml(language || "text")}</span><code>${syntaxMarkup(block.join("\n"))}</code></pre>`);
      continue;
    }
    if (line === "$$") {
      const block: string[] = [];
      index += 1;
      while (index < lines.length && lines[index] !== "$$") block.push(lines[index++]);
      index += 1;
      html.push(`<div class="doc-math doc-math--block" role="math" aria-label="read of source maps to render of surface">${renderMath(block.join(" "))}</div>`);
      continue;
    }
    if (/^#{1,6} /.test(line)) {
      const match = line.match(/^(#+) (.+)$/);
      if (match) html.push(`<h${match[1].length}>${inlineMarkup(match[2])}</h${match[1].length}>`);
      index += 1;
      continue;
    }
    if (line.startsWith("> [!NOTE]")) {
      const body = lines[index + 1]?.replace(/^> /, "") ?? "";
      html.push(`<aside class="doc-callout"><span class="doc-callout__rule" aria-hidden="true"></span><div><strong>Note</strong><p>${inlineMarkup(body)}</p></div></aside>`);
      index += 2;
      continue;
    }
    if (line.startsWith("|") && lines[index + 1]?.startsWith("|")) {
      const tableRows: string[] = [];
      while (index < lines.length && lines[index].startsWith("|")) tableRows.push(lines[index++]);
      const cells = (row: string) => row.split("|").slice(1, -1).map((cell) => cell.trim());
      const header = cells(tableRows[0]);
      const bodyRows = tableRows.slice(2).map(cells);
      html.push(`<table class="doc-table"><thead><tr>${header.map((cell) => `<th>${inlineMarkup(cell)}</th>`).join("")}</tr></thead><tbody>${bodyRows.map((row) => `<tr>${row.map((cell) => `<td>${inlineMarkup(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table>`);
      continue;
    }
    if (/^- \[[ x]\] /.test(line)) {
      const checked = line.startsWith("- [x]");
      html.push(`<p class="doc-task"><span class="doc-task__check${checked ? " is-checked" : ""}" aria-hidden="true">${checked ? "✓" : ""}</span>${inlineMarkup(line.slice(6))}</p>`);
      index += 1;
      continue;
    }
    if (line.startsWith("- ")) {
      const items: string[] = [];
      while (index < lines.length && lines[index].startsWith("- ")) items.push(`<li>${inlineMarkup(lines[index++].slice(2))}</li>`);
      html.push(`<ul class="doc-list">${items.join("")}</ul>`);
      continue;
    }
    if (line.startsWith("[^1]:")) {
      html.push(`<aside class="doc-footnote"><span>1</span><p>${inlineMarkup(line.slice(5).trim())}</p></aside>`);
      index += 1;
      continue;
    }
    html.push(`<p>${inlineMarkup(line)}</p>`);
    index += 1;
  }
  return html.join("\n");
}

export const sampleHtml = renderSampleMarkdown();
export const themeColorEntries = (theme: AppTheme) => Object.entries(theme.palette);
