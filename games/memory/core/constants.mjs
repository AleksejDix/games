// Tuning values. No DT — the only clock in Memory is the player's.

export const DECK = {
  pairs: 8, // the classic 4×4; 6 is gentler, 10 is for showoffs
  // Board layouts per pair count: [columns, rows].
  layout: { 6: [4, 3], 8: [4, 4], 10: [5, 4] },
};
