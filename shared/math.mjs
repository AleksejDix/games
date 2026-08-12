// Pure math helpers — mechanism, so cores may import them.

// Pin a value into [lo, hi]. Reads far better than the traditional
// Math.min(hi, Math.max(lo, value)) nesting it replaces.
export function clamp(value, lo, hi) {
  return Math.min(hi, Math.max(lo, value));
}
