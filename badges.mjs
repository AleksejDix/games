// ============================================================================
// badges.mjs — <input-badge type="keyboard|mouse|touch">: how a game is
// played, worn as a pixel icon. The emojis this replaces clashed with the
// neon-mono look and rendered differently on every platform; these are
// bitmaps in the logo's dialect — string art parsed to SVG rects, fill
// currentColor (the theme owns the color), crisp edges, intrinsic size
// (the logo's hard-won lesson).
//
// Shell-owned, so it lives at the root: only the library's cards wear
// badges. The palette's custom properties cross the shadow boundary, so
// var(--muted) works inside.
// ============================================================================

const ICONS = {
  keyboard: [
    "############",
    "#..........#",
    "#.#.#.#.#..#",
    "#..........#",
    "#..######..#",
    "#..........#",
    "############",
  ],
  mouse: [
    ".######.",
    "#..##..#",
    "#..##..#",
    "#......#",
    "########",
    "#......#",
    "#......#",
    "#......#",
    ".######.",
  ],
  touch: [
    "..#...#..",
    ".#.###.#.",
    "...###...",
    "...###...",
    "...###...",
    "..#####..",
    ".#######.",
    ".#######.",
    "..#####..",
  ],
};

function svg(rows) {
  const pixels = rows
    .flatMap((row, y) =>
      [...row].flatMap((ch, x) =>
        ch === "#" ? [`<rect x="${x}" y="${y}" width="1" height="1"/>`] : []
      )
    )
    .join("");
  const w = rows[0].length;
  const h = rows.length;
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="currentColor" shape-rendering="crispEdges" aria-hidden="true">${pixels}</svg>`;
}

customElements.define(
  "input-badge",
  class extends HTMLElement {
    connectedCallback() {
      if (this.shadowRoot) return;
      const type = this.getAttribute("type");
      const rows = ICONS[type];
      if (!rows) return;
      const root = this.attachShadow({ mode: "open" });
      root.innerHTML = `
        <style>
          :host {
            display: inline-grid;
            place-items: center;
            min-width: 22px;
            height: 17px;
            border: 1px solid #232733;
            border-radius: 999px;
            color: var(--muted);
          }
          svg { display: block; }
        </style>
        ${svg(rows)}`;
      this.setAttribute("role", "img");
      this.setAttribute("aria-label", `plays with ${type}`);
      if (!this.title) this.title = `plays with ${type}`;
    }
  }
);
