// Tuning values. The board is logical — size × size cells — and the
// renderer decides pixels; there is no DT because there is no time: the
// world changes only when the player slides.

export const BOARD = {
  size: 4, // the classic; 3 for beginners, 5 for the brave
  // Shuffle quality: legal random-walk moves per cell. Enough that the
  // solved order is thoroughly lost on any size.
  shufflePerCell: 20,
};
