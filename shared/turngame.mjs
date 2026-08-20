// ============================================================================
// turngame.mjs — createTurnGame(): the clockless sibling of createGame().
//
// Three turn-based games (Fifteen, OXO, Memory) each re-improvised the
// same wiring on top of the bare session: grab the canvas, draw after
// every action, redraw on reset, paint the HUD, offer a restart thumb.
// That program now lives here; a turn-based game declares its parts and
// keeps only what is truly its own (pointer mapping, keyboard, timers).
//
// Beyond createSession's config, a turn game declares:
//   render     — render(ctx, state, paused) — paused is always false here;
//                there is no clock to pause
//   hud        — (state) => { score? } written to #score on change
//   afterAct   — (state, events) => void, for per-game reactions
//                (cosmetic state, settle timers)
//   fewestBest — (state) => storage key: fewest wins, kept per variant,
//                recorded when the game reaches an ending
//   bestValue  — (state) => what "fewest" measures (default state.moves;
//                Peg counts the pegs left standing)
//   pick       — the board under the pointer, declared:
//                  board  — (state, canvas) => pickCell geometry
//                  action — (state, index) => events, or nothing when the
//                           tap only changed a selection (repaint follows)
//   opponent   — the machine seat, declared:
//                  title — the start card's heading
//                  side  — the state.turn value the machine plays
//                  delay — the thinking pause in ms (default 400)
//                  play  — (state) => events: compute and apply its move
//
// Returns { canvas, session, act, draw, cpuToMove } — act(events) is the
// one door: dispatch, react, repaint, and hand the machine its turn.
// ============================================================================

import { createSession } from "./session.mjs";
import { touchControls } from "./touch.mjs";
import { trackBestFewest } from "./score.mjs";
import { fitResolution } from "./resolution.mjs";
import { pickCell, actionKeys } from "./input.mjs";
import { startCard } from "./startcard.mjs";
import { replayTurns, sameGame } from "./replay.mjs";

