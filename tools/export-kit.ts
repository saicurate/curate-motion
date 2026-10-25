#!/usr/bin/env node
// tools/export-kit: the hand-off kit, everything a video maker outside this repo needs besides the app
// recordings (those are tools/export-media --build N), as a plain, readable folder:
//
//   tools/export-kit            → ../app-media/README.md (the brief, from handoff/README.md)
//                                 ../app-media/kit/<section>/… + kit/CONTENTS.md
//   --out <dir>                 another parent folder (default: app-media next to this repo)
//   --dry-run                   say what it would write, write nothing
//
// Sections: brand (the library's marks, lockup, app icon, fonts and brand book, plus the SVGs in handoff/), people
// (the personas' photos, layers, faces, selfies, try-ons), closet (garment cut-outs, one per item: the newest
// approved version, else the newest), zee (the 12 moods from the Blender renders in research/zee-pack, at the
// largest size whose take is complete: ProRes 4444 with alpha, PNG frames, a still), music, stock, devices
// (Curate's own phone; never Apple's bezels, whose licence forbids passing the file on), look (the films to
// match). The library stays the master copy. Files are APFS clones; the Zee .mov files are encoded here, and
// only again when their source frames change. A re-run replaces only what an earlier run wrote (`.export.json`).
import { execFileSync } from "node:child_process";
import { constants, copyFileSync, existsSync, mkdirSync, readdirSync, rmdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, extname, join, resolve } from "node:path";
import { LIB, parseArgs, readJson, ROOT, today } from "./lib/core.ts";
import { loadIndex, type IndexEntry } from "./lib/catalog.ts";

const args = parseArgs(process.argv.slice(2));
const top = resolve(String(args.out ?? join(ROOT, "..", "app-media")));
const dest = join(top, "kit");
const dry = Boolean(args["dry-run"]);

type Licence = { name?: string; attribution?: string; restrictions?: string[] };
type Row = { section: string; file: string; title: string; status: string; licence: string; id?: string; from?: string; make?: (to: string) => void; note?: string };
const rows: Row[] = [];
const lic = (e: IndexEntry) => ((e.asset as { licence?: Licence }).licence ?? {}) as Licence;
const tag = (e: IndexEntry, key: string) => e.tags.find((t) => t.startsWith(`${key}:`))?.slice(key.length + 1);
const fileOf = (e: IndexEntry, role = "original") => e.files.find((f) => f.role === role);
const nameOf = (e: IndexEntry) => e.id.split(".")[2];
const scopeOf = (e: IndexEntry) => e.id.split(".")[1];
const live = loadIndex().assets.filter((e) => e.status !== "retired");
const add = (section: string, file: string, e: IndexEntry, role = "original", note?: string) => {
  const f = fileOf(e, role);
  if (!f) return;
  rows.push({ section, file: `${section}/${file}${extname(f.path)}`, title: e.title, status: e.status, licence: lic(e).name ?? e.licence ?? "", id: e.id, from: join(LIB, f.path), note });
};
const HANDOFF = join(ROOT, "handoff");

// ---------------------------------------------------------------- brand

const BRAND: Record<string, string> = {
  "brand.curate.logo-mark.v1": "curate-mark-256",
  "brand.curate.splash-mark.v1": "curate-mark-1152-padded",
  "brand.curate.logo-splash.v1": "curate-splash-logo",
  "brand.curate.brand-guideline-2026.v1": "curate-brand-guidelines-2026",
  "brand.curate.mark-2048.v1": "curate-mark-2048",
  "brand.curate.lockup.v1": "curate-lockup",
  "brand.curate.app-icon.v1": "app-icon-1024",
};
for (const e of live.filter((x) => x.kind === "brand" && BRAND[x.id])) add("brand", BRAND[e.id], e);
for (const e of live.filter((x) => x.kind === "font")) add("brand/fonts", `Geist-${nameOf(e).replace(/^geist-/, "").replace(/(^|-)(\w)/g, (_, d, c) => c.toUpperCase()).replace("Semibold", "SemiBold")}`, e);
const EXTRA: { file: string; from: string; title: string; status: string; licence: string }[] = [
  { file: "brand/curate-mark.svg", from: "brand/curate-mark.svg", title: "The mark, vector (ink)", status: "draft", licence: "Curate original" },
  { file: "brand/apple/download-on-the-app-store-black.svg", from: "apple/download-on-the-app-store-black.svg", title: "Apple's Download on the App Store badge (black, preferred)", status: "Apple's artwork", licence: "App Store Marketing Guidelines" },
];
for (const x of EXTRA) rows.push({ section: dirname(x.file), file: x.file, title: x.title, status: x.status, licence: x.licence, from: join(HANDOFF, x.from) });

