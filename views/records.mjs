// ============================================================================
// views/records.mjs — the RECORDS view: every best the games have
// persisted, read back through the manifest's `record` declarations.
//
// The games write localStorage; this view only reads it. Rendering
// happens on every enter(), so a record set in the player is fresh the
// moment you come back — no live sync needed, the router IS the refresh.
// ============================================================================

import { GAMES } from "../games.mjs";
import { readRecords } from "../shared/score.mjs";

const recordsEl = document.getElementById("records");
const listEl = document.getElementById("recordsList");

const tpl = (id) => document.getElementById(id).content;

function row(game) {
  const node = tpl("tpl-record").cloneNode(true);
  node.querySelector(".record").href = `/play/${game.id}`;
  node.querySelector(".rname").textContent = game.title;

  const values = node.querySelector(".rvalues");
  const records = readRecords(game);
  if (records.length === 0) {
    values.textContent = "no record yet";
    values.classList.add("unset");
  } else {
    values.replaceChildren(
      ...records.map((r) => {
        const span = document.createElement("span");
        span.className = "rvalue";
        span.textContent = r.label
          ? `${r.label} · ${r.value} ${r.unit}`
          : `${r.value} ${r.unit}`;
        return span;
      })
    );
  }
  return node;
}

export const recordsView = {
  layout: "focus", // no sidebar: filters have nothing to filter here
  enter() {
    const keepers = GAMES.filter((g) => g.live && g.record);
    listEl.replaceChildren(...keepers.map(row));
    recordsEl.hidden = false;
  },
  leave() {
    recordsEl.hidden = true;
  },
};
