// The palette's single source of truth is CSS (shared/style.css :root).
// Canvas drawing needs the same values as strings, so shells read them off
// the computed style instead of copy-pasting hex codes into draw calls —
// retheme the CSS, and the canvas follows.
//
// Safe to read at module load: a <link> stylesheet in <head> is applied
// before module scripts execute.

export function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

// The shield-flicker idiom three renderers grew independently: visible
// two-thirds of each period while a tick counter runs, steady at zero.
export const blink = (ticks, period = 30, visible = 20) =>
  ticks === 0 || ticks % period < visible;
