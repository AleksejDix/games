// ============================================================================
// <game-shell> — the frame every game page shares, as a web component.
//
// Eight index.html files repeated the same skeleton: header (title +
// scores), canvas, settings <details>, hint. It now lives ONCE, here, in
// this element's shadow DOM; each page provides only its own parts as
// slotted children:
//
//   <game-shell name="SNAKE">
//     <span slot="scores">Score: <strong id="score">0</strong></span>
//     <canvas id="game" ...></canvas>            ← the default slot
//     <label slot="settings">...</label>
//     <span slot="hint">...</span>
//   </game-shell>
//
// The property that makes this SAFE: slotted nodes stay in the LIGHT DOM.
// They are only rendered inside the shadow frame — getElementById still
// finds #game/#score/#lives, document CSS still styles them, the engine
// and the touch bar (which inserts itself after the canvas, landing in
// the default slot) never learn the frame exists. Shadow styles cover
// only the frame's own elements.
// ============================================================================

const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
      display: block;
      width: min(var(--court-width), 92vw);
      margin-inline: auto; /* centered on x... */
      margin-block: auto; /* ...and on y, in the body's flex column */
      padding-block: 24px;
    }

    /* Slots render their assigned nodes as if they were the slot's own
       children — display:contents lets flex containers reach them. */
    slot { display: contents; }

    header {
      display: flex; /* one axis (x) — flex */
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 14px;
    }

    h1 {
      margin: 0;
      font-size: 1.2rem;
      letter-spacing: 0.4em;
      color: var(--accent);
    }

    .scores {
      display: flex;
      gap: 16px;
      font-size: 0.85rem;
      opacity: 0.9;
    }

    ::slotted(.touch-controls) {
      margin-top: 14px;
    }

    details {
      margin-top: 14px;
      font-size: 0.8rem;
    }

    summary {
      cursor: pointer;
      opacity: 0.5;
      user-select: none;
    }

    .options {
      display: grid; /* wraps on small screens — two axes */
      grid-template-columns: repeat(auto-fit, minmax(140px, max-content));
      gap: 12px 24px;
      padding: 10px 2px 0;
    }

    ::slotted(label) {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .hint {
      margin-top: 14px;
      font-size: 0.75rem;
      opacity: 0.5;
      text-align: center;
    }
  </style>

  <header>
    <h1></h1>
    <div class="scores"><slot name="scores"></slot></div>
  </header>

  <slot></slot>

  <details>
    <summary>settings</summary>
    <div class="options"><slot name="settings"></slot></div>
  </details>

  <p class="hint"><slot name="hint"></slot></p>
`;

customElements.define(
  "game-shell",
  class extends HTMLElement {
    connectedCallback() {
      if (this.shadowRoot) return;
      const root = this.attachShadow({ mode: "open" });
      root.append(template.content.cloneNode(true));
      root.querySelector("h1").textContent = this.getAttribute("name") ?? "";
    }
  }
);
