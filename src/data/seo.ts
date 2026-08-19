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

/**
 * A page's Open Graph card is derived from its Markdown mirror path, so a route,
 * its mirror and its card cannot drift apart — `scripts/generate-og.mjs` writes
 * the files this resolves to. PNG, because no link-preview crawler renders SVG.
 */
export const ogImagePath = (markdownPath: string): string => {
  const slug = markdownPath.replace(/^\/+/, "").replace(/\.md$/, "").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  return `/og/${slug || "index"}.png`;
};

/**
 * Page titles are written for search results: they carry a brand suffix after a
 * pipe that reads as noise on a link card. These are the headlines the cards
 * actually set, keyed by mirror path so `scripts/generate-og.mjs` and the meta
 * tags resolve the same string.
 */
const ogHeadlines: Record<string, string> = {
  "/index.md": "The native Markdown app for macOS.",
  "/privacy.md": "Local use is the default.",
  "/changelog.md": "Version truth, in public.",
  "/themes.md": "Six palettes. One document.",
  "/faq.md": "Questions, answered from source.",
};

export const ogHeadline = (markdownPath: string, title: string): string =>
  ogHeadlines[markdownPath] ?? title.split("|")[0].trim();

export const reviewedOn = "2026-08-16";
export const reviewedLabel = "August 16, 2026";

