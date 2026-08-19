// ============================================================================
// world.mjs — streaming-world mechanisms for scrolling games.
//
// Three games invented these independently before the pattern was named:
// Racer's road, Copter's cave and blocks, Flappy's pipes. The shared idea
// is a world that INVENTS ITSELF just past the horizon — as long as the
// run that drove it, deterministic under the injected random.
//
// What stays per-game is everything these produce: what an offset means,
// what an obstacle is, what touching one costs. Mechanism here, rules
// there — the house line, as always.
// ============================================================================

// Sample a segment-indexed offset list at a continuous distance, easing
// between control points with smoothstep so bends arrive gently.
export function smoothSample(offsets, d, segment) {
  const i = Math.max(0, Math.floor(d / segment));
  const a = offsets[Math.min(i, offsets.length - 1)] ?? 0;
  const b = offsets[Math.min(i + 1, offsets.length - 1)] ?? a;
  const t = (d - i * segment) / segment;
  const s = t * t * (3 - 2 * t);
  return a + (b - a) * s;
}

// Keep a segment-indexed list generated past the horizon.
export function extendOffsets(offsets, distance, segment, lookahead, generate) {
  const needed = Math.floor((distance + lookahead) / segment) + 2;
  while (offsets.length < needed) offsets.push(generate());
}

// Keep a list of world objects spaced along a distance key generated past
// the horizon. `start` is where the first one goes; `make(at)` builds one.
export function extendSpaced(items, key, horizon, spacing, start, make) {
  while ((items.at(-1)?.[key] ?? start - spacing) + spacing < horizon) {
    items.push(make((items.at(-1)?.[key] ?? start - spacing) + spacing));
  }
}
