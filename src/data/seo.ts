export interface Breadcrumb {
  name: string;
  path?: string;
}

export interface PageMeta {
  title: string;
  description: string;
  imagePath?: string;
  markdownPath?: string;
  type?: "website" | "article";
}

export const reviewedOn = "2026-08-16";
export const reviewedLabel = "August 16, 2026";

export const pageMeta = {
  home: {
    title: "Downright | Native Markdown for macOS",
    description: "A free, open-source native Markdown editor and viewer for macOS. Render exact files, review agent rewrites live, and keep every byte local.",
    imagePath: "/og/index.svg",
    markdownPath: "/index.md",
  },
  download: {
    title: "Download Downright for macOS",
    description: "Download the signed Downright Markdown app for macOS 14 or newer, or install it with curl, npm, or the public Homebrew tap.",
    imagePath: "/og/download.svg",
    markdownPath: "/download.md",
  },
  release: {
    title: "Downright 1.0.16 release",
    description: "Downright 1.0.16 is a signed, notarized macOS Markdown app release with Quick Look, Finder integration, Sparkle updates, and the down CLI.",
    imagePath: "/og/releases-1-0-16.svg",
    markdownPath: "/releases/1.0.16.md",
    type: "article" as const,
  },
  themes: {
    title: "Markdown themes for macOS | Downright",
    description: "Explore Downright's six source-derived Markdown themes for macOS, including Paper Light, Warm Dark, Nord, Solarized Light, High Contrast, and System.",
    imagePath: "/og/themes.svg",
    markdownPath: "/themes.md",
  },
  changelog: {
    title: "Downright changelog | Native Markdown app",
    description: "Read the source-grounded Downright changelog for the native macOS Markdown editor, viewer, Quick Look extensions, CLI, and agent-review workflow.",
    imagePath: "/og/changelog.svg",
    markdownPath: "/changelog.md",
  },
  privacy: {
    title: "Downright privacy | Local Markdown for macOS",
    description: "Downright keeps Markdown files local. Learn how the native app, Quick Look extensions, optional Apple Intelligence, and website handle data.",
    imagePath: "/og/privacy.svg",
    markdownPath: "/privacy.md",
  },
  knownGaps: {
    title: "Downright release evidence and known gaps",
    description: "See the current Downright release artifact, installer, Homebrew tap, source provenance, and remaining clean-machine verification work.",
    imagePath: "/og/known-gaps.svg",
    markdownPath: "/known-gaps.md",
  },
  faq: {
    title: "Downright FAQ | Markdown app for macOS",
    description: "Answers about Downright's Markdown rendering, external agent edits, Quick Look, installation, file privacy, supported macOS versions, and license.",
    imagePath: "/og/faq.svg",
    markdownPath: "/faq.md",
  },
  viewer: {
    title: "How to preview and read Markdown on a Mac | Downright",
    description: "A practical guide to previewing Markdown with Finder and Quick Look, then reading and reviewing long local files in Downright.",
    imagePath: "/og/markdown-viewer-mac.svg",
    markdownPath: "/markdown-viewer-mac.md",
    type: "article" as const,
  },
  editors: {
    title: "Free Markdown editors for macOS compared | Downright",
    description: "Compare free Markdown editors for macOS by file ownership, native behavior, preview model, licensing, vault features, and agent-edit review.",
    imagePath: "/og/markdown-editor-mac-free.svg",
    markdownPath: "/markdown-editor-mac-free.md",
    type: "article" as const,
  },
  typora: {
    title: "Downright vs Typora | Native Markdown on macOS",
    description: "Compare Downright and Typora for Markdown editing on macOS, including native rendering, live preview, exact files, licensing, and agent rewrites.",
    imagePath: "/og/downright-vs-typora.svg",
    markdownPath: "/downright-vs-typora.md",
    type: "article" as const,
  },
  obsidian: {
    title: "Downright vs Obsidian | File-first Markdown on macOS",
    description: "Compare Downright and Obsidian for local Markdown, including ordinary project files, vaults, backlinks, external edits, plugins, and privacy.",
    imagePath: "/og/downright-vs-obsidian.svg",
    markdownPath: "/downright-vs-obsidian.md",
    type: "article" as const,
  },
  quickLook: {
    title: "How to preview Markdown with Quick Look on a Mac",
    description: "Use Finder and Quick Look for fast Markdown previews, then use Downright when the file needs full rendering, editing, or external-change review.",
    imagePath: "/og/guides-quick-look-markdown.svg",
    markdownPath: "/guides/quick-look-markdown.md",
    type: "article" as const,
  },
  openMarkdown: {
    title: "How to open a .md file on a Mac",
    description: "Learn the simplest ways to open a Markdown file on macOS with Finder, Quick Look, the down CLI, or a native Markdown editor.",
    imagePath: "/og/guides-open-md-file-mac.svg",
    markdownPath: "/guides/open-md-file-mac.md",
    type: "article" as const,
  },
  externalChanges: {
    title: "Review Markdown files changed by another process",
    description: "A practical explanation of what happens when Claude Code, Codex, a script, or another process rewrites an open Markdown file.",
    imagePath: "/og/guides-markdown-external-changes.svg",
    markdownPath: "/guides/markdown-external-changes.md",
    type: "article" as const,
  },
  claudePlans: {
    title: "How to review Claude Code plans in Markdown",
    description: "Use a native Markdown viewer to inspect Claude Code plans, follow links and tasks, and review changes before accepting an agent rewrite.",
    imagePath: "/og/guides-review-claude-code-plans.svg",
    markdownPath: "/guides/review-claude-code-plans.md",
    type: "article" as const,
  },
  claudeCode: {
    title: "Markdown workflow for Claude Code on macOS",
    description: "A file-first Markdown workflow for Claude Code: keep plans and instructions visible, review external edits, and preserve the source file.",
    imagePath: "/og/markdown-for-agents-claude-code.svg",
    markdownPath: "/markdown-for-agents/claude-code.md",
    type: "article" as const,
  },
  codex: {
    title: "Markdown workflow for Codex on macOS",
    description: "Use Downright with Codex and local Markdown files to read plans, inspect generated documents, and review external changes safely.",
    imagePath: "/og/markdown-for-agents-codex.svg",
    markdownPath: "/markdown-for-agents/codex.md",
    type: "article" as const,
  },
  agentsMd: {
    title: "How to read and review AGENTS.md files on a Mac",
    description: "A practical workflow for reading AGENTS.md and other repository instructions with Finder, Quick Look, the down CLI, and Downright.",
    imagePath: "/og/markdown-for-agents-agents-md.svg",
    markdownPath: "/markdown-for-agents/agents-md.md",
    type: "article" as const,
  },
  macdown: {
    title: "Downright vs MacDown | Markdown editors for macOS",
    description: "Compare Downright and MacDown for native macOS Markdown editing, rendering, file fidelity, Quick Look, and external agent changes.",
    imagePath: "/og/compare-macdown.svg",
    markdownPath: "/compare/macdown.md",
    type: "article" as const,
  },
  marked: {
    title: "Downright vs Marked | Markdown preview on macOS",
    description: "Compare Downright and Marked for Markdown preview on macOS, including editing, file watching, native integration, and agent-review workflows.",
    imagePath: "/og/compare-marked.svg",
    markdownPath: "/compare/marked.md",
    type: "article" as const,
  },
  formats: {
    title: "Markdown formats supported by Downright",
    description: "See the Markdown file extensions Downright opens and the native features it renders, including CommonMark, GFM, math, Mermaid, tables, and tasks.",
    imagePath: "/og/formats.svg",
    markdownPath: "/formats.md",
    type: "article" as const,
  },
  engineering: {
    title: "Downright engineering | Native Markdown rendering",
    description: "How Downright uses AppKit, TextKit 2, native layout, source-preserving decoration, file watching, Quick Look, and the down CLI.",
    imagePath: "/og/engineering.svg",
    markdownPath: "/engineering.md",
    type: "article" as const,
  },
  benchmarks: {
    title: "Downright Markdown rendering benchmarks",
    description: "Read Downright's published baseline measurements, corpus, targets, and limitations for Markdown parsing, editing, diffing, and convergence.",
    imagePath: "/og/benchmarks.svg",
    markdownPath: "/benchmarks.md",
    type: "article" as const,
  },
  press: {
    title: "Downright press and product facts",
    description: "A concise, source-grounded fact sheet for Downright, the native open-source Markdown editor and viewer for macOS.",
    imagePath: "/og/press.svg",
    markdownPath: "/press.md",
    type: "article" as const,
  },
} satisfies Record<string, PageMeta>;

