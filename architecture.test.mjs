// ============================================================================
// architecture.test.mjs — the dependency rules, as executable tests.
//
// The layering that keeps this codebase healthy has lived in comments and
// discipline: cores never touch the browser, cores import only mechanisms,
// games never reach into each other, renderers only project. Architecture
// erodes one innocent-looking import at a time — these tests make each
// violation a red build instead of a slow decay.
//
// A meta-suite: it reads SOURCE FILES, not modules, so it may use node:fs.
// ============================================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { GAMES } from "./games.mjs";

const games = GAMES.filter((g) => g.live).map((g) => g.id);

// Every game lives under games/ — the repo root holds only the shell,
// the shared mechanisms, and the meta-suites.
const dir = (id) => `games/${id}`;

// Comments may SAY "no canvas, no DOM" — strip them so only code counts.
const stripComments = (src) =>
  src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

// Comments strip FIRST: prose like «decouples X from "how often…"» would
// otherwise read as an import of "how often…". The suite found that one
// out itself on its first run.
const importSpecs = (src) =>
  [...stripComments(src).matchAll(/from\s+"([^"]+)"/g)].map((m) => m[1]);

const mjsFiles = async (dir) =>
  (await readdir(dir)).filter((f) => f.endsWith(".mjs")).map((f) => `${dir}/${f}`);

const gameFiles = async (id) => [
  ...(await mjsFiles(dir(id))).filter((f) => !f.endsWith(".test.mjs")),
  ...(await mjsFiles(`${dir(id)}/core`)),
];

test("every game ships the same architecture: rules, projection, wiring", async () => {
  // The three-layer shape is the contract a new game signs by going live
  // in the manifest. Extra core modules (Pong's ai.mjs, Snake's spawn.mjs)
  // are welcome — this is the required minimum, not a ceiling.
  const required = ["logic.mjs", "render.mjs", "game.mjs", "index.html", "style.css", "logic.test.mjs"];
  const requiredCore = ["constants.mjs", "state.mjs", "machine.mjs", "step.mjs"];

  for (const id of games) {
    const files = await readdir(dir(id));
    for (const f of required) {
      assert.ok(files.includes(f), `${dir(id)}/ is missing ${f}`);
    }
    const core = await readdir(`${dir(id)}/core`);
    for (const f of requiredCore) {
      assert.ok(core.includes(f), `${dir(id)}/core/ is missing ${f}`);
    }
  }
});

test("every game's renderer exports the same signature", async () => {
  // Checked as source (importing render.mjs needs a DOM for the palette).
  for (const id of games) {
    const src = await readFile(`${dir(id)}/render.mjs`, "utf8");
    assert.match(
      src,
      /export function render\(ctx, state, paused\)/,
      `${id}/render.mjs must export render(ctx, state, paused)`
    );
  }
});

test("cores never touch the browser", async () => {
  const banned = [
    "document",
    "window.",
    "localStorage",
    "addEventListener",
    "requestAnimationFrame",
    "AudioContext",
    "getComputedStyle",
    "setTimeout",
    "setInterval",
    "Date.now",
  ];
  for (const id of games) {
    for (const file of await mjsFiles(`${dir(id)}/core`)) {
      const code = stripComments(await readFile(file, "utf8"));
      for (const word of banned) {
        assert.ok(!code.includes(word), `${file} uses ${word}`);
      }
    }
  }
});

test("cores import only their own folder or shared mechanisms", async () => {
  for (const id of games) {
    for (const file of await mjsFiles(`${dir(id)}/core`)) {
      for (const spec of importSpecs(await readFile(file, "utf8"))) {
        assert.ok(
          /^\.\/|^\.\.\/\.\.\/\.\.\/shared\//.test(spec),
          `${file} imports "${spec}" — cores may only reach ./ or ../../../shared/`
        );
      }
    }
  }
});

test("games never import from another game", async () => {
  for (const id of games) {
    for (const file of await gameFiles(id)) {
      for (const spec of importSpecs(await readFile(file, "utf8"))) {
        for (const other of games) {
          if (other === id) continue;
          assert.ok(
            !spec.includes(`/${other}/`) && !spec.startsWith(`../${other}`),
            `${file} imports "${spec}" — games stay independent worlds`
          );
        }
      }
    }
  }
});

test("shared mechanisms know nothing about any game", async () => {
  for (const file of await mjsFiles("shared")) {
    for (const spec of importSpecs(await readFile(file, "utf8"))) {
      assert.ok(
        /^\.\/|^node:/.test(spec),
        `${file} imports "${spec}" — shared/ must not depend on games`
      );
    }
  }
});

test("renderers take every color from the palette — no rgba()/hex literals", async () => {
  // The palette is the ONLY place a color is defined; faint variants go
  // through cssVarAlpha. A hardcoded literal silently divorces a canvas
  // from the theme — thirteen renderers proved it happens one at a time.
  for (const id of games) {
    const code = stripComments(await readFile(`${dir(id)}/render.mjs`, "utf8"));
    for (const word of ["rgba(", '"#']) {
      assert.ok(
        !code.includes(word),
        `${id}/render.mjs hardcodes a color (${word}…) — use cssVar/cssVarAlpha`
      );
    }
  }
});

test("renderers only project — no storage, no listeners, no settings", async () => {
  const banned = ["localStorage", "addEventListener", "bindSettings", "trackBest"];
  for (const id of games) {
    const code = stripComments(await readFile(`${dir(id)}/render.mjs`, "utf8"));
    for (const word of banned) {
      assert.ok(!code.includes(word), `${id}/render.mjs uses ${word}`);
    }
  }
});
