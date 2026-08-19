// Two verbs: reveal (a fact) and flag (a belief). The flood fill does
// the famous part — a zero opens its whole quiet region at once.

import { transition } from "./machine.mjs";
import { shuffle } from "../../../shared/random.mjs";

export function step() {
  return [];
}

function neighbors(state, i) {
  const s = state.size;
  const r = Math.floor(i / s);
  const c = i % s;
  const out = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < s && nc >= 0 && nc < s) out.push(nr * s + nc);
    }
  }
  return out;
}

export function computeCounts(state) {
  return state.mines.map((_, i) =>
    neighbors(state, i).filter((n) => state.mines[n]).length
  );
}

// The first dig plants the field: mines land anywhere but under it.
function plant(state, safe) {
  const spots = shuffle(
    state.mines.map((_, i) => i).filter((i) => i !== safe),
    state.random
  ).slice(0, state.mineCount);
  for (const i of spots) state.mines[i] = true;
  state.counts = computeCounts(state);
  state.safeLeft = state.mines.length - state.mineCount;
  state.planted = true;
}

export function reveal(state, index) {
  if (state.status !== "playing" || state.revealed[index] || state.flags[index]) return [];
  if (!state.planted) plant(state, index);

  if (state.mines[index]) {
    state.revealed[index] = true;
    // The field confesses: every mine shows itself at the end.
    state.mines.forEach((mine, i) => mine && (state.revealed[i] = true));
    transition(state, "gameover");
    return [{ type: "boom", index }, { type: "died" }];
  }

  // The flood: a zero opens its neighbors, and their zeros open theirs.
  let cells = 0;
  const stack = [index];
  while (stack.length) {
    const i = stack.pop();
    if (state.revealed[i] || state.flags[i] || state.mines[i]) continue;
    state.revealed[i] = true;
    cells++;
    if (state.counts[i] === 0) stack.push(...neighbors(state, i));
  }
  state.safeLeft -= cells;

  const events = [{ type: "revealed", cells }];
  if (state.safeLeft === 0) {
    transition(state, "solved");
    events.push({ type: "solved" });
  }
  return events;
}

export function flag(state, index) {
  if (state.status !== "playing" || state.revealed[index]) return [];
  state.flags[index] = !state.flags[index];
  const left = state.mineCount - state.flags.filter(Boolean).length;
  return [{ type: state.flags[index] ? "flagged" : "unflagged", left }];
}
