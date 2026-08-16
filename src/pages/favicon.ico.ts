export const GET = (): Response => new Response(null, {
  status: 302,
  headers: {
    "Cache-Control": "public, max-age=31536000, immutable",
    "Location": "/favicon.svg",
  },
});
