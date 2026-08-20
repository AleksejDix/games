// Helpers shared by every game's test suite. Test code is code — the rule
// of three applies to it too.

// A fake random that returns the given values in order (cycling). This is
// the payoff of injecting `random` into createState: tests control
// "chance" completely, so every run is identical.
export function fakeRandom(...values) {
  let i = 0;
  return () => values[i++ % values.length];
}

// The canonical state form grew up and moved to replay.mjs — it is what
// a verifier hashes, not just what tests compare. Re-exported so suites
// keep one import for their helpers.
export { canonical } from "./replay.mjs";