// ---------------------------------------------------------------- people

for (const e of live.filter((x) => ["photo", "tryon", "face", "selfie"].includes(x.kind))) {
  const p = scopeOf(e);
  const n = nameOf(e);
  const layer = Boolean(tag(e, "layer"));
  if (e.kind === "tryon" || (e.kind === "photo" && /tryon/.test(n))) add(`people/${p}/try-ons${layer ? "/layers" : ""}`, n, e);
  else if (e.kind === "photo" && (layer || e.tags.includes("derived"))) add(`people/${p}/photos/layers`, n, e);
  else if (e.kind === "photo") add(`people/${p}/photos`, n, e);
  else add(`people/${p}/${e.kind}`, e.kind === "face" ? `face-${n}` : n, e);
}

// ---------------------------------------------------------------- closet: one file per item

const items = new Map<string, IndexEntry[]>();
for (const e of live.filter((x) => x.kind === "garment")) {
  const k = `${scopeOf(e)}.${nameOf(e)}`;
  items.set(k, [...(items.get(k) ?? []), e]);
}
const ver = (e: IndexEntry) => Number(e.id.split(".").pop()!.slice(1));
for (const [k, vs] of [...items].sort(([a], [b]) => a.localeCompare(b))) {
  const byNew = vs.sort((a, b) => ver(b) - ver(a));
  const e = byNew.find((x) => x.status === "approved") ?? byNew[0];
  const [p, n] = k.split(".");
  add(`closet/${p}`, n, e, "cutout");
  add(`closet/${p}/on-white`, n, e);
}

// ---------------------------------------------------------------- music, stock, devices

const credit = new Map<string, string>();
for (const e of live.filter((x) => x.kind === "music")) {
  add("music", nameOf(e), e);
  const len = (e.asset as { durationSec?: number }).durationSec;
  const bpm = tag(e, "bpm");
  rows[rows.length - 1].title = [e.title, bpm && `${bpm} BPM`, len && `${Math.floor(len / 60)}:${String(Math.round(len % 60)).padStart(2, "0")}`].filter(Boolean).join(" · ");
  credit.set(e.id, lic(e).attribution ?? "");
}
for (const e of live.filter((x) => x.kind === "stock")) add(`stock/${scopeOf(e)}`, nameOf(e), e);
for (const e of live.filter((x) => x.kind === "device" && scopeOf(x) === "curate")) add("devices", `curate-${nameOf(e)}`, e);

// ---------------------------------------------------------------- zee: the Blender renders, largest complete size

const ZEE = join(homedir(), "Desktop/Curate/research/zee-pack/zee-v2/sharp");
const SIZES = [1080, 720];
const PARTS = ["intro", "loop", "outro"] as const;
const pngs = (d: string) => (existsSync(d) ? readdirSync(d).filter((f) => f.endsWith(".png")).sort() : []);
const complete = (take: string, size: number) => {
  const dir = join(ZEE, `frames-${size}-f18cL-v2`, take, "a");
  const rj = join(dir, "render.json");
  if (!existsSync(rj)) return null;
  const r = readJson<Record<string, { frames: number }>>(rj);
  return PARTS.every((p) => r[p] && pngs(join(dir, p)).length === r[p].frames) ? dir : null;
};
const takes = existsSync(join(ZEE, "frames-720-f18cL-v2")) ? readdirSync(join(ZEE, "frames-720-f18cL-v2")).filter((t) => !t.startsWith(".")).sort() : [];
const zeeSize: Record<string, number> = {};
const zeeSrcPath = join(dest, "zee", ".source.json");
const zeeBefore: Record<string, number> = existsSync(zeeSrcPath) ? readJson(zeeSrcPath) : {};
for (const take of takes) {
  const size = SIZES.find((s) => complete(take, s));
  if (!size) continue;
  zeeSize[take] = size;
  const dir = complete(take, size)!;
  const title = (p: string) => `Zee, ${take}: ${p} (${size} × ${size}, 30 fps, transparent)`;
  const z: Omit<Row, "file" | "title"> = { section: `zee/${take}`, status: "approved (the 384 px app pack); this size: draft", licence: "Curate original (Curate's character)" };
  for (const part of PARTS) {
    const frames = join(dir, part);
    rows.push({
      ...z, file: `zee/${take}/${take}-${part}.mov`, title: title(part),
      make: (to) => {
        if (existsSync(to) && zeeBefore[take] === size) return;
        execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-framerate", "30", "-start_number", "1", "-i", join(frames, "%04d.png"), "-c:v", "prores_ks", "-profile:v", "4444", "-pix_fmt", "yuva444p10le", "-alpha_bits", "16", "-vendor", "apl0", to]);
      },
    });
    for (const f of pngs(frames)) rows.push({ ...z, file: `zee/${take}/frames/${part}/${f}`, title: "", from: join(frames, f) });
  }
  rows.push({ ...z, file: `zee/${take}/${take}-still.png`, title: `Zee, ${take}: still (${size} px)`, from: join(dir, "loop", "0001.png") });
}

