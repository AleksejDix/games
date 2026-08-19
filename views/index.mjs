// ============================================================================
// views/index.mjs — the shell's ROUTE TABLE: matcher → view, in order,
// the last one the catch-all. Adding a page to the app = one view module
// in views/ plus one line here. (The same single-registration idea as the
// games manifest.)
// ============================================================================

import { libraryView } from "./library.mjs";
import { playView } from "./play.mjs";
import { recordsView } from "./records.mjs";

export const ROUTES = [
  {
    match: (path) => {
      const m = path.match(/^\/play\/([a-z0-9]+)$/); // 2048 taught us ids have digits
      return m && { id: m[1] };
    },
    view: playView,
  },
  { match: (path) => (path === "/records" ? {} : null), view: recordsView },
  // The catch-all: everything else is the library.
  { match: () => ({}), view: libraryView },
];

// Views that navigate (filter resets, invalid ids) get the router handed
// in — plain dependency injection, same as the cores' random.
export function wire(router) {
  for (const { view } of ROUTES) view.wire?.(router);
}
