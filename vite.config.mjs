// Vite config for a multi-page site: the catalog at / plus one page per
// game. The dev server (`npm run dev`) serves every page automatically —
// this `input` list only matters for `npm run build`, which needs to know
// each HTML entry point to bundle. Add a line here when a new game joins
// the catalog.

import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        catalog: resolve(import.meta.dirname, "index.html"),
        snake: resolve(import.meta.dirname, "snake/index.html"),
      },
    },
  },
});
