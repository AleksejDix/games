// ============================================================================
// thumbs.mjs — the live-thumbnail factory, shared by the library's cards
// and the player's "more games" rail.
//
// Each thumbnail is the architecture's party trick: the game's REAL core
// stepped a few ticks, drawn by its REAL renderer into an offscreen
// canvas — a live screenshot, no image files. Prerendered once per id
// and cached; paintThumbs() letterboxes the cache into every
// canvas[data-thumb] under a root.
// ============================================================================

import { cssVar } from "./shared/theme.mjs";

const THUMBS = new Map(); // id → offscreen canvas

export async function prerenderThumb(game) {
  if (THUMBS.has(game.id)) return;
  const [core, { render }] = await Promise.all([
    import(`./games/${game.id}/logic.mjs`),
    import(`./games/${game.id}/render.mjs`),
  ]);
  const off = document.createElement("canvas");
  off.width = game.thumb.width;
  off.height = game.thumb.height;
  const state = core.createState(game.thumb.options ?? {});
  for (let i = 0; i < game.thumb.ticks; i++) core.step(state);
  render(off.getContext("2d"), state, false);
  THUMBS.set(game.id, off);
}

export function paintThumbs(root) {
  for (const canvas of root.querySelectorAll("canvas[data-thumb]")) {
    const off = THUMBS.get(canvas.dataset.thumb);
    if (!off) continue;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = cssVar("--bg");
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Contain: whole court visible, letterboxed on the dark ground.
    const scale = Math.min(canvas.width / off.width, canvas.height / off.height);
    const w = off.width * scale;
    const h = off.height * scale;
    ctx.drawImage(off, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
  }
}
