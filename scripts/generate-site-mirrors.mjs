import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const publicRoot = join(root, "public");
const dataRoot = join(root, "src/data/app");
const readJson = (name) => readFile(join(dataRoot, name), "utf8").then(JSON.parse);
const plain = (value) => value.replace(/[—–]/g, "-").replace(/\s+/g, " ").trim();
const entityDescription = "Downright is a free, open-source, native Markdown editor and viewer for macOS. It renders files exactly, reviews agent rewrites live, never modifies your bytes, uses no WebView, and is MIT licensed.";
const [themes, benchmarks, facts, changelog] = await Promise.all(["themes.json", "benchmarks.json", "facts.json", "changelog.json"].map(readJson));
const improvements = benchmarks.optimizations;
const pipeline = benchmarks.pipeline;
const performanceSource = `${facts.repository}/blob/${benchmarks.sourceCommit}/${benchmarks.source}`;
const comparisonTable = `| Measurement | Sample type | Before | After | Reduction |\n|---|---|---:|---:|---:|\n${improvements.rows.map((row) => `| ${row.measurement} | ${row.statistic} | ${row.before} | ${row.after} | ${row.reduction} |`).join("\n")}`;
const pipelineTable = `| Measurement | Before (p95) | After (p95) | Less time |\n|---|---:|---:|---:|\n${pipeline.rows.map((row) => `| ${row.measurement} | ${row.before} | ${row.after} | ${row.reduction} |`).join("\n")}`;
const pipelineConditions = `${pipeline.machine}, ${pipeline.date}. ${pipeline.qualification} Corpus: ${pipeline.corpus}.`;
const pipelineSource = `${facts.repository}/blob/${benchmarks.sourceCommit}/${pipeline.evidencePath}`;
const answerRoutes = [
  ["/guides/quick-look-markdown/", "How to preview Markdown with Quick Look on a Mac"],
  ["/guides/open-md-file-mac/", "How to open a .md file on a Mac"],
  ["/guides/markdown-external-changes/", "Review Markdown files changed by another process"],
  ["/guides/review-claude-code-plans/", "How to review Claude Code plans in Markdown"],
  ["/markdown-for-agents/claude-code/", "Markdown workflow for Claude Code on macOS"],
  ["/markdown-for-agents/codex/", "Markdown workflow for Codex on macOS"],
  ["/markdown-for-agents/agents-md/", "How to read and review AGENTS.md files on a Mac"],
  ["/compare/macdown/", "Downright vs MacDown"],
  ["/compare/marked/", "Downright vs Marked"],
  ["/formats/", "Markdown formats supported by Downright"],
  ["/engineering/", "Downright engineering"],
  ["/benchmarks/", "Downright Markdown rendering benchmarks"],
  ["/press/", "Downright press and product facts"],
];

const index = `# Downright

${entityDescription}

A native Markdown reader and editor for files people and coding agents change together. Exact rendering and live agent-rewrite review keep the source in charge.

## The file is the starting point

The same source appears in a plain preview and in Downright. The renderer keeps math, tables, callouts, tasks, footnotes, syntax, and Mermaid in one document surface.

## Structural zoom

One anchor moves from headings to full text without throwing away the place you are reading.

## Architecture

Raw text is the only source of truth. One adaptive surface moves between Read, Live, and Source Focus. The renderer decorates. It never rewrites the bytes.

## System reach

Open a file from Finder, preview it with Quick Look, or send it through the down command. The same file stays the source of truth.

## Themes

${themes.themes.map((theme) => `- ${theme.name}: ${theme.palette.background} background, ${theme.palette.text} text, ${theme.palette.accent} accent`).join("\n")}

## Free and open

Free. Open source. MIT. No account. Your Markdown stays on your Mac.

If Downright is useful to you, you can [star it on GitHub](${facts.repository}) to support the project.

## Measured improvements

Downright 1.0.18 spends less time parsing, diffing, and updating your document.

${pipelineTable}

${pipelineConditions} [All benchmarks and test conditions](https://downright.cc/benchmarks/).

## Source

- Repository: ${facts.repository ?? "not configured"}
- App payload commit: ${facts.sourceCommit}
- App payload generated: ${facts.generatedAt}
- Supported extensions: ${facts.supportedExtensions.map((extension) => `.${extension}`).join(" ")}

Download: ${facts.downloadUrl || "pending a verified signed and notarized artifact"}
`;

