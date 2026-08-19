import { execFileSync } from "node:child_process";
import type { APIContext } from "astro";
import { reviewedOn, siteRoutes } from "../data/seo";

// Astro runs the static build from the site checkout. Using cwd keeps the
// source-file manifest rooted at the repository even after Vite bundles this
// endpoint into a generated server module.
const root = process.cwd();

function sourceDate(files: string[]): string {
  const diffModes = [
    ["diff", "--quiet", "--no-ext-diff"],
    ["diff", "--cached", "--quiet", "--no-ext-diff"],
  ];
  for (const mode of diffModes) {
    try {
      execFileSync("git", [...mode, "--", ...files], {
        cwd: root,
        stdio: ["ignore", "ignore", "ignore"],
      });
    } catch {
      // An edited-but-uncommitted source file is newer than its last commit.
      // Use the build date for that route so local previews and deployment
      // previews do not publish a stale lastmod value.
      return new Date().toISOString().slice(0, 10);
    }
  }

  try {
    const date = execFileSync("git", ["log", "-1", "--format=%cs", "--", ...files], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : reviewedOn;
  } catch {
    // Hosted builds may not include .git. The reviewed date is an honest
    // fallback and keeps the sitemap valid instead of inventing a timestamp.
    return reviewedOn;
  }
}

function escapeXml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
}

export function GET({ site }: APIContext) {
  const base = site?.toString().replace(/\/$/, "") ?? "https://downright.cc";
  const urls = siteRoutes
    .map(({ path, sourceFiles }) => `<url><loc>${escapeXml(`${base}${path}`)}</loc><lastmod>${sourceDate(sourceFiles)}</lastmod></url>`)
    .join("");
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
