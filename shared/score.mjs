// Best-score persistence: show the stored best immediately, and return a
// saver that raises it when beaten. One localStorage key + one element per
// game — the same three lines Snake and Breakout each used to carry.

// Fewest-is-best records (move counts, tries), keyed per variant — the
// key is a FUNCTION because the variant (board size, deck size) can
// change between games.
// keyOf may return null: that variant keeps no record (a two-player
// Memory deal must not pollute the solo fewest-tries bests).
export function trackBestFewest(keyOf, element) {
  const show = () => {
    const key = keyOf();
    element.textContent = (key && localStorage[key]) ?? "–";
  };
  show();
  return {
    show,
    record(value) {
      const key = keyOf();
      if (!key) return;
      const best = Number(localStorage[key] ?? Infinity);
      localStorage[key] = Math.min(best, value);
      show();
    },
  };
}

// The shell-side READER for what the games write: the manifest entry's
// `record` field (see games.mjs) names the shape, this turns it back
// into rows for the catalog's cards and the records view. Returns
// [{ label, value, unit }] — label null for single-key records, one row
// per stored variant otherwise, empty when nothing is stored yet.
export function readRecords(game) {
  const spec = game.record;
  if (!spec) return [];
  const unit = spec.fewest ?? spec.unit;
  if (spec.variants) {
    const prefix = `${game.id}Best.`;
    return Object.keys(localStorage)
      .filter((k) => k.startsWith(prefix))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      .map((k) => ({
        label: `${spec.variants} ${k.slice(prefix.length)}`,
        value: Number(localStorage[k]),
        unit,
      }));
  }
  const key = `${game.id}Best`;
  return key in localStorage
    ? [{ label: null, value: Number(localStorage[key]), unit }]
    : [];
}

// The saver is cheap enough to call every tick: it remembers the best in
// a closure and touches localStorage and the DOM only when beaten —
// which is what lets the session save CONTINUOUSLY instead of waiting
// for a terminal event (a closed tab used to take the record with it).
export function trackBest(key, element) {
  let best = Number(localStorage[key] ?? 0);
  element.textContent = best;
  return (score) => {
    if (score <= best) return;
    best = score;
    localStorage[key] = best;
    element.textContent = best;
  };
}
