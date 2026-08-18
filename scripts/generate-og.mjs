import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const output = join(root, "public/og");
const { themes } = JSON.parse(await readFile(join(root, "src/data/app/themes.json"), "utf8"));
const paper = themes.find((theme) => theme.id === "paper-light");
const palette = paper?.palette ?? { background: "#f7f4ee", rule: "#d9d2c8", accent: "#307afe", text: "#292522", heading: "#181513", textSecondary: "#685f56", textFaint: "#8b8178" };
const escape = (value) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const images = {
  index: ["The native Markdown app", "for macOS.", "Files people and coding agents change together.", "PRODUCT"],
  download: ["Download Downright", "for macOS.", "A signed native app for macOS 14 and newer.", "INSTALL"],
  "releases-1-0-16": ["Downright 1.0.16", "release facts.", "Quick Look, Finder, Sparkle, and the down CLI.", "RELEASE"],
  themes: ["Six palettes.", "One document.", "Source-derived themes from the native app.", "THEMES"],
  changelog: ["Version truth,", "in public.", "A changelog generated from the app payload.", "CHANGELOG"],
  privacy: ["Local use", "is the default.", "No account. No cloud sync. No core-app telemetry.", "PRIVACY"],
  "known-gaps": ["Evidence,", "not promises.", "Release facts, provenance, and known verification gaps.", "EVIDENCE"],
  faq: ["Markdown questions,", "answered.", "Rendering, external edits, Quick Look, and privacy.", "FAQ"],
  "markdown-viewer-mac": ["Preview Markdown", "on a Mac.", "Finder for the glance. Downright for the document.", "GUIDE"],
  "markdown-editor-mac-free": ["Free Markdown", "editors for Mac.", "Compare files, native behavior, and review workflows.", "COMPARE"],
  "downright-vs-typora": ["Downright vs", "Typora.", "Native file review versus a focused writing surface.", "COMPARE"],
  "downright-vs-obsidian": ["Downright vs", "Obsidian.", "Ordinary files versus a connected vault.", "COMPARE"],
  "guides-quick-look-markdown": ["Quick Look", "your Markdown.", "Select a file in Finder. Press Space. Keep going.", "GUIDE"],
  "guides-open-md-file-mac": ["Open a .md", "file on Mac.", "Finder, Quick Look, the down CLI, or Downright.", "GUIDE"],
  "guides-markdown-external-changes": ["The file changed", "under you.", "See the rewrite. Keep your work. Take theirs when ready.", "WORKFLOW"],
  "guides-review-claude-code-plans": ["Review a", "Claude plan.", "Keep the plan open while the agent writes.", "AGENTS"],
  "markdown-for-agents-claude-code": ["Claude writes", "the Markdown.", "Downright keeps the document visible and reviewable.", "AGENTS"],
  "markdown-for-agents-codex": ["Codex writes", "the Markdown.", "Read plans and review external changes safely.", "AGENTS"],
  "markdown-for-agents-agents-md": ["Read", "AGENTS.md.", "Repository instructions deserve a real document surface.", "AGENTS"],
  "compare-macdown": ["Downright vs", "MacDown.", "A native adaptive surface versus a compact editor-preview pair.", "COMPARE"],
  "compare-marked": ["Downright vs", "Marked.", "A file-aware editor versus a dedicated preview companion.", "COMPARE"],
  formats: ["Markdown", "formats.", "CommonMark, GFM, math, Mermaid, tables, and tasks.", "REFERENCE"],
  engineering: ["AppKit +", "TextKit 2.", "Source-preserving Markdown rendering without a WebView.", "ENGINEERING"],
  benchmarks: ["Measure the", "document.", "Published parsing, editing, diff, and convergence baselines.", "BENCHMARKS"],
  press: ["Downright", "press kit.", "Canonical product facts, assets, architecture, and contact.", "PRESS"],
};
const canonicalMark = await readFile(join(root, "public/favicon.svg"), "utf8");
const markContent = canonicalMark.replace(/^<svg\b[^>]*>/, "").replace(/<\/svg>\s*$/, "");
const brandMark = `<g transform="translate(77 100) scale(1.1)">${markContent}</g>`;

await mkdir(output, { recursive: true });
for (const [name, lines] of Object.entries(images)) {
  const [headline, subhead, detail, category] = lines;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="${palette.background}"/><path d="M72 86h1056M72 550h1056" stroke="${palette.rule}"/>${brandMark}<text x="116" y="123" fill="${palette.text}" font-family="Arial,sans-serif" font-size="22" font-weight="700">Downright</text><rect x="72" y="174" width="132" height="30" rx="15" fill="${palette.accent}"/><text x="138" y="195" fill="${palette.background}" font-family="Arial,sans-serif" font-size="13" font-weight="700" text-anchor="middle" letter-spacing="1.8">${escape(category)}</text><text x="72" y="300" fill="${palette.heading}" font-family="Georgia,serif" font-size="72">${escape(headline)}</text><text x="72" y="380" fill="${palette.heading}" font-family="Georgia,serif" font-size="72">${escape(subhead)}</text><text x="76" y="458" fill="${palette.textSecondary}" font-family="Arial,sans-serif" font-size="24">${escape(detail)}</text><rect x="730" y="132" width="398" height="300" rx="18" fill="${palette.surface ?? palette.background}" stroke="${palette.rule}"/><rect x="754" y="160" width="350" height="34" rx="8" fill="${palette.rule}" opacity=".46"/><circle cx="776" cy="177" r="5" fill="${palette.accent}"/><path d="M770 234h208M770 260h282M770 286h246M770 342h176M770 368h278" stroke="${palette.textFaint}" stroke-width="4" stroke-linecap="round" opacity=".72"/><path d="M770 418h96" stroke="${palette.accent}" stroke-width="5" stroke-linecap="round"/><text x="1080" y="595" fill="${palette.textFaint}" font-family="monospace" font-size="14" text-anchor="end">downright.cc</text></svg>`;
  await writeFile(join(output, `${name}.svg`), svg);
}
console.log(`Generated ${Object.keys(images).length} route-specific 1200x630 OG SVGs`);
