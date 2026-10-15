// The inspo board's operations, shared by tools/inspo (CLI) and tools/library-ui (the Inspo tab).
// An entry is inspo/<id>.md (schemas/inspo.ts). Its media goes into the library as kind
// `reference` (licence "Third-party content, reference only", never shipped) through the same
// addAsset as tools/catalog, so it is hashed, catalogued and uploaded to S3 like any asset.
// `breakdown` uses free local tools only (ffprobe / ffmpeg): no paid calls, no uploads but the sheet.
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { extname, join } from "node:path";
import { INSPO_KINDS, InspoMeta } from "../../schemas/inspo.ts";
import { findInspo, kebab, loadInspo, writeInspoFile, writeInspoIndex, type Inspo } from "./boards.ts";
import { addAsset, loadIndex, replaceAsset, type IndexEntry } from "./catalog.ts";
import { LIB, today } from "./core.ts";

type Rec = Record<string, unknown>;
const uniq = <T>(a: T[]) => [...new Set(a)];
const isUrl = (s: string) => /^https?:\/\//i.test(s);
const VIDEO = new Set([".mp4", ".mov", ".m4v", ".webm"]);
const IMAGE = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".heic"]);
const AUDIO = new Set([".mp3", ".wav", ".m4a", ".aac"]);

export type AddInspoInput = {
  /** A media file (copied into library/references/ as a reference asset) and/or a URL. */
  file?: string;
  url?: string;
  /** An existing reference asset instead of a file. */
  asset?: string;
  title: string;
  kind?: string;
  /** Where it's from (the id's second segment): creator, competitor, founder, tiktok, curate… Default: from the URL's site, else "founder". */
  source?: string;
  name?: string;
  love?: string[];
  tags?: string[];
  useFor?: string[];
  techniques?: { transitions?: string[]; pacing?: string[]; type?: string[]; colour?: string[]; other?: string[] };
  links?: { label: string; url: string }[];
  /** Who sent it / how it reached us. */
  sourceNote?: string;
  notes?: string;
  by: string;
  push?: boolean;
};

const siteOf = (url: string) => {
  try {
    const h = new URL(url).hostname.replace(/^www\./, "").split(".");
    return kebab(h.length > 1 ? h[h.length - 2] : h[0]) || "web";
  } catch {
    return "web";
  }
};

const nextInspoVersion = (source: string, name: string) => {
  let v = 1;
  const taken = new Set(loadInspo().ok.map((x) => x.meta.id));
  while (taken.has(`inspo.${source}.${name}.v${v}`)) v++;
  return v;
};

