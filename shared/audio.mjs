// ============================================================================
// audio.mjs — a tiny synthesizer shared by every game (shell-side only)
//
// No sound files: every effect is SYNTHESIZED — an oscillator (a raw
// waveform generator) shaped by a gain envelope. This is how the arcade
// originals made sound too; Pong's "pong" was a bare square wave wired
// almost directly to the speaker.
//
// Why is this not in a game's core? Sound is pure OUTPUT, like pixels.
// The core reports events ("ate", "paddle", "died"); the shell decides
// what they look and sound like. Also: node --test has no speakers.
//
// Browser autoplay policy: a page can't make noise before the user
// interacts with it (imagine the ads if it could). An AudioContext created
// earlier sits in the "suspended" state — unlockAudio() must be called
// from a real user gesture (keydown, pointerdown) to get sound flowing.
// ============================================================================

let ctx = null;

// Call from a user-gesture event handler. Safe to call any number of
// times — only the first one does any work.
export function unlockAudio() {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") ctx.resume();
}

// The standard hookup: unlock on whichever gesture comes first.
// { once: true } removes each listener after it fires.
export function unlockOnFirstGesture() {
  document.addEventListener("keydown", unlockAudio, { once: true });
  document.addEventListener("pointerdown", unlockAudio, { once: true });
}

// Play one synthesized bleep.
//   freq     — starting pitch in Hz
//   slideTo  — pitch glides there over the note (lasers, death whines)
//   type     — waveform flavor: "square" (chippy), "triangle" (soft),
//              "sawtooth" (harsh)
//   at       — start offset in seconds, for scheduling tiny melodies
export function beep({
  freq,
  duration = 0.08,
  type = "square",
  volume = 0.12,
  slideTo = null,
  at = 0,
} = {}) {
  if (!ctx || ctx.state !== "running") return; // silent until unlocked

  const t = ctx.currentTime + at;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slideTo) {
    osc.frequency.exponentialRampToValueAtTime(slideTo, t + duration);
  }

  // The envelope: start at full volume, decay exponentially to silence.
  // Without it a note ends in an audible CLICK — the waveform chopped off
  // mid-swing instead of fading out.
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

  osc.connect(gain).connect(ctx.destination);
  // Oscillators are one-shot: start, stop, garbage-collected. Cheap enough
  // to build a fresh one per bleep.
  osc.start(t);
  osc.stop(t + duration);
}
