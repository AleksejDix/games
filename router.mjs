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
    const query = new URLSearchParams(location.search);
    for (const { match, view } of routes) {
      const params = match(location.pathname);
      if (!params) continue;
      if (active !== view) active?.leave?.();
      active = view;
      view.enter?.(params, query);
      onChange?.(view); // the shell reacts to the view itself (layouts)
      return;
    }
  }

  function navigate(path, { replace = false } = {}) {
    if (location.pathname + location.search !== path) {
      history[replace ? "replaceState" : "pushState"]({}, "", path);
    }
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

  // Native forms are the router's second input: a GET form already
  // DESCRIBES a URL — its name/value pairs are the query string, and the
  // browser has serialized them since 1993. Intercept submit on any
  // <form data-link>, build the query (empty values omitted, for clean
  // URLs), and navigate instead of reloading. data-replace opts into
  // replaceState — right for live filters, which should update the
  // address bar without writing a history entry per keystroke.
  document.addEventListener("submit", (e) => {
    const form = e.target.closest("form[data-link]");
    if (!form) return;
    e.preventDefault();
    const qs = new URLSearchParams();
    for (const [name, value] of new FormData(form)) {
      if (value !== "") qs.append(name, value);
    }
    const path = form.getAttribute("action") || location.pathname;
    navigate(qs.size ? `${path}?${qs}` : path, {
      replace: form.hasAttribute("data-replace"),
    });
  });

  window.addEventListener("popstate", route);

  return { navigate, route };
}
