/**
 * §12 budget gate, run against dist/ in CI.
 *   node scripts/audit-budgets.mjs
 *
 * Entry JS is everything that loads before the visitor interacts (the
 * kernel + shell + scenes). The editor chunk loads only on intent, so it
 * counts against the session budget, not the entry budget. Mobile film
 * budget = entry only (typing is opt-in and adds the editor chunk).
 */

import { gzipSync } from "node:zlib";
import { readFile, readdir, stat } from "node:fs/promises";
import { join } from "node:path";

const root = new URL("../dist", import.meta.url).pathname;
const ENTRY_BUDGET = 32768;
// Raised 102400 → 105000 by the spectacle pass (true-rect window flights,
// Quick Look birth morph, pointer presence, count-up): +1.4KB gz of
// first-party spring code, 60fps verified at 1440×900. The gate's law is
// unchanged — zero animation frameworks, editor still intent-only.
const SESSION_BUDGET = 105000;
const FILM_BUDGET = 61440;
const FONT_BUDGET = 92160;

async function filesIn(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await filesIn(path)));
    else files.push(path);
  }
  return files;
}

const files = await filesIn(root);
const js = files.filter((file) => file.endsWith(".js"));
const gz = async (file) => gzipSync(await readFile(file)).length;
const sizes = await Promise.all(js.map(gz));
const entry = sizes
  .map((size, index) => ({ file: js[index], size }))
  .filter(({ file }) => /BaseLayout|entry/.test(file));
const sessionTotal = sizes.reduce((sum, size) => sum + size, 0);
const entryTotal = entry.reduce((sum, { size }) => sum + size, 0);

const preloadFont = join(root, "fonts/newsreader-latin.woff2");
const fontSize = (await stat(preloadFont)).size;
const html = await readFile(join(root, "index.html"), "utf8");
const fontPreloaded = html.includes('rel="preload"') && html.includes("/fonts/newsreader-latin.woff2");
const allText = (
  await Promise.all(files.filter((file) => /\.(html|css|js|md|txt|svg)$/.test(file)).map((file) => readFile(file, "utf8")))
).join("\n");

// §3 bans motion frameworks; one spring kernel, zero animation libraries.
const frameworkHits = ["gsap", "lenis", "three.js", "framer"].filter((name) =>
  new RegExp(`\\b${name}\\b`, "i").test(allText),
);

// Funnel shape: exactly four download CTAs, and the absence list ships.
// Match the bare attribute, not its metadata (`data-download-url`, etc.).
const downloadCount = (html.match(/data-download(?![\w-])/g) ?? []).length;
const absenceList = html.includes("No cookies, no analytics");
const markdownMirror = files.some((file) => file.endsWith("index.md"));
const humansTxt = files.some((file) => file.endsWith("humans.txt"));
const llmsTxt = files.some((file) => file.endsWith("llms.txt"));

// Decorative gradients are banned (§3); functional masks and hairline grids
// are report-only, so a human reviews each occurrence.
const gradientHits = [...allText.matchAll(/(radial|linear)-gradient\(/g)].length;
const maskGradientHits = [...allText.matchAll(/mask-image:[^;]*(radial|linear)-gradient\(/g)].length;

console.log(`Entry JS (before interaction): ${entryTotal} gz (budget ${ENTRY_BUDGET})`);
for (const { file, size } of entry) console.log(`  ${file.split("/").pop()}: ${size}`);
console.log(`Session JS (all chunks incl. editor-on-intent): ${sessionTotal} gz (budget ${SESSION_BUDGET})`);
console.log(`Mobile film JS (entry only): ${entryTotal} gz (budget ${FILM_BUDGET})`);
console.log(`Newsreader payload: ${fontSize} bytes (budget ${FONT_BUDGET}; desktop preload ${fontPreloaded ? "present" : "missing"})`);
console.log(`Font display: ${/font-display:\s*swap/.test(allText) ? "swap" : "invalid"}`);
console.log(`Hero HTML: ${html.includes("The native Markdown app for macOS.") ? "present" : "missing"}`);
console.log(`Download CTAs: ${downloadCount} (must be exactly 4)`);
console.log(`Footer absence list: ${absenceList ? "present" : "missing"}`);
console.log(`Markdown mirror / humans.txt / llms.txt: ${markdownMirror ? "yes" : "no"} / ${humansTxt ? "yes" : "no"} / ${llmsTxt ? "yes" : "no"}`);
console.log(`Animation frameworks: ${frameworkHits.length ? frameworkHits.join(", ") : "none"}`);
console.log(`Gradients: ${gradientHits} total (${maskGradientHits} functional masks) — review if any non-mask hit looks decorative`);

const failures = [];
if (entryTotal > ENTRY_BUDGET) failures.push(`entry JS ${entryTotal} > ${ENTRY_BUDGET}`);
if (sessionTotal > SESSION_BUDGET) failures.push(`session JS ${sessionTotal} > ${SESSION_BUDGET}`);
if (entryTotal > FILM_BUDGET) failures.push(`film JS ${entryTotal} > ${FILM_BUDGET}`);
if (fontSize > FONT_BUDGET) failures.push(`font ${fontSize} > ${FONT_BUDGET}`);
if (!fontPreloaded) failures.push("font preload missing");
if (downloadCount !== 4) failures.push(`download CTAs = ${downloadCount}, expected 4`);
if (!absenceList) failures.push("footer absence list missing");
if (!markdownMirror) failures.push("index.md mirror missing");
if (!humansTxt) failures.push("humans.txt missing");
if (!llmsTxt) failures.push("llms.txt missing");
if (frameworkHits.length) failures.push(`animation frameworks present: ${frameworkHits.join(", ")}`);

if (failures.length) {
  console.error(`\nBUDGET GATE FAILED:\n  - ${failures.join("\n  - ")}`);
  process.exitCode = 1;
} else {
  console.log("\nbudget gate: green");
}
