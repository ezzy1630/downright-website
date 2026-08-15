import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const siteRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const appRoot = resolve(process.env.DOWNRIGHT_APP_ROOT ?? "/Volumes/Neural/Downright");
const outputRoot = join(siteRoot, "src/data/app");
const themesRoot = join(appRoot, "Sources/MarkdownRender/Themes");

const read = (path) => readFile(path, "utf8");
const writeJson = (name, value) => writeFile(join(outputRoot, name), `${JSON.stringify(value, null, 2)}\n`);
const cleanText = (value) => value.replace(/[—–]/g, "-").replace(/\s+/g, " ").trim();

function command(args, fallback = "") {
  try {
    return execFileSync(args[0], args.slice(1), { cwd: appRoot, encoding: "utf8" }).trim();
  } catch {
    return fallback;
  }
}

function parsePipeTable(markdown) {
  const lines = markdown.split("\n").map((line) => line.trim()).filter((line) => line.startsWith("|"));
  if (lines.length < 3) return [];
  const columns = (line) => line.split("|").slice(1, -1).map((cell) => cleanText(cell));
  const headers = columns(lines[0]);
  return lines.slice(2).map((line) => {
    const cells = columns(line);
    return Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""]));
  });
}

function sectionBetween(markdown, start, end) {
  const startIndex = markdown.indexOf(start);
  if (startIndex < 0) return "";
  const remainder = markdown.slice(startIndex + start.length);
  const endIndex = end ? remainder.indexOf(end) : -1;
  return endIndex < 0 ? remainder : remainder.slice(0, endIndex);
}

function parseBenchmarkPayload(markdown) {
  const budgets = parsePipeTable(sectionBetween(markdown, "## Budgets", "## Current local benchmark"));
  const benchmarkRows = parsePipeTable(sectionBetween(markdown, "## Current local benchmark", "## Measurement procedure"));
  const budgetFor = (measurement) => {
    const aliases = {
      "cmark parse": "Cold launch to first rendered pixel, 100 KB",
      "Parse 100 KB": "Cold launch to first rendered pixel, 100 KB",
      "Source edit and paragraph map": "Keystroke response, 5,000-line file",
      "Incremental decoration": "Keystroke response, 5,000-line file",
      "End-to-end semantic convergence": "End-to-end convergence",
      "Quick Look preview": "Quick Look preview",
    };
    const alias = Object.entries(aliases).find(([key]) => measurement.toLowerCase().includes(key.toLowerCase()))?.[1];
    if (measurement === "End-to-end semantic convergence") return { target: "<100 ms", passCondition: "p95 below target" };
    const budget = budgets.find((row) => row.Metric === alias);
    return budget ? { target: budget.Target, passCondition: budget["Pass condition"] } : { target: "Informational", passCondition: "Baseline only" };
  };
  return {
    source: "Docs/PERFORMANCE.md",
    date: "2026-08-06",
    corpus: "120,825 characters / 4,885 lines",
    machine: "single unrecorded machine",
    qualification: "Baseline only. Not a cross-machine claim.",
    limitations: ["TextKit layout", "scroll frames", "IME input", "live window frame time"],
    rows: benchmarkRows.map((row) => {
      const measurement = row.Measurement;
      return { measurement, p50: row["p50"], p95: row["p95"], ...budgetFor(measurement) };
    }),
  };
}

