// Shared helpers for tools/*.ts (Node >= 23.6 runs these .ts files directly).
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const LIB = join(ROOT, "library");
export const CATALOG = join(ROOT, "catalog");
export const INDEX_PATH = join(CATALOG, "index.json");

/** The one bucket. Override with CURATE_MOTION_BUCKET for a test bucket. */
export const BUCKET = process.env.CURATE_MOTION_BUCKET ?? "curate-motion-library-276451918677";
export const REGION = process.env.CURATE_MOTION_REGION ?? "us-east-1";
/** library/<path> locally  <->  s3://BUCKET/library/<path> */
export const s3KeyFor = (libPath: string) => `library/${libPath}`;

export const readJson = <T = unknown>(p: string): T => JSON.parse(readFileSync(p, "utf8")) as T;
export const writeJson = (p: string, v: unknown) => {
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, JSON.stringify(v, null, 2) + "\n");
};

export const sha256File = (p: string) => createHash("sha256").update(readFileSync(p)).digest("hex");

/** Tree hash of a frame folder: sha256 over "<sha256>  <name>\n" lines sorted by name. */
export const treeSha = (dir: string) => {
  const names = readdirSync(dir).filter((n) => !n.startsWith(".")).sort();
  const h = createHash("sha256");
  let bytes = 0;
  for (const n of names) {
    const p = join(dir, n);
    bytes += statSync(p).size;
    h.update(`${sha256File(p)}  ${n}\n`);
  }
  return { sha256: h.digest("hex"), count: names.length, bytes };
};

/** Every library/**\/manifest.json, as paths relative to ROOT. */
export const findManifests = (): string[] => {
  const out: string[] = [];
  const walk = (d: string) => {
    if (!existsSync(d)) return;
    for (const n of readdirSync(d)) {
      if (n.startsWith(".") || n === "node_modules") continue;
      const p = join(d, n);
      const st = statSync(p);
      if (st.isDirectory()) walk(p);
      else if (n === "manifest.json") out.push(relative(ROOT, p).split(sep).join("/"));
    }
  };
  walk(LIB);
  return out.sort();
};

export const findAds = (): string[] =>
  readdirSync(join(ROOT, "ads"))
    .filter((n) => !n.startsWith("_") && existsSync(join(ROOT, "ads", n, "ad.json")))
    .sort()
    .map((n) => `ads/${n}/ad.json`);

export const findAccounts = (): string[] => {
  const d = join(LIB, "people");
  if (!existsSync(d)) return [];
  return readdirSync(d)
    .filter((n) => existsSync(join(d, n, "account.json")))
    .map((n) => `library/people/${n}/account.json`);
};

/** Run the aws cli (never through a shell). Returns stdout, or null on a non-zero exit when `soft`. */
export const aws = (args: string[], soft = false): string | null => {
  try {
    return execFileSync("aws", [...args, "--region", REGION], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 1 << 28 });
  } catch (e) {
    if (soft) return null;
    const err = e as { stderr?: string };
    throw new Error(`aws ${args.slice(0, 2).join(" ")} failed: ${(err.stderr ?? String(e)).trim().split("\n").slice(-2).join(" ")}`);
  }
};

/** Mime + pixel/duration facts about a media file, via sips (images) and ffprobe (audio/video). */
export const probe = (p: string): { mime?: string; w?: number; h?: number; durationSec?: number; fps?: number } => {
  const ext = p.split(".").pop()!.toLowerCase();
  const MIME: Record<string, string> = {
    jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif",
    mp4: "video/mp4", mov: "video/quicktime", mp3: "audio/mpeg", wav: "audio/wav", m4a: "audio/mp4",
    ttf: "font/ttf", otf: "font/otf", woff2: "font/woff2", json: "application/json", pdf: "application/pdf",
    glb: "model/gltf-binary", hdr: "image/vnd.radiance", txt: "text/plain", rtf: "application/rtf",
  };
  const mime = MIME[ext];
  const quiet = { encoding: "utf8" as const, stdio: ["ignore", "pipe", "ignore"] as ["ignore", "pipe", "ignore"] };
  if (mime?.startsWith("image/")) {
    try {
      const o = execFileSync("sips", ["-g", "pixelWidth", "-g", "pixelHeight", p], quiet);
      const w = Number(/pixelWidth: (\d+)/.exec(o)?.[1]);
      const h = Number(/pixelHeight: (\d+)/.exec(o)?.[1]);
      if (w && h) return { mime, w, h };
    } catch {
      /* not macOS, or sips can't read it: try ffprobe */
    }
    try {
      const o = execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", p], quiet);
      const [w, h] = o.trim().split("\n")[0].split(",").map(Number);
      if (w && h) return { mime, w, h };
    } catch {
      /* unknown */
    }
    return { mime };
  }
  if (mime?.startsWith("video/") || mime?.startsWith("audio/")) {
    const o = execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration:stream=width,height,r_frame_rate,codec_type", "-of", "json", p], quiet);
    const j = JSON.parse(o) as { format: { duration: string }; streams: { codec_type: string; width?: number; height?: number; r_frame_rate?: string }[] };
    const v = j.streams.find((s) => s.codec_type === "video");
    const [a, b] = (v?.r_frame_rate ?? "0/1").split("/").map(Number);
    return { mime, durationSec: Math.round(Number(j.format.duration) * 1000) / 1000, w: v?.width, h: v?.height, fps: v && b ? Math.round((a / b) * 100) / 100 : undefined };
  }
  return { mime };
};

export const today = () => new Date().toISOString().slice(0, 10);

/** Tiny argv parser: --flag value, --flag (true), repeated flags become arrays; positionals in _. */
export const parseArgs = (argv: string[]) => {
  const out: Record<string, string | boolean | string[]> & { _: string[] } = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) {
      out._.push(a);
      continue;
    }
    const [k, inline] = a.slice(2).split(/=(.*)/s, 2);
    const v = inline ?? (argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true);
    const prev = out[k];
    if (prev === undefined) out[k] = v as string | boolean;
    else out[k] = ([] as string[]).concat(prev as string | string[], String(v));
  }
  return out;
};

export const list = (v: unknown): string[] => (v === undefined || v === false ? [] : ([] as string[]).concat(v as string | string[]).map(String));
