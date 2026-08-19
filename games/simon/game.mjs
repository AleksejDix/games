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
      setTimeout(() => {
        game.act(Simon.extend(game.session.state));
        playback();
      }, 800);
    }
  },
});

// Perform the sequence: light and sound each note on a timer, then open
// the floor. The sequence identity guards against a restart mid-show.
function playback() {
  accepting = false;
  const state = game.session.state;
  const sequence = state.sequence;
  sequence.forEach((pad, i) => {
    setTimeout(() => {
      if (game.session.state.sequence !== sequence) return; // restarted
      game.session.state.lit = pad;
      tone(pad);
      game.draw();
    }, i * 560);
    setTimeout(() => {
      if (game.session.state.sequence !== sequence) return;
      game.session.state.lit = null;
      game.draw();
      if (i === sequence.length - 1) accepting = true;
    }, i * 560 + 380);
  });
}

game.canvas.addEventListener("pointerdown", (e) => {
  if (!accepting || game.session.state.status !== "playing") return;
  const p = pointerPosition(game.canvas, e);
  const court = courtSize(game.canvas);
  const pad = (p.y < court.height / 2 ? 0 : 2) + (p.x < court.width / 2 ? 0 : 1);
  // A brief self-lit flash for the player's own press — with the same
  // sequence-identity guard as playback, so a restart mid-flash doesn't
  // get its fresh board written to by a stale timer.
  const sequence = game.session.state.sequence;
  game.session.state.lit = pad;
  setTimeout(() => {
    if (game.session.state.sequence !== sequence) return;
    game.session.state.lit = null;
    game.draw();
  }, 200);
  game.act(Simon.press(game.session.state, pad));
});

game.session.onReset(() => setTimeout(playback, 500));
setTimeout(playback, 500);
