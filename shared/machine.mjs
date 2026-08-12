// ============================================================================
// machine.mjs — the state-machine MECHANISM, shared by every game core.
//
// A state machine is two things: a GRAPH (which status can become which)
// and a GUARD (refuse everything else). The graph is a rule, so it stays in
// each game's core as plain data; only the guard machinery lives here.
//
// This is the first shared module the CORES import, so it must be as pure
// as they are: no DOM, no clock, no randomness — just data in, data out.
// The machine itself is stateless; it operates on any state object with a
// `status` field, so game states remain plain serializable objects.
//
// Usage:
//   export const TRANSITIONS = { playing: ["gameover"], gameover: [] };
//   export const { transition, can } = createMachine(TRANSITIONS);
// ============================================================================

export function createMachine(transitions) {
  // Answers "would this jump be legal?" without touching anything.
  function can(state, to) {
    return transitions[state.status]?.includes(to) ?? false;
  }

  // Performs the jump, or throws. An exception here always means a BUG in
  // the calling core — the rules tried something their own graph forbids —
  // so failing loudly beats corrupting the game silently.
  function transition(state, to) {
    if (!can(state, to)) {
      throw new Error(`illegal status change: ${state.status} → ${to}`);
    }
    state.status = to;
  }

  return { can, transition, transitions };
}
