import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const publicRoot = join(root, "public");
const dataRoot = join(root, "src/data/app");
const readJson = (name) => readFile(join(dataRoot, name), "utf8").then(JSON.parse);
const plain = (value) => value.replace(/[—–]/g, "-").replace(/\s+/g, " ").trim();
const [themes, benchmarks, facts, changelog] = await Promise.all(["themes.json", "benchmarks.json", "facts.json", "changelog.json"].map(readJson));

const index = `# Downright

The native Markdown app for macOS.

A native reader and editor for files people and coding agents change together. No WebView. No account.

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

## Source

- Repository: ${facts.repository ?? "not configured"}
- App payload commit: ${facts.sourceCommit}
- App payload generated: ${facts.generatedAt}
- Supported extensions: ${facts.supportedExtensions.map((extension) => `.${extension}`).join(" ")}

Download: ${facts.downloadUrl || "pending a verified signed and notarized artifact"}
`;

const themesMirror = `# Downright themes

One document, six source-derived palettes. These values are generated from the native app theme JSON files.

${themes.themes.map((theme) => `## ${theme.name}\n\n- Appearance: ${theme.appearance}\n- Background: ${theme.palette.background}\n- Surface: ${theme.palette.surface}\n- Text: ${theme.palette.text}\n- Secondary text: ${theme.palette.textSecondary}\n- Accent: ${theme.palette.accent}\n- Rule: ${theme.palette.rule}`).join("\n\n")}
`;

const changelogMirror = `# Downright changelog

Generated from the native app CHANGELOG.md payload.

${changelog.entries.map((entry) => `## ${entry.version} · ${entry.kind}\n\n${plain(entry.summary)}`).join("\n\n")}

Source commit: ${facts.sourceCommit}
`;

const privacy = `# Downright privacy

## Files stay local

Read, edit, save, search, compare, watch, and export Markdown without a network connection. Open document text stays in the file you chose and in memory while you work.

The site has no analytics.

## Optional intelligence

Apple Intelligence is optional, on-device, and off by default. A user action starts each task. Downright 1.0 has no remote model integration.

## Clear boundaries

Quick Look receives only the file Finder requests. Downright does not scan unrelated folders in the background. Snapshots, settings, and themes are local and user-controlled.
`;

const knownGaps = `# Downright known gaps

This is the current launch record for the approved site plan. The site does not hide release or evidence gaps behind a finished-looking button.

## Release inputs

- Domain: https://downright.cc is the verified production domain, connected to Vercel through Porkbun DNS.
- Artifact: ${facts.artifactName} is available at ${facts.downloadUrl || "no signed, notarized, stapled public URL is configured"}.
- Homebrew: no cask is claimed until one exists and is verified.
- Repository: ${facts.repository ?? "not configured"} is the source remote; public address confirmation remains open.
- Brand: the current knot mark ships as the canonical mark; whether it evolves before launch remains open.

## Native evidence

This website intentionally publishes no screenshots. Its interactive demonstrations use live HTML, CSS, and generated document payload data. Native app verification remains a separate local release gate; the current payload follows the ${facts.version} source commit ${facts.sourceCommit.slice(0, 7)}.

The approved Quick Look, Finder, conflict, density, structural zoom, theme, split view, terminal, and motion checks remain outside the website and are not represented as shipped evidence here.

## Payload provenance

- Native source commit: ${facts.sourceCommit}
- Payload generated: ${facts.generatedAt}
- Native working tree dirty at generation: ${facts.sourceWorkingTreeDirty ? "yes; unrelated source changes were preserved" : "no"}

The technical site budgets, accessibility audits, Markdown mirrors, llms.txt, RSS, and social OG images are generated and verified locally. Clean-machine download and install verification remains pending the artifact URL.
`;

const llms = `# Downright

> The native Markdown app for macOS.

Downright is a local-first Markdown reader and editor. The native app renders Markdown without a WebView, keeps raw bytes exact, and integrates with Finder, Quick Look, and the down command.

## Routes

- https://downright.cc/ - product argument and interactive document demos
- https://downright.cc/themes - six source-derived themes
- https://downright.cc/changelog - generated native-app changelog
- https://downright.cc/privacy - privacy promises
- https://downright.cc/known-gaps - current release and evidence gaps
- https://downright.cc/index.md - Markdown version of the homepage
- https://downright.cc/themes.md - Markdown theme data
- https://downright.cc/changelog.md - Markdown changelog
- https://downright.cc/known-gaps.md - Markdown launch record

## Source and evidence

- Native source: /Volumes/Neural/Downright
- App payload commit: ${facts.sourceCommit}
- Payload generated: ${facts.generatedAt}
- Benchmark corpus: ${benchmarks.corpus}
- Benchmark date: ${benchmarks.date}
- Benchmark qualification: ${benchmarks.qualification}
- Missing benchmark measurements: ${benchmarks.limitations.join(", ")}

## Claims

- Minimum macOS: ${facts.minimumMacOS}+
- License: ${facts.license}
- Supported extensions: ${facts.supportedExtensions.map((extension) => `.${extension}`).join(" ")}
- Download artifact: ${facts.artifactName}
- Download URL: ${facts.downloadUrl || "not configured until a signed and notarized artifact is verified"}

The site does not claim a Homebrew cask. Its verified production domain is https://downright.cc.
`;

await mkdir(publicRoot, { recursive: true });
await Promise.all([
  writeFile(join(publicRoot, "index.md"), index),
  writeFile(join(publicRoot, "themes.md"), themesMirror),
  writeFile(join(publicRoot, "changelog.md"), changelogMirror),
  writeFile(join(publicRoot, "privacy.md"), privacy),
  writeFile(join(publicRoot, "known-gaps.md"), knownGaps),
  writeFile(join(publicRoot, "llms.txt"), llms),
]);
console.log("Generated Markdown mirrors and llms.txt");
