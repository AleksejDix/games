// ============================================================================
// serve.mjs — the dev server, build-less and dependency-free.
//
// The whole app is plain ESM and CSS that browsers run natively; nothing
// is compiled, so nothing needs building. This ~50-line node:http server
// replaces the last tool between the source and the screen: static files
// with correct types, directory indexes, and the one SPA fallback the
// shell's router needs (/play/:id → index.html). Production needs even
// less — any static host with the same rewrite (see vercel.json).
// ============================================================================

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, normalize } from "node:path";

const PORT = process.env.PORT ?? 5190;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

const send = (res, status, body, type = "text/plain") => {
  res.writeHead(status, { "content-type": type, "cache-control": "no-store" });
  res.end(body);
};

createServer(async (req, res) => {
  const { pathname } = new URL(req.url, "http://localhost");
  // Normalize and jail to the project directory — no path traversal.
  let path = normalize(decodeURIComponent(pathname)).replace(/^([/.]+)/, "");
  if (path === "" || pathname.endsWith("/")) path += "index.html";

  try {
    return send(res, 200, await readFile(path), TYPES[extname(path)] ?? "application/octet-stream");
  } catch {
    // A directory visited without its slash: redirect so relative URLs work.
    try {
      await readFile(path + "/index.html");
      res.writeHead(301, { location: pathname + "/" });
      return res.end();
    } catch {}
    // Extension-less path → the shell's router owns it (/play/:id).
    if (!extname(path)) {
      return send(res, 200, await readFile("index.html"), TYPES[".html"]);
    }
    return send(res, 404, `not found: ${pathname}`);
  }
}).listen(PORT, () => console.log(`neon games, build-less → http://localhost:${PORT}`));
