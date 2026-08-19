// ============================================================================
// session.mjs — everything about a running game EXCEPT the clock.
//
// The engine split in two when we noticed createGame() fused two ideas:
// the SESSION (settings, state lifecycle, the dispatch funnel, sounds,
// best score, restart-on-terminal) and the CLOCK (the fixed-timestep
// loop, pause, stepMs). A turn-based game — actions instead of ticks —
// needs everything here and nothing from the clock: it calls
// session.dispatch(core.someAction(state, ...)) from its own handlers
// and renders when it likes.
//
// Restart is legal exactly where the machine says the game has ended —
// terminal statuses, read off the core's transition table. Pause is NOT
// here: pausing means stopping a clock, and there is no clock here.
// ============================================================================

import { bindSettings, gameId } from "./settings.mjs";
import { unlockOnFirstGesture, soundBoard } from "./audio.mjs";
import { trackBest } from "./score.mjs";
import { seededRandom } from "./random.mjs";

export function createSession({
  core,
  options = () => ({}),
  settings: settingsConfig,
  sounds = {},
  filterEvents = (events) => events,
  best = null,
  onNewGame = null,
  keys = {},
}) {
  const bestEl = document.getElementById("best");

  let state;
  const resetListeners = []; // the clock resets its pause here, for one

  const settings = bindSettings({
    ...settingsConfig,
    onWorldChange: () => newGame(),
  });

  // Timers that die with the world. Four shells invented four different
  // stale-timer guards (sequence identity, state identity, clear-before-
  // arm) against the same hazard: a timeout armed in one game firing
  // into the next. Scheduling through the session removes the hazard —
  // newGame clears every pending timer before anything else runs.
  // Returns a cancel function, for timers superseded before they fire.
  const pending = new Set();
  function after(ms, fn) {
    const id = setTimeout(() => {
      pending.delete(id);
      fn();
    }, ms);
    pending.add(id);
    return () => {
      clearTimeout(id);
      pending.delete(id);
    };
  }

  // Every world gets a NAMED chance: one fresh 32-bit seed per game,
  // expanded into the core's whole random stream by mulberry32. Play
  // feels exactly as random as before — but now the session KNOWS the
  // seed, which is half of what a replay is (the other half is the
  // input log). This is the one place the shell may roll Math.random:
  // to name the world, never to run it.
  let seed;

  function newGame() {
    for (const id of pending) clearTimeout(id);
    pending.clear();
    seed = (Math.random() * 2 ** 32) >>> 0;
    state = core.createState({ ...options(settings), random: seededRandom(seed) });
    if (onNewGame) onNewGame(state, settings);
    for (const listener of resetListeners) listener();
  }

  const sound = soundBoard(sounds, () => settings.sound);
  // `best: true` means "the conventional key": the folder names it.
  const bestKey = best === true ? `${gameId()}Best` : best;
  const saveBest = bestKey ? trackBest(bestKey, bestEl) : null;

  // The one funnel: every event from any action — the clock's step, a
  // special key's launch, a click handler's move — gets the same reactions.
  function dispatch(events) {
    for (const event of filterEvents(events, state)) sound(event);
    // The best score tracks the LIVE score, not a terminal event: a
    // record run that ends in a closed tab is still a record. The saver
    // only touches storage when beaten, so per-tick is free.
    if (saveBest) saveBest(state.score);
  }

  const isTerminal = () => core.TRANSITIONS[state.status]?.length === 0;

  const restartKey = keys.restart ?? "Enter";
  document.addEventListener("keydown", (e) => {
    if (e.code === restartKey && isTerminal()) newGame();
  });

  unlockOnFirstGesture();

  const session = {
    get state() {
      return state;
    },
    get seed() {
      return seed; // the current world's name — a future replay records it
    },
    settings,
    dispatch,
    newGame,
    after,
    isTerminal,
    onReset(listener) {
      resetListeners.push(listener);
    },
  };

  newGame();
  return session;
}