/** Add one inspiration. Media → reference asset (S3, never shipped); the entry → inspo/<id>.md. */
export const addInspo = (inp: AddInspoInput): Inspo => {
  if (!inp.title?.trim()) throw new Error("an inspo needs a --title");
  if (!inp.file && !inp.url && !inp.asset) throw new Error("give a file, a link, or both");
  if (inp.url && !isUrl(inp.url)) throw new Error(`not a link: ${inp.url}`);
  const source = kebab(inp.source || (inp.url ? siteOf(inp.url) : "founder")) || "founder";
  const name = kebab(inp.name || inp.title);
  const v = nextInspoVersion(source, name);
  const id = `inspo.${source}.${name}.v${v}`;
  const ext = inp.file ? extname(inp.file).toLowerCase() : "";
  const kind = inp.kind ?? (inp.file ? (VIDEO.has(ext) ? "video" : IMAGE.has(ext) ? "image" : AUDIO.has(ext) ? "audio" : "other") : "link");
  if (!(INSPO_KINDS as readonly string[]).includes(kind)) throw new Error(`--kind must be one of ${INSPO_KINDS.join(", ")}`);
  let asset = inp.asset;
  if (asset) {
    const e = loadIndex().assets.find((a) => a.id === asset);
    if (!e) throw new Error(`no asset ${asset}`);
    if (e.kind !== "reference") throw new Error(`${asset} is a ${e.kind}; inspo media must be a reference asset`);
  }
  const willAsset = inp.file ? `reference.${source}.${name}.v${v}` : asset;
  if (inp.file) {
    if (!existsSync(inp.file)) throw new Error(`no such file: ${inp.file}`);
    if (loadIndex().assets.some((a) => a.id === willAsset)) throw new Error(`${willAsset} is already in the library; give this one another --name`);
  }
  // check the entry before any media is copied, so a bad field leaves nothing behind
  const draft = entryMeta(inp, { id, kind, asset: willAsset });
  const ok = InspoMeta.safeParse(draft);
  if (!ok.success) throw new Error(ok.error.issues.map((i) => `${i.path.join(".") || "inspo"}: ${i.message}`).join("; "));
  if (inp.file) {
    const r = addAsset({
      file: inp.file,
      kind: "reference",
      id: `reference.${source}.${name}.v${v}`,
      title: inp.title.trim(),
      licence: "reference",
      tags: ["inspo", ...(inp.tags ?? [])],
      fields: inp.love?.length ? { notes: `What we love: ${inp.love.join("; ")}` } : {},
      source: { type: "original", ...(inp.url ? { url: inp.url } : {}), ...(inp.sourceNote ? { author: inp.sourceNote } : {}) },
      by: inp.by,
      byType: inp.by === "founder" ? "human" : "agent",
      push: inp.push,
    });
    asset = r.id;
  }
  const meta = entryMeta(inp, { id, kind, asset });
  const body = inp.notes?.trim() ? `${inp.notes.trim()}\n` : "Notes: what to steal, what to avoid, where it fits. Run `tools/inspo breakdown " + id + "` for the technical breakdown.\n";
  const x = writeInspoFile(meta, body, { create: true });
  writeInspoIndex();
  return x;
};

const entryMeta = (inp: AddInspoInput, o: { id: string; kind: string; asset?: string }): Rec => ({
    id: o.id,
    title: inp.title.trim(),
    kind: o.kind,
    status: "active",
    url: inp.url,
    asset: o.asset,
    source: inp.sourceNote,
    addedBy: inp.by,
    addedAt: today(),
    love: (inp.love ?? []).map((s) => s.trim()).filter(Boolean),
    techniques: { transitions: [], pacing: [], type: [], colour: [], other: [], ...(inp.techniques ?? {}) },
    useFor: uniq(inp.useFor ?? []),
    tags: uniq((inp.tags ?? []).map((t) => t.trim().toLowerCase().replace("=", ":")).filter(Boolean)),
    links: inp.links ?? [],
  });

export const archiveInspo = (id: string, o: { unarchive?: boolean } = {}) => {
  const x = findInspo(id);
  const w = writeInspoFile({ ...x.meta, status: o.unarchive ? "active" : "archived" }, x.body);
  writeInspoIndex();
  return { id, status: w.meta.status };
};

/** Edit the curated fields (love, techniques, useFor, tags, title, links). Media is never changed here. */
export const editInspo = (id: string, patch: Partial<Pick<InspoMeta, "title" | "love" | "useFor" | "tags" | "links" | "url">> & { techniques?: Partial<Record<string, string[]>>; notes?: string }) => {
  const x = findInspo(id);
  const meta: Rec = { ...x.meta, ...Object.fromEntries(Object.entries(patch).filter(([k, v]) => v !== undefined && k !== "techniques" && k !== "notes")) };
  if (patch.techniques) meta.techniques = { ...(x.meta.techniques as Rec), ...patch.techniques };
  const w = writeInspoFile(meta, patch.notes !== undefined ? replaceNotes(x.body, patch.notes) : x.body);
  writeInspoIndex();
  return w;
};
const START = "<!-- breakdown:start";
const END = "<!-- breakdown:end -->";
const replaceNotes = (body: string, notes: string) => {
  const i = body.indexOf(START);
  return i < 0 ? `${notes.trim()}\n` : `${notes.trim()}\n\n${body.slice(i)}`;
};

