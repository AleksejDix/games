// ============================================================================
// replay.mjs — a game as DATA: the seed that named the world, the options
// that shaped it, and the moves in order. Play it back through the same
// core and you get the same game — which is the entire leaderboard plan:
// a score is believed because the server replayed it, not because the
// client claimed it.
//
// This first slice covers TURN games, where order is the only clock: a
// recording is { seed, options, moves }, and each move says which door
// it came through — the board (pick), the keyboard (key), or the machine
// seat (cpu). The clocked games' recorder (tick-anchored input logs)
// builds on the same shape and is the next slice.
// ============================================================================

import { seededRandom } from "./random.mjs";

// A state as PURE DATA: the injected random dropped, Sets flattened to
// arrays, everything through JSON — the form a verifier hashes and a
// leaderboard stores. If two runs are the same game, their canonical
// forms are deep-equal.
export function canonical(state) {
  return JSON.parse(
    JSON.stringify({ ...state, random: null }, (key, value) =>
      value instanceof Set ? [...value] : value
    )
  );
}

// Rebuild the world and take every recorded move through the same doors
// the live game used. The hooks are the game's own declarations, handed
// straight from its config — and the one subtlety is fidelity to act():
// live, a selection-only tap returns nothing and act() never runs, so
// afterAct fires here EXACTLY when events came back, not per move.
// (The first draft ran it every time, and Checkers' hand-clearing
// afterAct wiped each selection the instant the replay made it.)
export function replayTurns(core, recording, { pick, actions, opponent, afterAct } = {}) {
  const state = core.createState({
    ...recording.options,
    random: seededRandom(recording.seed),
  });
  for (const move of recording.moves) {
    const events =
      move.via === "pick" ? pick.action(state, move.index)
      : move.via === "key" ? actions[move.code](state)
      : opponent.play(state);
    if (events) afterAct?.(state, events);
  }
  return state;
}

// Did the live state and its replay agree? Canonical forms, compared as
// JSON — both states are built by the same createState, so key order
// matches by construction.
export function sameGame(a, b) {
  return JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
}
