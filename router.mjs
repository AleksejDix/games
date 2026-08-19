// ============================================================================
// router.mjs — the SHELL's tiny history router, now with VIEWS.
//
// A route pairs a matcher with a view; a view is { enter(params), leave() }.
// The router walks the table in order, calls leave() on the outgoing view
// and enter(params) on the incoming one — that's the entire lifecycle.
// pushState for in-app clicks (any <a data-link>), popstate for Back.
// The router knows nothing about what the routes mean.
//
// Lives at the root with the rest of the shell: shared/ is the games'
// standard library, and no game ever routes. Deep links need the server to
// fall back to index.html for extension-less paths (Vite's dev server does).
// ============================================================================

export function createRouter(routes, { onChange } = {}) {
  let active = null;

  function route() {
    for (const { match, view } of routes) {
      const params = match(location.pathname);
      if (!params) continue;
      if (active !== view) active?.leave?.();
      active = view;
      view.enter?.(params);
      onChange?.(view); // the shell reacts to the view itself (layouts)
      return;
    }
  }

  function navigate(path) {
    if (location.pathname !== path) history.pushState({}, "", path);
    route();
  }

  document.addEventListener("click", (e) => {
    const link = e.target.closest("a[data-link]");
    if (!link) return;
    // Modified clicks (new tab, window) belong to the browser.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    navigate(link.getAttribute("href"));
  });

  window.addEventListener("popstate", route);

  return { navigate, route };
}
