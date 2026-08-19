// The catalog page is DATA-DRIVEN: it renders whatever games.mjs declares,
// and the shell's filters narrow it live. The filtering itself is pure
// logic in games.mjs (tested in games.test.mjs); this file is only DOM.
//
// The thumbnails are the architecture's party trick: because every game
// is a pure core plus a pure renderer, the catalog can import both, run
// the REAL simulation for a few ticks, and draw the REAL frame — live
// screenshots, different on every visit, no image files anywhere.

import { GAMES, filterGames } from "./games.mjs";
import { cssVar } from "./shared/theme.mjs";

const searchEl = document.getElementById("search");
const genreEl = document.getElementById("genre");
const yearEl = document.getElementById("year");
const countEl = document.getElementById("count");
const listEl = document.getElementById("catalog");

// Dropdown options DERIVE from the manifest — register a game, and its
// genre and year become filterable for free.
const unique = (values) => [...new Set(values)].sort();
const options = (values, label) =>
  ["all", ...values]
    .map((v) => `<option value="${v}">${v === "all" ? `all ${label}` : v}</option>`)
    .join("");

genreEl.innerHTML = options(unique(GAMES.map((g) => g.genre)), "genres");
yearEl.innerHTML = options(unique(GAMES.map((g) => g.year)), "years");

// --- live thumbnails ---------------------------------------------------------
// Each is prerendered ONCE into an offscreen canvas: create the game's
// real state, step its real rules, call its real renderer. Cached so
// filtering doesn't resimulate — and so a thumbnail doesn't change while
// you type.

const THUMBS = new Map(); // id → offscreen canvas

async function prerenderThumb(game) {
  const [core, { render }] = await Promise.all([
    import(`./games/${game.id}/logic.mjs`),
    import(`./games/${game.id}/render.mjs`),
  ]);
  const off = document.createElement("canvas");
  off.width = game.thumb.width;
  off.height = game.thumb.height;
  const state = core.createState(game.thumb.options ?? {});
  for (let i = 0; i < game.thumb.ticks; i++) core.step(state);
  render(off.getContext("2d"), state, false);
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
  const shown = filterGames(GAMES, {
    query: searchEl.value,
    genre: genreEl.value,
    year: yearEl.value,
  });
  listEl.innerHTML =
    shown.map(card).join("") ||
    `<li class="empty">nothing matches — try fewer filters</li>`;
  countEl.textContent = `${shown.length} of ${GAMES.length} games`;
  paintThumbs();
}

searchEl.addEventListener("input", renderCatalog);
genreEl.addEventListener("change", renderCatalog);
yearEl.addEventListener("change", renderCatalog);

renderCatalog(); // cards first — thumbnails hydrate in as they finish
for (const game of GAMES.filter((g) => g.live)) {
  prerenderThumb(game).then(paintThumbs);
}
