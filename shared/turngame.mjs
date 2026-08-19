// ============================================================================
// turngame.mjs — createTurnGame(): the clockless sibling of createGame().
//
// Three turn-based games (Fifteen, OXO, Memory) each re-improvised the
// same wiring on top of the bare session: grab the canvas, draw after
// every action, redraw on reset, paint the HUD, offer a restart thumb.
// That program now lives here; a turn-based game declares its parts and
// keeps only what is truly its own (pointer mapping, keyboard, timers).
//
// Beyond createSession's config, a turn game declares:
//   render     — render(ctx, state, paused) — paused is always false here;
//                there is no clock to pause
//   hud        — (state) => { score? } written to #score on change
//   afterAct   — (state, events) => void, for per-game reactions
//                (records, AI replies, settle timers)
//
// Returns { canvas, session, act, draw } — act(events) is the one door:
// dispatch, react, repaint.
// ============================================================================

import { createSession } from "./session.mjs";
import { touchControls } from "./touch.mjs";

export function createTurnGame(config) {
  const { render, hud = null, afterAct = null } = config;

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const scoreEl = document.getElementById("score");

  const session = createSession(config);

  let lastScore;
  function paintHud() {
    if (!hud || !scoreEl) return;
    const h = hud(session.state);
    if (h.score !== undefined && h.score !== lastScore) {
      scoreEl.textContent = lastScore = h.score;
    }
  }

  function draw() {
    render(ctx, session.state, false);
    paintHud();
  }

  function act(events) {
    session.dispatch(events);
    afterAct?.(session.state, events);
    draw();
  }

  session.onReset(draw);

  // Boards are tapped directly, so phones need only a restart thumb.
  touchControls([{ code: "Enter", label: "↻" }]);

  draw();
  return { canvas, session, act, draw };
}
