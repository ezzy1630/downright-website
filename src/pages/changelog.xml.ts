import type { APIContext } from "astro";
import changelog from "../data/app/changelog.json";
import { copy } from "../data/site";

export function GET({ site }: APIContext) {
  const base = site?.toString().replace(/\/$/, "") ?? "https://downright.cc";
  const changelogUrl = `${base}/changelog/`;
  const items = changelog.entries.slice(0, 20).map((entry) => `<item><title>${escapeXml(entry.summary)}</title><link>${changelogUrl}</link><guid>${changelogUrl}#${slug(entry.summary)}</guid><pubDate>${new Date(entry.date === "Unreleased" ? Date.now() : entry.date).toUTCString()}</pubDate><description>${escapeXml(`${entry.kind}: ${entry.summary}`)}</description></item>`).join("");
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Downright Changelog</title><link>${changelogUrl}</link><description>${escapeXml(copy.description)}</description>${items}</channel></rss>`, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}

function slug(value: string): string { return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
function escapeXml(value: string): string { return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;"); }
