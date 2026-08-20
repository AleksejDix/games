// ============================================================================
// game.mjs — Tetris, DECLARED on the engine.
//
// Gravity rides the engine clock through stepMs (Snake's shrinking-tick
// trick); the steering is all ACTIONS through the special-keys hook, so
// the OS key-repeat drives movement for free. Space hard-drops, as the
// gods of stacking intended — pause lives on P.
// ============================================================================

import * as Tetris from "./logic.mjs";
import { render } from "./render.mjs";
import { createGame } from "../../shared/engine.mjs";
import { beep, fanfare } from "../../shared/audio.mjs";
import { touchControls } from "../../shared/touch.mjs";
import { swipeKeys } from "../../shared/gestures.mjs";
import { actionKeys } from "../../shared/input.mjs";


// ONE table drives the keys: what each does, and (by existing at all)
// which keys wake a ready well. The switch and a separate key set used
// to keep the same list twice.
const rotate = (s) => Tetris.rotate(s);
const ACTIONS = {
  ArrowLeft: (s) => Tetris.move(s, -1),
  KeyA: (s) => Tetris.move(s, -1),
  ArrowRight: (s) => Tetris.move(s, 1),
  KeyD: (s) => Tetris.move(s, 1),
  ArrowDown: (s) => Tetris.softDrop(s),
  KeyS: (s) => Tetris.softDrop(s),
  ArrowUp: rotate,
  KeyW: rotate,
  KeyX: rotate,
  Space: (s) => Tetris.hardDrop(s),
};
// Held keys repeat moves and soft drops (the OS repeat drives movement
// for free); spins and slams fire once per press.
const NO_REPEAT = ["ArrowUp", "KeyW", "KeyX", "Space"];

createGame({
  core: Tetris,
  render,

  options: (s) => ({ startLevel: s.startLevel }),
  stepMs: (state) => state.stepMs, // gravity hurries as the levels climb

  settings: {
    controls: { startLevel: 1 },
  },

  keys: { pause: "KeyP" }, // Space is sacred: it hard-drops

  // The table IS the wiring now: the first piece key wakes a ready well
  // AND acts, and the actions guard status themselves.
  special: actionKeys(ACTIONS, { noRepeat: NO_REPEAT, wake: (s) => Tetris.start(s) }),

  sounds: {
    rotated: () => beep({ freq: 520, duration: 0.04, volume: 0.07 }),
    locked: () => beep({ freq: 130, duration: 0.06, volume: 0.1 }),
    hardDrop: () => beep({ freq: 320, slideTo: 90, duration: 0.1, volume: 0.1 }),
    // One note per line — four notes is the word "TETRIS" in beep.
    cleared: (e) => fanfare(e.rows),
    levelUp: () => {
      beep({ freq: 392, duration: 0.1, type: "triangle" });
      beep({ freq: 587, duration: 0.14, at: 0.11, type: "triangle" });
    },
    died: () => beep({ freq: 180, slideTo: 35, duration: 0.9, type: "sawtooth" }),
  },

  best: true,
});

touchControls([]);
// The court is the controller, the mobile-tetris dialect: swipe left or
// right to step (a long drag keeps stepping), swipe down to soft-drop,
// swipe UP to hard-drop, tap to rotate.
swipeKeys(document.getElementById("game"), {
  map: { up: "Space" },
  tap: "ArrowUp",
});
