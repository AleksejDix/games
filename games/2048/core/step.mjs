// One verb in four directions. The heart is slideLine: pack, merge each
// tile AT MOST ONCE, pack again — everything else is bookkeeping.

import { BOARD } from "./constants.mjs";
import { spawnTile } from "./state.mjs";
import { transition } from "./machine.mjs";

export function step() {
  return [];
}

// Slide one line toward its head. Returns the new line, the points, and
// each tile's JOURNEY (path positions from → to) — the events narrate the
// motion so the shell can animate it without knowing the rules.
function slideLine(line) {
  const sources = line.flatMap((v, pos) => (v ? [{ pos, v }] : []));
  const out = Array(line.length).fill(0);
  const moves = [];
  let points = 0;
  let slot = 0;
  for (let i = 0; i < sources.length; i++) {
    const { pos, v } = sources[i];
    if (sources[i + 1]?.v === v) {
      out[slot] = v * 2; // merge once...
      points += v * 2;
      moves.push({ fromPos: pos, toPos: slot, value: v });
      moves.push({ fromPos: sources[i + 1].pos, toPos: slot, value: v });
      i++; // ...and consume both
    } else {
      out[slot] = v;
      moves.push({ fromPos: pos, toPos: slot, value: v });
    }
    slot++;
  }
  return { out, points, moves };
}

// The four directions as index paths through the flat board.
function lines(dir) {
  const s = BOARD.size;
  const result = [];
  for (let a = 0; a < s; a++) {
    const line = [];
    for (let b = 0; b < s; b++) {
      if (dir === "left") line.push(a * s + b);
      if (dir === "right") line.push(a * s + (s - 1 - b));
      if (dir === "up") line.push(b * s + a);
      if (dir === "down") line.push((s - 1 - b) * s + a);
    }
    result.push(line);
  }
  return result;
}

export function anyMoves(state) {
  if (state.cells.some((c) => c === 0)) return true;
  const s = BOARD.size;
  return state.cells.some((c, i) => {
    const right = i % s < s - 1 && state.cells[i + 1] === c;
    const down = i + s < s * s && state.cells[i + s] === c;
    return right || down;
  });
}

export function slide(state, dir) {
  if (state.status !== "playing") return [];

  let moved = false;
  let gained = 0;
  const journeys = [];
  for (const path of lines(dir)) {
    const { out, points, moves } = slideLine(path.map((i) => state.cells[i]));
    gained += points;
    for (const m of moves) {
      journeys.push({ from: path[m.fromPos], to: path[m.toPos], value: m.value });
    }
    path.forEach((cellIndex, j) => {
      if (state.cells[cellIndex] !== out[j]) moved = true;
      state.cells[cellIndex] = out[j];
    });
  }
  if (!moved) return []; // not a move — no spawn, no cost, no sound

  state.score += gained;
  const events = [{ type: "slid", moves: journeys }];
  if (gained > 0) events.push({ type: "merged", points: gained });

  const summit = Math.max(...state.cells);
  if (summit > state.top) {
    state.top = summit;
    if (summit >= 128) events.push({ type: "milestone", value: summit });
  }

  events.push({ type: "spawned", index: spawnTile(state) });
  if (!anyMoves(state)) {
    transition(state, "gameover");
    events.push({ type: "died" });
  }
  return events;
}
