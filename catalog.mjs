// The catalog page is DATA-DRIVEN: it renders whatever games.mjs declares.
// Note the contrast with the games themselves — a canvas redraws every
// frame (immediate mode), but this page builds its DOM once and lets the
// browser keep it (retained mode). Right tool for each job.

import { GAMES } from "./games.mjs";

const card = (game) =>
  game.live
    ? `<li>
        <a class="card" href="/${game.id}/">
          <h2>${game.title}</h2>
          <p>${game.blurb}</p>
          <span class="year">${game.year}</span>
        </a>
      </li>`
    : `<li>
        <span class="card soon">
          <h2>${game.title}</h2>
          <p>${game.blurb} Coming soon.</p>
          <span class="year">${game.year}</span>
        </span>
      </li>`;

document.getElementById("catalog").innerHTML = GAMES.map(card).join("");
