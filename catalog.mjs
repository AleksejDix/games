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

const searchEl = document.getElementById("search");
const genreNavEl = document.getElementById("genreNav");
const yearNavEl = document.getElementById("yearNav");
const countEl = document.getElementById("count");
const listEl = document.getElementById("catalog");

// The shell's filter state — the sidebar and the cards both render from it.
const state = { query: "", genre: "all", year: "all" };

// --- sidebar nav ---------------------------------------------------------------
// Sections DERIVE from the manifest — register a game, and its genre and
// year appear in the nav, with counts, for free.

const unique = (values) => [...new Set(values)].sort();

const navButton = (attr, value, label, count, active) =>
  `<button data-${attr}="${value}" class="${active ? "active" : ""}">
     <span>${label}</span><span class="n">${count}</span>
   </button>`;

function renderNav() {
  const section = (attr, title, values, selected) =>
    `<h3>${title}</h3>` +
    navButton(attr, "all", `all ${title}`, GAMES.length, selected === "all") +
    values
      .map((v) =>
        navButton(
          attr,
          v,
          v,
          GAMES.filter((g) => String(g[attr]) === String(v)).length,
          String(selected) === String(v)
        )
      )
      .join("");

  genreNavEl.innerHTML = section("genre", "genres", unique(GAMES.map((g) => g.genre)), state.genre);
  yearNavEl.innerHTML = section("year", "years", unique(GAMES.map((g) => g.year)), state.year);
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

const card = (game) =>
  game.live
    ? `<li>
        <a class="card" href="/games/${game.id}/">
          <canvas class="thumb" data-thumb="${game.id}" width="320" height="200"></canvas>
          <h2>${game.title}</h2>
          <p>${game.blurb}</p>
          <span><span class="year">${game.year}</span><span class="genre">${game.genre}</span></span>
        </a>
      </li>`
    : `<li>
        <span class="card soon">
          <div class="thumb placeholder">?</div>
          <h2>${game.title}</h2>
          <p>${game.blurb} Coming soon.</p>
          <span><span class="year">${game.year}</span><span class="genre">${game.genre}</span></span>
        </span>
      </li>`;

function renderCatalog() {
  const shown = filterGames(GAMES, state);
  listEl.innerHTML =
    shown.map(card).join("") ||
    `<li class="empty">nothing matches — try fewer filters</li>`;
  countEl.textContent = `${shown.length} of ${GAMES.length} games`;
  paintThumbs();
}

function update(patch) {
  Object.assign(state, patch);
  renderNav();
  renderCatalog();
}

renderNav();
renderCatalog(); // cards first — thumbnails hydrate in as they finish
for (const game of GAMES.filter((g) => g.live)) {
  prerenderThumb(game).then(paintThumbs);
}
