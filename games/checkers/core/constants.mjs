// Tuning values — though checkers barely has any: the board and the two
// sides are the whole physics. English draughts rules: men move diagonally
// forward, captures jump and are FORCED, chains continue, the crown ends
// the move, and a side with nothing to play has lost.

export const SIZE = 8;

export const SIDES = ["red", "white"]; // red sits at the bottom and moves first

// Only the dark squares are real; the light ones are just wood.
export const playable = (row, col) => (row + col) % 2 === 1;
