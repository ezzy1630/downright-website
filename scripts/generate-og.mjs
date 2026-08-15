import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const output = join(root, "public/og");
const { themes } = JSON.parse(await readFile(join(root, "src/data/app/themes.json"), "utf8"));
const paper = themes.find((theme) => theme.id === "paper-light");
const palette = paper?.palette ?? { background: "#f7f4ee", rule: "#d9d2c8", accent: "#307afe", text: "#292522", heading: "#181513", textSecondary: "#685f56", textFaint: "#8b8178" };
const escape = (value) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const images = {
  index: ["The native Markdown app", "for macOS.", "The page is a Downright document."],
  themes: ["Six palettes.", "One document.", "Source-derived themes from the native app."],
  changelog: ["Version truth,", "in public.", "A changelog generated from the app payload."],
  privacy: ["Local use", "is the default.", "No account. No cloud sync. No core-app telemetry."],
};

await mkdir(output, { recursive: true });
for (const [name, lines] of Object.entries(images)) {
  const [headline, subhead, detail] = lines;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><defs><clipPath id="render"><rect x="700" y="132" width="428" height="310" rx="12"/></clipPath></defs><rect width="1200" height="630" fill="${palette.background}"/><path d="M72 86h1056M72 550h1056" stroke="${palette.rule}"/><path d="M86 104l-3 27M97 104l-3 27M79 114h27M78 126h27" stroke="${palette.accent}" stroke-width="2.6" stroke-linecap="round" fill="none"/><text x="116" y="123" fill="${palette.text}" font-family="Arial,sans-serif" font-size="22" font-weight="700">Downright</text><text x="72" y="285" fill="${palette.heading}" font-family="Georgia,serif" font-size="72">${escape(headline)}</text><text x="72" y="365" fill="${palette.heading}" font-family="Georgia,serif" font-size="72">${escape(subhead)}</text><text x="76" y="460" fill="${palette.textSecondary}" font-family="Arial,sans-serif" font-size="24">${escape(detail)}</text><rect x="700" y="132" width="428" height="310" rx="12" fill="#171614" stroke="${palette.rule}"/><image href="../assets/downright-renderer-showcase.webp" x="700" y="132" width="428" height="310" preserveAspectRatio="xMidYMid slice" clip-path="url(#render)"/><text x="1080" y="595" fill="${palette.textFaint}" font-family="monospace" font-size="14" text-anchor="end">downright.app</text></svg>`;
  await writeFile(join(output, `${name}.svg`), svg);
}
console.log("Generated 1200x630 OG SVGs");
