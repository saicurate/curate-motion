#!/usr/bin/env node
// tools/export-media: a plain, readable copy of the app's screen recordings and screenshots for one
// build, to use outside this repo (decks, Canva, the website, the App Store). The library stays the
// master copy; this folder is generated from it.
//
//   tools/export-media --build 284        → ../app-media/b284/<area>/<name>_v<N>.<ext> + CONTENTS.md
//   --out <dir>                           another parent folder (default: app-media next to this repo)
//   --include-retired                     also retired assets (default: drafts and approved)
//   --dry-run                             say what it would write, write nothing
//
// Files are APFS clones (no extra space on the same disk; a real copy anywhere else), so changing
// one never touches the library. A re-run replaces only what an earlier run wrote (`.export.json`);
// anything else in the folder is left alone.
import { constants, copyFileSync, existsSync, mkdirSync, readdirSync, rmdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { LIB, parseArgs, readJson, ROOT, today } from "./lib/core.ts";
import { loadIndex, type IndexEntry } from "./lib/catalog.ts";

const args = parseArgs(process.argv.slice(2));
const build = Number(args.build);
if (!build) {
  console.error("usage: tools/export-media --build <N> [--out <dir>] [--include-retired] [--dry-run]");
  process.exit(2);
}
const dest = join(resolve(String(args.out ?? join(ROOT, "..", "app-media"))), `b${build}`);
const dry = Boolean(args["dry-run"]);

// The app's areas, as a person looks for them. An `area` tag (tools/take sets it) wins, then a screenshot's
// `screen` tag; otherwise the moment's name decides, first match in this order.
const AREAS: [string, RegExp][] = [
  ["first-run", /splash|front-door|sign-?up|sign-in|onboarding|^ob-|selfie|privacy|photos-(off|permission)|draw|tips|welcome/],
  ["today", /today/],
  ["studio", /studio/],
  ["try-ons", /try-?on/],
  ["chat", /chat|ask|^zee-|question|location|look-card/],
  ["wardrobe", /wardrobe|scan|extract|pieces|import|piece|item|outfit|calendar|duplicate/],
  ["profile", /profile|settings|body|notification/],
];

type Row = { e: IndexEntry; area: string; file: string; from: string };

const tag = (e: IndexEntry, key: string) => e.tags.find((t) => t.startsWith(`${key}:`))?.slice(key.length + 1);
const appOf = (e: IndexEntry) => (e.asset.app ?? {}) as { build?: number; version?: string; commit?: string; env?: string };
const buildOf = (e: IndexEntry) => appOf(e).build ?? Number(tag(e, "build"));

const ofBuild = loadIndex().assets.filter(
  (e) => (e.kind === "footage" || e.kind === "screenshot") && buildOf(e) === build && (args["include-retired"] || e.status !== "retired"),
);
// Made from this build's code but drawing screens no user can reach in it (an old probe's v1 page):
// tagged look:v1, kept in the library, left out here.
const oldLook = ofBuild.filter((e) => e.tags.includes("look:v1"));
const picked = ofBuild.filter((e) => !oldLook.includes(e));
if (!picked.length) {
  console.error(`no footage or screenshots from build ${build} in the catalog`);
  process.exit(1);
}

const rows: Row[] = [];
const missing: IndexEntry[] = [];
const taken = new Set<string>();
for (const e of picked.sort((a, b) => a.id.localeCompare(b.id))) {
  const orig = e.files.find((f) => f.role === "original") ?? e.files[0];
  const from = join(LIB, orig.path);
  if (!existsSync(from)) {
    missing.push(e);
    continue;
  }
  const [, scope, name, v] = e.id.split(".");
  // b284-studio-tryon-b284 → studio-tryon
  const short = name.replace(new RegExp(`^b${build}-|-b${build}$`, "g"), "");
  const area = tag(e, "area") ?? tag(e, "screen") ?? AREAS.find(([, re]) => re.test(short))?.[0] ?? "other";
  let file = `${area}/${short}_${v}${extname(orig.path)}`;
  if (taken.has(file)) file = `${area}/${short}_${scope}_${v}${extname(orig.path)}`;
  taken.add(file);
  rows.push({ e, area, file, from });
}

// ---------------------------------------------------------------- CONTENTS.md

const mb = (bytes: number) => `${(bytes / 1e6).toFixed(1)} MB`;
const sizeOf = (r: Row) => {
  const d = r.e.asset.dims as { w: number; h: number } | undefined;
  const len = r.e.asset.durationSec as number | undefined;
  return [d && `${d.w}×${d.h}`, len && `${len.toFixed(1)} s`, mb(statSync(r.from).size)].filter(Boolean).join(" · ");
};
const uniq = (k: "version" | "commit") => [...new Set(rows.map((r) => appOf(r.e)[k]).filter(Boolean))].join(" / ");
const appLabel = [uniq("version"), uniq("commit") && `@${uniq("commit")}`].filter(Boolean).join(" ");
const areas = [...new Set(rows.map((r) => r.area))].sort();
const lines = [
  `# Curate app media: build ${build}`,
  "",
  `Screen recordings and screenshots of the app at build ${build}${appLabel ? ` (${appLabel})` : ""}, ` +
    `for any use. Made ${today()} by \`tools/export-media --build ${build}\` from curate-motion's library, ` +
    "which is the master copy: don't edit here, re-run the tool.",
  "",
  "- **Clean:** no phone frame, no words, no music; the status bar reads 9:41 with full battery.",
  "- **Status:** `approved` = signed off for ads; `draft` = not yet (fine for drafts and decks).",
  `- ${rows.filter((r) => r.e.kind === "footage").length} recordings, ${rows.filter((r) => r.e.kind === "screenshot").length} screenshots.`,
  "",
];
for (const a of areas) {
  lines.push(`## ${a}`, "", "| File | What it shows | Size | Status | Library id |", "|---|---|---|---|---|");
  for (const r of rows.filter((x) => x.area === a)) {
    lines.push(`| [${r.file.slice(a.length + 1)}](${r.file}) | ${r.e.title.replace(/\|/g, "/")} | ${sizeOf(r)} | ${r.e.status} | \`${r.e.id}\` |`);
  }
  lines.push("");
}
if (oldLook.length) {
  lines.push("## Left out: the old look", "", `Recorded from build ${build}'s code, but showing screens nobody can reach in it (tagged \`look:v1\`).`, "");
  for (const e of oldLook) lines.push(`- \`${e.id}\`: ${e.title}`);
  lines.push("");
}
if (missing.length) {
  lines.push("## Not on this Mac yet", "", "In the catalog but not downloaded: `tools/sync pull`, then re-run.", "");
  for (const e of missing) lines.push(`- \`${e.id}\`: ${e.title}`);
  lines.push("");
}

// ---------------------------------------------------------------- write

const ledgerPath = join(dest, ".export.json");
const before: string[] = existsSync(ledgerPath) ? readJson<{ files: string[] }>(ledgerPath).files : [];
const now = rows.map((r) => r.file);
const stale = before.filter((f) => !now.includes(f));

for (const r of rows) console.log(`${dry ? "would write" : "write"}  ${r.file}  ← ${r.e.id}`);
for (const f of stale) console.log(`${dry ? "would remove" : "remove"}  ${f}  (no longer in the catalog's build ${build})`);
for (const e of missing) console.log(`skip  ${e.id}  (not on this Mac: tools/sync pull)`);

if (!dry) {
  for (const f of stale) {
    rmSync(join(dest, f), { force: true });
    const dir = dirname(join(dest, f));
    if (existsSync(dir) && readdirSync(dir).length === 0) rmdirSync(dir);
  }
  for (const r of rows) {
    const to = join(dest, r.file);
    mkdirSync(dirname(to), { recursive: true });
    rmSync(to, { force: true });
    copyFileSync(r.from, to, constants.COPYFILE_FICLONE);
  }
  writeFileSync(join(dest, "CONTENTS.md"), lines.join("\n"));
  writeFileSync(ledgerPath, JSON.stringify({ build, at: today(), files: now }, null, 2) + "\n");
}
console.log(`\n${dry ? "would export" : "exported"} ${rows.length} files to ${dest}${missing.length ? `; ${missing.length} not on this Mac` : ""}`);
