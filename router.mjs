// ============================================================================
// router.mjs — the SHELL's tiny history router, the whole thing.
//
// Lives at the root with the rest of the shell: shared/ is the GAMES'
// standard library, and no game ever routes.
//
// Real URLs via the History API: pushState for in-app navigation, popstate
// for the Back button, and one delegated click handler that captures every
// <a data-link>. The app supplies a single callback that renders whatever
// the current pathname means — the router never knows what routes exist.
//
// Modified clicks (new tab, window) belong to the browser, not the router.
// Deep links need the server to fall back to index.html for extension-less
// paths (Vite's dev server does by default).
// ============================================================================

export function createRouter(onRoute) {
  const route = () => onRoute(location.pathname);

  function navigate(path) {
    if (location.pathname !== path) history.pushState({}, "", path);
    route();
  }

  document.addEventListener("click", (e) => {
    const link = e.target.closest("a[data-link]");
    if (!link) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    navigate(link.getAttribute("href"));
  });

  window.addEventListener("popstate", route);

  return { navigate, route };
}
