// The eight warehouses, in the notation Sokoban levels have been traded
// in since the eighties — one character per cell:
//
//   #  wall          .  goal
//      floor         $  box        *  box on a goal
//   @  keeper        +  keeper on a goal
//
// All eight are ORIGINAL layouts (Thinking Rabbit's 1982 levels are
// copyrighted, and stay in the museum). Every one is machine-verified
// solvable — an unsolvable shipped level would be the one unforgivable
// bug — and the comment above each states the fewest moves a breadth-
// first search found, with the pushes along that line.

export const LEVELS = [
  // 1 — the first push: one box, one goal, one corner to walk around.
  // Fewest moves: 4 (1 push).
  [
    "######",
    "#    #",
    "# $  #",
    "# .@ #",
    "#    #",
    "######",
  ],

  // 2 — two boxes, two parking spots against the far wall.
  // Fewest moves: 4 (2 pushes).
  [
    "########",
    "#  ..  #",
    "#  $$  #",
    "#  @   #",
    "#      #",
    "########",
  ],

  // 3 — around the block: the box must turn a corner it cannot see.
  // Fewest moves: 9 (4 pushes).
  [
    "#######",
    "#@    #",
    "# ##$ #",
    "# ##  #",
    "# .   #",
    "#######",
  ],

  // 4 — the petals: four boxes around a hedge, four corners to reach.
  // Fewest moves: 11 (4 pushes).
  [
    "########",
    "# .  . #",
    "# $##$ #",
    "#  @   #",
    "# $##$ #",
    "# .  . #",
    "########",
  ],

  // 5 — the cross: three boxes radiate from the keeper; a fourth (the *
  // below him) is already home and only has to be left in peace.
  // Fewest moves: 15 (3 pushes).
  [
    "#######",
    "#  .  #",
    "# .$. #",
    "# $@$ #",
    "#  *  #",
    "#######",
  ],

  // 6 — the doorway: both boxes fit through the same gap, in one order.
  // Fewest moves: 24 (9 pushes).
  [
    "########",
    "#  #   #",
    "# $#   #",
    "# @  ..#",
    "# $#   #",
    "#  #   #",
    "########",
  ],

  // 7 — two chambers: one corridor, three boxes, and an order that
  // matters — fill the corridor too early and nothing else gets home.
  // Fewest moves: 42 (17 pushes).
  [
    "#########",
    "#@  #   #",
    "# $ #.  #",
    "# $   . #",
    "# $ # . #",
    "#   #   #",
    "#########",
  ],

  // 8 — the plus: four boxes, and the middle row is both the only road
  // between the wings and the parking lot — park too soon and you wall
  // yourself out.
  // Fewest moves: 43 (14 pushes).
  [
    "#########",
    "#@  #   #",
    "# $ # $ #",
    "#  ...  #",
    "# $ #.$ #",
    "#   #   #",
    "#########",
  ],
];
