// ============================================================================
// game.mjs — Simon, on the turn engine. The shell owns ALL the timing:
// playback lights and sounds the sequence on timers, then opens the
// floor. Sound is not feedback here — it IS the game.
// ============================================================================

import * as Simon from "./logic.mjs";
import { render } from "./render.mjs";
import { courtSize } from "../../shared/resolution.mjs";
import { createTurnGame } from "../../shared/turngame.mjs";
import { beep } from "../../shared/audio.mjs";
import { pointerPosition } from "../../shared/input.mjs";


// The four voices — low to high, one per pad, long enough to sing.
const TONES = [262, 330, 392, 523];
const tone = (pad, duration = 0.28) => {
  if (game.session.settings.sound) beep({ freq: TONES[pad], duration, type: "triangle" });
};

let accepting = false; // the floor is closed while the machine performs

const game = createTurnGame({
  core: Simon,
  render,
  options: () => ({}),
  settings: { storageKey: "simonSettings" }, // #sound binds by convention
  sounds: {
    pressed: (e) => tone(e.pad, 0.2),
    died: () => beep({ freq: 140, slideTo: 45, duration: 0.8, type: "sawtooth" }),
  },
  best: "simonBest",
  hud: (state) => ({ score: state.score }),
  afterAct: (state, events) => {
    if (events.some((e) => e.type === "roundComplete")) {
      accepting = false;
      game.session.after(800, () => {
        game.act(Simon.extend(game.session.state));
        playback();
      });
    }
  },
});

// Perform the sequence: light and sound each note on a timer, then open
// the floor. World-scoped timers, so a restart mid-show simply silences
// it — no stale timer ever writes into the fresh board.
function playback() {
  accepting = false;
  const state = game.session.state;
  state.sequence.forEach((pad, i) => {
    game.session.after(i * 560, () => {
      state.lit = pad;
      tone(pad);
      game.draw();
    });
    game.session.after(i * 560 + 380, () => {
      state.lit = null;
      game.draw();
      if (i === state.sequence.length - 1) accepting = true;
    });
  });
}

game.canvas.addEventListener("pointerdown", (e) => {
  if (!accepting || game.session.state.status !== "playing") return;
  const p = pointerPosition(game.canvas, e);
  const court = courtSize(game.canvas);
  const pad = (p.y < court.height / 2 ? 0 : 2) + (p.x < court.width / 2 ? 0 : 1);
  // A brief self-lit flash for the player's own press.
  game.session.state.lit = pad;
  game.session.after(200, () => {
    game.session.state.lit = null;
    game.draw();
  });
  game.act(Simon.press(game.session.state, pad));
});

// A fresh board closes the floor and performs after a beat. The timer
// is armed AFTER newGame cleared the old world's — it survives.
const opening = () => {
  accepting = false;
  game.session.after(500, playback);
};
game.session.onReset(opening);
opening();
