// ============================================================================
// catalog.mjs — the shell's BOOTSTRAP, and nothing else.
//
// Structure of the shell app:
//   games.mjs      — the manifest + pure filter logic (tested)
//   router.mjs     — the history router mechanism (views, data-links)
//   views/         — one module per route, registered in views/index.mjs
//   catalog.mjs    — this file: brand in, router up, first route
// ============================================================================

import { BRAND } from "./shared/logo.mjs";
import { createRouter } from "./router.mjs";
import { ROUTES, wire } from "./views/index.mjs";

document.getElementById("brandHome").innerHTML = BRAND;

// Each view declares its layout ("app" = full frame, "focus" = no
// sidebar); the bootstrap stamps it on the app frame and CSS does the rest.
const appEl = document.querySelector(".app");

const router = createRouter(ROUTES, {
  onChange: (view) => (appEl.dataset.layout = view.layout ?? "app"),
});
wire(router);
router.route();
