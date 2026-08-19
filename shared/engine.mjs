// ============================================================================
// engine.mjs — createGame(): a SESSION driven by a CLOCK.
//
// The framework move, refined twice since v1:
//
// 1. The engine is now a composition — createSession() (state lifecycle,
//    settings, dispatch, sounds, best, restart) plus the clock this file
//    adds (the fixed-timestep loop, pause, HUD painting). A turn-based
//    game skips this file entirely and drives a bare session from its
//    own event handlers.
//
// 2. The engine knows NOTHING about input devices. v1 imported the
//    keyboard tracker and took a heldKeys list; now the game owns its
//    device (keyboard, pointer, whatever) and declares only
//    input: (state) => whatever-step-expects, asked once per tick.
//    Removing a subsystem beats making it configurable.
//
// What a game declares (beyond the session config — see session.mjs):
//   render          — render(ctx, state, paused), the projection
//   input           — (state) => the input object step() expects
//   keys.pause      — pause key (default "Space")
//   special         — (e, api) => bool: game-specific keys, checked FIRST
//   hud             — (state) => { score?, lives? } → #score / #lives
//   runningStatuses — statuses the loop simulates (default ["playing"])
//   stepMs          — (state) => ms per tick (default: core.DT × 1000)
// ============================================================================

import { startLoop } from "./loop.mjs";
import { createSession } from "./session.mjs";
import { fitResolution } from "./resolution.mjs";
import { drawOverlay } from "./overlay.mjs";

export function createGame(config) {
  const {
    core,
    render,
    input = null,
    keys = {},
    special = null,
    // The convention: #score shows state.score. Ten shells declared
    // exactly this; a game with more to say (lives, turn lines) still
    // declares its own.
    hud = (state) => ({ score: state.score }),
    // ready is simulated by default: a ready world's step() holds still
    // until the first touch of the controls, and to FEEL that touch the
    // loop must keep asking input(). Games without a ready status lose
    // nothing — the status simply never occurs.
    runningStatuses = ["ready", "playing"],
    stepMs = null,
  } = config;

  const session = createSession(config);

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  // Crisp at any display size: the backing store follows the element,
  // the transform keeps renderers in court units (shared/resolution.mjs).
  const applyCourt = fitResolution(canvas);
  const scoreEl = document.getElementById("score");
  const livesEl = document.getElementById("lives");

  let paused = false;
  session.onReset(() => (paused = false)); // a fresh world is never paused

  // The api handed to game hooks — live views, not snapshots.
  const api = {
    get state() {
      return session.state;
    },
    get paused() {
      return paused;
    },
    settings: session.settings, // live: input() may branch on a mode
    dispatch: session.dispatch,
    newGame: session.newGame,
  };

  const pauseKey = keys.pause ?? "Space";
  document.addEventListener("keydown", (e) => {
    // A paused world takes no game keys — only the pause key below can
    // reach it. Without this gate every shell had to remember its own
    // api.paused check, and two didn't: pause is a promise the ENGINE
    // makes, so the engine keeps it. (Pointer handlers live in the
    // games; they consult api.paused themselves.)
    if (!paused && special && special(e, api)) return;
    if (e.code === pauseKey) {
      e.preventDefault();
      if (session.state.status === "playing") paused = !paused;
    }
  });

  // HUD readouts write to the DOM only when the value CHANGES — a canvas
  // repaint is cheap, a per-frame DOM write is not.
  let lastScore;
  let lastLives;
  function paintHud() {
    if (!hud) return;
    const h = hud(session.state);
    if (scoreEl && h.score !== undefined && h.score !== lastScore) {
      scoreEl.textContent = lastScore = h.score;
    }
    if (livesEl && h.lives !== undefined && h.lives !== lastLives) {
      livesEl.textContent = lastLives = h.lives;
    }
  }

  const tick = stepMs ?? (() => core.DT * 1000);

  startLoop({
    stepMs: () => tick(session.state),
    running: () => runningStatuses.includes(session.state.status) && !paused,
    update: () =>
      session.dispatch(
        core.step(session.state, input ? input(session.state) : undefined)
      ),
    render: () => {
      applyCourt(ctx);
      render(ctx, session.state, paused);
      // Pause is a promise the ENGINE makes (see the keydown gate above),
      // so the engine paints the banner too — fourteen renderers used to
      // repeat it, split 7/7 between "P" and "Space" by which key their
      // shell happened to declare. The label now comes from the source.
      if (paused) {
        drawOverlay(ctx, "PAUSED", `${pauseKey.replace(/^Key/, "")} to resume`);
      }
      paintHud();
    },
  });

  return api;
}