function parseChangelog(markdown) {
  const entries = [];
  const versions = [...markdown.matchAll(/^## \[([^\]]+)\](?: - (.+))?\s*$/gm)];
  for (let versionIndex = 0; versionIndex < versions.length; versionIndex += 1) {
    const version = versions[versionIndex];
    const [, label, date] = version;
    const bodyStart = (version.index ?? 0) + version[0].length;
    const bodyEnd = versions[versionIndex + 1]?.index ?? markdown.length;
    const body = markdown.slice(bodyStart, bodyEnd);
    const categories = [...body.matchAll(/^### ([^\n]+)\s*$/gm)];
    for (let categoryIndex = 0; categoryIndex < categories.length; categoryIndex += 1) {
      const category = categories[categoryIndex];
      const [, kind] = category;
      const categoryStart = (category.index ?? 0) + category[0].length;
      const categoryEnd = categories[categoryIndex + 1]?.index ?? body.length;
      const categoryBody = body.slice(categoryStart, categoryEnd);
      const bullets = [...categoryBody.matchAll(/^- (.+(?:\n(?![-#]).+)*)/gm)];
      for (const bullet of bullets) {
        const summary = cleanText(bullet[1].replace(/\*\*/g, "").replace(/`([^`]+)`/g, "$1"));
        if (summary) entries.push({ version: label, date: date ?? label, kind, summary });
      }
    }
  }
  return { source: "CHANGELOG.md", entries };
}

function parseExtensions(plist) {
  const block = plist.match(/<key>CFBundleTypeExtensions<\/key>\s*<array>([\s\S]*?)<\/array>/)?.[1] ?? "";
  return [...block.matchAll(/<string>([^<]+)<\/string>/g)].map((match) => match[1]);
}

function parseMotion(swift) {
  const readNumber = (name, fallback) => Number(swift.match(new RegExp(`public static let ${name}[^=]*= ([0-9.]+)`))?.[1] ?? fallback);
  return {
    durations: {
      quick: readNumber("quick", 0.12), standard: readNumber("standard", 0.20), deliberate: readNumber("deliberate", 0.32),
      liquidSettle: readNumber("liquidSettle", 0.38), hover: readNumber("hover", 0.10), pressIn: readNumber("pressIn", 0.07),
      pressOut: readNumber("pressOut", 0.11), selection: readNumber("selection", 0.15), emphasis: readNumber("emphasis", 0.11),
      previewCrossfade: readNumber("previewCrossfade", 0.06), floatingContentRevealLead: readNumber("floatingContentRevealLead", 0.08),
      jumpPunchKick: readNumber("jumpPunchKick", 480), breathe: readNumber("breathe", 0.12), previewStagger: readNumber("quick", 0.12) / 3, stagger: readNumber("quick", 0.12) / 3,
    },
    curves: {
      decelerate: [0.22, 0.82, 0.28, 1], snap: [0.16, 1, 0.30, 1], structural: [0.30, 0.30, 0.20, 1], easeOut: "ease-out",
    },
    springs: { windup: 4.744, maximumSettleBand: 0.5, minimumSettleBand: 0.0006, bounceRange: [0, 1] },
    scroll: { velocityKick: 480, durationFormula: "clamp(0.0115 * sqrt(distance), 0.18s, 0.55s)" },
    source: "Sources/MarkdownRender/Motion.swift",
  };
}

function tokenCss(themes, motion) {
  const paletteNames = [
    ["background", "bg"], ["surface", "surface"], ["text", "text"], ["textSecondary", "text-secondary"], ["textFaint", "text-faint"],
    ["heading", "heading"], ["marker", "marker"], ["accent", "accent"], ["link", "link"], ["rule", "rule"], ["selection", "selection"],
    ["codeBackground", "code-bg"], ["inlineCodeBackground", "inline-code-bg"], ["codeRule", "code-rule"], ["railTick", "rail-tick"],
    ["railTickCurrent", "rail-tick-current"], ["quoteRule", "quote-rule"], ["changeAdded", "change-added"], ["changeRemoved", "change-removed"],
    ["changeModified", "change-modified"], ["pathMissing", "path-missing"], ["searchHit", "search-hit"], ["searchHitCurrent", "search-hit-current"],
    ["calloutNote", "callout-note"], ["calloutWarning", "callout-warning"], ["calloutSuccess", "callout-success"], ["calloutDanger", "callout-danger"],
  ];
  const codeNames = ["keyword", "string", "number", "comment", "type", "function", "variable", "constant", "operator", "punctuation", "attribute", "diffAdded", "diffRemoved", "diffHeader"];
  const cssFor = (theme, fallback) => {
    const palette = theme.name === "System" ? fallback.palette : theme.palette;
    const code = theme.name === "System" ? fallback.code : theme.code;
    const lines = paletteNames.map(([source, target]) => `  --${target}: ${palette[source]};`);
    lines.push(...codeNames.map((source) => `  --syntax-${source.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}: ${code[source]};`));
    return lines.join("\n");
  };
  const lightFallback = themes.find((theme) => theme.name === "Paper Light");
  const darkFallback = themes.find((theme) => theme.name === "Warm Dark");
  const blocks = themes.filter((theme) => theme.name !== "System").map((theme) => `[data-theme="${theme.id}"] {\n${cssFor(theme, theme)}\n}`);
  blocks.push(`[data-theme="system"] {\n${cssFor(themes.find((theme) => theme.name === "System"), lightFallback)}\n}\n\n@media (prefers-color-scheme: dark) {\n  [data-theme="system"] {\n${cssFor(themes.find((theme) => theme.name === "System"), darkFallback).split("\n").map((line) => `    ${line.trimStart()}`).join("\n")}\n  }\n}`);
  const motionLines = Object.entries(motion.durations).map(([name, value]) => `  --motion-${name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}: ${name === "jumpPunchKick" ? `${value}px` : `${value}s`};`);
  const curveLines = Object.entries(motion.curves).map(([name, value]) => {
    const ease = Array.isArray(value) ? `cubic-bezier(${value.join(", ")})` : value;
    const cssName = name === "easeOut" ? "out" : name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
    return `  --ease-${cssName}: ${ease};`;
  });
  const bandLines = [
    `  --band-bg: ${darkFallback.palette.background};`, `  --band-surface: ${darkFallback.palette.surface};`, `  --band-text: ${darkFallback.palette.text};`,
    `  --band-text-secondary: ${darkFallback.palette.textSecondary};`, `  --band-heading: ${darkFallback.palette.heading};`, `  --band-rule: ${darkFallback.palette.rule};`,
  ];
  return `/* Generated from /Volumes/Neural/Downright/Sources/MarkdownRender/Themes and Motion.swift. */\n:root {\n${cssFor(lightFallback, lightFallback)}\n${bandLines.join("\n")}\n${motionLines.join("\n")}\n${curveLines.join("\n")}\n  --font-display: "New York", "Iowan Old Style", Newsreader, Georgia, serif;\n  --font-body: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Inter, Arial, sans-serif;\n  --font-mono: "SF Mono", "JetBrains Mono", ui-monospace, monospace;\n  --measure: 70ch;\n  --page-max: 1800px;\n  --content-max: 1120px;\n  --radius-chip: 4px;\n  --radius-button: 8px;\n  --radius-panel: 10px;\n  --radius-window: 12px;\n  --focus-ring: color-mix(in oklab, var(--accent) 40%, transparent);\n  --window-shadow: 0 1px 2px color-mix(in srgb, var(--text) 5%, transparent), 0 12px 32px color-mix(in srgb, var(--text) 10%, transparent);\n}\n\n${blocks.join("\n\n")}\n`;
}

async function main() {
  await mkdir(outputRoot, { recursive: true });
  const themeFiles = ["paper-light.json", "warm-dark.json", "nord.json", "solarized-light.json", "high-contrast.json", "system.json"];
  const themes = await Promise.all(themeFiles.map(async (file) => ({
    id: file.replace(/\.json$/, ""),
    ...JSON.parse(await read(join(themesRoot, file))),
  })));
  const performance = await read(join(appRoot, "Docs/PERFORMANCE.md"));
  const changelog = await read(join(appRoot, "CHANGELOG.md"));
  const sample = await read(join(appRoot, "Docs/sample.md"));
  const motionSource = await read(join(appRoot, "Sources/MarkdownRender/Motion.swift"));
  const plist = await read(join(appRoot, "Config/Downright-Info.plist"));
  const versionSource = await read(join(appRoot, "Config/version.env"));
  const version = versionSource.match(/^MARKETING_VERSION=(.+)$/m)?.[1]?.trim() ?? "unknown";
  const repositoryRaw = command(["git", "config", "--get", "remote.origin.url"]);
  const repository = repositoryRaw.replace(/^git@github\.com:/, "https://github.com/").replace(/\.git$/, "") || null;
  const sourceCommit = command(["git", "rev-parse", "HEAD"], "unknown");
  const dirty = Boolean(command(["git", "status", "--porcelain"]));
  const generatedAt = new Date().toISOString();
  const motion = parseMotion(motionSource);
  await writeJson("themes.json", { source: "Sources/MarkdownRender/Themes", sourceCommit, generatedAt, themes });
  await writeJson("benchmarks.json", { ...parseBenchmarkPayload(performance), sourceCommit, generatedAt });
  await writeJson("changelog.json", { ...parseChangelog(changelog), sourceCommit, generatedAt });
  await writeJson("facts.json", {
    sourceCommit, generatedAt, sourceWorkingTreeDirty: dirty, version, minimumMacOS: "14.0", license: "MIT", artifactName: "Downright.dmg",
    repository, supportedExtensions: parseExtensions(plist), downloadUrl: process.env.PUBLIC_DOWNLOAD_URL?.trim() ?? "",
  });
  await writeJson("motion.json", motion);
  await writeFile(join(outputRoot, "sample.md"), sample);
  await writeFile(join(siteRoot, "src/styles/tokens.css"), tokenCss(themes, motion));
  console.log(`Generated Downright payload from ${sourceCommit}${dirty ? " (working tree dirty)" : ""}`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
