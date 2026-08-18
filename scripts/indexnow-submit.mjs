#!/usr/bin/env node

import { readFile } from "node:fs/promises";

const origin = (process.env.SITE_ORIGIN || "https://downright.cc").replace(/\/$/, "");
const endpoint = process.env.INDEXNOW_ENDPOINT || "https://api.indexnow.org/indexnow";
const key = process.env.INDEXNOW_KEY;
const keyLocation = process.env.INDEXNOW_KEY_LOCATION || (key ? `${origin}/${key}.txt` : undefined);
const send = process.argv.includes("--send");
const paths = process.argv.slice(2).filter((value) => value !== "--send");

function canonicalPath(value) {
  const path = value.startsWith("/") ? value : `/${value}`;
  if (path.includes("?") || path.includes("#") || path.endsWith(".md") || path.includes("//")) {
    throw new Error(`not a canonical HTML path: ${value}`);
  }
  return path === "/" ? path : `${path.replace(/\/+$/, "")}/`;
}

async function sitemapPaths() {
  const source = await readFile("dist/sitemap-0.xml", "utf8").catch(async () => readFile("dist/sitemap.xml", "utf8"));
  return [...source.matchAll(/<loc>(.*?)<\/loc>/g)].map(([, value]) => new URL(value).pathname);
}

const selected = (paths.length ? paths : await sitemapPaths()).map(canonicalPath);
const unique = [...new Set(selected)].sort();
const payload = {
  host: new URL(origin).host,
  key,
  keyLocation,
  urlList: unique.map((path) => `${origin}${path}`),
};

if (!send) {
  console.log(JSON.stringify({ mode: "dry-run", endpoint, ...payload }, null, 2));
  process.exit(0);
}
if (!key || !keyLocation) throw new Error("--send requires INDEXNOW_KEY and INDEXNOW_KEY_LOCATION (or SITE_ORIGIN)");
const response = await fetch(endpoint, {
  method: "POST",
  headers: { "content-type": "application/json; charset=utf-8", "user-agent": "downright-indexnow-submit" },
  body: JSON.stringify(payload),
});
if (!response.ok) throw new Error(`IndexNow returned ${response.status}: ${await response.text()}`);
console.log(`Submitted ${unique.length} canonical URLs to ${endpoint}.`);
