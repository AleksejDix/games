// Vite config for a multi-page site: the catalog at / plus one page per
// game. The dev server (`npm run dev`) serves every page automatically —
// this `input` list only matters for `npm run build`, which needs to know
// each HTML entry point to bundle. Add a line here when a new game joins
// the catalog.

import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  server: {
    // A fixed home for this project. Without strictPort, Vite silently
    // hops to the next free port when its default (5173) is taken by
    // another project's dev server — easy to end up staring at the wrong
    // app. strictPort makes it fail loudly instead.
    port: 5190,
    strictPort: true,
  },
  build: {
    rollupOptions: {
      input: {
        catalog: resolve(import.meta.dirname, "index.html"),
        snake: resolve(import.meta.dirname, "snake/index.html"),
      },
    },
  },
});
