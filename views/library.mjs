// ============================================================================
// views/library.mjs — the LIBRARY view: sidebar nav, search, the card
// grid, live thumbnails. Owns everything visible at "/".
//
// Filter state lives in the URL, nowhere else. The controls are one
// native GET form (the search field and the sidebar radios associate via
// form="filters"); any change auto-submits, the router serializes it into
// the query string, and enter() renders FROM the URL. One direction:
// form → URL → view. Shareable, bookmarkable, back-button-proof.
// ============================================================================

import { GAMES, filterGames } from "../games.mjs";
import { cssVar } from "../shared/theme.mjs";

const searchEl = document.getElementById("search");
const genreNavEl = document.getElementById("genreNav");
const inputNavEl = document.getElementById("inputNav");
const yearNavEl = document.getElementById("yearNav");
const countEl = document.getElementById("count");
const listEl = document.getElementById("catalog");
const libraryEl = document.getElementById("library");
const filtersForm = document.getElementById("filters");

const tpl = (id) => document.getElementById(id).content;

// The URL's query string, read back as filter values. "" and absence both
// mean the default — the "all" radios carry value="" so defaults never
// clutter the URL.
const readFilters = (query) => ({
  query: query.get("q") ?? "",
  genre: query.get("genre") || "all",
  year: query.get("year") || "all",
  input: query.get("input") || "all",
});

// --- sidebar nav ---------------------------------------------------------------
// Sections DERIVE from the manifest and render ONCE — radios carry the
// selection from then on, and CSS :has(:checked) styles the active row.

const unique = (values) => [...new Set(values)].sort();

function navItem(name, value, label, count) {
  const node = tpl("tpl-nav-item").cloneNode(true);
  const input = node.querySelector("input");
  input.name = name;
  input.value = value; // "" = the default → omitted from the URL
  node.querySelector(".label").textContent = label;
  node.querySelector(".n").textContent = count;
  return node;
}

function renderNav() {
  // The default counter matches scalar fields; "play with" counts array
  // membership instead.
  const section = (el, name, title, values, counts) => {
    const heading = document.createElement("h3");
    heading.textContent = title;
    const count = counts ?? ((v) => GAMES.filter((g) => String(g[name]) === String(v)).length);
    el.replaceChildren(
      heading,
      navItem(name, "", `all ${title}`, GAMES.length),
      ...values.map((v) => navItem(name, String(v), String(v), count(v)))
    );
  };

  section(genreNavEl, "genre", "genres", unique(GAMES.map((g) => g.genre)));
  section(inputNavEl, "input", "play with", ["keyboard", "mouse", "touch"],
    (v) => GAMES.filter((g) => g.inputs.includes(v)).length);
  section(yearNavEl, "year", "years", unique(GAMES.map((g) => g.year)));
}

// Any filter change auto-submits the form; the router turns it into a URL
// and routes — the view never mutates its own state directly.
for (const el of [searchEl, genreNavEl, inputNavEl, yearNavEl]) {
  el.addEventListener("input", () => filtersForm.requestSubmit());
}

// Write the URL's values back INTO the controls (deep links, back button).
// Guarded assignments: rewriting an identical search value would still
// move the caret while typing.
function syncControls({ query, genre, year, input }) {
  if (searchEl.value !== query) searchEl.value = query;
  for (const [nav, value] of [[genreNavEl, genre], [inputNavEl, input], [yearNavEl, year]]) {
    const input = nav.querySelector(`input[value="${value === "all" ? "" : value}"]`);
    if (input && !input.checked) input.checked = true;
  }
}

// --- live thumbnails ---------------------------------------------------------
// Prerendered ONCE each into an offscreen canvas: the game's real state,
// its real rules stepped, its real renderer. Cached so filtering doesn't
// resimulate — and a thumbnail doesn't change while you type.

const THUMBS = new Map(); // id → offscreen canvas

async function prerenderThumb(game) {
  const [core, { render }] = await Promise.all([
    import(`../games/${game.id}/logic.mjs`),
    import(`../games/${game.id}/render.mjs`),
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
    node.querySelector(".card").href = `/play/${game.id}`;
    node.querySelector(".thumb").dataset.thumb = game.id;
  }
  node.querySelector("h2").textContent = game.title;
  node.querySelector("p").textContent = game.live ? game.blurb : `${game.blurb} Coming soon.`;
  node.querySelector(".year").textContent = game.year;
  node.querySelector(".genre").textContent = game.genre;
  // Input tags: the SAME .tag pill the genre wears — one CSS rule, no
  // drift. (This was a web component while it drew pixel icons; as text,
  // a span is the honest element.)
  const LABELS = { keyboard: "keys", mouse: "mouse", touch: "touch" };
  const inputsEl = node.querySelector(".inputs");
  if (inputsEl && game.inputs) {
    inputsEl.replaceChildren(
      ...game.inputs.map((type) => {
        const tag = document.createElement("span");
        tag.className = "tag";
        tag.textContent = LABELS[type];
        return tag;
      })
    );
  }
  return node;
}

function renderCatalog(filters) {
  const shown = filterGames(GAMES, filters);
  listEl.replaceChildren(
    ...(shown.length ? shown.map(card) : [tpl("tpl-empty").cloneNode(true)])
  );
  countEl.textContent = `${shown.length} of ${GAMES.length} games`;
  paintThumbs();
}

// --- the view ---------------------------------------------------------------------

export const libraryView = {
  layout: "app", // the full frame: sidebar + topbar
  wire() {}, // navigation is the form's job now — nothing to inject
  enter(_, query) {
    const filters = readFilters(query);
    syncControls(filters);
    renderCatalog(filters);
    libraryEl.hidden = false;
    searchEl.hidden = false; // the search field belongs to this view
  },
  leave() {
    libraryEl.hidden = true;
  },
};

// Nav renders once at module load; thumbnails hydrate in as they finish.
renderNav();
for (const game of GAMES.filter((g) => g.live)) {
  prerenderThumb(game).then(paintThumbs);
}
