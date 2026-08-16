// ============================================================================
// engine.mjs — the game ENGINE: the program every game.mjs turned out to be.
//
// After five games, each shell was the same ~140 lines with different
// nouns: boot the canvas, bind settings, track keys, wire sounds, keep a
// best score, run the loop, dispatch events. createGame() owns that
// program; a game DECLARES its parts. This is the framework move —
// inversion of control: the engine calls the game, never the reverse.
//
// What a game declares:
//   core       — its logic barrel (createState / step / TRANSITIONS ...)
//   render     — render(ctx, state, paused), the projection
//   options    — (settings) => createState options
//   settings   — the bindSettings config (minus onWorldChange, engine-owned)
//   heldKeys   — key codes to track for continuous input
//   input      — (held, state) => the input object step() expects
//   keys       — { pause, restart } key codes (Space / Enter by default)
//   special    — (e, api) => bool: game-specific keys, checked FIRST
//                (Breakout's launch, Snake's direction taps)
//   sounds     — { eventType: (event) => beep(...) }
//   filterEvents — (events, state) => events, for batch-aware sound rules
//   best       — { key, on: [eventTypes] } high-score persistence
//   hud        — (state) => { score?, lives? } written to #score / #lives
//   onNewGame  — (state, settings) => void, extra per-game boot work
//   runningStatuses — statuses the loop simulates (default ["playing"])
//   stepMs     — (state) => ms per tick (default: core.DT × 1000)
//
// Conventions the engine assumes (all enforced by the meta-suites):
// #game canvas; settings include `sound`; step() returns an events array;
// restart is legal exactly in TERMINAL statuses — read straight off the
// core's transition table, the state machine paying rent again.
// ============================================================================

import { startLoop } from "./loop.mjs";
import { bindSettings } from "./settings.mjs";
import { trackHeldKeys } from "./input.mjs";
import { unlockOnFirstGesture, soundBoard } from "./audio.mjs";
import { trackBest } from "./score.mjs";

export function createGame({
  core,
  render,
  options = () => ({}),
  settings: settingsConfig,
  heldKeys = [],
  input = null,
  keys = {},
  special = null,
  sounds = {},
  filterEvents = (events) => events,
  best = null,
  hud = null,
  onNewGame = null,
  runningStatuses = ["playing"],
  stepMs = null,
}) {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const scoreEl = document.getElementById("score");
  const livesEl = document.getElementById("lives");
  const bestEl = document.getElementById("best");

  let state;
  let paused = false;

  const settings = bindSettings({
    ...settingsConfig,
    onWorldChange: () => newGame(),
  });

  function newGame() {
    state = core.createState(options(settings));
    paused = false;
    if (onNewGame) onNewGame(state, settings);
  }

  const sound = soundBoard(sounds, () => settings.sound);
  const saveBest = best ? trackBest(best.key, bestEl) : null;

  // The one funnel: every event from any action (the loop's step, a
  // special key's launch) gets the same reactions.
  function dispatch(events) {
    for (const event of filterEvents(events, state)) {
      if (best && best.on.includes(event.type)) saveBest(state.score);
      sound(event);
    }
  }

  // The api handed to game hooks — live views, not snapshots.
  const api = {
    get state() {
      return state;
    },
    get paused() {
      return paused;
    },
    dispatch,
    newGame,
  };

  unlockOnFirstGesture();
  const held = trackHeldKeys(...heldKeys);

  const pauseKey = keys.pause ?? "Space";
  const restartKey = keys.restart ?? "Enter";
  // Restart is legal exactly where the machine says the game has ended.
  const isTerminal = () => core.TRANSITIONS[state.status]?.length === 0;

  document.addEventListener("keydown", (e) => {
    if (special && special(e, api)) return;
    if (e.code === pauseKey) {
      e.preventDefault();
      if (state.status === "playing") paused = !paused;
      return;
    }
    if (e.code === restartKey && isTerminal()) newGame();
  });

  newGame();

  const tick = stepMs ?? (() => core.DT * 1000);

  startLoop({
    stepMs: () => tick(state),
    running: () => runningStatuses.includes(state.status) && !paused,
    update: () => dispatch(core.step(state, input ? input(held, state) : undefined)),
    render: () => {
      render(ctx, state, paused);
      if (hud) {
        const h = hud(state);
        if (scoreEl && h.score !== undefined) scoreEl.textContent = h.score;
        if (livesEl && h.lives !== undefined) livesEl.textContent = h.lives;
      }
    },
  });

  return api;
}
