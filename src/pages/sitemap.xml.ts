import type { APIContext } from "astro";

const paths = ["/", "/themes", "/changelog", "/privacy", "/known-gaps"];

export function GET({ site }: APIContext) {
  const base = site?.toString().replace(/\/$/, "") ?? "https://downright.cc";
  const urls = paths.map((path) => `<url><loc>${base}${path}</loc></url>`).join("");
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
