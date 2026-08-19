// On-screen controls for touch play.
//
// The trick: no parallel input path. Each button SYNTHESIZES the keyboard
// event for its key code — pointerdown dispatches keydown, release
// dispatches keyup — so everything that already listens for keys works
// untouched: held-key tracking, Snake's tap queue, Breakout's contextual
// Space, pause, restart. A game's touch layout is just codes and labels.
//
// The bar only appears where touch is the PRIMARY pointer (a phone, not a
// laptop with a touchscreen nearby) — desktops keep a clean page.

export function touchControls(buttons) {
  if (!window.matchMedia("(pointer: coarse)").matches) return;

  const bar = document.createElement("div");
  bar.className = "touch-controls";

  for (const { code, label } of buttons) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;

    const press = (e) => {
      e.preventDefault(); // no focus steal, no double-tap zoom
      document.dispatchEvent(new KeyboardEvent("keydown", { code }));
    };
    const release = () =>
      document.dispatchEvent(new KeyboardEvent("keyup", { code }));

    // Touch implicitly captures the pointer, so pointerup reaches the
    // button even if the finger wandered; cancel covers interruptions.
    button.addEventListener("pointerdown", press);
    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
    button.addEventListener("contextmenu", (e) => e.preventDefault());

    bar.append(button);
  }

  document.getElementById("game").insertAdjacentElement("afterend", bar);
}
