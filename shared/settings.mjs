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
