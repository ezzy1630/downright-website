/**
 * Minimal TrueType metrics reader.
 *
 * The OG cards are laid out from measured advance widths, not guessed ones —
 * the previous generator hardcoded a 72px headline and silently ran the
 * homepage title underneath the artwork. Everything here reads the same font
 * files resvg rasterises with, so measurement and render agree by construction.
 *
 * Advances come from hmtx only. Kerning (GPOS) is ignored, which over-measures
 * slightly: text fits tighter than predicted, never wider. That bias is the
 * safe direction for a fitting routine.
 */
import { readFileSync } from "node:fs";

const tag = (view, offset) => String.fromCharCode(...[0, 1, 2, 3].map((i) => view.getUint8(offset + i)));

function readTables(view) {
  const tables = new Map();
  const count = view.getUint16(4);
  for (let i = 0; i < count; i += 1) {
    const record = 12 + i * 16;
    tables.set(tag(view, record), { offset: view.getUint32(record + 8), length: view.getUint32(record + 12) });
  }
  return tables;
}

/** Unicode -> glyph id. Format 4 covers the BMP; format 12 covers the rest. */
function readCmap(view, offset) {
  const map = new Map();
  const subtables = view.getUint16(offset + 2);
  let best = -1;
  let bestScore = -1;
  for (let i = 0; i < subtables; i += 1) {
    const record = offset + 4 + i * 8;
    const platform = view.getUint16(record);
    const encoding = view.getUint16(record + 2);
    const subtable = offset + view.getUint32(record + 4);
    // Prefer a full-repertoire table, then Windows BMP, then anything Unicode.
    const score = platform === 3 && encoding === 10 ? 3 : platform === 3 && encoding === 1 ? 2 : platform === 0 ? 1 : 0;
    if (score > bestScore) { bestScore = score; best = subtable; }
  }
  if (best < 0) throw new Error("font has no usable cmap subtable");

  const format = view.getUint16(best);
  if (format === 4) {
    const segX2 = view.getUint16(best + 6);
    const segments = segX2 / 2;
    const ends = best + 14;
    const starts = ends + segX2 + 2;
    const deltas = starts + segX2;
    const ranges = deltas + segX2;
    for (let s = 0; s < segments; s += 1) {
      const end = view.getUint16(ends + s * 2);
      const start = view.getUint16(starts + s * 2);
      if (start > end) continue;
      const delta = view.getInt16(deltas + s * 2);
      const rangeOffset = view.getUint16(ranges + s * 2);
      for (let code = start; code <= end && code !== 0xffff; code += 1) {
        let glyph;
        if (rangeOffset === 0) {
          glyph = (code + delta) & 0xffff;
        } else {
          const glyphAddr = ranges + s * 2 + rangeOffset + (code - start) * 2;
          glyph = view.getUint16(glyphAddr);
          if (glyph !== 0) glyph = (glyph + delta) & 0xffff;
        }
        if (glyph !== 0) map.set(code, glyph);
      }
    }
  } else if (format === 12) {
    const groups = view.getUint32(best + 12);
    for (let g = 0; g < groups; g += 1) {
      const record = best + 16 + g * 12;
      const start = view.getUint32(record);
      const end = view.getUint32(record + 4);
      const startGlyph = view.getUint32(record + 8);
      for (let code = start; code <= end; code += 1) map.set(code, startGlyph + (code - start));
    }
  } else {
    throw new Error(`unsupported cmap format ${format}`);
  }
  return map;
}

export function loadFontMetrics(path) {
  const buffer = readFileSync(path);
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  const tables = readTables(view);
  const head = tables.get("head");
  const hhea = tables.get("hhea");
  const hmtx = tables.get("hmtx");
  const cmap = tables.get("cmap");
  if (!head || !hhea || !hmtx || !cmap) throw new Error(`${path}: missing required tables`);

  const unitsPerEm = view.getUint16(head.offset + 18);
  const hMetrics = view.getUint16(hhea.offset + 34);
  const advances = new Uint16Array(hMetrics);
  for (let i = 0; i < hMetrics; i += 1) advances[i] = view.getUint16(hmtx.offset + i * 4);

  const charmap = readCmap(view, cmap.offset);
  const ascent = view.getInt16(hhea.offset + 4) / unitsPerEm;
  const descent = view.getInt16(hhea.offset + 6) / unitsPerEm;
  // Missing glyphs fall back to the last advance, matching hmtx's monospaced tail.
  const fallback = advances[hMetrics - 1] ?? unitsPerEm;

  const widthOf = (code) => {
    const glyph = charmap.get(code);
    if (glyph === undefined) return fallback;
    return (glyph < hMetrics ? advances[glyph] : fallback);
  };

  return {
    path,
    unitsPerEm,
    ascent,
    descent,
    has: (code) => charmap.has(code),
    /** Advance width of `text` rendered at `size` px. */
    measure(text, size) {
      let units = 0;
      for (const character of text) units += widthOf(character.codePointAt(0));
      return (units / unitsPerEm) * size;
    },
  };
}
