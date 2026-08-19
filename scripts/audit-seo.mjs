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
const fileForPath = (pathname) => {
  const clean = pathname.split("?", 1)[0].split("#", 1)[0];
  if (clean === "/") return join(dist, "index.html");
  if (clean.endsWith("/")) return join(dist, clean.slice(1), "index.html");
  return join(dist, clean.slice(1));
};

const exists = async (path) => {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
};

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
  const canonicals = html.match(/<link\b[^>]*rel="canonical"[^>]*>/g) ?? [];
  if (canonicals.length !== 1) failures.push(`${route}: expected exactly one canonical, found ${canonicals.length}`);
  if (!html.includes(`rel="canonical" href="https://downright.cc${route}"`)) failures.push(`${route}: canonical is not the normalized URL`);
  // The site intentionally renders real Markdown inside interactive document
  // demos, so those inner document headings are not page-level SEO headings.
  // Count the structural hero heading instead of flattening the product demo.
  const primaryH1 = html.match(/<(?:section|div)\b[^>]*class="[^"]*(?:hero__copy|subpage-hero)[^"]*"[^>]*>[\s\S]*?<h1\b/gi) ?? [];
  if (primaryH1.length !== 1) failures.push(`${route}: expected exactly one page-level H1`);
  if (/<meta\b[^>]*name="robots"[^>]*content="[^"]*noindex/i.test(html)) failures.push(`${route}: accidental noindex`);
  if (!html.includes('type="application/ld+json"')) failures.push(`${route}: missing JSON-LD`);
  if (!html.includes('"@type":"Organization"') || !html.includes('"@type":"SoftwareSourceCode"')) failures.push(`${route}: incomplete entity graph`);
  if (/\/Volumes\/Neural\//.test(html)) failures.push(`${route}: local filesystem path leaked into built HTML`);
  if (/when verified|not configured yet/.test(html)) failures.push(`${route}: stale release placeholder leaked into built HTML`);

  for (const image of html.match(/<img\b[^>]*>/gi) ?? []) {
    const decorative = /aria-hidden="true"/i.test(image) || /role="presentation"/i.test(image);
    if (!decorative && !/\balt="[^"]+"/i.test(image)) failures.push(`${route}: image is missing alt text`);
  }

  const ogImage = html.match(/<meta\b[^>]*property="og:image"[^>]*content="([^"]+)"/i)?.[1];
  if (!ogImage) {
    failures.push(`${route}: missing OG image`);
  } else {
    const pathname = new URL(ogImage).pathname;
    if (!(await exists(fileForPath(pathname)))) failures.push(`${route}: OG image does not resolve (${pathname})`);
  }

  const markdownAlternate = html.match(/<link\b[^>]*rel="alternate"[^>]*type="text\/markdown"[^>]*href="([^"]+)"/i)?.[1];
  if (!markdownAlternate) {
    failures.push(`${route}: missing Markdown alternate`);
  } else {
    const pathname = new URL(markdownAlternate).pathname;
    if (!(await exists(fileForPath(pathname)))) failures.push(`${route}: Markdown alternate does not resolve (${pathname})`);
  }

  for (const href of html.matchAll(/\bhref="(\/[^"#]+)"/g)) {
    const pathname = href[1];
    if (pathname.startsWith("/api/") || pathname === "/install") continue;
    if (!(await exists(fileForPath(pathname)))) failures.push(`${route}: broken internal link ${pathname}`);
  }
}

const sitemap = await readFile(join(dist, "sitemap.xml"), "utf8");
const sitemapEntries = [...sitemap.matchAll(/<url>(.*?)<\/url>/g)].map((match) => match[1]);
if (sitemapEntries.length !== routes.length) failures.push(`sitemap: expected ${routes.length} canonical URLs, found ${sitemapEntries.length}`);
for (const route of routes) {
  const entry = sitemapEntries.find((candidate) => candidate.includes(`<loc>https://downright.cc${route}</loc>`));
  if (!entry) {
    failures.push(`sitemap: missing ${route}`);
    continue;
  }
  const date = entry.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1] ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) failures.push(`sitemap: invalid lastmod for ${route}`);
}
if (/<loc>[^<]+\.md<\/loc>/.test(sitemap)) failures.push("sitemap: Markdown mirrors must not be submitted as canonical URLs");

if (failures.length > 0) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}

console.log(`SEO/AEO audit passed for ${routes.length} HTML routes and sitemap entries.`);
