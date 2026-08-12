// Best-score persistence: show the stored best immediately, and return a
// saver that raises it when beaten. One localStorage key + one element per
// game — the same three lines Snake and Breakout each used to carry.

export function trackBest(key, element) {
  const load = () => Number(localStorage[key] ?? 0);
  element.textContent = load();
  return (score) => {
    const best = Math.max(score, load());
    localStorage[key] = best;
    element.textContent = best;
  };
}