const benchmarksMirror = `# Downright Markdown rendering benchmarks

## Measured improvements

Downright 1.0.18 benchmarks.

${pipelineTable}

## Test conditions

${pipelineConditions}

The measured code is included in [Downright 1.0.18 (build 356)](${facts.repository}/releases/tag/auto-${benchmarks.sourceCommit}). [Raw runs and source identity](${pipelineSource}). These timings cover parsing, diffing, storage, and decoration; they do not measure first-pixel launch time, visible scrolling, or complete window transitions.

## Parsing, search, and memory

${improvements.date}. ${improvements.machine}. ${improvements.qualification}

${comparisonTable}

## Test conditions and limits

${improvements.rows.map((row) => `- ${row.measurement}: ${row.workload}. ${row.statistic}.`).join("\n")}

The search result is a single invocation, not a percentile. Memory is the kernel's lifetime maximum physical footprint across two fresh isolated native processes, not live heap or resident memory. ${improvements.memoryLimit} A later 126.2 MB observation measured opening the stress document only; it does not replace these interactive-session measurements.

The 1,032,709-byte stress document contains 57,043 lines and 16,298 tasks. Each run opens a fresh isolated release host, enters Source, inserts seven characters, saves, undoes seven times and saves again, scrolls down and up two pages, then performs three further Source/Document cycles. The original bytes were restored exactly. These checks do not establish first-pixel launch time or 120 Hz frame delivery.

## Historical pipeline baseline

- Corpus: ${benchmarks.corpus}
- Date: ${benchmarks.date}
- Machine: ${benchmarks.machine}
- Qualification: ${benchmarks.qualification}
- Not measured: ${benchmarks.limitations.join(", ")}

${benchmarks.corpusCorrection}

| Measurement | p50 | p95 | Target |
|---|---:|---:|---|
${benchmarks.rows.map((row) => `| ${row.measurement} | ${row.p50} | ${row.p95} | ${row.target} |`).join("\n")}

## Source

- [Native performance record](${performanceSource})
- Source commit: ${benchmarks.sourceCommit}
- Site payload generated: ${benchmarks.generatedAt}
`;

const themesMirror = `# Downright themes

One document, six source-derived palettes. These values are generated from the native app theme JSON files.

${themes.themes.map((theme) => `## ${theme.name}\n\n- Appearance: ${theme.appearance}\n- Background: ${theme.palette.background}\n- Surface: ${theme.palette.surface}\n- Text: ${theme.palette.text}\n- Secondary text: ${theme.palette.textSecondary}\n- Accent: ${theme.palette.accent}\n- Rule: ${theme.palette.rule}`).join("\n\n")}
`;

const changelogMirror = `# Downright changelog

Generated from the native app CHANGELOG.md payload.

${changelog.entries.map((entry) => `## ${entry.version} · ${entry.kind}\n\n${plain(entry.summary)}`).join("\n\n")}

Source commit: ${changelog.sourceCommit}
`;

const privacy = `# Downright privacy

## Files stay local

Read, edit, save, search, compare, watch, and export Markdown without a network connection. Open document text stays in the file you chose and in memory while you work.

The site uses Vercel Web Analytics to measure anonymous page views. It does not use cookies.

## Optional intelligence

Apple Intelligence is optional, on-device, and off by default. A user action starts each task. Downright 1.0 has no remote model integration.

## Clear boundaries

Quick Look receives only the file Finder requests. Downright does not scan unrelated folders in the background. Snapshots, settings, and themes are local and user-controlled.

## Site analytics

The site sends anonymized page-view data to Vercel Web Analytics. Analytics collection can be disabled by removing the site integration.
`;

const knownGaps = `# Downright known gaps

This is the current launch record for the approved site plan. The site does not hide release or evidence gaps behind a finished-looking button.

## Release inputs

- Domain: https://downright.cc is the verified production domain.
- Artifact: ${facts.artifactName} is available at ${facts.downloadUrl || "no signed, notarized, stapled public URL is configured"}.
- Command-line options: the shell installer curl -fsSL https://downright.cc/install | bash, or the npm launcher npx --yes downright-installer; both use the same first-party installer path and rolling DMG.
- Homebrew cask: the public tap at https://github.com/ezzy1630/homebrew-downright resolves to the same rolling DMG with brew tap ezzy1630/downright && brew trust --cask ezzy1630/downright/downright && brew install --cask downright; tap-free official Homebrew Cask review remains separate.
- Repository: ${facts.repository ?? "not configured"} is the public source remote.
- Brand: the app-derived vector mark is canonical; the tactile native raster remains product artwork.

## Native evidence

The homepage uses live HTML, CSS, and generated document payload data rather than pretending a screenshot is interactive. The press kit also includes native stills captured from a fresh local build; native app verification remains a separate release gate, and the current payload follows the ${facts.version} source commit ${facts.sourceCommit.slice(0, 7)}.

The approved Quick Look, Finder, conflict, density, structural zoom, theme, split view, terminal, and motion checks remain outside the website and are not represented as shipped evidence here.

## Payload provenance

- Native source commit: ${facts.sourceCommit}
- Payload generated: ${facts.generatedAt}
- Native working tree dirty at generation: ${facts.sourceWorkingTreeDirty ? "yes; unrelated source changes were preserved" : "no"}