export type InspoQuery = { text?: string; tags?: string[]; kind?: string; status?: string; useFor?: string; technique?: string };
export const searchInspo = (q: InspoQuery): Inspo[] => {
  const { ok, errors } = loadInspo();
  if (errors.length) throw new Error(errors.join("\n"));
  const words = (q.text ?? "").toLowerCase().split(/\s+/).filter(Boolean);
  const status = q.status ?? "active";
  return ok.filter(({ meta: m, body }) => {
    if (status !== "all" && m.status !== status) return false;
    if (q.kind && m.kind !== q.kind) return false;
    for (const t of q.tags ?? []) if (!m.tags.includes(t.toLowerCase())) return false;
    if (q.useFor && !m.useFor.some((u) => u === q.useFor || u.endsWith(`:${q.useFor}`))) return false;
    const tech = Object.values(m.techniques as Record<string, string[]>).flat().join(" ").toLowerCase();
    if (q.technique && !tech.includes(q.technique.toLowerCase())) return false;
    if (words.length) {
      const hay = `${m.id} ${m.title} ${m.love.join(" ")} ${tech} ${m.useFor.join(" ")} ${m.tags.join(" ")} ${body}`.toLowerCase();
      if (!words.every((w) => hay.includes(w))) return false;
    }
    return true;
  });
};

// ---------------------------------------------------------------- breakdown (free, local)

const run = (bin: string, a: string[]) => execFileSync(bin, a, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 1 << 26 });
const stderrOf = (a: string[]) => {
  // ffmpeg writes its analysis to stderr and exits 0: capture stderr either way
  const r = execFileSync("sh", ["-c", 'ffmpeg "$@" 2>&1 >/dev/null', "sh", ...a], { encoding: "utf8", maxBuffer: 1 << 27 });
  return r;
};
const fmt = (n: number) => (Math.round(n * 100) / 100).toFixed(2);
const hex = (b: Buffer) => [...Array(Math.floor(b.length / 3)).keys()].map((i) => `#${[b[i * 3], b[i * 3 + 1], b[i * 3 + 2]].map((x) => x.toString(16).padStart(2, "0")).join("")}`.toUpperCase());

/** Six rough colours (a 3×2 area-average of the frame or sheet). */
const palette = (file: string) => {
  try {
    const raw = execFileSync("ffmpeg", ["-v", "error", "-i", file, "-frames:v", "1", "-vf", "scale=3:2:flags=area", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], { maxBuffer: 1 << 20 });
    return uniq(hex(raw));
  } catch {
    return [];
  }
};

/** The average colour of the frame at six moments (1/7 … 6/7 of the way through): the grade at a glance. */
const moments = (file: string, duration: number) => {
  const out: string[] = [];
  for (let k = 1; k <= 6; k++) {
    try {
      const raw = execFileSync("ffmpeg", ["-v", "error", "-ss", String((duration * k) / 7), "-i", file, "-frames:v", "1", "-vf", "scale=1:1:flags=area", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], { maxBuffer: 1 << 16 });
      out.push(...hex(raw));
    } catch {
      /* skip that moment */
    }
  }
  return out;
};

type Probe = { duration: number; w?: number; h?: number; fps?: number; vcodec?: string; audio?: { codec: string; channels: number; rate: number } };
const ffprobe = (file: string): Probe => {
  const j = JSON.parse(run("ffprobe", ["-v", "error", "-show_entries", "format=duration:stream=codec_type,codec_name,width,height,r_frame_rate,channels,sample_rate", "-of", "json", file])) as { format: { duration?: string }; streams: { codec_type: string; codec_name: string; width?: number; height?: number; r_frame_rate?: string; channels?: number; sample_rate?: string }[] };
  const v = j.streams.find((s) => s.codec_type === "video");
  const a = j.streams.find((s) => s.codec_type === "audio");
  const [n, d] = (v?.r_frame_rate ?? "0/1").split("/").map(Number);
  return { duration: Number(j.format.duration ?? 0), w: v?.width, h: v?.height, fps: v && d ? Math.round((n / d) * 100) / 100 : undefined, vcodec: v?.codec_name, audio: a ? { codec: a.codec_name, channels: a.channels ?? 0, rate: Number(a.sample_rate ?? 0) } : undefined };
};
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
const aspect = (w?: number, h?: number) => (w && h ? `${w / gcd(w, h)}:${h / gcd(w, h)}` : "?");

export type BreakdownResult = { id: string; kind: string; facts: string[]; cuts: number[]; sheet: string | null; sheetAsset: string | null };

