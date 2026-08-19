// The catalog page is DATA-DRIVEN: it renders whatever games.mjs declares,
// and the shell's filters narrow it live. The filtering itself is pure
// logic in games.mjs (tested in games.test.mjs); this file is only DOM.
//
// Note the rendering model: on every filter change the list is rebuilt
// from data — the immediate-mode habit from the canvases, applied to DOM,
// which is fine at ten cards and spares us all bookkeeping.

import { GAMES, filterGames } from "./games.mjs";

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

const card = (game) =>
  game.live
    ? `<li>
        <a class="card" href="/games/${game.id}/">
          <h2>${game.title}</h2>
          <p>${game.blurb}</p>
          <span class="year">${game.year}</span><span class="genre">${game.genre}</span>
        </a>
      </li>`
    : `<li>
        <span class="card soon">
          <h2>${game.title}</h2>
          <p>${game.blurb} Coming soon.</p>
          <span class="year">${game.year}</span><span class="genre">${game.genre}</span>
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
}

searchEl.addEventListener("input", renderCatalog);
genreEl.addEventListener("change", renderCatalog);
yearEl.addEventListener("change", renderCatalog);
renderCatalog();
