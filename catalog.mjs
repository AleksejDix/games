// The catalog page is DATA-DRIVEN: it renders whatever games.mjs declares.
// The shell is an app layout — sidebar nav (genres, years, with counts),
// topbar search, content grid — and every list on it derives from the
// manifest. Filtering itself is pure logic in games.mjs (tested in
// games.test.mjs); this file is only DOM.
//
// The thumbnails are the architecture's party trick: because every game
// is a pure core plus a pure renderer, the catalog can import both, run
// the REAL simulation for a few ticks, and draw the REAL frame — live
// screenshots, different on every visit, no image files anywhere.

import { GAMES, filterGames } from "./games.mjs";
import { cssVar } from "./shared/theme.mjs";
import { BRAND } from "./shared/logo.mjs";

document.getElementById("brandHome").innerHTML = BRAND;

const searchEl = document.getElementById("search");
const genreNavEl = document.getElementById("genreNav");
const yearNavEl = document.getElementById("yearNav");
const countEl = document.getElementById("count");
const listEl = document.getElementById("catalog");
const libraryEl = document.getElementById("library");
const playerEl = document.getElementById("player");
const playerFrame = document.getElementById("playerFrame");
const playerTitle = document.getElementById("playerTitle");

// The shell's filter state — the sidebar and the cards both render from it.
const state = { query: "", genre: "all", year: "all" };

// HTML5 templates: markup lives in index.html; this file only CLONES and
// fills with textContent — parsed once, no string building, no injection.
const tpl = (id) => document.getElementById(id).content;

// --- sidebar nav ---------------------------------------------------------------
// Sections DERIVE from the manifest — register a game, and its genre and
// year appear in the nav, with counts, for free.

const unique = (values) => [...new Set(values)].sort();

function navButton(attr, value, label, count, active) {
  const node = tpl("tpl-nav-item").cloneNode(true);
  const button = node.querySelector("button");
  button.dataset[attr] = value;
  button.classList.toggle("active", active);
  button.querySelector(".label").textContent = label;
  button.querySelector(".n").textContent = count;
  return node;
}

function renderNav() {
  const section = (el, attr, title, values, selected) => {
    const heading = document.createElement("h3");
    heading.textContent = title;
    el.replaceChildren(
      heading,
      navButton(attr, "all", `all ${title}`, GAMES.length, selected === "all"),
      ...values.map((v) =>
        navButton(
          attr,
          v,
          String(v),
          GAMES.filter((g) => String(g[attr]) === String(v)).length,
          String(selected) === String(v)
        )
      )
    );
  };

  section(genreNavEl, "genre", "genres", unique(GAMES.map((g) => g.genre)), state.genre);
  section(yearNavEl, "year", "years", unique(GAMES.map((g) => g.year)), state.year);
}

genreNavEl.addEventListener("click", (e) => {
  const b = e.target.closest("[data-genre]");
  if (b) update({ genre: b.dataset.genre });
});
yearNavEl.addEventListener("click", (e) => {
  const b = e.target.closest("[data-year]");
  if (b) update({ year: b.dataset.year });
});
searchEl.addEventListener("input", () => update({ query: searchEl.value }));

// --- live thumbnails ---------------------------------------------------------
// Prerendered ONCE each into an offscreen canvas: the game's real state,
// its real rules stepped, its real renderer. Cached so filtering doesn't
// resimulate — and a thumbnail doesn't change while you type.

const THUMBS = new Map(); // id → offscreen canvas

async function prerenderThumb(game) {
  const [core, { render }] = await Promise.all([
    import(`./games/${game.id}/logic.mjs`),
    import(`./games/${game.id}/render.mjs`),
  ]);
  const off = document.createElement("canvas");
  off.width = game.thumb.width;
  off.height = game.thumb.height;
  const gameState = core.createState(game.thumb.options ?? {});
  for (let i = 0; i < game.thumb.ticks; i++) core.step(gameState);
  render(off.getContext("2d"), gameState, false);
  THUMBS.set(game.id, off);
}

function paintThumbs() {
  for (const canvas of listEl.querySelectorAll("canvas[data-thumb]")) {
    const off = THUMBS.get(canvas.dataset.thumb);
    if (!off) continue;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = cssVar("--bg");
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Contain: whole court visible, letterboxed on the dark ground.
    const scale = Math.min(canvas.width / off.width, canvas.height / off.height);
    const w = off.width * scale;
    const h = off.height * scale;
    ctx.drawImage(off, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
  }
}

// --- cards ---------------------------------------------------------------------

function card(game) {
  const node = tpl(game.live ? "tpl-card" : "tpl-card-soon").cloneNode(true);
  if (game.live) {
    node.querySelector(".card").href = `#/play/${game.id}`;
    node.querySelector(".thumb").dataset.thumb = game.id;
  }
  node.querySelector("h2").textContent = game.title;
  node.querySelector("p").textContent = game.live ? game.blurb : `${game.blurb} Coming soon.`;
  node.querySelector(".year").textContent = game.year;
  node.querySelector(".genre").textContent = game.genre;
  return node;
}

function renderCatalog() {
  const shown = filterGames(GAMES, state);
  listEl.replaceChildren(
    ...(shown.length ? shown.map(card) : [tpl("tpl-empty").cloneNode(true)])
  );
  countEl.textContent = `${shown.length} of ${GAMES.length} games`;
  paintThumbs();
}

function update(patch) {
  Object.assign(state, patch);
  if (location.hash) location.hash = ""; // filtering brings you back to the library
  renderNav();
  renderCatalog();
}

// --- the player ------------------------------------------------------------------
// Games open in an IFRAME inside the shell — the sidebar and topbar stay,
// and the games never learn they're embedded (their own chrome skips
// itself when framed). Hash routing keeps the back button honest:
// #/play/<id> is a game, anything else is the library.

function route() {
  const match = location.hash.match(/^#\/play\/([a-z]+)$/);
  const game = match && GAMES.find((g) => g.id === match[1] && g.live);
  if (game) {
    playerTitle.textContent = game.title;
    const src = `/games/${game.id}/`;
    if (playerFrame.getAttribute("src") !== src) playerFrame.src = src;
    libraryEl.hidden = true;
    playerEl.hidden = false;
  } else {
    playerEl.hidden = true;
    libraryEl.hidden = false;
    // Unload on exit — a hidden game must not keep looping and beeping.
    playerFrame.removeAttribute("src");
  }
}

// Keyboard games need the frame focused — hand it over as soon as it loads.
playerFrame.addEventListener("load", () => playerFrame.focus());
window.addEventListener("hashchange", route);

renderNav();
renderCatalog(); // cards first — thumbnails hydrate in as they finish
route();
for (const game of GAMES.filter((g) => g.live)) {
  prerenderThumb(game).then(paintThumbs);
}
