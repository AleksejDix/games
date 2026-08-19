// ============================================================================
// game.mjs — 2048, on the turn engine. Arrows and WASD slide; the touch
// bar synthesizes the same keys, so phones steer with thumb buttons. The
// best score is HIGHEST here, so the session's ordinary best applies.
// ============================================================================

import * as G from "./logic.mjs";
import { render } from "./render.mjs";
import { createTurnGame } from "../../shared/turngame.mjs";
import { beep, fanfare } from "../../shared/audio.mjs";

const TWEEN_MS = 95; // brisk — 2048 is a rhythm game in disguise

// The tween: the shell owns time, as always. Each slid event's journeys
// are stashed as presentation state; a short rAF loop advances t and
// redraws, then the final board (and the popped spawn) takes over.
function animate(moves, spawned) {
  const state = game.session.state;
  const start = performance.now();
  state.anim = { moves, spawned, t: 0 };
  const tick = (now) => {
    if (game.session.state !== state || state.anim?.moves !== moves) return; // restarted or superseded
    state.anim.t = (now - start) / TWEEN_MS;
    game.draw();
    if (state.anim.t < 1.4) requestAnimationFrame(tick);
    else {
      delete state.anim;
      game.draw();
    }
  };
  requestAnimationFrame(tick);
}

const game = createTurnGame({
  core: G,
  render,
  options: () => ({}),
  settings: { storageKey: "2048Settings" }, // #sound binds by convention
  afterAct: (state, events) => {
    const slid = events.find((e) => e.type === "slid");
    if (slid) {
      animate(slid.moves, events.find((e) => e.type === "spawned")?.index ?? -1);
    }
  },
  sounds: {
    slid: () => beep({ freq: 300, duration: 0.03, volume: 0.05 }),
    merged: (e) => beep({ freq: 380 + Math.min(e.points, 256), duration: 0.06, volume: 0.09 }),
    milestone: (e) => fanfare(e.value >= 2048 ? 4 : 2),
    died: () => beep({ freq: 220, slideTo: 60, duration: 0.6, type: "sawtooth" }),
  },
  best: { key: "2048Best", on: ["died"] },
  hud: (state) => ({ score: state.score }),
  touch: [
    { code: "ArrowLeft", label: "◀" },
    { code: "ArrowUp", label: "▲" },
    { code: "ArrowDown", label: "▼" },
    { code: "ArrowRight", label: "▶" },
    { code: "Enter", label: "↻" },
  ],
});

const KEY_DIRS = {
  ArrowLeft: "left", KeyA: "left",
  ArrowRight: "right", KeyD: "right",
  ArrowUp: "up", KeyW: "up",
  ArrowDown: "down", KeyS: "down",
};

document.addEventListener("keydown", (e) => {
  const dir = KEY_DIRS[e.code];
  if (!dir) return;
  e.preventDefault();
  game.act(G.slide(game.session.state, dir));
});
