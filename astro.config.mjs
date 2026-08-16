import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://downright.cc",
  output: "static",
  // The dev toolbar floats a pill over the fold and lands in every design
  // screenshot. This page is judged on its composition; keep the surface clean.
  devToolbar: { enabled: false },
  build: {
    format: "directory",
  },
});
