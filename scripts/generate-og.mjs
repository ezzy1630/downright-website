/**
 * Generates one 1200x630 PNG Open Graph card per page, from `pageMeta`.
 *
 * PNG, not SVG: X, iMessage, Slack, Discord, Facebook and LinkedIn all refuse
 * `image/svg+xml` for link previews, which is why every shared Downright link
 * used to unfurl as a blank grey card.
 *
 * Rasterising happens through resvg with the brand fonts passed explicitly and
 * system fonts switched off, so a Linux CI builder and a local Mac produce
 * byte-comparable output instead of silently substituting whatever serif
 * happens to be installed.
 */
import { mkdir, readFile, readdir, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { Resvg } from "@resvg/resvg-js";
import sharp from "sharp";
import { pageMeta, ogCard, ogImagePath } from "../src/data/seo.ts";
import { renderCard, FONT_FILES } from "./og/card.mjs";

const root = new URL("..", import.meta.url).pathname;
const outDir = join(root, "public/og");
const { themes } = JSON.parse(await readFile(join(root, "src/data/app/themes.json"), "utf8"));

// Warm Dark is the ground every first visit lands on; the cards use the same
// palette so a shared link and the page it opens read as one surface.
const palette = themes.find((theme) => theme.id === "warm-dark").palette;

await mkdir(outDir, { recursive: true });

// Clear stale cards so a renamed or removed page cannot leave an orphan behind.
for (const file of await readdir(outDir).catch(() => [])) {
  if (/\.(png|svg)$/.test(file)) await unlink(join(outDir, file));
}

const written = [];
for (const meta of Object.values(pageMeta)) {
  const markdownPath = meta.markdownPath ?? "/index.md";
  const svg = renderCard({ ...ogCard(markdownPath, meta), palette });

  const png = new Resvg(svg, {
    fitTo: { mode: "width", value: 1200 },
    font: { fontFiles: FONT_FILES, loadSystemFonts: false, defaultFontFamily: "Inter" },
  }).render().asPng();

  // Full colour, not palette-quantised: the accent bloom behind the document is
  // a smooth gradient that 256 colours can only render as dither noise, and at
  // this size the quantised file is barely 3 KB smaller anyway.
  const optimised = await sharp(png).png({ compressionLevel: 9, effort: 10 }).toBuffer();

  const file = ogImagePath(markdownPath).replace("/og/", "");
  await writeFile(join(outDir, file), optimised);
  written.push({ file, bytes: optimised.length });
}

const total = written.reduce((sum, entry) => sum + entry.bytes, 0);
console.log(`Generated ${written.length} OG cards (PNG, 1200x630) · ${(total / 1024).toFixed(0)} KB total`);
