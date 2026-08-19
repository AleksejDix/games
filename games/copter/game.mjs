// ============================================================================
// game.mjs — Cave Copter, DECLARED on the clocked engine. The one input
// is HELD: keys through the tracker, the pointer through a pressed flag —
// the engine just asks input(state) every tick, never knowing which.
// ============================================================================

import * as Copter from "./logic.mjs";
import { render } from "./render.mjs";
import { createGame } from "../../shared/engine.mjs";
import { beep } from "../../shared/audio.mjs";
import { trackHeldKeys } from "../../shared/input.mjs";
import { touchControls } from "../../shared/touch.mjs";

const canvas = document.getElementById("game");
const tunnelEl = document.getElementById("tunnel");
const soundEl = document.getElementById("sound");

// The game owns its input DEVICES: held keys plus a held pointer.
const held = trackHeldKeys("Space", "ArrowUp", "KeyW");
let pressing = false;
canvas.addEventListener("pointerdown", () => {
  pressing = true;
  api.dispatch(Copter.start(api.state)); // the first touch starts the rotor
});
for (const type of ["pointerup", "pointercancel"]) {
  window.addEventListener(type, () => (pressing = false));
}

const TUNNELS = { forgiving: 0.003, classic: 0.0045, cruel: 0.007 };

const api = createGame({
  core: Copter,
  render,
  options: (s) => ({ narrow: TUNNELS[s.tunnel] ?? TUNNELS.classic }),
  settings: {
    storageKey: "copterSettings",
    defaults: { tunnel: "classic", sound: true },
    read: () => ({ tunnel: tunnelEl.value, sound: soundEl.checked }),
    write: (s) => {
      tunnelEl.value = s.tunnel;
      soundEl.checked = s.sound;
    },
    worldEls: [tunnelEl],
    presentationEls: [soundEl],
  },
  keys: { pause: "KeyP" }, // Space is the rotor
  input: () => ({ lift: pressing || held.has("Space") || held.has("ArrowUp") || held.has("KeyW") }),
  special: (e, apiRef) => {
    if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") {
      e.preventDefault();
      if (!e.repeat) apiRef.dispatch(Copter.start(apiRef.state));
      return true;
    }
    return false;
  },
  sounds: {
    started: () => beep({ freq: 220, slideTo: 440, duration: 0.15, volume: 0.08 }),
    milestone: () => beep({ freq: 880, duration: 0.06, volume: 0.09 }),
    died: () => {
      beep({ freq: 180, duration: 0.06, volume: 0.12 });
      beep({ freq: 260, slideTo: 50, duration: 0.5, at: 0.07, type: "sawtooth" });
    },
  },
  best: { key: "copterBest", on: ["died"] },
  hud: (state) => ({ score: state.score }),
});

touchControls([{ code: "Enter", label: "↻" }]);
