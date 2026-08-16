import { access, readFile } from "node:fs/promises";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const dist = join(root, "dist");
const routes = [
  "/", "/download/", "/releases/1.0.16/", "/themes/", "/changelog/", "/privacy/", "/known-gaps/", "/faq/",
  "/markdown-viewer-mac/", "/markdown-editor-mac-free/", "/downright-vs-typora/", "/downright-vs-obsidian/",
  "/guides/quick-look-markdown/", "/guides/open-md-file-mac/", "/guides/markdown-external-changes/", "/guides/review-claude-code-plans/",
  "/markdown-for-agents/claude-code/", "/markdown-for-agents/codex/", "/markdown-for-agents/agents-md/",
  "/compare/macdown/", "/compare/marked/", "/formats/", "/engineering/", "/benchmarks/", "/press/",
];

const failures = [];
const htmlFor = (route) => route === "/" ? join(dist, "index.html") : join(dist, route.slice(1, -1), "index.html");

for (const route of routes) {
  const path = htmlFor(route);
  let html;
  try {
    await access(path);
    html = await readFile(path, "utf8");
  } catch {
    failures.push(`${route}: missing built HTML`);
    continue;
  }

  if (!/<title>[^<]+<\/title>/.test(html)) failures.push(`${route}: missing title`);
  if (!/<meta name="description" content="[^"]+"/.test(html)) failures.push(`${route}: missing description`);
  if (!html.includes(`rel="canonical" href="https://downright.cc${route}"`)) failures.push(`${route}: canonical is not the normalized URL`);
  if (!html.includes('type="application/ld+json"')) failures.push(`${route}: missing JSON-LD`);
  if (!html.includes('"@type":"Organization"') || !html.includes('"@type":"SoftwareSourceCode"')) failures.push(`${route}: incomplete entity graph`);
  if (/\/Volumes\/Neural\//.test(html)) failures.push(`${route}: local filesystem path leaked into built HTML`);
  if (/when verified|not configured yet/.test(html)) failures.push(`${route}: stale release placeholder leaked into built HTML`);
}

const sitemap = await readFile(join(dist, "sitemap.xml"), "utf8");
for (const route of routes) {
  if (!sitemap.includes(`https://downright.cc${route}`)) failures.push(`sitemap: missing ${route}`);
}
if (!sitemap.includes("<lastmod>2026-08-16</lastmod>")) failures.push("sitemap: missing reviewed date");

if (failures.length > 0) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}

console.log(`SEO/AEO audit passed for ${routes.length} HTML routes and sitemap entries.`);
