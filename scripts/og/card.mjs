/**
 * Open Graph card composition.
 *
 * Cards are built as SVG and rasterised to PNG — crawlers reject SVG outright,
 * which is why previews used to arrive as an empty grey box. Every text block
 * here is fitted against real font metrics before it is emitted, so no headline
 * can silently run under the artwork the way the homepage one did.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { loadFontMetrics } from "./metrics.mjs";

const root = new URL("../..", import.meta.url).pathname;
const fontDir = join(root, "assets/og-fonts");

export const FONT_FILES = [
  "newsreader-regular.ttf",
  "newsreader-semibold.ttf",
  "inter-regular.ttf",
  "inter-semibold.ttf",
  "jetbrains-mono-regular.ttf",
  "jetbrains-mono-medium.ttf",
].map((file) => join(fontDir, file));

const FONTS = {
  display: loadFontMetrics(join(fontDir, "newsreader-regular.ttf")),
  displayBold: loadFontMetrics(join(fontDir, "newsreader-semibold.ttf")),
  body: loadFontMetrics(join(fontDir, "inter-regular.ttf")),
  bodyBold: loadFontMetrics(join(fontDir, "inter-semibold.ttf")),
  mono: loadFontMetrics(join(fontDir, "jetbrains-mono-regular.ttf")),
  monoMedium: loadFontMetrics(join(fontDir, "jetbrains-mono-medium.ttf")),
};

const FAMILY = { display: "Newsreader", displayBold: "Newsreader", body: "Inter", bodyBold: "Inter", mono: "JetBrains Mono", monoMedium: "JetBrains Mono" };
const WEIGHT = { display: 400, displayBold: 600, body: 400, bodyBold: 600, mono: 400, monoMedium: 500 };

const escape = (value) => String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Advance width including SVG letter-spacing, which resvg applies per glyph. */
const widthOf = (text, role, size, tracking = 0) => FONTS[role].measure(text, size) + tracking * text.length;

function text(content, { x, y, role, size, fill, tracking = 0, anchor = "start", opacity }) {
  const attrs = [
    `x="${round(x)}"`, `y="${round(y)}"`, `fill="${fill}"`,
    `font-family="${FAMILY[role]}"`, `font-size="${round(size)}"`, `font-weight="${WEIGHT[role]}"`,
    tracking ? `letter-spacing="${round(tracking)}"` : "",
    anchor !== "start" ? `text-anchor="${anchor}"` : "",
    opacity !== undefined ? `opacity="${opacity}"` : "",
  ].filter(Boolean);
  return `<text ${attrs.join(" ")}>${escape(content)}</text>`;
}

const round = (n) => Math.round(n * 100) / 100;

