// ============================================================================
// badges.mjs — <input-badge type="keyboard|mouse|touch">: how a game is
// played, worn as a small text pill. Plain words beat icons here: no
// legend needed, legible at any size, same in every font stack. (This
// element rendered emojis once, then pixel icons — text won.)
//
// Shell-owned, so it lives at the root: only the library's cards wear
// badges. Inherited properties (font, color via var(--muted)) cross the
// shadow boundary, so the pill dresses itself from the page's theme.
// ============================================================================

const LABELS = {
  keyboard: "keys",
  mouse: "mouse",
  touch: "touch",
};

customElements.define(
  "input-badge",
  class extends HTMLElement {
    connectedCallback() {
      if (this.shadowRoot) return;
      const label = LABELS[this.getAttribute("type")];
      if (!label) return;
      const root = this.attachShadow({ mode: "open" });
      root.innerHTML = `
        <style>
          :host {
            display: inline-block;
            font-size: 0.62rem;
            letter-spacing: 0.08em;
            color: var(--muted);
            border: 1px solid #232733;
            border-radius: 999px;
            padding: 1px 7px;
          }
        </style>
        ${label}`;
    }
  }
);