export const pageMeta = {
  home: {
    title: "Downright | Native Markdown for macOS",
    description: "A free, open-source native Markdown editor and viewer for macOS. Render exact files, review agent rewrites live, and keep every byte local.",
    markdownPath: "/index.md",
  },
  download: {
    title: "Download Downright for macOS",
    description: "Download the signed Downright Markdown app for macOS 14 or newer, or install it with curl, npm, or the public Homebrew tap.",
    markdownPath: "/download.md",
  },
  release: {
    title: "Downright 1.0.16 release",
    description: "Downright 1.0.16 is a signed, notarized macOS Markdown app release with Quick Look, Finder integration, Sparkle updates, and the down CLI.",
    markdownPath: "/releases/1.0.16.md",
    type: "article" as const,
  },
  themes: {
    title: "Markdown themes for macOS | Downright",
    description: "Explore Downright's six source-derived Markdown themes for macOS, including Paper Light, Warm Dark, Nord, Solarized Light, High Contrast, and System.",
    markdownPath: "/themes.md",
  },
  changelog: {
    title: "Downright changelog | Native Markdown app",
    description: "Read the source-grounded Downright changelog for the native macOS Markdown editor, viewer, Quick Look extensions, CLI, and agent-review workflow.",
    markdownPath: "/changelog.md",
  },
  privacy: {
    title: "Downright privacy | Local Markdown for macOS",
    description: "Downright keeps Markdown files local. Learn how the native app, Quick Look extensions, optional Apple Intelligence, and website handle data.",
    markdownPath: "/privacy.md",
  },
  knownGaps: {
    title: "Downright release evidence and known gaps",
    description: "See the current Downright release artifact, installer, Homebrew tap, source provenance, and remaining clean-machine verification work.",
    markdownPath: "/known-gaps.md",
  },
  faq: {
    title: "Downright FAQ | Markdown app for macOS",
    description: "Answers about Downright's Markdown rendering, external agent edits, Quick Look, installation, file privacy, supported macOS versions, and license.",
    markdownPath: "/faq.md",
  },
  viewer: {
    title: "How to preview and read Markdown on a Mac | Downright",
    description: "A practical guide to previewing Markdown with Finder and Quick Look, then reading and reviewing long local files in Downright.",
    markdownPath: "/markdown-viewer-mac.md",
    type: "article" as const,
  },
  editors: {
    title: "Free Markdown editors for macOS compared | Downright",
    description: "Compare free Markdown editors for macOS by file ownership, native behavior, preview model, licensing, vault features, and agent-edit review.",
    markdownPath: "/markdown-editor-mac-free.md",
    type: "article" as const,
  },
  typora: {
    title: "Downright vs Typora | Native Markdown on macOS",
    description: "Compare Downright and Typora for Markdown editing on macOS, including native rendering, live preview, exact files, licensing, and agent rewrites.",
    markdownPath: "/downright-vs-typora.md",
    type: "article" as const,
  },
  obsidian: {
    title: "Downright vs Obsidian | File-first Markdown on macOS",
    description: "Compare Downright and Obsidian for local Markdown, including ordinary project files, vaults, backlinks, external edits, plugins, and privacy.",
    markdownPath: "/downright-vs-obsidian.md",
    type: "article" as const,
  },
  quickLook: {
    title: "How to preview Markdown with Quick Look on a Mac",
    description: "Use Finder and Quick Look for fast Markdown previews, then use Downright when the file needs full rendering, editing, or external-change review.",
    markdownPath: "/guides/quick-look-markdown.md",
    type: "article" as const,
  },
  openMarkdown: {
    title: "How to open a .md file on a Mac",
    description: "Learn the simplest ways to open a Markdown file on macOS with Finder, Quick Look, the down CLI, or a native Markdown editor.",
    markdownPath: "/guides/open-md-file-mac.md",
    type: "article" as const,
  },
  externalChanges: {
    title: "Review Markdown files changed by another process",
    description: "A practical explanation of what happens when Claude Code, Codex, a script, or another process rewrites an open Markdown file.",
    markdownPath: "/guides/markdown-external-changes.md",
    type: "article" as const,
  },
  claudePlans: {
    title: "How to review Claude Code plans in Markdown",
    description: "Use a native Markdown viewer to inspect Claude Code plans, follow links and tasks, and review changes before accepting an agent rewrite.",
    markdownPath: "/guides/review-claude-code-plans.md",
    type: "article" as const,
  },
  claudeCode: {
    title: "Markdown workflow for Claude Code on macOS",
    description: "A file-first Markdown workflow for Claude Code: keep plans and instructions visible, review external edits, and preserve the source file.",
    markdownPath: "/markdown-for-agents/claude-code.md",
    type: "article" as const,
  },
  codex: {
    title: "Markdown workflow for Codex on macOS",
    description: "Use Downright with Codex and local Markdown files to read plans, inspect generated documents, and review external changes safely.",
    markdownPath: "/markdown-for-agents/codex.md",
    type: "article" as const,
  },
  agentsMd: {
    title: "How to read and review AGENTS.md files on a Mac",
    description: "A practical workflow for reading AGENTS.md and other repository instructions with Finder, Quick Look, the down CLI, and Downright.",
    markdownPath: "/markdown-for-agents/agents-md.md",
    type: "article" as const,
  },
  macdown: {
    title: "Downright vs MacDown | Markdown editors for macOS",
    description: "Compare Downright and MacDown for native macOS Markdown editing, rendering, file fidelity, Quick Look, and external agent changes.",
    markdownPath: "/compare/macdown.md",
    type: "article" as const,
  },
  marked: {
    title: "Downright vs Marked | Markdown preview on macOS",
    description: "Compare Downright and Marked for Markdown preview on macOS, including editing, file watching, native integration, and agent-review workflows.",
    markdownPath: "/compare/marked.md",
    type: "article" as const,
  },
  formats: {
    title: "Markdown formats supported by Downright",
    description: "See the Markdown file extensions Downright opens and the native features it renders, including CommonMark, GFM, math, Mermaid, tables, and tasks.",
    markdownPath: "/formats.md",
    type: "article" as const,
  },
  engineering: {
    title: "Downright engineering | Native Markdown rendering",
    description: "How Downright uses AppKit, TextKit 2, native layout, source-preserving decoration, file watching, Quick Look, and the down CLI.",
    markdownPath: "/engineering.md",
    type: "article" as const,
  },
  benchmarks: {
    title: "Downright Markdown rendering benchmarks",
    description: "Read Downright's published baseline measurements, corpus, targets, and limitations for Markdown parsing, editing, diffing, and convergence.",
    markdownPath: "/benchmarks.md",
    type: "article" as const,
  },
  press: {
    title: "Downright press and product facts",
    description: "A concise, source-grounded fact sheet for Downright, the native open-source Markdown editor and viewer for macOS.",
    markdownPath: "/press.md",
    type: "article" as const,
  },
} satisfies Record<string, PageMeta>;

export const siteRouteDates: Record<string, string> = {
  "/": reviewedOn,
  "/download/": reviewedOn,
  "/releases/1.0.16/": reviewedOn,
  "/themes/": reviewedOn,
  "/changelog/": reviewedOn,
  "/privacy/": reviewedOn,
  "/known-gaps/": reviewedOn,
  "/faq/": reviewedOn,
  "/markdown-viewer-mac/": reviewedOn,
  "/markdown-editor-mac-free/": reviewedOn,
  "/downright-vs-typora/": reviewedOn,
  "/downright-vs-obsidian/": reviewedOn,
  "/guides/quick-look-markdown/": reviewedOn,
  "/guides/open-md-file-mac/": reviewedOn,
  "/guides/markdown-external-changes/": reviewedOn,
  "/guides/review-claude-code-plans/": reviewedOn,
  "/markdown-for-agents/claude-code/": reviewedOn,
  "/markdown-for-agents/codex/": reviewedOn,
  "/markdown-for-agents/agents-md/": reviewedOn,
  "/compare/macdown/": reviewedOn,
  "/compare/marked/": reviewedOn,
  "/formats/": reviewedOn,
  "/engineering/": reviewedOn,
  "/benchmarks/": reviewedOn,
  "/press/": reviewedOn,
};
