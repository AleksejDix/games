// ============================================================================
// resolution.mjs — crisp scaling. The <canvas> markup declares the COURT
// resolution; CSS scales the element to fill the page; and without help
// the browser interpolates the drawing — rounded shapes go soft on big
// screens. fitResolution() re-backs the canvas at display size × device
// pixel ratio and returns applyCourt(ctx), which makes 1 drawing unit =
// 1 court unit again. Renderers never learn the backing changed: they
// ask courtSize(canvas) instead of canvas.width, and draw as always.
// ============================================================================

// The court's dimensions, whatever the backing resolution is today.
export function courtSize(canvas) {
  return {
    width: Number(canvas.dataset?.courtW ?? canvas.width),
    height: Number(canvas.dataset?.courtH ?? canvas.height),
  };
}

// onFit (optional) runs after each re-back: re-backing WIPES the canvas,
// so games that only paint on actions (the turn engine) repaint here.
// Clocked games repaint every frame anyway and pass nothing.
export function fitResolution(canvas, onFit = null) {
  // Capture the markup's court resolution before the first re-back.
  canvas.dataset.courtW ??= canvas.width;
  canvas.dataset.courtH ??= canvas.height;

  const fit = (notify) => {
    if (!canvas.clientWidth) return; // not laid out yet — keep the court backing
    const court = courtSize(canvas);
    const w = Math.max(1, Math.round(canvas.clientWidth * (window.devicePixelRatio || 1)));
    if (w === canvas.width) return;
    canvas.width = w;
    canvas.height = Math.round((w * court.height) / court.width);
    if (notify) onFit?.();
  };
  // The boot fit is silent: the caller's first paint is still to come,
  // and its own wiring may not exist yet.
  fit(false);
  new ResizeObserver(() => fit(true)).observe(canvas);

  // Called before every render: resizing wipes canvas state, so the
  // transform is restated per frame — cheap, and always right.
  return function applyCourt(ctx) {
    const scale = ctx.canvas.width / courtSize(ctx.canvas).width;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
  };
}
