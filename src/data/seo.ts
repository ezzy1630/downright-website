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

export interface OgCard {
  headline: string;
  kicker: string;
  eyebrow: string;
}

/**
 * Card copy, keyed by mirror path. Page titles and descriptions are written for
 * search results — they carry a brand suffix and run long — so link cards get
 * their own line, written to be read at a glance in a feed.
 */
const ogCards: Record<string, OgCard> = {
  "/index.md": { headline: "The native Markdown app for macOS.", kicker: "Files people and coding agents change together.", eyebrow: "Product" },
  "/download.md": { headline: "Download Downright for macOS.", kicker: "A signed native app for macOS 14 and newer.", eyebrow: "Install" },
  "/releases/1.0.16.md": { headline: "Downright 1.0.16 release facts.", kicker: "Quick Look, Finder, Sparkle, and the down CLI.", eyebrow: "Release" },
  "/themes.md": { headline: "Six palettes. One document.", kicker: "Source-derived themes from the native app.", eyebrow: "Themes" },
  "/changelog.md": { headline: "Version truth, in public.", kicker: "A changelog generated from the app payload.", eyebrow: "Changelog" },
  "/privacy.md": { headline: "Local use is the default.", kicker: "No account. No cloud sync. No core-app telemetry.", eyebrow: "Privacy" },
  "/known-gaps.md": { headline: "Evidence, not promises.", kicker: "Release facts, provenance, and known verification gaps.", eyebrow: "Evidence" },
  "/faq.md": { headline: "Markdown questions, answered.", kicker: "Rendering, external edits, Quick Look, and privacy.", eyebrow: "Faq" },
  "/markdown-viewer-mac.md": { headline: "Preview Markdown on a Mac.", kicker: "Finder for the glance. Downright for the document.", eyebrow: "Guide" },
  "/markdown-editor-mac-free.md": { headline: "Free Markdown editors for Mac.", kicker: "Compare files, native behavior, and review workflows.", eyebrow: "Compare" },
  "/downright-vs-typora.md": { headline: "Downright vs Typora.", kicker: "Native file review versus a focused writing surface.", eyebrow: "Compare" },
  "/downright-vs-obsidian.md": { headline: "Downright vs Obsidian.", kicker: "Ordinary files versus a connected vault.", eyebrow: "Compare" },
  "/guides/quick-look-markdown.md": { headline: "Quick Look your Markdown.", kicker: "Select a file in Finder. Press Space. Keep going.", eyebrow: "Guide" },
  "/guides/open-md-file-mac.md": { headline: "Open a .md file on Mac.", kicker: "Finder, Quick Look, the down CLI, or Downright.", eyebrow: "Guide" },
  "/guides/markdown-external-changes.md": { headline: "The file changed under you.", kicker: "See the rewrite. Keep your work. Take theirs when ready.", eyebrow: "Workflow" },
  "/guides/review-claude-code-plans.md": { headline: "Review a Claude plan.", kicker: "Keep the plan open while the agent writes.", eyebrow: "Agents" },
  "/markdown-for-agents/claude-code.md": { headline: "Claude writes the Markdown.", kicker: "Downright keeps the document visible and reviewable.", eyebrow: "Agents" },
  "/markdown-for-agents/codex.md": { headline: "Codex writes the Markdown.", kicker: "Read plans and review external changes safely.", eyebrow: "Agents" },
  "/markdown-for-agents/agents-md.md": { headline: "Read AGENTS.md.", kicker: "Repository instructions deserve a real document surface.", eyebrow: "Agents" },
  "/compare/macdown.md": { headline: "Downright vs MacDown.", kicker: "A native adaptive surface versus a compact editor-preview pair.", eyebrow: "Compare" },
  "/compare/marked.md": { headline: "Downright vs Marked.", kicker: "A file-aware editor versus a dedicated preview companion.", eyebrow: "Compare" },
  "/formats.md": { headline: "Markdown formats.", kicker: "CommonMark, GFM, math, Mermaid, tables, and tasks.", eyebrow: "Reference" },
  "/engineering.md": { headline: "AppKit + TextKit 2.", kicker: "Source-preserving Markdown rendering without a WebView.", eyebrow: "Engineering" },
  "/benchmarks.md": { headline: "Measure the document.", kicker: "Published parsing, editing, diff, and convergence baselines.", eyebrow: "Benchmarks" },
  "/press.md": { headline: "Downright press kit.", kicker: "Canonical product facts, assets, architecture, and contact.", eyebrow: "Press" },
};

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
 * Falls back to the page's own title and the first sentence of its description,
 * so a page added without card copy still gets a correct card rather than none.
 */
export const ogCard = (markdownPath: string, meta: Pick<PageMeta, "title" | "description">): OgCard =>
  ogCards[markdownPath] ?? {
    headline: meta.title.split("|")[0].trim(),
    kicker: meta.description.split(/(?<=\.)\s+/)[0] ?? meta.description,
    eyebrow: "Downright",
  };

export const ogHeadline = (markdownPath: string, title: string): string =>
  ogCards[markdownPath]?.headline ?? title.split("|")[0].trim();

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
    description: "Download the signed Downright Markdown app for macOS 14 or newer, or install it with the shell installer, npm launcher, or public Homebrew cask.",
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