export function createTurnGame(config) {
  const {
    render,
    hud = (state) => ({ score: state.score }), // the house default: #score shows state.score
    afterAct = null,
    fewestBest = null,
    // What "fewest" measures — moves for most boards; Peg counts the
    // pegs left standing. A selector, so no game re-wires the record.
    bestValue = (state) => state.moves,
    // Boards are tapped directly, so most turn games need only the
    // restart thumb touchControls appends by itself; a game that steers
    // by key (2048) declares its own layout here INSTEAD — two calls
    // would stack two bars on a phone.
    touch = [],
    // Declarative keys: { code: (state) => events }, the same table
    // shape the engine's actionKeys takes — minus pause, because a turn
    // game has no clock to pause.
    actions = null,
    pick = null,
    opponent = null,
  } = config;

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const scoreEl = document.getElementById("score");

  // Crisp at any display size; a resize wipes the canvas, so it redraws.
  const applyCourt = fitResolution(canvas, () => draw());

  // A declared opponent owns the #opponent select: the settings plumbing
  // five shells copied is derived here from the one element. (A game
  // with an opponent AND settings of its own would need composition —
  // none exists; the day one does, this is where read/write merge.)
  const opponentEl = opponent ? document.getElementById("opponent") : null;
  const session = createSession(
    opponent
      ? {
          ...config,
          settings: {
            ...config.settings,
            defaults: { opponent: "cpu" },
            read: () => ({ opponent: opponentEl.value }),
            write: (s) => {
              opponentEl.value = s.opponent;
            },
            worldEls: [opponentEl],
          },
        }
      : config
  );

  // The machine moves when the mode says so, the game runs, and the turn
  // is its seat — checked LIVE every time, so a restart or a settings
  // change mid-thought changes the answer, not the wiring.
  const cpuToMove = () =>
    opponent !== null &&
    session.settings.opponent === "cpu" &&
    session.state.status === "playing" &&
    session.state.turn === opponent.side;

  // The thinking pause, on a world-scoped timer (a restart clears it).
  // The guard re-checks on firing for the one hazard a reset isn't (the
  // settings flipping to two-player mid-thought), and act() at the
  // bottom re-schedules while the machine still holds the turn — which
  // is all a capture chain (Checkers) or a pass (Reversi) needs.
  function thinkSoon() {
    session.after(opponent.delay ?? 400, () => {
      if (!cpuToMove()) return;
      session.recording.moves.push({ via: "cpu" }); // the bot is a pure function: recording THAT it moved suffices
      act(opponent.play(session.state) ?? []);
    });
  }

  const bestEl = document.getElementById("best");
  const best =
    fewestBest && bestEl ? trackBestFewest(() => fewestBest(session.state), bestEl) : null;
  if (best) session.onReset(best.show);

  let lastScore;
  function paintHud() {
    if (!hud || !scoreEl) return;
    const h = hud(session.state);
    if (h.score !== undefined && h.score !== lastScore) {
      scoreEl.textContent = lastScore = h.score;
    }
  }

  function draw() {
    applyCourt(ctx);
    render(ctx, session.state, false);
    paintHud();
  }

  function act(events) {
    session.dispatch(events);
    if (best && session.isTerminal()) best.record(bestValue(session.state));
    afterAct?.(session.state, events);
    draw();
    if (cpuToMove()) thinkSoon();
  }

  session.onReset(draw);

  // The declared board: one pointerdown listener every picking game used
  // to hand-roll. Finished boards take no picks, and neither does a
  // board the machine is thinking at; an action that returns nothing
  // only moved a selection, so the repaint is the whole reaction — and
  // the recording keeps even those, because a selection shapes how the
  // NEXT tap is read.
  if (pick) {
    canvas.addEventListener("pointerdown", (e) => {
      if (session.isTerminal() || cpuToMove()) return;
      const index = pickCell(canvas, e, pick.board(session.state, canvas));
      if (index === -1) return;
      session.recording.moves.push({ via: "pick", index });
      const events = pick.action(session.state, index);
      if (events) act(events);
      else draw();
    });
  }

  // The declared opponent's start card: the same two seats every board
  // game offered, asked once at page load. The pick runs through the
  // select's own change event (persist + fresh board).
  if (opponent) {
    startCard({
      title: opponent.title,
      options: [
        { label: "vs the machine", value: "cpu" },
        { label: "two players", value: "human" },
      ],
      onPick: (value) => {
        opponentEl.value = value;
        opponentEl.dispatchEvent(new Event("change"));
      },
    }).show();
  }

  // The same table shape the clocked engine's special hook takes, run
  // through the same mechanism (shared/ carried two implementations of
  // this loop) — with dispatch routed through act(), so the board
  // repaints like any other action. actionKeys tells api.record which
  // key ran exactly when its action runs, so swallowed repeats never
  // pollute the replay log.
  if (actions) {
    const handler = actionKeys(actions);
    const actApi = {
      get state() {
        return session.state;
      },
      dispatch: act,
      record: (entry) => session.recording.moves.push(entry),
    };
    document.addEventListener("keydown", (e) => handler(e, actApi));
  }

  touchControls(touch);

  // The recording, replayable — a dev tool today, the leaderboard's
  // verifier tomorrow. verify() rebuilds the world from seed + moves
  // through the game's own declared doors and asks whether it lands on
  // the exact state on screen. (Sokoban's level-advancing afterAct makes
  // its verify lively right at a solve; every other turn game is pure.)
  const replay = {
    get recording() {
      return session.recording;
    },
    verify: () =>
      sameGame(
        session.state,
        replayTurns(config.core, session.recording, { pick, actions, opponent, afterAct })
      ),
  };
  canvas.replay = replay; // the console's door: document.getElementById("game").replay.verify()

  draw();
  return { canvas, session, act, draw, cpuToMove, replay };
}
