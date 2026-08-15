import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://downright.app",
  output: "static",
  build: {
    format: "directory",
  },
});
