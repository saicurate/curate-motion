#!/usr/bin/env node
// tools/library-ui: the founder's local library page. Browse every asset, drag files in to add
// them, retire / remove / approve / tag with a click, watch the render queue.
//
//   tools/library-ui            then open http://127.0.0.1:4317
//   [--port 4317] [--no-push]   (--no-push: don't upload new assets to S3 straight away)
//   [--lan]                     also serve to phones on the same Wi-Fi (off by default). Every LAN
//                               request needs the per-run key: open the page on this Mac and use the
//                               Voice panel's "Open on your phone" link (the key is never printed).
//
// The Voice panel (tools/library-ui-voice.js, injected into the page) picks the voiceover: the
// default and each ad's own choice, written through tools/lib/voice-settings.ts (the same code as
// `tools/voice use`). "Preview cost" runs `tools/voice generate <ad> --dry-run`; "Preview with Mac
// voice" makes free say-preview clips; "Generate" (paid) needs a confirmation AND
// config/voice.json › tts.spendCapUsd above spent + estimate, which tools/lib/voice.ts checks again.
//
// The Prompts and Inspo tabs (tools/library-ui-tabs.js) read and write prompts/ and inspo/ through
// /api/prompts/* and /api/inspo/* (tools/lib/boards-api.ts → the same code as tools/prompts and tools/inspo).
//
// Localhost only: it binds 127.0.0.1, checks the Host header, and every write needs the per-run
// token baked into the page, so another website can't drive it. It calls the SAME code as
// tools/catalog (tools/lib/catalog.ts), so every change is validated and lands in the manifests,
// catalog/index.json and S3 exactly as the CLI would do it. Without this server, tracker/index.html
// still opens from disk as a read-only browser.
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { execFile } from "node:child_process";
import { hostname, networkInterfaces } from "node:os";
import { createReadStream, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { tmpdir } from "node:os";
import { INDEX_PATH, LIB, parseArgs, readJson, ROOT } from "./lib/core.ts";
import { addAsset, approveAsset, KIND_FIELDS, LICENCES, removeAsset, replaceAsset, retireAsset, tagAsset } from "./lib/catalog.ts";
import { KINDS } from "../schemas/asset.ts";
import { applyVoiceChange, partOf, readVoiceState, type VoiceChange } from "./lib/voice-settings.ts";
import { loadConfig, planFor, PROVIDERS } from "./lib/voice.ts";
import { boardsGet, boardsPost, inspoUpload } from "./lib/boards-api.ts";
import type { VoiceMode } from "../schemas/voice.ts";

const args = parseArgs(process.argv.slice(2));
const PORT = Number(args.port ?? 4317);
const TOKEN = randomBytes(18).toString("hex");
const PUSH = !args["no-push"];
const LAN = !!args.lan;
const MIME: Record<string, string> = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif", ".mp4": "video/mp4", ".mp3": "audio/mpeg", ".m4a": "audio/mp4", ".wav": "audio/wav", ".srt": "text/plain; charset=utf-8", ".vtt": "text/vtt; charset=utf-8", ".ttf": "font/ttf" };

// ---- who may connect: this Mac always; phones on the Wi-Fi only with --lan AND the per-run key
const LOOPBACK = new Set(["127.0.0.1", "::1", "::ffff:127.0.0.1"]);
const lanIps = () => Object.values(networkInterfaces()).flatMap((l) => l ?? []).filter((a) => a.family === "IPv4" && !a.internal).map((a) => a.address);
const lanHosts = () => new Set([...lanIps(), hostname(), `${hostname().replace(/\.local$/, "")}.local`].map((h) => h.toLowerCase()));
const sameKey = (a?: string) => !!a && a.length === TOKEN.length && timingSafeEqual(Buffer.from(a), Buffer.from(TOKEN));
const cookieKey = (req: IncomingMessage) => /(?:^|;\s*)cm_ui=([0-9a-f]+)/.exec(req.headers.cookie ?? "")?.[1];

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
const staticFile = (res: ServerResponse, base: string, rel: string, req?: IncomingMessage) => {
  const p = normalize(join(base, decodeURIComponent(rel)));
  if (!p.startsWith(base) || !existsSync(p) || statSync(p).isDirectory()) return send(res, 404, { error: "not found" });
  const size = statSync(p).size;
  const head = { "content-type": MIME[extname(p).toLowerCase()] ?? "application/octet-stream", "cache-control": "no-store", "accept-ranges": "bytes" };
  // byte ranges: Safari (the founder's iPhone) won't play audio without them
  const r = /^bytes=(\d*)-(\d*)$/.exec(String(req?.headers.range ?? ""));
  if (r && (r[1] || r[2])) {
    const start = r[1] ? Number(r[1]) : Math.max(0, size - Number(r[2]));
    const end = r[1] && r[2] ? Math.min(Number(r[2]), size - 1) : size - 1;
    if (start > end || start >= size) {
      res.writeHead(416, { "content-range": `bytes */${size}` });
      return res.end();
    }
    res.writeHead(206, { ...head, "content-range": `bytes ${start}-${end}/${size}`, "content-length": end - start + 1 });
    return createReadStream(p, { start, end }).pipe(res);
  }
  res.writeHead(200, { ...head, "content-length": size });
  createReadStream(p).pipe(res);
};

// ---- the Voice panel's jobs: `tools/voice generate` in a child process, one at a time
let voiceBusy: string | null = null;
type GenSummary = { ad: string; profile: string; provider: string; voice: string; previewOnly: boolean; lines: { id: string; chars: number; usd: number; cached: string | null }[]; todo: number; chars: number; est: number; spent: number; cap: number; priceNote: string; keyName?: string; keyExists?: boolean; generated: string[]; dryRun: boolean };
const runVoice = (argv: string[]): Promise<GenSummary> =>
  new Promise((ok, bad) => {
    execFile(join(ROOT, "tools", "voice"), [...argv, "--json", "--by", "founder", ...(PUSH ? [] : ["--no-push"])], { cwd: ROOT, timeout: 15 * 60_000, maxBuffer: 64 << 20, env: { ...process.env, CURATE_AGENT: "founder" } }, (err, stdout) => {
      const last = String(stdout).trim().split("\n").pop() ?? "";
      let j: (GenSummary & { error?: string }) | null = null;
      try {
        j = JSON.parse(last);
      } catch {
        /* fall through */
      }
      if (j?.error) return bad(new Error(j.error));
      if (!j) return bad(new Error(err ? `tools/voice failed: ${err.message.split("\n")[0]}` : "tools/voice printed no result"));
      ok(j);
    });
  });
const voiceJob = async <T>(what: string, f: () => Promise<T>): Promise<T> => {
  if (voiceBusy) throw new Error(`Busy: ${voiceBusy}. Try again when it finishes.`);
  voiceBusy = what;
  console.log(`voice: ${what}`);
  try {
    return await f();
  } finally {
    voiceBusy = null;
  }
};
/** The free Mac preview profile (provider say, preview only). */
const macProfile = () => {
  const cfg = loadConfig();
  const e = Object.entries(cfg.tts.profiles).find(([k, p]) => p.provider === "say" && p.previewOnly && k === "say-preview") ?? Object.entries(cfg.tts.profiles).find(([, p]) => p.provider === "say" && p.previewOnly);
  if (!e) throw new Error("config/voice.json has no free Mac preview profile (provider say, previewOnly)");
  if (PROVIDERS.say.estimateUsd("test", e[1]) !== 0) throw new Error("the Mac preview profile isn't free; refusing");
  return e[0];
};
/** What the next render would play for this ad with this choice: the clips, in order. */
const sampleFor = (ad: string, mode: VoiceMode, use: string | undefined, partKey?: string) => {
  const part = partOf(ad, partKey);
  const plan = planFor(ad, { override: { mode, ...(use ? { tts: { use } } : {}) }, length: part.length });
  const clips = plan.lines.flatMap((l) => (l.audio ? [{ line: l.id, text: l.text, url: `/library/${l.audio.path.split("/").map(encodeURIComponent).join("/")}`, start: l.audio.trimBeforeSec, dur: l.audio.durSec, previewOnly: l.audio.previewOnly, id: l.audio.id }] : []));
  return { mode: plan.voice.mode, use: plan.voice.tts.use, part: part.key, lines: plan.lines.length, clips, missing: plan.missing, gapSec: plan.voice.timing.gapSec, previewOnly: clips.some((c) => c.previewOnly) };
};
const linesArg = (ad: string, partKey?: string) => partOf(ad, partKey).lines.join(",");


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
    const host = (req.headers.host ?? "").replace(/:\d+$/, "").replace(/^\[|\]$/g, "").toLowerCase();
    const local = LOOPBACK.has(req.socket.remoteAddress ?? "");
    if (host !== "127.0.0.1" && host !== "localhost" && !(LAN && lanHosts().has(host))) return send(res, 403, { error: LAN ? "unknown host" : "localhost only" });
    const u = new URL(req.url ?? "/", `http://${req.headers.host}`);
    const q = Object.fromEntries(u.searchParams);
    if (!local) {
      // only reachable with --lan (otherwise the server binds 127.0.0.1): the key, from the link or its cookie
      if (req.method === "GET" && sameKey(q.k)) {
        res.writeHead(302, { "set-cookie": `cm_ui=${TOKEN}; HttpOnly; SameSite=Lax; Path=/`, location: u.pathname, "cache-control": "no-store" });
        return res.end();
      }
      if (!sameKey(cookieKey(req))) return send(res, 403, "Open the \"Open on your phone\" link from the library page on the Mac (it carries the key).", "text/plain; charset=utf-8");
    }

    if (req.method === "GET") {
      if (u.pathname === "/" || u.pathname === "/index.html") {
        const html = readFileSync(join(ROOT, "tracker", "index.html"), "utf8").replace("<!--UI-TOKEN-->", `<meta name="ui-token" content="${TOKEN}"><script src="/ui/voice.js" defer></script><script src="/ui/tabs.js" defer></script>`);
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
      if (u.pathname === "/ui/voice.js") return staticFile(res, join(ROOT, "tools"), "library-ui-voice.js");
      if (u.pathname === "/ui/tabs.js") return staticFile(res, join(ROOT, "tools"), "library-ui-tabs.js");
      if (u.pathname === "/api/prompts" || u.pathname === "/api/inspo") return send(res, 200, boardsGet(u.pathname));
      if (u.pathname === "/api/voice/state") {
        const port = (server.address() as { port: number }).port;
        return send(res, 200, { ...readVoiceState(), push: PUSH, lan: LAN, busy: voiceBusy, ...(LAN && local ? { phoneLinks: lanIps().map((ip) => `http://${ip}:${port}/?k=${TOKEN}`) } : {}) });
      }
      if (u.pathname.startsWith("/library/")) return staticFile(res, LIB, u.pathname.slice("/library/".length), req);
      if (u.pathname.startsWith("/renders/")) return staticFile(res, join(ROOT, "renders"), u.pathname.slice("/renders/".length));
      if (u.pathname.startsWith("/tracker/")) return staticFile(res, join(ROOT, "tracker"), u.pathname.slice("/tracker/".length));
      return send(res, 404, { error: "not found" });
    }

    if (req.method !== "POST") return send(res, 405, { error: "method" });
    if (req.headers["x-ui-token"] !== TOKEN) return send(res, 403, { error: "bad token: reload the page" });
    const by = q.by || "founder";

    if (u.pathname === "/api/inspo/add-file") {
      const t = tempFile(await body(req), q.filename || "upload.bin");
      try {
        return send(res, 200, inspoUpload(t.p, q, by, PUSH));
      } finally {
        t.done();
      }
    }
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
    // ---- the Prompts and Inspo tabs
    if (u.pathname.startsWith("/api/prompts/") || u.pathname.startsWith("/api/inspo/")) {
      const r = boardsPost(u.pathname, j, by, PUSH);
      if (r !== undefined) return send(res, 200, r);
    }

    // ---- the Voice panel
    const v = j as unknown as { ad: string; mode: VoiceMode; use?: string; part?: string; expectUsd?: number; confirm?: boolean; capUsd?: number; version?: string } & VoiceChange;
    if (u.pathname === "/api/voice/save") {
      if (v.capUsd !== undefined) throw new Error("the spending limit is changed with its own button");
      const r = applyVoiceChange({ global: v.global, ads: v.ads, versions: v.versions });
      console.log(`voice: ${r.message}`);
      return send(res, 200, { ...r, state: readVoiceState() });
    }
    if (u.pathname === "/api/voice/cap") {
      if (v.confirm !== true) throw new Error("raising the spending limit needs a confirmation");
      const r = applyVoiceChange({ capUsd: Number(v.capUsd), versions: { config: v.version } });
      console.log(`voice: spending limit set to $${Number(v.capUsd).toFixed(2)} by the founder`);
      return send(res, 200, { ...r, state: readVoiceState() });
    }
    if (u.pathname === "/api/voice/sample") return send(res, 200, sampleFor(v.ad, v.mode, v.use, v.part));
    if (u.pathname === "/api/voice/estimate") {
      const use = v.use ?? loadConfig().tts.use;
      return send(res, 200, await voiceJob(`pricing ${v.ad} with ${use}`, () => runVoice(["generate", v.ad, "--profile", use, "--lines", linesArg(v.ad, v.part), "--dry-run"])));
    }
    if (u.pathname === "/api/voice/mac-preview") {
      const mac = macProfile();
      const r = await voiceJob(`Mac preview of ${v.ad}`, () => runVoice(["generate", v.ad, "--profile", mac, "--lines", linesArg(v.ad, v.part), "--yes"]));
      if (r.est !== 0 || !r.previewOnly) throw new Error("internal: the Mac preview wasn't free; stopped");
      return send(res, 200, { result: r, sample: sampleFor(v.ad, "tts", mac, v.part) });
    }
    if (u.pathname === "/api/voice/generate") {
      // Paid. Gate 1: the founder pressed "Generate (costs ~$X)" and confirmed. Gate 2: a fresh
      // estimate no higher than what they saw. Gate 3: the spend cap here AND again in tools/lib/voice.ts.
      if (v.confirm !== true || typeof v.expectUsd !== "number") throw new Error("paid generation needs the Generate button and a confirmation");
      const use = v.use ?? loadConfig().tts.use;
      const r = await voiceJob(`generating ${v.ad} with ${use}`, async () => {
        const lines = linesArg(v.ad, v.part);
        const dry = await runVoice(["generate", v.ad, "--profile", use, "--lines", lines, "--dry-run"]);
        if (dry.previewOnly) throw new Error("that's the Mac preview voice: use \"Preview with Mac voice\"");
        if (dry.todo === 0) return dry;
        if (dry.est > v.expectUsd! + 0.005) throw new Error(`the price changed (now ~$${dry.est.toFixed(2)}): press Preview cost again`);
        if (dry.cap <= 0 || dry.spent + dry.est > dry.cap) throw new Error(`Not allowed: $${dry.spent.toFixed(2)} spent + ~$${dry.est.toFixed(2)} is over your $${dry.cap.toFixed(2)} limit. Raise the limit first.`);
        if (dry.keyName && !dry.keyExists) throw new Error(`the ${dry.provider} key isn't set up (AWS SSM ${dry.keyName})`);
        return runVoice(["generate", v.ad, "--profile", use, "--lines", lines, "--yes"]);
      });
      return send(res, 200, { result: r, sample: sampleFor(v.ad, "tts", use, v.part) });
    }
    return send(res, 404, { error: "not found" });
  } catch (e) {
    return send(res, 400, { error: (e as Error).message });
  }
});

server.listen(PORT, LAN ? "0.0.0.0" : "127.0.0.1", () => {
  console.log(`curate-motion library: http://127.0.0.1:${PORT}  (${LAN ? "also on this Wi-Fi, key-protected" : "localhost only"}; Ctrl-C to stop)${PUSH ? "" : "  [--no-push: new assets stay local]"}`);
  if (LAN) console.log(`  --lan: phones on the same Wi-Fi can open it WITH the per-run key. Open the page on this Mac › Voice › "Open on your phone" for the link (the key is not printed here).`);
});
