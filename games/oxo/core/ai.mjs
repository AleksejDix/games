// The perfect opponent: MINIMAX.
//
// The idea, in one sentence: my best move is the one whose position is
// worst for you, assuming you'll then do the same to me — recursively,
// to the end of the game. Tic-tac-toe's tree is tiny (under a few
// hundred thousand nodes from empty, far fewer mid-game), so the search
// runs to the LEAVES and the play is provably perfect: the test suite
// pits every possible human strategy against this function and counts
// zero losses.
//
// Scores are depth-weighted (10 - depth) so the AI prefers the QUICK win
// and the SLOW loss — that's what makes it feel intentional rather than
// merely unbeatable.

import { LINES } from "./constants.mjs";

const winnerOf = (cells) => {
  for (const [a, b, c] of LINES) {
    if (cells[a] && cells[a] === cells[b] && cells[b] === cells[c]) return cells[a];
  }
  return null;
};

const other = (mark) => (mark === "X" ? "O" : "X");

function best(cells, mark, depth) {
  let top = { score: -Infinity, index: -1 };
  for (let i = 0; i < 9; i++) {
    if (cells[i]) continue;
    cells[i] = mark; // try it...
    let score;
    if (winnerOf(cells) === mark) {
      score = 10 - depth;
    } else if (cells.every(Boolean)) {
      score = 0;
    } else {
      // ...whatever is best for the opponent is worst for us.
      score = -best(cells, other(mark), depth + 1).score;
    }
    cells[i] = null; // ...and untry it.
    if (score > top.score) top = { score, index: i };
  }
  return top;
}

// The best index for whoever's turn it is. Pure and deterministic — an
// input source, exactly like Pong's aiInput.
export function aiMove(state) {
  return best([...state.cells], state.turn, 0).index;
}
