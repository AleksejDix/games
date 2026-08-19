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

const router = createRouter(ROUTES);
wire(router);
router.route();
