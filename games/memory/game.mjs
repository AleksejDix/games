// ============================================================================
// game.mjs — Memory, DECLARED on the turn engine. What remains here is
// only Memory's own: card picking through the renderer's geometry, the
// 750ms settle beat, and the fewest-tries record per deck size.
// ============================================================================

import * as Memory from "./logic.mjs";
import { render, boardGeometry } from "./render.mjs";
import { createTurnGame } from "../../shared/turngame.mjs";
import { beep, fanfare } from "../../shared/audio.mjs";
import { startCard } from "../../shared/startcard.mjs";

const pairsEl = document.getElementById("pairs");
const playersEl = document.getElementById("players");

const game = createTurnGame({
  core: Memory,
  render,
  options: (s) => ({ pairs: s.pairs, players: s.players }),
  settings: {
    storageKey: "memorySettings",
    defaults: { pairs: 8, players: 1 },
    read: () => ({ pairs: Number(pairsEl.value), players: Number(playersEl.value) }),
    write: (s) => {
      pairsEl.value = String(s.pairs);
      playersEl.value = String(s.players);
    },
    worldEls: [pairsEl, playersEl],
  },
  sounds: {
    flipped: (e) => beep({ freq: 420 + e.value * 24, duration: 0.05, volume: 0.08 }),
    matched: () => {
      beep({ freq: 660, duration: 0.07 });
      beep({ freq: 990, duration: 0.1, at: 0.08 });
    },
    mismatched: () => beep({ freq: 150, duration: 0.12, volume: 0.08 }),
    solved: () => fanfare(),
  },
  // Solo counts tries; versus shows the running tally with the deck
  // marker (▶) on whoever flips next.
  hud: (state) => ({
    score:
      state.players > 1
        ? `${state.turn === 0 ? "▶" : ""}P1 ${state.won[0]} · ${state.turn === 1 ? "▶" : ""}P2 ${state.won[1]}`
        : `${state.moves} tries`,
  }),
  // The fewest-tries record is a SOLO discipline — a null key means this
  // deal keeps no record, so versus games never pollute the solo bests.
  fewestBest: (s) => (s.players === 1 ? `memoryBest.${s.pairs}` : null),
  afterAct: (state, events) => {
    // The settle beat: a mismatch lingers long enough to memorize, then
    // turns back. ONE pending timer, always for the LATEST mismatch:
    // settle() can tell "a pair lingers" but not WHICH mismatch armed the
    // clock, so a stale timer from mismatch #1 (already settled by the
    // next flip) would cut mismatch #2's viewing time short. Clearing
    // before arming keeps every pair its full 750ms.
    if (events.some((e) => e.type === "mismatched")) {
      clearTimeout(settleTimer);
      settleTimer = setTimeout(() => game.act(Memory.settle(game.session.state)), 750);
    }
  },
  // Memory's deck sizes itself per deal, so the geometry comes from the
  // renderer's own layout, not the square-board default.
  pick: {
    board: (state, canvas) => boardGeometry(state, canvas),
    action: (state, index) => Memory.flip(state, index),
  },
});

let settleTimer;
game.session.onReset(() => clearTimeout(settleTimer)); // no settling into a fresh deck


// The start card: solo or head-to-head, asked before the first flip —
// same pattern as OXO's. The pick runs through the select's change
// event (persist + fresh deal).
startCard({
  title: "MEMORY",
  options: [
    { label: "solo", value: "1" },
    { label: "two players", value: "2" },
  ],
  onPick: (players) => {
    playersEl.value = players;
    playersEl.dispatchEvent(new Event("change"));
  },
}).show();
