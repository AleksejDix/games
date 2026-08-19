// ============================================================================
// game.mjs — Minesweeper, on the turn engine, and the catalog's first
// TWO-BUTTON pointer game: left digs a fact, right plants a belief
// (contextmenu, suppressed). The HUD counts mines minus flags — the
// player's running ledger.
// ============================================================================

import * as Mines from "./logic.mjs";
import { render } from "./render.mjs";
import { boardGeometry } from "../../shared/board.mjs";
import { createTurnGame } from "../../shared/turngame.mjs";
import { beep, fanfare } from "../../shared/audio.mjs";
import { pickCell } from "../../shared/input.mjs";


const game = createTurnGame({
  core: Mines,
  render,
  options: (s) => ({ size: s.size }),
  settings: {
    controls: { size: 9 },
  },
  sounds: {
    revealed: (e) => beep({ freq: 320 + Math.min(e.cells, 20) * 12, duration: 0.05, volume: 0.07 }),
    flagged: () => beep({ freq: 600, duration: 0.04, volume: 0.07 }),
    unflagged: () => beep({ freq: 400, duration: 0.04, volume: 0.07 }),
    boom: () => beep({ freq: 100, slideTo: 30, duration: 0.7, type: "sawtooth", volume: 0.18 }),
    solved: () => fanfare(),
  },
  hud: (state) => ({
    score: state.mineCount - state.flags.filter(Boolean).length,
  }),
});

const cellAt = (e) => {
  const state = game.session.state;
  return pickCell(game.canvas, e, boardGeometry(game.canvas, state.size));
};

// Two input dialects for two devices. Mouse: instant dig on the left
// button, flag on the right — unchanged. Touch: a tap digs ON RELEASE,
// and holding ~450ms plants the flag instead (with a vibration nudge
// where hardware allows). Deferring the touch dig to pointerup is what
// makes room for the hold to mean something else.
const HOLD_MS = 450;
let hold = null; // the armed touch: { index, timer, fired }

game.canvas.addEventListener("pointerdown", (e) => {
  const index = cellAt(e);
  if (index === -1) return;

  if (e.pointerType !== "touch") {
    // The mouse path: right button plants a belief, LEFT digs — middle
    // and side buttons do neither (a misclicked wheel must not reveal).
    if (e.button === 2) game.act(Mines.flag(game.session.state, index));
    else if (e.button === 0) game.act(Mines.reveal(game.session.state, index));
    return;
  }

  hold = {
    index,
    fired: false,
    timer: setTimeout(() => {
      hold.fired = true;
      navigator.vibrate?.(35);
      game.act(Mines.flag(game.session.state, index));
    }, HOLD_MS),
  };
});

game.canvas.addEventListener("pointerup", (e) => {
  if (e.pointerType !== "touch" || !hold) return;
  clearTimeout(hold.timer);
  if (!hold.fired) game.act(Mines.reveal(game.session.state, hold.index));
  hold = null;
});

game.canvas.addEventListener("pointercancel", (e) => {
  // A scroll or system gesture stole the touch: neither dig nor flag.
  if (e.pointerType !== "touch" || !hold) return;
  clearTimeout(hold.timer);
  hold = null;
});

game.canvas.addEventListener("contextmenu", (e) => e.preventDefault());
