import type { APIContext } from "astro";
import { siteRouteDates } from "../data/seo";

export function GET({ site }: APIContext) {
  const base = site?.toString().replace(/\/$/, "") ?? "https://downright.cc";
  const urls = Object.entries(siteRouteDates)
    .map(([path, lastmod]) => `<url><loc>${base}${path}</loc><lastmod>${lastmod}</lastmod></url>`)
    .join("");
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