export interface SiteRoute {
  path: string;
  sourceFiles: string[];
}

/**
 * The sitemap owns a small, explicit route manifest. Keeping the dependencies
 * beside each route lets the build derive `lastmod` from the content that can
 * actually change that page instead of stamping every URL with one review date.
 */
export const siteRoutes: SiteRoute[] = [
  { path: "/", sourceFiles: ["src/pages/index.astro", "src/data/site.ts", "src/data/seo.ts"] },
  { path: "/download/", sourceFiles: ["src/pages/download.astro", "src/data/site.ts", "public/download.md"] },
  { path: "/releases/1.0.16/", sourceFiles: ["src/pages/releases/1.0.16.astro", "public/releases/1.0.16.md"] },
  { path: "/themes/", sourceFiles: ["src/pages/themes.astro", "src/data/app/themes.json"] },
  { path: "/changelog/", sourceFiles: ["src/pages/changelog.astro", "src/data/app/changelog.json", "public/changelog.md"] },
  { path: "/privacy/", sourceFiles: ["src/pages/privacy.astro", "public/privacy.md"] },
  { path: "/known-gaps/", sourceFiles: ["src/pages/known-gaps.astro", "public/known-gaps.md"] },
  { path: "/faq/", sourceFiles: ["src/pages/faq.astro", "public/faq.md"] },
  { path: "/markdown-viewer-mac/", sourceFiles: ["src/pages/markdown-viewer-mac.astro", "public/markdown-viewer-mac.md"] },
  { path: "/markdown-editor-mac-free/", sourceFiles: ["src/pages/markdown-editor-mac-free.astro", "public/markdown-editor-mac-free.md"] },
  { path: "/downright-vs-typora/", sourceFiles: ["src/pages/downright-vs-typora.astro", "public/downright-vs-typora.md"] },
  { path: "/downright-vs-obsidian/", sourceFiles: ["src/pages/downright-vs-obsidian.astro", "public/downright-vs-obsidian.md"] },
  { path: "/guides/quick-look-markdown/", sourceFiles: ["src/pages/guides/quick-look-markdown.astro", "public/guides/quick-look-markdown.md"] },
  { path: "/guides/open-md-file-mac/", sourceFiles: ["src/pages/guides/open-md-file-mac.astro", "public/guides/open-md-file-mac.md"] },
  { path: "/guides/markdown-external-changes/", sourceFiles: ["src/pages/guides/markdown-external-changes.astro", "public/guides/markdown-external-changes.md"] },
  { path: "/guides/review-claude-code-plans/", sourceFiles: ["src/pages/guides/review-claude-code-plans.astro", "public/guides/review-claude-code-plans.md"] },
  { path: "/markdown-for-agents/claude-code/", sourceFiles: ["src/pages/markdown-for-agents/claude-code.astro", "public/markdown-for-agents/claude-code.md"] },
  { path: "/markdown-for-agents/codex/", sourceFiles: ["src/pages/markdown-for-agents/codex.astro", "public/markdown-for-agents/codex.md"] },
  { path: "/markdown-for-agents/agents-md/", sourceFiles: ["src/pages/markdown-for-agents/agents-md.astro", "public/markdown-for-agents/agents-md.md"] },
  { path: "/compare/macdown/", sourceFiles: ["src/pages/compare/macdown.astro", "public/compare/macdown.md"] },
  { path: "/compare/marked/", sourceFiles: ["src/pages/compare/marked.astro", "public/compare/marked.md"] },
  { path: "/formats/", sourceFiles: ["src/pages/formats.astro", "public/formats.md"] },
  { path: "/engineering/", sourceFiles: ["src/pages/engineering.astro", "public/engineering.md"] },
  { path: "/benchmarks/", sourceFiles: ["src/pages/benchmarks.astro", "public/benchmarks.md"] },
  { path: "/press/", sourceFiles: ["src/pages/press.astro", "public/press.md"] },
];

export function imagePathForMarkdown(markdownPath: string): string {
  const key = markdownPath
    .replace(/^\//, "")
    .replace(/\.md$/, "")
    .replaceAll("/", "-") || "index";
  return `/og/${key}.svg`;
}
