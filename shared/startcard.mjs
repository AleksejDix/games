// ============================================================================
// startcard.mjs — the mode-select START CARD, as real DOM.
//
// The first version was canvas text, and canvas text can't do what a
// choice needs: no hover, no focus ring, no thumb-sized tap target. This
// card is HTML buttons over the frozen court — the browser provides the
// affordances, shared/style.css the look, and <game-shell>'s .stage the
// positioning anchor (the card slots in right after the canvas).
//
// Number keys pick by position (1, 2, …), clicks and taps pick directly,
// and picking hides the card before onPick runs. Games with an arcade
// loop (Pong) call show() again when their world returns to ready.
// ============================================================================

export function startCard({ title, options, onPick }) {
  const card = document.createElement("div");
  card.className = "start-card";

  const heading = document.createElement("h2");
  heading.textContent = title;
  card.append(heading);

  options.forEach(({ label, value }, i) => {
    const button = document.createElement("button");
    button.type = "button";
    const key = document.createElement("kbd");
    key.textContent = i + 1;
    button.append(key, ` ${label}`);
    button.addEventListener("click", () => pick(value));
    card.append(button);
  });

  function pick(value) {
    hide();
    onPick(value);
  }

  document.addEventListener("keydown", (e) => {
    if (card.hidden) return;
    const i = ["Digit1", "Digit2", "Digit3"].indexOf(e.code);
    if (i !== -1 && options[i]) pick(options[i].value);
  });

  const show = () => (card.hidden = false);
  const hide = () => (card.hidden = true);

  document.getElementById("game").insertAdjacentElement("afterend", card);
  return { show, hide };
}
