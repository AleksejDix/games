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

// A palette token at partial opacity — the faint nets, sheens, and wave
// markers every renderer used to hardcode as rgba() literals, quietly
// divorcing them from the palette. Tokens are #rrggbb; canvas wants an
// rgba() string. Like cssVar, read once at module load, not per frame.
export function cssVarAlpha(name, alpha) {
  const hex = cssVar(name);
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// The shield-flicker idiom three renderers grew independently: visible
// two-thirds of each period while a tick counter runs, steady at zero.
export const blink = (ticks, period = 30, visible = 20) =>
  ticks === 0 || ticks % period < visible;

// The house face, as a builder. Twenty-one call sites spelled the
// ui-monospace stack by hand at sixteen sizes; the stack now has one
// spelling, and a font choice reads as the two numbers it really is.
export const mono = (px, bold = false) =>
  `${bold ? "bold " : ""}${px}px ui-monospace, monospace`;
