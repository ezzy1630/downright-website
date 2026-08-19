/**
 * Guards the link-preview contract against the failure that shipped once
 * already: cards were authored as SVG, every crawler refused them, and every
 * shared link unfurled as a blank grey box. Nothing in the build noticed.
 *
 * Checks each built page's declared card actually exists, is a PNG, is exactly
 * 1200x630, and stays under the tightest platform ceiling (X, at 5 MB).
 */
import { access, readFile, readdir, stat } from "node:fs/promises";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const dist = join(root, "dist");
const SITE = "https://downright.cc";
const MAX_BYTES = 5 * 1024 * 1024;

const failures = [];

/** Width and height straight from the PNG IHDR, so no image library is needed. */
async function pngSize(path) {
  const buffer = await readFile(path);
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (!buffer.subarray(0, 8).equals(signature)) return null;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

async function* htmlFiles(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* htmlFiles(path);
    else if (entry.name.endsWith(".html")) yield path;
  }
}

const seen = new Set();
let pages = 0;

for await (const file of htmlFiles(dist)) {
  const route = `/${file.slice(dist.length + 1).replace(/index\.html$/, "").replace(/\.html$/, "/")}`;
  const html = await readFile(file, "utf8");
  pages += 1;

  const og = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1];
  const twitter = html.match(/<meta name="twitter:image" content="([^"]+)"/)?.[1];

  if (!og) { failures.push(`${route}: no og:image`); continue; }
  if (!twitter) failures.push(`${route}: no twitter:image`);
  if (twitter && twitter !== og) failures.push(`${route}: twitter:image disagrees with og:image`);
  if (!og.startsWith(`${SITE}/`)) failures.push(`${route}: og:image is not an absolute ${SITE} URL (${og})`);
  if (!og.endsWith(".png")) failures.push(`${route}: og:image is ${og.split(".").pop()}, but crawlers only accept raster formats`);
  if (!/<meta property="og:image:type" content="image\/png"/.test(html)) failures.push(`${route}: missing og:image:type`);
  if (!/<meta name="twitter:card" content="summary_large_image"/.test(html)) failures.push(`${route}: not a summary_large_image card`);

  const asset = join(dist, og.slice(SITE.length));
  try {
    await access(asset);
  } catch {
    failures.push(`${route}: og:image ${og} has no file in dist`);
    continue;
  }
  seen.add(asset);

  const { size } = await stat(asset);
  if (size > MAX_BYTES) failures.push(`${route}: og:image is ${(size / 1024 / 1024).toFixed(1)} MB, over the 5 MB limit`);

  const dimensions = await pngSize(asset);
  if (!dimensions) failures.push(`${route}: og:image is not a valid PNG`);
  else if (dimensions.width !== 1200 || dimensions.height !== 630) {
    failures.push(`${route}: og:image is ${dimensions.width}x${dimensions.height}, expected 1200x630`);
  }
}

// Orphans are how the previous set rotted: files kept being served that nothing
// referenced and no build step could reproduce.
for (const file of await readdir(join(dist, "og")).catch(() => [])) {
  const path = join(dist, "og", file);
  if (!seen.has(path)) failures.push(`og/${file}: generated but no page references it`);
}

if (failures.length > 0) {
  console.error("OG audit failed:");
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}
console.log(`OG audit passed: ${pages} pages, ${seen.size} cards, all PNG 1200x630`);
