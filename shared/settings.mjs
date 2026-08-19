// The settings persistence pattern, extracted once it appeared in three
// shells (the "rule of three": tolerate one copy, squint at two, extract
// at three — by then you know which parts actually vary).
//
// What varies per game is DATA (the storage key, the defaults, which
// controls exist); what never varied is this MECHANISM.

// localStorage stores strings, so structs go through JSON. The try/catch
// means a missing or corrupted entry silently becomes "use the defaults",
// and the spread-merge lets old saved blobs pick up newly added defaults.
export function loadSettings(key, defaults) {
  try {
    return { ...defaults, ...JSON.parse(localStorage[key]) };
  } catch {
    return { ...defaults };
  }
}

export function saveSettings(key, settings) {
  localStorage[key] = JSON.stringify(settings);
}

// The full settings choreography, which every shell had hand-rolled:
// load → fill the controls → on every change, read the controls back,
// persist, and blur (a focused control would swallow the game's keys).
//
// The one game-design distinction stays in the API: WORLD controls define
// the game and restart it via onWorldChange; PRESENTATION controls (sound)
// apply silently to the running game.
//
//   read()   — controls → a fresh settings object
//   write(s) — settings → the controls
//
// Most games need no read/write at all: they declare
//
//   controls: { fuel: 400, paddle: "classic", wrap: true }
//
// where each key names BOTH the setting and the element id, and the
// default's own type is the coercion — numbers come back through
// Number(), booleans through .checked, strings as-is. Seventeen shells
// had hand-rolled exactly that correspondence; now it is the convention.
// Hand-written read/write remain for the genuinely irregular (Sokoban's
// one-based level display, Pong's mode card).
//
// Returns the live settings object, updated in place so closures over it
// always see current values.
export function bindSettings({
  storageKey,
  controls = null,
  defaults = {},
  read = () => ({}),
  write = () => {},
  worldEls = [],
  presentationEls = [],
  onWorldChange = () => {},
}) {
  if (controls) {
    const els = Object.keys(controls).map((key) => [key, document.getElementById(key)]);
    defaults = { ...controls };
    read = () =>
      Object.fromEntries(
        els.map(([key, el]) => [
          key,
          typeof controls[key] === "number" ? Number(el.value)
          : typeof controls[key] === "boolean" ? el.checked
          : el.value,
        ])
      );
    write = (s) => {
      for (const [key, el] of els) {
        if (typeof controls[key] === "boolean") el.checked = s[key];
        else el.value = String(s[key]);
      }
    };
    worldEls = els.map(([, el]) => el);
  }

  const settings = loadSettings(storageKey, { sound: true, ...defaults });
  write(settings);

  // The sound toggle is a framework CONVENTION, like #score and #best:
  // if the page has a #sound checkbox, it's bound right here — a
  // presentation setting, persisted, never restarting the world — and no
  // game ever declares it again.
  const soundEl = document.getElementById("sound");
  if (soundEl) {
    soundEl.checked = settings.sound;
    soundEl.addEventListener("change", (e) => {
      settings.sound = soundEl.checked;
      saveSettings(storageKey, settings);
      e.target.blur();
    });
  }

  const persist = (e) => {
    Object.assign(settings, read());
    saveSettings(storageKey, settings);
    e.target.blur();
  };

  for (const el of worldEls) {
    el.addEventListener("change", (e) => {
      persist(e);
      onWorldChange();
    });
  }
  for (const el of presentationEls) {
    el.addEventListener("change", persist);
  }

  return settings;
}
