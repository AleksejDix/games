// The dimmed message overlay (PAUSED / GAME OVER / ...) every game draws.
// It reads the canvas size off the context, so it fits any court.

export function drawOverlay(ctx, title, subtitle) {
  const { width, height } = ctx.canvas;
  ctx.fillStyle = "rgba(15, 17, 21, 0.75)";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#e6e6e6";
  ctx.textAlign = "center";
  ctx.font = "bold 28px ui-monospace, monospace";
  ctx.fillText(title, width / 2, height / 2 - 8);
  ctx.font = "14px ui-monospace, monospace";
  ctx.fillText(subtitle, width / 2, height / 2 + 20);
}
