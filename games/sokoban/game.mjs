// ============================================================================
// game.mjs — Sokoban, DECLARED on the turn engine. What remains here is
// only Sokoban's own: the level shelf, the undo key, and the classic
// score — the fewest-PUSHES record per level (moves are walking; pushes
// are the puzzle).
// ============================================================================

import * as Sokoban from "./logic.mjs";
import { render } from "./render.mjs";
import { createTurnGame } from "../../shared/turngame.mjs";
import { DPAD } from "../../shared/touch.mjs";
import { saveSettings } from "../../shared/settings.mjs";
import { beep, fanfare } from "../../shared/audio.mjs";

const levelEl = document.getElementById("level");

// One table, four directions across two key rows — the turn engine wires
// it. Z (or U) takes a step back, as freely as any step forward.
const ACTIONS = Object.fromEntries(
  Object.entries({
    ArrowLeft: "left", KeyA: "left",
    ArrowRight: "right", KeyD: "right",
    ArrowUp: "up", KeyW: "up",
    ArrowDown: "down", KeyS: "down",
  }).map(([code, dir]) => [code, (s) => Sokoban.move(s, dir)])
);
ACTIONS.KeyZ = (s) => Sokoban.undo(s);
ACTIONS.KeyU = (s) => Sokoban.undo(s);

// Assigned, not bare: afterAct reaches for game.session — and an
// unassigned `game` would silently resolve to the CANVAS through the
// id="game" named-element global, which is exactly the bug this line
// once was.
const game = createTurnGame({
  core: Sokoban,
  render,
  options: (s) => ({ level: s.level }),
  settings: {
    storageKey: "sokobanSettings",
    defaults: { level: 0 },
    read: () => ({ level: Number(levelEl.value) - 1 }),
    write: (s) => {
      levelEl.value = String(s.level + 1);
    },
    worldEls: [levelEl],
  },
  sounds: {
    // A tick per step; a lower thock when a box goes along for the ride.
    moved: () => beep({ freq: 300, duration: 0.03, volume: 0.05 }),
    pushed: () => beep({ freq: 170, duration: 0.07, volume: 0.1, type: "triangle" }),
    undone: () => beep({ freq: 200, slideTo: 380, duration: 0.08, volume: 0.06 }),
    stuck: () => beep({ freq: 220, slideTo: 90, duration: 0.4, type: "sawtooth", volume: 0.1 }),
    solved: () => fanfare(),
  },
  // The move count — flagged the moment a crate is cornered, so the
  // header agrees with the red stain on the board.
  hud: (state) => ({
    score: Sokoban.deadBoxes(state).length ? `${state.moves} · stuck!` : state.moves,
  }),
  fewestBest: (s) => `sokobanBest.${s.level + 1}`,
  bestValue: (state) => state.pushes, // fewest pushes is the classic score
  actions: ACTIONS,
  // Solving ADVANCES: the setting moves to the next room (dropdown and
  // storage included), so the Enter on the solved overlay deals it. The
  // last room stays put — a replay, and pride's rematch.
  afterAct: (state, events) => {
    if (
      events.some((e) => e.type === "solved") &&
      state.level < Sokoban.LEVELS.length - 1
    ) {
      const settings = game.session.settings;
      settings.level = state.level + 1;
      levelEl.value = String(settings.level + 1);
      saveSettings("sokobanSettings", settings);
    }
  },
  // Phones steer by thumb: the four directions, a step back, a restart.
  touch: [...DPAD, { code: "KeyZ", label: "↶" }],
});

// R re-deals the room from anywhere — the way out when undo would take
// longer than starting over. (Enter only listens at the end; R always.)
document.addEventListener("keydown", (e) => {
  if (e.code === "KeyR") game.session.newGame();
});
