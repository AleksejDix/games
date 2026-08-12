// The fixed-timestep game loop — extracted verbatim from three shells.
//
// requestAnimationFrame fires once per display refresh with a timestamp.
// We accumulate elapsed real time and run one simulation step per full
// stepMs slice. This decouples "how often the world advances" from "how
// often the screen repaints": the same game speed on 60Hz and 144Hz
// displays, whether that's Snake's ~8 ticks/s or Breakout's 120.
//
// Everything game-specific comes in as FUNCTIONS, because the answers can
// change while the loop runs: Snake's stepMs shrinks as it eats, and
// running() flips with pause and gameover.

export function startLoop({ stepMs, running, update, render }) {
  let lastTime = 0;
  let accumulator = 0;

  function frame(time) {
    const delta = time - lastTime;
    lastTime = time;

    if (running()) {
      // Clamp huge deltas (a background tab) so we don't fast-forward
      // through dozens of ticks in one visible frame.
      accumulator += Math.min(delta, 250);
      while (accumulator >= stepMs()) {
        update();
        accumulator -= stepMs();
      }
    }

    render();
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}
