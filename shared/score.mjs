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

export function trackBest(key, element) {
  const load = () => Number(localStorage[key] ?? 0);
  element.textContent = load();
  return (score) => {
    const best = Math.max(score, load());
    localStorage[key] = best;
    element.textContent = best;
  };
}