/** Greedy word wrap against measured widths. */
function wrap(content, { role, size, maxWidth, tracking = 0 }) {
  const lines = [];
  let line = "";
  for (const word of content.split(/\s+/).filter(Boolean)) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && widthOf(candidate, role, size, tracking) > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * Pick the largest size on the ladder whose wrap fits the box. The ladder is
 * descending, so the first fit is the best fit; if nothing fits, the smallest
 * size is used and the overflow is truncated rather than allowed to bleed.
 */
export function fit(content, { role, maxWidth, maxLines, sizes, tracking = 0 }) {
  for (const size of sizes) {
    const lines = wrap(content, { role, size, maxWidth, tracking });
    if (lines.length <= maxLines && lines.every((line) => widthOf(line, role, size, tracking) <= maxWidth)) {
      return { size, lines };
    }
  }
  const size = sizes[sizes.length - 1];
  const lines = wrap(content, { role, size, maxWidth, tracking }).slice(0, maxLines);
  const last = lines.length - 1;
  while (lines[last] && widthOf(`${lines[last]}…`, role, size, tracking) > maxWidth) {
    lines[last] = lines[last].replace(/\s*\S+$/, "");
  }
  lines[last] = `${lines[last]}…`;
  return { size, lines, truncated: true };
}

/**
 * The canonical mark, reused from the favicon so the geometry has one source.
 * The favicon picks its accent with a prefers-color-scheme media query; resvg
 * has no viewing context to resolve that against, so the dark-mode accent is
 * inlined here — these cards are always composed on the Warm Dark ground.
 */
function brandMark(x, y, size, accent) {
  const source = readFileSync(join(root, "public/favicon.svg"), "utf8");
  const body = source
    .replace(/^[\s\S]*?<\/defs>/, "")
    .replace(/<style>[\s\S]*?<\/style>/, "")
    .replace(/<\/svg>\s*$/, "")
    .replace(/class="fav-accent"/g, `fill="${accent}"`);
  const defs = source.match(/<defs>[\s\S]*?<\/defs>/)?.[0] ?? "";
  return `${defs}<g transform="translate(${x} ${y}) scale(${round(size / 32)})">${body}</g>`;
}

/** A rendered-Markdown fragment: the product's actual claim, shown rather than described. */
function evidencePanel(box, p) {
  const pad = 26;
  const cx = box.x + pad;
  const cw = box.w - pad * 2;
  const parts = [];

  parts.push(
    `<rect x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" rx="16" fill="${p.surface}" stroke="${p.rule}"/>`,
  );

  // File header — the card is about a real file on disk, so name one.
  let y = box.y + 36;
  parts.push(`<circle cx="${cx + 4}" cy="${y - 4}" r="4" fill="${p.accent}"/>`);
  parts.push(text("AGENTS.md", { x: cx + 18, y, role: "monoMedium", size: 14, fill: p.textSecondary }));
  parts.push(text("edited by agent", { x: box.x + box.w - pad, y, role: "mono", size: 13, fill: p.textFaint, anchor: "end" }));
  y += 16;
  parts.push(`<path d="M${cx} ${y}h${cw}" stroke="${p.rule}"/>`);

  // Rendered heading, then rendered prose. Not a wireframe — real type.
  y += 52;
  parts.push(text("Build steps", { x: cx, y, role: "displayBold", size: 30, fill: p.heading }));
  y += 34;
  for (const line of ["Downright renders this file exactly", "as written. Opening it changes", "nothing on disk."]) {
    parts.push(text(line, { x: cx, y, role: "body", size: 15, fill: p.text }));
    y += 23;
  }

  // The diff pair — the one detail that still reads at thumbnail size.
  y += 18;
  for (const row of [
    { mark: "-", copy: "npm test --legacy-parser", color: p.changeRemoved },
    { mark: "+", copy: "npm run verify --exact", color: p.changeAdded },
  ]) {
    parts.push(`<rect x="${cx}" y="${y}" width="${cw}" height="34" rx="7" fill="${row.color}" fill-opacity="0.12"/>`);
    parts.push(`<rect x="${cx}" y="${y}" width="3" height="34" rx="1.5" fill="${row.color}"/>`);
    parts.push(text(`${row.mark}  ${row.copy}`, { x: cx + 16, y: y + 22, role: "monoMedium", size: 14, fill: row.color }));
    y += 42;
  }

  y += 12;
  parts.push(text("Review the rewrite, then keep or", { x: cx, y, role: "body", size: 15, fill: p.textSecondary }));
  parts.push(text("discard it. Your bytes, your call.", { x: cx, y: y + 23, role: "body", size: 15, fill: p.textSecondary }));

  return parts.join("");
}

export function renderCard({ eyebrow, headline, kicker, palette: p }) {
  const M = 72;
  const panel = { x: 740, y: 122, w: 388, h: 378 };
  const colWidth = panel.x - M - 44;

  const head = fit(headline, { role: "display", maxWidth: colWidth, maxLines: 3, sizes: [64, 58, 52, 46, 42, 38] });
  const sub = fit(kicker, { role: "body", maxWidth: colWidth, maxLines: 2, sizes: [21, 19, 17] });

  // Centre the eyebrow/headline/kicker stack on the band between the lockup and
  // the footer rule. Titles run from three words to eleven, and anchoring the
  // stack to either edge leaves the short ones stranded against the other.
  const CAP = 0.72;
  const EYEBROW = 14;
  const GAP_EYEBROW = 38;
  const GAP_KICKER = 46;
  const headLeading = head.size * 1.14;
  const subLeading = sub.size * 1.42;
  const headBlock = (head.lines.length - 1) * headLeading + head.size * CAP;
  const subBlock = (sub.lines.length - 1) * subLeading + sub.size * CAP;
  const stack = EYEBROW * CAP + GAP_EYEBROW + headBlock + GAP_KICKER + subBlock;

  let cursor = 332 - stack / 2;
  const eyebrowBaseline = cursor + EYEBROW * CAP;
  cursor += EYEBROW * CAP + GAP_EYEBROW;
  const headFirst = cursor + head.size * CAP;
  cursor += headBlock + GAP_KICKER;
  const subFirst = cursor + sub.size * CAP;

  const parts = [
    `<rect width="1200" height="630" fill="${p.background}"/>`,
    // A single soft accent bloom behind the document, so the panel sits in space
    // rather than on a flat field.
    `<defs><radialGradient id="bloom" cx="0.5" cy="0.5" r="0.5"><stop offset="0%" stop-color="${p.accent}" stop-opacity="0.20"/><stop offset="100%" stop-color="${p.accent}" stop-opacity="0"/></radialGradient></defs>`,
    `<ellipse cx="934" cy="311" rx="420" ry="340" fill="url(#bloom)"/>`,
    brandMark(M, 62, 40, p.accent),
    text("Downright", { x: M + 54, y: 90, role: "bodyBold", size: 26, fill: p.heading }),
    text(eyebrow.toUpperCase(), { x: M, y: eyebrowBaseline, role: "monoMedium", size: EYEBROW, fill: p.accent, tracking: 2.2 }),
  ];

  head.lines.forEach((line, index) => {
    parts.push(text(line, { x: M, y: headFirst + index * headLeading, role: "display", size: head.size, fill: p.heading }));
  });

  sub.lines.forEach((line, index) => {
    parts.push(text(line, { x: M, y: subFirst + index * subLeading, role: "body", size: sub.size, fill: p.textSecondary }));
  });

  parts.push(evidencePanel(panel, p));
  parts.push(`<path d="M${M} 558h${1200 - M * 2}" stroke="${p.rule}"/>`);
  parts.push(text("Free · MIT · macOS 14+ · no WebView", { x: M, y: 592, role: "mono", size: 15, fill: p.textFaint }));
  parts.push(text("downright.cc", { x: 1200 - M, y: 592, role: "monoMedium", size: 15, fill: p.textSecondary, anchor: "end" }));

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">${parts.join("")}</svg>`;
}
