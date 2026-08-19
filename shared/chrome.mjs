// The shared site chrome: a game page visited DIRECTLY prepends the app's
// topbar — the NEON GAMES brand linking back to the catalog, the page's
// title, the user slot. Inside the catalog's player iframe the shell
// already provides all of that, so the chrome skips itself when framed.

import { BRAND } from "./logo.mjs";

if (window.self !== window.top) {
  // Embedded in the shell — no chrome, the game fills the frame.
} else {
  injectChrome();
}

function injectChrome() {
  const header = document.createElement("header");
  header.className = "site-topbar";
  header.innerHTML = `
    <a class="brandmark" href="/">${BRAND}</a>
    <span class="here">${document.title}</span>
    <div class="user"><span class="avatar">&#9786;</span><span>guest</span></div>
  `;
  document.body.prepend(header);
}
