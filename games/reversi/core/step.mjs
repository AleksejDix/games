// The one action of reversi. The load-bearing rule is the FLANK: a
// placement is legal only if some straight line runs from it through
// enemy discs to a disc of your own — and every disc so bracketed
// flips, all eight directions at once. The quiet corollary is the PASS:
// a side with no legal placement loses its turn, not the game; only
// when BOTH sides are stuck does the board get counted.

import { SIZE, SIDES, DIRECTIONS } from "./constants.mjs";
import { transition } from "./machine.mjs";

export function step() {
  return [];
}

const other = (side) => SIDES.find((s) => s !== side);

// Every disc a placement at `index` would turn: walk each direction
// collecting enemy discs, and keep the run only if a friendly disc
// seals it. Empty runs mean the placement is illegal. Exported for the
// bot, which applies moves without the ceremony of events.
export function flipsFor(cells, index, side) {
  if (cells[index] !== null) return [];
  const row = Math.floor(index / SIZE);
  const col = index % SIZE;
  const flips = [];
  for (const [dr, dc] of DIRECTIONS) {
    const run = [];
    let r = row + dr;
    let c = col + dc;
    while (r >= 0 && r < SIZE && c >= 0 && c < SIZE && cells[r * SIZE + c] === other(side)) {
      run.push(r * SIZE + c);
      r += dr;
      c += dc;
    }
    if (run.length > 0 && r >= 0 && r < SIZE && c >= 0 && c < SIZE && cells[r * SIZE + c] === side) {
      flips.push(...run);
    }
  }
  return flips;
}

// Every square the side to move could take — the renderer's hints and
// the bot's move list. What glows IS legal, the house line since Peg.
export function legalPlacements(state) {
  return state.cells.flatMap((cell, i) =>
    cell === null && flipsFor(state.cells, i, state.turn).length > 0 ? [i] : []
  );
}

export function place(state, index) {
  if (state.status !== "playing") return [];
  const side = state.turn;
  const flips = flipsFor(state.cells, index, side);
  if (flips.length === 0) return [];

  state.cells[index] = side;
  for (const i of flips) state.cells[i] = side;
  state.last = index;
  const events = [
    { type: "placed", index, side },
    { type: "flipped", indices: flips },
  ];

  // The turn passes — unless the opponent is stuck, in which case it
  // comes straight back; and if the mover is stuck too, the game is
  // over and the discs get counted.
  state.turn = other(side);
  if (legalPlacements(state).length === 0) {
    state.turn = side;
    if (legalPlacements(state).length === 0) {
      const black = state.cells.filter((c) => c === "black").length;
      const white = state.cells.filter((c) => c === "white").length;
      if (black === white) {
        transition(state, "draw");
        events.push({ type: "draw", black, white });
      } else {
        state.winner = black > white ? "black" : "white";
        transition(state, "won");
        events.push({ type: "won", winner: state.winner, black, white });
      }
    } else {
      events.push({ type: "passed", side: other(side) });
    }
  }
  return events;
}
