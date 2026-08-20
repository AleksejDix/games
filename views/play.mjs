// ============================================================================
// views/play.mjs — the PLAY view: one game, alone, in an iframe inside the
// shell. The games never learn they're embedded (their own chrome skips
// itself when framed).
// ============================================================================

import { GAMES } from "../games.mjs";
import { prerenderThumb, paintThumbs } from "../thumbs.mjs";

const playerEl = document.getElementById("player");
const playerFrame = document.getElementById("playerFrame");
const panelTitle = document.getElementById("panelTitle");

let router;

// The iframe is always navigated with location.replace(): assigning .src
// to a live iframe PUSHES an entry into the browser's shared session
// history, so Back would first rewind the invisible iframe navigation and
// feel broken. replace() loads without leaving a trace — the router is
// the only thing that writes history.
function loadFrame(url) {
  playerFrame.contentWindow.location.replace(url);
}

const panelAbout = document.getElementById("panelAbout");
const panelHow = document.getElementById("panelHow");
const playerScores = document.getElementById("playerScores");

// The dossier: filled when the game loads. Same-origin frames allow DOM
// ADOPTION — the game page's own hint text and settings controls (with
// their listeners, closures, and localStorage intact) move into the
// panel. One source of truth per game; no shell-side duplication. The
// game's own frame hides its copies while framed (see game-shell.mjs).
function fillPanel(game) {
  const doc = playerFrame.contentDocument;
  panelAbout.textContent = game?.blurb ?? "";
  panelHow.textContent = doc?.querySelector('[slot="hint"]')?.textContent ?? "";
  // The scores too: they are LIVE nodes (#score, #best, #lives) that the
  // engine keeps a reference to — adoption moves them, updates continue.
  playerScores.replaceChildren(
    ...[...(doc?.querySelectorAll('[slot="scores"]') ?? [])].map((el) =>
      document.adoptNode(el)
    )
  );
}

// Keyboard games need the frame focused — hand it over as soon as it loads.
playerFrame.addEventListener("load", () => {
  fillPanel(GAMES.find((g) => g.id === playerFrame.dataset.game));
  playerFrame.focus();
});

const moreGames = document.getElementById("moreGames");
const tplMore = document.getElementById("tpl-more").content;

// The related rail: same genre first (the YouTube instinct), then the
// rest in shelf order, never the game being played. Thumbnails come from
// the shared live-thumb cache and hydrate in as they finish.
function fillMore(current) {
  const related = [
    ...GAMES.filter((g) => g.live && g.id !== current.id && g.genre === current.genre),
    ...GAMES.filter((g) => g.live && g.id !== current.id && g.genre !== current.genre),
  ].slice(0, 8);

  moreGames.replaceChildren(
    ...related.map((game) => {
      const node = tplMore.cloneNode(true);
      node.querySelector(".more").href = `/play/${game.id}`;
      node.querySelector("canvas").dataset.thumb = game.id;
      node.querySelector(".moretitle").textContent = game.title;
      node.querySelector(".moremeta").textContent = `${game.year} · ${game.genre}`;
      return node;
    })
  );
  paintThumbs(moreGames);
  for (const game of related) {
    prerenderThumb(game).then(() => paintThumbs(moreGames));
  }
}

export const playView = {
  // Focused layout: no sidebar while playing — its filters would only
  // navigate away, and the game deserves the width.
  layout: "focus",
  wire(r) {
    router = r;
  },
  enter({ id }) {
    const game = GAMES.find((g) => g.id === id && g.live);
    if (!game) return router.navigate("/"); // unknown game → the library
    panelTitle.textContent = game.title;
    if (playerFrame.dataset.game !== game.id) {
      playerFrame.dataset.game = game.id;
      loadFrame(`/games/${game.id}/`);
    }
    fillMore(game);
    playerEl.hidden = false;
  },
  leave() {
    playerEl.hidden = true;
    // The adopted controls' closures live in the frame's realm, which the
    // unload below destroys — clear them with it.
    playerScores.replaceChildren();
    // Truly unload on exit — a hidden game must not keep looping and
    // beeping (removing the src attribute does NOT navigate an iframe).
    if (playerFrame.dataset.game) {
      delete playerFrame.dataset.game;
      loadFrame("about:blank");
    }
  },
};
