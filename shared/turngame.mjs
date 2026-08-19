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
//                (AI replies, settle timers)
//   fewestBest — (state) => storage key: fewest wins, kept per variant,
//                recorded when the game reaches an ending
//   bestValue  — (state) => what "fewest" measures (default state.moves;
//                Peg counts the pegs left standing)
//
// Returns { canvas, session, act, draw } — act(events) is the one door:
// dispatch, react, repaint.
// ============================================================================

import { createSession } from "./session.mjs";
import { touchControls } from "./touch.mjs";
import { trackBestFewest } from "./score.mjs";
import { fitResolution } from "./resolution.mjs";

export function createTurnGame(config) {
  const {
    render,
    hud = null,
    afterAct = null,
    fewestBest = null,
    // What "fewest" measures — moves for most boards; Peg counts the
    // pegs left standing. A selector, so no game re-wires the record.
    bestValue = (state) => state.moves,
    // Boards are tapped directly, so most turn games need only a restart
    // thumb; a game that steers by key (2048) declares its own layout
    // here INSTEAD — two calls would stack two bars on a phone.
    touch = [{ code: "Enter", label: "↻" }],
    // Declarative keys: { code: (state) => events }, the same table
    // shape the engine's actionKeys takes — minus pause, because a turn
    // game has no clock to pause.
    actions = null,
  } = config;

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const scoreEl = document.getElementById("score");

  // Crisp at any display size; a resize wipes the canvas, so it redraws.
  const applyCourt = fitResolution(canvas, () => draw());

  const session = createSession(config);

  const bestEl = document.getElementById("best");
  const best =
    fewestBest && bestEl ? trackBestFewest(() => fewestBest(session.state), bestEl) : null;
  if (best) session.onReset(best.show);

  let lastScore;
  function paintHud() {
    if (!hud || !scoreEl) return;
    const h = hud(session.state);
    if (h.score !== undefined && h.score !== lastScore) {
      scoreEl.textContent = lastScore = h.score;
    }
  }

  function draw() {
    applyCourt(ctx);
    render(ctx, session.state, false);
    paintHud();
  }

  function act(events) {
    session.dispatch(events);
    if (best && session.isTerminal()) best.record(bestValue(session.state));
    afterAct?.(session.state, events);
    draw();
  }

  session.onReset(draw);

  if (actions) {
    document.addEventListener("keydown", (e) => {
      const action = actions[e.code];
      if (!action) return;
      e.preventDefault(); // a known key never scrolls the page
      act(action(session.state) ?? []);
    });
  }

  touchControls(touch);

  draw();
  return { canvas, session, act, draw };
}
