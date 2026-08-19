// Helpers shared by every game's test suite. Test code is code — the rule
// of three applies to it too.

// A fake random that returns the given values in order (cycling). This is
// the payoff of injecting `random` into createState: tests control
// "chance" completely, so every run is identical.
export function fakeRandom(...values) {
  let i = 0;
  return () => values[i++ % values.length];
}

// A state as PURE DATA: the injected random dropped, Sets flattened to
// arrays, everything through JSON — exactly the shape a replay verifier
// would hash or a leaderboard would store. If two runs are the same
// game, their canonical forms are deep-equal; if a core smuggles in a
// function or a cycle, JSON refuses loudly right here.
export function canonical(state) {
  return JSON.parse(
    JSON.stringify({ ...state, random: null }, (key, value) =>
      value instanceof Set ? [...value] : value
    )
  );
}
