#!/usr/bin/env node
// tools/library-ui: the founder's local library page. Browse every asset, drag files in to add
// them, retire / remove / approve / tag with a click, watch the render queue.
//
//   tools/library-ui            then open http://127.0.0.1:4317
//   [--port 4317] [--no-push]   (--no-push: don't upload new assets to S3 straight away)
//
// Localhost only: it binds 127.0.0.1, checks the Host header, and every write needs the per-run
// token baked into the page, so another website can't drive it. It calls the SAME code as
// tools/catalog (tools/lib/catalog.ts), so every change is validated and lands in the manifests,
// catalog/index.json and S3 exactly as the CLI would do it. Without this server, tracker/index.html
// still opens from disk as a read-only browser.
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { randomBytes } from "node:crypto";
import { createReadStream, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { tmpdir } from "node:os";
import { INDEX_PATH, LIB, parseArgs, readJson, ROOT } from "./lib/core.ts";
import { addAsset, approveAsset, KIND_FIELDS, LICENCES, removeAsset, replaceAsset, retireAsset, tagAsset } from "./lib/catalog.ts";
import { KINDS } from "../schemas/asset.ts";

const args = parseArgs(process.argv.slice(2));
const PORT = Number(args.port ?? 4317);
const TOKEN = randomBytes(18).toString("hex");
const PUSH = !args["no-push"];
const MIME: Record<string, string> = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".json": "application/json", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif", ".mp4": "video/mp4", ".mp3": "audio/mpeg", ".wav": "audio/wav", ".ttf": "font/ttf" };

const send = (res: ServerResponse, code: number, body: unknown, type = "application/json") => {
  res.writeHead(code, { "content-type": type, "cache-control": "no-store", "x-content-type-options": "nosniff" });
  res.end(typeof body === "string" || Buffer.isBuffer(body) ? body : JSON.stringify(body));
};
const body = (req: IncomingMessage, limit = 2 * 1024 ** 3): Promise<Buffer> =>
  new Promise((ok, bad) => {
    const parts: Buffer[] = [];
    let n = 0;
    req.on("data", (c: Buffer) => {
      n += c.length;
      if (n > limit) bad(new Error("too large"));
      else parts.push(c);
    });
    req.on("end", () => ok(Buffer.concat(parts)));
    req.on("error", bad);
  });
const staticFile = (res: ServerResponse, base: string, rel: string) => {
  const p = normalize(join(base, decodeURIComponent(rel)));
  if (!p.startsWith(base) || !existsSync(p) || statSync(p).isDirectory()) return send(res, 404, { error: "not found" });
  res.writeHead(200, { "content-type": MIME[extname(p).toLowerCase()] ?? "application/octet-stream", "cache-control": "no-store" });
  createReadStream(p).pipe(res);
};

/** Save an uploaded body to a temp file with the original name (so the extension survives). */
const tempFile = (buf: Buffer, name: string) => {
  const d = join(tmpdir(), `curate-motion-ui-${randomBytes(6).toString("hex")}`);
  mkdirSync(d, { recursive: true });
  const p = join(d, name.replace(/[^A-Za-z0-9._-]/g, "_"));
  writeFileSync(p, buf);
  return { p, done: () => rmSync(d, { recursive: true, force: true }) };
};

const server = createServer(async (req, res) => {
  try {
    const host = (req.headers.host ?? "").split(":")[0];
    if (host !== "127.0.0.1" && host !== "localhost") return send(res, 403, { error: "localhost only" });
    const u = new URL(req.url ?? "/", `http://${req.headers.host}`);
    const q = Object.fromEntries(u.searchParams);

    if (req.method === "GET") {
      if (u.pathname === "/" || u.pathname === "/index.html") {
        const html = readFileSync(join(ROOT, "tracker", "index.html"), "utf8").replace("<!--UI-TOKEN-->", `<meta name="ui-token" content="${TOKEN}">`);
        return send(res, 200, html, "text/html; charset=utf-8");
      }
      if (u.pathname === "/data/catalog.json") return send(res, 200, existsSync(INDEX_PATH) ? readFileSync(INDEX_PATH) : "{}");
      if (u.pathname === "/data/queue.json") return send(res, 200, existsSync(join(ROOT, "renders", "queue.json")) ? readFileSync(join(ROOT, "renders", "queue.json")) : '{"jobs":[]}');
      if (u.pathname === "/data/options.json") return send(res, 200, { kinds: KINDS, fields: KIND_FIELDS, licences: Object.fromEntries(Object.entries(LICENCES).map(([k, v]) => [k, v.licence.name])), push: PUSH });
      if (u.pathname === "/data/people.json") {
        const d = join(LIB, "people");
        const people = existsSync(d) ? readdirSync(d).filter((n) => existsSync(join(d, n, "account.json"))).map((n) => ({ persona: n, account: readJson(join(d, n, "account.json")), state: existsSync(join(d, n, "account-state.json")) ? readJson(join(d, n, "account-state.json")) : null })) : [];
        return send(res, 200, { people });
      }
      if (u.pathname.startsWith("/library/")) return staticFile(res, LIB, u.pathname.slice("/library/".length));
      if (u.pathname.startsWith("/renders/")) return staticFile(res, join(ROOT, "renders"), u.pathname.slice("/renders/".length));
      if (u.pathname.startsWith("/tracker/")) return staticFile(res, join(ROOT, "tracker"), u.pathname.slice("/tracker/".length));
      return send(res, 404, { error: "not found" });
    }

    if (req.method !== "POST") return send(res, 405, { error: "method" });
    if (req.headers["x-ui-token"] !== TOKEN) return send(res, 403, { error: "bad token: reload the page" });
    const by = q.by || "founder";

    if (u.pathname === "/api/add" || u.pathname === "/api/replace") {
      const t = tempFile(await body(req), q.filename || "upload.bin");
      try {
        if (u.pathname === "/api/replace") return send(res, 200, replaceAsset(q.id, t.p, { by, byType: "human", push: PUSH }));
        const fields = q.fields ? (JSON.parse(q.fields) as Record<string, unknown>) : {};
        return send(
          res,
          200,
          addAsset({
            file: t.p,
            kind: q.kind,
            scope: q.scope || undefined,
            name: q.name || undefined,
            title: q.title || undefined,
            licence: q.licence,
            tags: (q.tags ?? "").split(",").map((s) => s.trim()).filter(Boolean),
            fields,
            by,
            byType: "human",
            push: PUSH,
          }),
        );
      } finally {
        t.done();
      }
    }
    const j = JSON.parse((await body(req, 1 << 20)).toString() || "{}") as Record<string, string & string[]>;
    if (u.pathname === "/api/retire") return send(res, 200, retireAsset(j.id, { for: j.for }));
    if (u.pathname === "/api/remove") return send(res, 200, removeAsset(j.id, { force: !!j.force }));
    if (u.pathname === "/api/approve") return send(res, 200, approveAsset(j.id, j.by || by));
    if (u.pathname === "/api/tag") return send(res, 200, tagAsset(j.id, j.add ?? [], j.remove ?? []));
    return send(res, 404, { error: "not found" });
  } catch (e) {
    return send(res, 400, { error: (e as Error).message });
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`curate-motion library: http://127.0.0.1:${PORT}  (localhost only; Ctrl-C to stop)${PUSH ? "" : "  [--no-push: new assets stay local]"}`);
});
