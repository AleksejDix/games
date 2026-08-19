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

import { bindSettings } from "./settings.mjs";
import { unlockOnFirstGesture, soundBoard } from "./audio.mjs";
import { trackBest } from "./score.mjs";

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

  function newGame() {
    state = core.createState(options(settings));
    if (onNewGame) onNewGame(state, settings);
    for (const listener of resetListeners) listener();
  }

  const sound = soundBoard(sounds, () => settings.sound);
  const saveBest = best ? trackBest(best, bestEl) : null;

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
    settings,
    dispatch,
    newGame,
    isTerminal,
    onReset(listener) {
      resetListeners.push(listener);
    },
  };

  newGame();
  return session;
}
