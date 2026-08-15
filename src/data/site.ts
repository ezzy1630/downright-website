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

function inlineMarkup(value: string): string {
  const codeSpans: string[] = [];
  let html = escapeHtml(value).replace(/`([^`]+)`/g, (_, code) => {
    const index = codeSpans.push(`<code>${code}</code>`) - 1;
    return `\u0000${index}\u0000`;
  });
  html = html
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/&lt;(https?:\/\/[^&]+)&gt;/g, '<a href="$1">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/~~([^~]+)~~/g, "<s>$1</s>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/_([^_]+)_/g, "<em>$1</em>")
    .replace(/\[\^([^\]]+)\]/g, '<sup class="doc-footnote-mark">$1</sup>');
  return html.replace(/\u0000(\d+)\u0000/g, (_, index) => codeSpans[Number(index)]);
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
      html.push(`<div class="doc-math doc-math--block" aria-label="Rendered math">${inlineMarkup(block.join(" "))}</div>`);
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