The technical site budgets, accessibility audits, Markdown mirrors, llms.txt, RSS, and OG images are generated and verified locally. Checksum, signature, notarization, and stapling evidence exists for the public artifact; clean-machine download and install verification remains pending.
`;

const llms = `# Downright

> ${entityDescription}

${entityDescription} It integrates with Finder, Quick Look, and the down command while keeping the source file in charge.

## Source code and support

- Repository: ${facts.repository}
- Issues: ${facts.repository}/issues
- Releases: ${facts.repository}/releases
- License: ${facts.license}
- Optional support: if Downright is useful to you, star its repository on GitHub or sponsor the author at ${facts.sponsorsUrl}.

## Browser tools (WebMCP)

In supporting browsers, pages expose these read-only tools through document.modelContext (or navigator.modelContext in older implementations):

- get_downright_info: published product facts, requirements, source provenance, and links
- get_downright_installation: signed DMG link and installation instructions; does not download or execute anything
- find_downright_docs: search page titles and descriptions, or list all pages with an empty query
- read_downright_doc: read a published Markdown page using a markdownPath from find_downright_docs
- get_downright_repository: GitHub source, releases, issues, and optional support links

These tools do not star repositories or change GitHub accounts. Agents without WebMCP can read the Markdown routes below.

## Routes

- https://downright.cc/ - product argument and interactive document demos
- https://downright.cc/download/ - signed macOS download and install choices
- ${facts.repository}/releases/tag/auto-${facts.sourceCommit} - current release notes
- https://downright.cc/releases/1.0.16/ - historical 1.0.16 release record
- https://downright.cc/themes/ - six source-derived themes
- https://downright.cc/changelog/ - generated native-app changelog
- https://downright.cc/privacy/ - privacy promises
- https://downright.cc/known-gaps/ - current release and evidence gaps
- https://downright.cc/markdown-viewer-mac/ - how to preview and read Markdown on a Mac
- https://downright.cc/markdown-editor-mac-free/ - free Markdown editors compared
- https://downright.cc/downright-vs-typora/ - Downright and Typora
- https://downright.cc/downright-vs-obsidian/ - Downright and Obsidian
- https://downright.cc/faq/ - product FAQ
${answerRoutes.map(([path, title]) => `- https://downright.cc${path} - ${title}`).join("\n")}
- https://downright.cc/install - checksum- and signature-verifying macOS installer
- https://downright.cc/index.md - Markdown version of the homepage
- https://downright.cc/themes.md - Markdown theme data
- https://downright.cc/changelog.md - Markdown changelog
- https://downright.cc/known-gaps.md - Markdown launch record

## Source and evidence

- App payload commit: ${facts.sourceCommit}
- Payload generated: ${facts.generatedAt}
- Historical benchmark corpus: ${benchmarks.corpus}
- Historical benchmark date: ${benchmarks.date}
- Historical benchmark qualification: ${benchmarks.qualification}
- Missing benchmark measurements: ${benchmarks.limitations.join(", ")}

## Performance benchmarks

Downright 1.0.18. ${pipelineConditions}

${pipelineTable}

${improvements.memoryLimit} Full workloads, search and memory measurements, source provenance, and the corrected historical small-document label are at https://downright.cc/benchmarks.md.
Native performance source: ${performanceSource}

## Claims

- Minimum macOS: ${facts.minimumMacOS}+
- License: ${facts.license}
- Supported extensions: ${facts.supportedExtensions.map((extension) => `.${extension}`).join(" ")}
- Download artifact: ${facts.artifactName}
- Download URL: ${facts.downloadUrl || "not configured until a signed and notarized artifact is verified"}
- Shell installer: curl -fsSL https://downright.cc/install | bash (same rolling DMG)
- npm launcher: npx --yes downright-installer (same first-party installer and rolling DMG)

Homebrew cask tap: https://github.com/ezzy1630/homebrew-downright
Homebrew cask install: brew tap ezzy1630/downright && brew trust --cask ezzy1630/downright/downright && brew install --cask downright (same rolling DMG)
The tap-free cask command remains pending official Homebrew Cask review. Its verified production domain is https://downright.cc.
`;

await mkdir(publicRoot, { recursive: true });
await Promise.all([
  writeFile(join(publicRoot, "index.md"), index),
  writeFile(join(publicRoot, "benchmarks.md"), benchmarksMirror),
  writeFile(join(publicRoot, "themes.md"), themesMirror),
  writeFile(join(publicRoot, "changelog.md"), changelogMirror),
  writeFile(join(publicRoot, "privacy.md"), privacy),
  writeFile(join(publicRoot, "known-gaps.md"), knownGaps),
  writeFile(join(publicRoot, "llms.txt"), llms),
]);
console.log("Generated Markdown mirrors and llms.txt");
