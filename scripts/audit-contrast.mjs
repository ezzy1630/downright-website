import { readFile } from "node:fs/promises";

const { themes } = JSON.parse(await readFile(new URL("../src/data/app/themes.json", import.meta.url), "utf8"));
const rgb = (hex) => { const value = hex.replace("#", ""); return [0, 2, 4].map((index) => Number.parseInt(value.slice(index, index + 2), 16) / 255); };
const luminance = (hex) => rgb(hex).map((value) => value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
const ratio = (a, b) => { const light = Math.max(luminance(a), luminance(b)); const dark = Math.min(luminance(a), luminance(b)); return (light + 0.05) / (dark + 0.05); };
let failed = false;
const concreteThemes = themes.filter((theme) => theme.name !== "System");
const paperLight = themes.find((theme) => theme.name === "Paper Light");
const warmDark = themes.find((theme) => theme.name === "Warm Dark");
const systemModes = [
  paperLight && { ...paperLight, name: "System (light)" },
  warmDark && { ...warmDark, name: "System (dark)" },
].filter(Boolean);
for (const theme of [...concreteThemes, ...systemModes]) {
  const checks = [["body", theme.palette.text, theme.palette.background], ["secondary", theme.palette.textSecondary, theme.palette.background], ["heading", theme.palette.heading, theme.palette.background], ["link", theme.palette.link, theme.palette.background], ["primary button", theme.palette.background, theme.palette.heading], ["callout label", theme.palette.heading, theme.palette.background]];
  const results = checks.map(([name, foreground, background]) => [name, ratio(foreground, background)]);
  const minimum = Math.min(...results.map(([, value]) => value));
  console.log(`${theme.name}: minimum ${minimum.toFixed(2)}:1`);
  if (minimum < 4.5) { failed = true; console.error(`Contrast failure in ${theme.name}`); }
}
if (failed) process.exitCode = 1;
