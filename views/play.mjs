// ============================================================================
// views/play.mjs — the PLAY view: one game, alone, in an iframe inside the
// shell. The games never learn they're embedded (their own chrome skips
// itself when framed).
// ============================================================================

import { GAMES } from "../games.mjs";

const playerEl = document.getElementById("player");
const playerFrame = document.getElementById("playerFrame");
const playerTitle = document.getElementById("playerTitle");

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
const panelSettings = document.getElementById("panelSettings");
const panelSettingsTitle = document.getElementById("panelSettingsTitle");

// The dossier: filled when the game loads. Same-origin frames allow DOM
// ADOPTION — the game page's own hint text and settings controls (with
// their listeners, closures, and localStorage intact) move into the
// panel. One source of truth per game; no shell-side duplication. The
// game's own frame hides its copies while framed (see game-shell.mjs).
function fillPanel(game) {
  const doc = playerFrame.contentDocument;
  panelAbout.textContent = game?.blurb ?? "";
  panelHow.textContent = doc?.querySelector('[slot="hint"]')?.textContent ?? "";
  panelSettings.replaceChildren(
    ...[...(doc?.querySelectorAll('[slot="settings"]') ?? [])].map((el) =>
      document.adoptNode(el)
    )
  );
  const hasSettings = panelSettings.children.length > 0;
  panelSettings.hidden = !hasSettings;
  panelSettingsTitle.hidden = !hasSettings;
}

// Keyboard games need the frame focused — hand it over as soon as it loads.
playerFrame.addEventListener("load", () => {
  fillPanel(GAMES.find((g) => g.id === playerFrame.dataset.game));
  playerFrame.focus();
});

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
    playerTitle.textContent = game.title;
    if (playerFrame.dataset.game !== game.id) {
      playerFrame.dataset.game = game.id;
      loadFrame(`/games/${game.id}/`);
    }
    playerEl.hidden = false;
  },
  leave() {
    playerEl.hidden = true;
    // The adopted controls' closures live in the frame's realm, which the
    // unload below destroys — clear them with it.
    panelSettings.replaceChildren();
    // Truly unload on exit — a hidden game must not keep looping and
    // beeping (removing the src attribute does NOT navigate an iframe).
    if (playerFrame.dataset.game) {
      delete playerFrame.dataset.game;
      loadFrame("about:blank");
    }
  },
};
