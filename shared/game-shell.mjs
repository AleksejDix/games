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

    /* The stage toolbar, YouTube's corner: settings and fullscreen,
       quiet until hovered, tappable on phones. */
    .toolbar {
      position: absolute;
      right: 10px;
      bottom: 10px;
      z-index: 2;
      display: flex;
      gap: 6px;
    }

    .toolbar button {
      background: none;
      border: 1px solid #232733;
      border-radius: 6px;
      color: var(--text);
      font: inherit;
      font-size: 1rem;
      line-height: 1;
      padding: 6px 8px;
      cursor: pointer;
      opacity: 0.35;
    }

    .toolbar button:hover { opacity: 1; border-color: var(--accent); }

    /* The gear's popover: the settings' ONE home — standalone, framed,
       and (the point) fullscreen, where no sidebar can follow. Anchored
       to the toolbar, stacked above the court. */
    .pop {
      position: absolute;
      right: 10px;
      bottom: 54px;
      z-index: 3;
      min-width: 230px;
      background: var(--panel);
      border: 1px solid #232733;
      border-radius: 10px;
      padding: 14px;
      font-size: 0.8rem;
    }

    /* The name lives in the page chrome (standalone) or the dossier
       (framed) — the shell shows only the scores row. */
    header {
      display: flex; /* one axis (x) — flex */
      justify-content: flex-end;
      align-items: baseline;
      margin-bottom: 14px;
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

    /* Small screens: the document side (shared/style.css) turns the host
       into a full-viewport column; this side says which row grows. The
       stage takes everything the header and settings leave, and centers
       the court and the thumb bar inside it. Hints are a keyboard
       courtesy — a thumb screen doesn't need them. */
    @media (max-width: 720px) {
      header { margin-bottom: 10px; }

      .stage {
        flex: 1;
        min-height: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 12px;
      }

      .hint { display: none; }
    }
  </style>

  <header>
    <div class="scores"><slot name="scores"></slot></div>
  </header>

  <div class="stage">
    <slot></slot>
    <div class="toolbar">
      <button class="pp" type="button" title="pause / resume" hidden>⏸</button>
      <button class="rr" type="button" title="restart">↻</button>
      <button class="gear" type="button" title="settings">⚙</button>
      <button class="fs" type="button" title="fullscreen (f)">⛶</button>
    </div>
    <div class="pop" hidden>
      <div class="options"><slot name="settings"></slot></div>
    </div>
  </div>

  <p class="hint"><slot name="hint"></slot></p>
`;

customElements.define(
  "game-shell",
  class extends HTMLElement {
    connectedCallback() {
      if (this.shadowRoot) return;
      const root = this.attachShadow({ mode: "open" });
      root.append(template.content.cloneNode(true));
      // Inside the shell's player, the dossier panel shows the settings
      // and how-to-play, and the playerbar carries the title and the
      // scores — the frame surrenders its own copies (the shell ADOPTS
      // the slotted nodes; these shadow frames would sit empty).
      if (window.self !== window.top) {
        root.querySelector("header").hidden = true;
        root.querySelector(".hint").hidden = true;
        // Tell CSS: no chrome in here — the frame is ALL stage, so the
        // court may contain-fit the full height (see shared/style.css).
        document.documentElement.classList.add("framed");
      }
      // Fullscreen, the YouTube way: the corner button or the F key,
      // Escape (or either again) to leave. One mechanism serves both
      // contexts — standalone pages fullscreen themselves, and in the
      // shell's player the frame does (the iframe carries
      // allowfullscreen). While fullscreen, the page chrome steps aside
      // exactly like framed mode; the contain-fit sizing then reads
      // 100dvh as the whole screen. Unsupported browsers (iPhone) just
      // ignore the request.
      const framed = window.self !== window.top;
      const surrender = (on) => {
        for (const part of ["header", ".hint"]) {
          root.querySelector(part).hidden = framed || on;
        }
        document.documentElement.classList.toggle("fullscreen", on);
      };
      const toggleFs = () => {
        if (document.fullscreenElement) document.exitFullscreen();
        else
          document.documentElement
            .requestFullscreen?.()
            .catch((e) => console.warn("fullscreen refused:", e.message));
      };
      root.querySelector(".fs").addEventListener("click", toggleFs);

      // Play/pause and restart speak to the engine through DOM events —
      // no keys synthesized, no per-game wiring. The ⏯ icon follows the
      // engine's broadcasts; clockless games announce no pausable, so
      // the button hides itself (checked after the page's modules ran).
      const pp = root.querySelector(".pp");
      pp.addEventListener("click", () =>
        document.dispatchEvent(new CustomEvent("game:pause"))
      );
      root.querySelector(".rr").addEventListener("click", () =>
        document.dispatchEvent(new CustomEvent("game:restart"))
      );
      document.addEventListener("game:paused", (e) => {
        pp.textContent = e.detail ? "▶" : "⏸";
      });
      // Revealed, not hidden — and by REACTION, not by timer. The engine
      // announces its clock as data-pausable on the root; this element
      // may construct before or after that happens (module tasks
      // interleave with timers — both rAF and setTimeout drafts lost the
      // race one way or the other), so: check now, and observe for it.
      const reveal = () => {
        if ("pausable" in document.documentElement.dataset) {
          pp.hidden = false;
          observer.disconnect();
        }
      };
      const observer = new MutationObserver(reveal);
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["data-pausable"],
      });
      reveal();

      // The gear: toggle the popover; Escape or a click anywhere else
      // closes it (composedPath sees through the shadow boundary).
      const pop = root.querySelector(".pop");
      const gear = root.querySelector(".gear");
      gear.addEventListener("click", () => (pop.hidden = !pop.hidden));
      document.addEventListener("click", (e) => {
        if (pop.hidden) return;
        const path = e.composedPath();
        if (!path.includes(pop) && !path.includes(gear)) pop.hidden = true;
      });
      document.addEventListener("keydown", (e) => {
        if (e.code === "Escape") pop.hidden = true;
      });
      document.addEventListener("keydown", (e) => {
        if (e.code !== "KeyF" || /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
        e.preventDefault();
        toggleFs();
      });
      document.addEventListener("fullscreenchange", () =>
        surrender(!!document.fullscreenElement)
      );

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