/**
 * Write (or rewrite) the entry's "Breakdown" section from the media, with free local tools:
 * ffprobe facts, hard cuts (ffmpeg scene detection), loudness (EBU R128), a contact sheet and a rough
 * palette. The contact sheet is media, so it becomes a derived reference asset
 * (reference.<source>.<name>-sheet.vN) unless the media asset already has frame images (reused).
 */
export const breakdownInspo = (id: string, o: { by: string; sheet?: boolean; push?: boolean; threshold?: number }): BreakdownResult => {
  const x = findInspo(id);
  if (!x.meta.asset) throw new Error(`${id} is a link with no media. Save the video or image and add it (tools/inspo add <file> --url ${x.meta.url ?? "…"}), then run breakdown on the new entry.`);
  const idx = loadIndex().assets;
  const e = idx.find((a) => a.id === x.meta.asset) as IndexEntry | undefined;
  if (!e) throw new Error(`asset ${x.meta.asset} is not in the catalog`);
  const orig = e.files.find((f) => f.role === "original") ?? e.files[0];
  const file = join(LIB, orig.path);
  if (!existsSync(file)) throw new Error(`library/${orig.path} is not on disk. Run: tools/sync pull --only '${orig.path}'`);
  const mime = orig.mime ?? "";
  const facts: string[] = [];
  let cuts: number[] = [];
  let sheetRel: string | null = null;
  let sheetAsset: string | null = null;
  // existing frame images, contact sheets first (a spectrogram or a strip is a poor cover)
  const rank = (p: string) => (/sheet/.test(p) ? 0 : /spectro|wave|audio/.test(p) ? 2 : 1);
  const frames = e.files.filter((f) => f.role === "frame" && (f.mime ?? "").startsWith("image/")).sort((a, b) => rank(a.path) - rank(b.path) || a.path.localeCompare(b.path));
  const tmp = mkdtempSync(join(tmpdir(), "curate-inspo-"));
  try {
    if (mime.startsWith("video/") || mime.startsWith("audio/")) {
      const p = ffprobe(file);
      facts.push(`**Length:** ${fmt(p.duration)} s${p.fps ? ` · ${p.fps} fps (${Math.round(p.duration * p.fps)} frames)` : ""}`);
      if (p.w) facts.push(`**Frame:** ${p.w}×${p.h} (${aspect(p.w, p.h)}${p.h! > p.w ? ", vertical" : p.h === p.w ? ", square" : ", horizontal"}) · ${p.vcodec}`);
      if (p.audio) {
        const loud = /I:\s+(-?[\d.]+) LUFS/.exec(stderrOf(["-hide_banner", "-nostats", "-i", file, "-vn", "-af", "ebur128=framelog=quiet", "-f", "null", "-"]))?.[1];
        facts.push(`**Audio:** ${p.audio.codec}, ${p.audio.channels === 1 ? "mono" : p.audio.channels === 2 ? "stereo" : `${p.audio.channels} ch`}, ${p.audio.rate / 1000} kHz${loud ? ` · ${loud} LUFS integrated` : ""}`);
      } else if (p.w) facts.push("**Audio:** none");
      if (p.w) {
        const th = o.threshold ?? 0.3;
        const log = stderrOf(["-hide_banner", "-nostats", "-i", file, "-an", "-vf", `select='gt(scene,${th})',showinfo`, "-f", "null", "-"]);
        cuts = [...log.matchAll(/pts_time:([\d.]+)/g)].map((m) => Math.round(Number(m[1]) * 100) / 100);
        const bounds = [0, ...cuts, p.duration];
        const shots = bounds.slice(1).map((b, i) => b - bounds[i]).filter((s) => s > 0.04);
        facts.push(`**Cuts:** ${cuts.length} hard cut${cuts.length === 1 ? "" : "s"} (scene change > ${th})${cuts.length ? ` at ${cuts.map((c) => `${fmt(c)} s`).join(", ")}` : ""}`);
        if (shots.length) facts.push(`**Shots:** ${shots.length} · average ${fmt(shots.reduce((s, x) => s + x, 0) / shots.length)} s · shortest ${fmt(Math.min(...shots))} s · longest ${fmt(Math.max(...shots))} s · ${fmt((cuts.length / Math.max(p.duration, 0.01)) * 10)} cuts per 10 s`);
        facts.push(`**Hook window:** ${cuts.filter((c) => c < 3).length} cut(s) in the first 3 s${cuts.length ? `; first cut at ${fmt(cuts[0])} s` : ""}`);
        // contact sheet: 24 tiles across the whole video
        if (frames.length && !o.sheet) {
          sheetRel = frames[0].path;
          facts.push(`**Frames:** ${frames.length} image(s) already with the asset (contact sheets): ${frames.map((f) => `\`${f.path.split("/").pop()}\``).join(", ")}`);
        } else {
          const step = p.duration / 24;
          const out = join(tmp, `${(x.meta.asset.split(".")[2] ?? "inspo")}-sheet.jpg`);
          run("ffmpeg", ["-v", "error", "-y", "-i", file, "-vf", `fps=${24 / Math.max(p.duration, 0.1)},scale=320:-2,tile=6x4:padding=6:margin=6:color=white`, "-frames:v", "1", "-q:v", "3", out]);
          const [, src, name] = x.meta.asset.split(".");
          // a re-run makes the next version of the sheet (never overwrite a file)
          const prev = idx.filter((a) => a.id.startsWith(`reference.${src}.${name}-sheet.v`)).map((a) => a.id).sort((a, b) => Number(a.split(".v").pop()) - Number(b.split(".v").pop())).at(-1);
          const r = prev
            ? replaceAsset(prev, out, { by: o.by, push: o.push })
            : addAsset({ file: out, kind: "reference", scope: src, name: `${name}-sheet`, title: `${x.meta.title}: contact sheet`, licence: "reference", tags: ["inspo", "contact-sheet"], fields: { notes: `24 tiles, one every ${fmt(step)} s, left to right, top to bottom (tools/inspo breakdown).` }, source: { type: "derived", from: [x.meta.asset], tool: "tools/inspo breakdown (ffmpeg)" }, by: o.by, push: o.push });
          sheetAsset = r.id;
          sheetRel = r.files[0].replace(/^library\//, "");
          facts.push(`**Contact sheet:** 24 tiles, one every ${fmt(step)} s (\`${sheetAsset}\`)`);
        }
      }
      if (p.w) {
        const pal = moments(file, p.duration);
        if (pal.length) facts.push(`**Colour at six moments:** ${pal.join(" ")} (each frame's average, 1/7 … 6/7 through)`);
      }
    } else if (mime.startsWith("image/")) {
      const p = ffprobe(file);
      facts.push(`**Image:** ${p.w}×${p.h} (${aspect(p.w, p.h)})`);
      const pal = palette(file);
      if (pal.length) facts.push(`**Rough palette:** ${pal.join(" ")}`);
      sheetRel = orig.path;
    } else throw new Error(`can't break down ${mime || "this file type"} yet`);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
  const t = x.meta.techniques as Record<string, string[]>;
  const blank = ["transitions", "pacing", "type", "colour"].filter((k) => !t[k]?.length);
  const section = [
    `${START} (written by tools/inspo breakdown on ${today()}; re-running replaces this section) -->`,
    "## Breakdown",
    "",
    ...facts.map((f) => `- ${f}`),
    ...(sheetRel ? ["", `![contact sheet](../library/${sheetRel})`] : []),
    ...(blank.length ? ["", `By eye still to do: ${blank.join(", ")} (\`tools/inspo edit ${id} --transition … --pacing … --type … --colour …\`).`] : []),
    END,
  ].join("\n");
  const i = x.body.indexOf(START);
  const j = x.body.indexOf(END);
  const body = i >= 0 && j > i ? `${x.body.slice(0, i)}${section}${x.body.slice(j + END.length)}` : `${x.body.trimEnd()}\n\n${section}\n`;
  writeInspoFile(x.meta as unknown as Rec, body);
  writeInspoIndex();
  return { id, kind: x.meta.kind, facts, cuts, sheet: sheetRel, sheetAsset };
};

export { isUrl };
