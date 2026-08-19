// Tuning values — chess has none, only definitions. The board is 64
// cells, row 0 is BLACK's home rank (the eighth), row 7 is white's; a
// piece is { side, type } with the FEN letters as types.

export const SIZE = 8;

export const SIDES = ["white", "black"]; // white moves first, since 1475

export const TYPES = ["p", "n", "b", "r", "q", "k"];

// The material scale every engine starts from; the bot leans on it too.
export const VALUES = { p: 1, n: 3, b: 3.2, r: 5, q: 9, k: 0 };
