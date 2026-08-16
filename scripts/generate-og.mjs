import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const output = join(root, "public/og");
const { themes } = JSON.parse(await readFile(join(root, "src/data/app/themes.json"), "utf8"));
const paper = themes.find((theme) => theme.id === "paper-light");
const palette = paper?.palette ?? { background: "#f7f4ee", rule: "#d9d2c8", accent: "#307afe", text: "#292522", heading: "#181513", textSecondary: "#685f56", textFaint: "#8b8178" };
const escape = (value) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const images = {
  index: ["The native Markdown app", "for macOS.", "Live document surfaces, exact files, no WebView."],
  themes: ["Six palettes.", "One document.", "Source-derived themes from the native app."],
  changelog: ["Version truth,", "in public.", "A changelog generated from the app payload."],
  privacy: ["Local use", "is the default.", "No account. No cloud sync. No core-app telemetry."],
};
const canonicalMark = await readFile(join(root, "public/favicon.svg"), "utf8");
const markContent = canonicalMark.replace(/^<svg\b[^>]*>/, "").replace(/<\/svg>\s*$/, "");
const brandMark = `<g transform="translate(77 100) scale(1.1)">${markContent}</g>`;

await mkdir(output, { recursive: true });
for (const [name, lines] of Object.entries(images)) {
  const [headline, subhead, detail] = lines;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="${palette.background}"/><path d="M72 86h1056M72 550h1056" stroke="${palette.rule}"/>${brandMark}<text x="116" y="123" fill="${palette.text}" font-family="Arial,sans-serif" font-size="22" font-weight="700">Downright</text><text x="72" y="285" fill="${palette.heading}" font-family="Georgia,serif" font-size="72">${escape(headline)}</text><text x="72" y="365" fill="${palette.heading}" font-family="Georgia,serif" font-size="72">${escape(subhead)}</text><text x="76" y="460" fill="${palette.textSecondary}" font-family="Arial,sans-serif" font-size="24">${escape(detail)}</text><rect x="700" y="132" width="428" height="310" rx="12" fill="${palette.surface ?? palette.background}" stroke="${palette.rule}"/><path d="M746 212h238M746 236h310M746 260h270M746 316h190M746 340h258M746 364h224" stroke="${palette.textFaint}" stroke-width="3" stroke-linecap="round" opacity=".72"/><text x="746" y="420" fill="${palette.accent}" font-family="monospace" font-size="17">LIVE MARKDOWN / NO IMAGE</text><text x="1080" y="595" fill="${palette.textFaint}" font-family="monospace" font-size="14" text-anchor="end">downright.cc</text></svg>`;
  await writeFile(join(output, `${name}.svg`), svg);
}
console.log("Generated 1200x630 OG SVGs without screenshot assets");