// ---------------------------------------------------------------- look: the films to match

const R = join(ROOT, "renders");
const PREV = join(homedir(), "Desktop/Curate/research/app-store-previews/store");
const LOOK: { file: string; from: string; title: string; status: string }[] = [
  { file: "header-film_3840x1646.mp4", from: join(R, "app-store-header-all/master/30s/app-store-header-all-one_master_store-header_30s_v1.mp4"), title: "THE LOOK TO MATCH: the App Store header film, 30 s loop (founder: \"perfect the header video is soo good\")", status: "approved" },
  { file: "header-film_search-card_3x2.mp4", from: join(R, "app-store-header-all/master/30s/app-store-header-all-one_master_store-search_30s_v1.mp4"), title: "The header film as the App Store search card (3:2)", status: "approved" },
  ...[1, 2, 3].map((n) => ({ file: `app-store-preview-${n}.mp4`, from: join(PREV, `curate-preview-hybrid-${n}.mp4`), title: `App Store preview ${n}, submitted with 1.7.0 (the real app in Apple's frame, as previews must be)`, status: "submitted" })),
  { file: "ad_pop-out-v4.mp4", from: join(R, "pop-out-v4/tiktok/15s/pop-out-v4_tiktok_9x16_15s_v6.mp4"), title: "Ad draft: Pop out v4 (the real scan in Apple's frame; kept, not the template)", status: "draft" },
  { file: "ad_rain-or-shine.mp4", from: join(R, "rain-or-shine-v2/tiktok/15s/rain-or-shine-v2_tiktok_9x16_15s_v1.mp4"), title: "Ad draft: Rain or shine (the app redrawn; rough cut, music only)", status: "draft" },
  { file: "ad_ask-zee.mp4", from: join(R, "ask-zee/tiktok/15s/ask-zee_tiktok_9x16_15s_v1.mp4"), title: "Ad draft: Ask Zee (the app redrawn; rough cut; says \"wardrobe\", now Closet)", status: "draft" },
  { file: "ad_see-it-on-you.mp4", from: join(R, "see-it-on-you/tiktok/15s/see-it-on-you_tiktok_9x16_15s_v1.mp4"), title: "Ad draft: See it on you (the app redrawn; rough cut; says \"wardrobe\", now Closet)", status: "draft" },
];
for (const x of LOOK) rows.push({ section: "look", file: `look/${x.file}`, title: x.title, status: x.status, licence: "Curate original", from: x.from });

// ---------------------------------------------------------------- CONTENTS.md

