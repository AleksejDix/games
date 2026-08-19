// The English cross: a 7×7 grid whose corners never existed. A cell is
// on the board iff its row or column runs through the middle third.

export const SIZE = 7;

export const onBoard = (r, c) =>
  (r >= 2 && r <= 4) || (c >= 2 && c <= 4) ? r >= 0 && r < 7 && c >= 0 && c < 7 && ((r >= 2 && r <= 4) || (c >= 2 && c <= 4)) : false;
