// Pure math helpers — mechanism, so cores may import them.

// Pin a value into [lo, hi]. Reads far better than the traditional
// Math.min(hi, Math.max(lo, value)) nesting it replaces.
export function clamp(value, lo, hi) {
  return Math.min(hi, Math.max(lo, value));
}

// Torus arithmetic: fold a value into [0, max). The +max before the
// second % matters — JS % keeps the dividend's sign, so -1 % 10 is -1.
export function wrap(value, max) {
  return ((value % max) + max) % max;
}