const missing = rows.filter((r) => r.from && !existsSync(r.from));
const ok = rows.filter((r) => !missing.includes(r));
const mb = (b: number) => (b > 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1e3))} KB`);
const sizeOf = (r: Row) => (r.from && existsSync(r.from) ? mb(statSync(r.from).size) : "");
const SECTIONS: [string, string][] = [
  ["brand", "Brand: the mark, the lockup, the app icon, the brand book, Geist, Apple's badge"],
  ["people", "People: the personas (AI-generated: platforms need the AI label)"],
  ["closet", "Closet: their clothes as transparent cut-outs (one file per item), and on white"],
  ["zee", "Zee: 12 moods, each an intro, a seamless loop and an outro"],
  ["music", "Music"],
  ["stock", "Stock photos and grounds"],
  ["devices", "Devices: Curate's own phone (Apple's iPhone frames: download from Apple, see README)"],
  ["look", "Look: the films to match"],
];
const lines = [
  "# Curate kit: contents",
  "",
  `Every file in the kit, made ${today()} by \`tools/export-kit\` from curate-motion's library (the master copy: ` +
    "don't edit here, ask for a re-run). Read `../README.md` first: what Curate is, the look, the rules.",
  "",
  "- **Status:** `approved` = fine in an ad that runs; `draft` = fine for drafts and pitches until the founder approves.",
  "",
];
for (const [s, head] of SECTIONS) {
  const rs = ok.filter((r) => r.section === s || r.section.startsWith(`${s}/`));
  if (!rs.length) continue;
  lines.push(`## ${head}`, "");
  if (s === "zee") {
    lines.push("| Mood | Files | Size | Status |", "|---|---|---|---|");
    for (const t of Object.keys(zeeSize)) {
      const n = rs.filter((r) => r.section === `zee/${t}` && r.file.includes("/frames/")).length;
      lines.push(`| ${t} | [${t}-intro.mov](zee/${t}/${t}-intro.mov) · [loop](zee/${t}/${t}-loop.mov) · [outro](zee/${t}/${t}-outro.mov) · [still](zee/${t}/${t}-still.png) · \`frames/\` (${n} PNGs) | ${zeeSize[t]} × ${zeeSize[t]} | draft at this size (the app's 384 px pack is approved) |`);
    }
    lines.push("", "`.mov` = ProRes 4444 with alpha (Final Cut, Premiere, DaVinci, After Effects); `frames/` = the same frames as PNGs with alpha, for anything else. 30 fps. Play the intro, repeat the loop, end on the outro. Licence: Curate original.", "");
    continue;
  }
  lines.push("| File | What it is | Size | Status | Licence | Library id |", "|---|---|---|---|---|---|");
  for (const r of rs.sort((a, b) => a.file.localeCompare(b.file))) {
    const cr = r.id && credit.get(r.id) ? ` · credit: ${credit.get(r.id)}` : "";
    lines.push(`| [${r.file.slice(s.length + 1)}](${r.file}) | ${r.title.replace(/\|/g, "/")} | ${sizeOf(r)} | ${r.status} | ${(r.licence + cr).replace(/\|/g, "/")} | ${r.id ? `\`${r.id}\`` : "handoff/"} |`);
  }
  lines.push("");
}
if (missing.length) {
  lines.push("## Not on this Mac yet", "", "Listed but not found: `tools/sync pull` (library) or re-render, then re-run.", "");
  for (const r of missing) lines.push(`- \`${r.file}\`${r.id ? ` (\`${r.id}\`)` : ""}`);
  lines.push("");
}

// ---------------------------------------------------------------- write

const ledgerPath = join(dest, ".export.json");
const before: string[] = existsSync(ledgerPath) ? readJson<{ files: string[] }>(ledgerPath).files : [];
const now = ok.map((r) => r.file);
const stale = before.filter((f) => !now.includes(f));
for (const r of ok.filter((x) => !x.file.includes("/frames/"))) console.log(`${dry ? "would write" : "write"}  ${r.file}`);
console.log(`${dry ? "would write" : "write"}  zee/*/frames/: ${ok.filter((x) => x.file.includes("/frames/")).length} PNGs`);
for (const f of stale) console.log(`${dry ? "would remove" : "remove"}  ${f}`);
for (const r of missing) console.log(`skip  ${r.file}  (not found: ${r.from})`);

if (!dry) {
  for (const f of stale) {
    rmSync(join(dest, f), { force: true });
    let d = dirname(join(dest, f));
    while (d.startsWith(dest) && d !== dest && existsSync(d) && readdirSync(d).length === 0) {
      rmdirSync(d);
      d = dirname(d);
    }
  }
  for (const r of ok) {
    const to = join(dest, r.file);
    mkdirSync(dirname(to), { recursive: true });
    if (r.make) r.make(to);
    else {
      rmSync(to, { force: true });
      copyFileSync(r.from!, to, constants.COPYFILE_FICLONE);
    }
  }
  writeFileSync(join(dest, "CONTENTS.md"), lines.join("\n"));
  writeFileSync(zeeSrcPath, JSON.stringify(zeeSize, null, 2) + "\n");
  writeFileSync(ledgerPath, JSON.stringify({ at: today(), files: now }, null, 2) + "\n");
  copyFileSync(join(HANDOFF, "README.md"), join(top, "README.md"));
}
console.log(`\n${dry ? "would export" : "exported"} ${ok.length} files to ${dest}${missing.length ? `; ${missing.length} not found` : ""}; Zee: ${Object.entries(zeeSize).map(([t, s]) => `${t} ${s}`).join(", ") || "none"}`);
