// Placing things on the board. Both spawners use rejection sampling: keep
// picking random cells until one is free. Fine for a small grid; on a huge
// grid you'd pick from the list of free cells instead.
//
// Randomness comes from state.random — injected in createState, so tests
// can script every "dice roll" (see logic.test.mjs's fakeRandom).

import { BONUS } from "./constants.mjs";

export function spawnFood(state) {
  while (true) {
    const cell = {
      x: Math.floor(state.random() * state.cols),
      y: Math.floor(state.random() * state.rows),
    };
    if (!state.snake.some((s) => s.x === cell.x && s.y === cell.y)) {
      return cell;
    }
  }
}

// Like spawnFood, but a bonus must also avoid the regular food's cell.
export function spawnBonus(state) {
  while (true) {
    const cell = {
      x: Math.floor(state.random() * state.cols),
      y: Math.floor(state.random() * state.rows),
    };
    const onSnake = state.snake.some((s) => s.x === cell.x && s.y === cell.y);
    const onFood = state.food.x === cell.x && state.food.y === cell.y;
    if (!onSnake && !onFood) {
      return { ...cell, ttl: BONUS.ttl };
    }
  }
}
