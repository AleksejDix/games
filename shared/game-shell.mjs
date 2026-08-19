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

import { courtSize } from "./resolution.mjs";

const template = document.createElement("template");
template.innerHTML = `
  <style>
    /* NOTE: the host's LAYOUT (width, centering margins, padding) lives
       in shared/style.css — document rules beat :host rules on the same
       element, and the * reset was erasing auto margins declared here. */
    :host {
      display: block;
    }

    /* Slots render their assigned nodes as if they were the slot's own
       children — display:contents lets flex containers reach them. */
    slot { display: contents; }

    /* Our own display rules would silently defeat the hidden attribute
       (same trap shell.css documents) — the framed surrender relies on it. */
    [hidden] { display: none !important; }

    /* The positioning anchor for overlays (shared/startcard.mjs): the
       default slot's content — canvas, touch bar — lives inside it, so
       an absolutely positioned slotted card covers exactly the play
       area, not the page. */
    .stage { position: relative; }

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

  <div class="stage"><slot></slot></div>

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
      // Inside the shell's player, the dossier panel shows the settings
      // and how-to-play, and the playerbar carries the title and the
      // scores — the frame surrenders its own copies (the shell ADOPTS
      // the slotted nodes; these shadow frames would sit empty).
      if (window.self !== window.top) {
        root.querySelector("header").hidden = true;
        root.querySelector("details").hidden = true;
        root.querySelector(".hint").hidden = true;
      }
      // The sound toggle is a framework convention (settings.mjs binds
      // #sound wherever it exists), and every page carried the same
      // label. The frame provides it now — appended into the LIGHT DOM,
      // like every slotted node, so getElementById still finds it and it
      // lands in the settings slot after the game's own controls.
      if (!this.querySelector("#sound")) {
        const label = document.createElement("label");
        label.slot = "settings";
        const box = document.createElement("input");
        box.type = "checkbox";
        box.id = "sound";
        label.append(box, " sound");
        this.append(label);
      }
      // The court's aspect ratio, read off the slotted canvas — the one
      // number the width rule in shared/style.css needs to fill the
      // viewport without overflowing it. Declared once, by the markup
      // that owns the resolution; no game states its size twice.
      const canvas = this.querySelector("canvas");
      if (canvas) {
        // courtSize, not raw attrs: correct even if the hi-dpi re-back
        // (shared/resolution.mjs) has already replaced them.
        const court = courtSize(canvas);
        this.style.setProperty("--court-aspect", court.width / court.height);
      }
    }
  }
);
