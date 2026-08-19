// Best-score persistence: show the stored best immediately, and return a
// saver that raises it when beaten. One localStorage key + one element per
// game — the same three lines Snake and Breakout each used to carry.

// Fewest-is-best records (move counts, tries), keyed per variant — the
// key is a FUNCTION because the variant (board size, deck size) can
// change between games.
export function trackBestFewest(keyOf, element) {
  const show = () => (element.textContent = localStorage[keyOf()] ?? "–");
  show();
  return {
    show,
    record(value) {
      const best = Number(localStorage[keyOf()] ?? Infinity);
      localStorage[keyOf()] = Math.min(best, value);
      show();
    },
  };
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
