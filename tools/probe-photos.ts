#!/usr/bin/env node
// tools/probe-photos: a persona's photos as curate-app's new-look probes read them
// (`--dart-define=PROBE_PHOTOS=<folder>`, lib/dev/new_look_extract.dart and new_look_probe.dart), so
// footage of the scan shows her camera roll instead of the bundled stand-ins.
//
//   tools/probe-photos emma         → .cache/probe-photos/emma/: her-01…07.jpg (photos she's in, by the
//                                     list below), other-NN.jpg (stock with nobody in it), selfie.jpg
//   --out <dir>                       somewhere else
//
// Phone-sized copies (1200 px long side, JPEG); the library's files are never touched.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { LIB, parseArgs, readJson, ROOT } from "./lib/core.ts";
import { loadIndex, type IndexEntry } from "./lib/catalog.ts";

const args = parseArgs(process.argv.slice(2));
const persona = args._[0];
if (persona !== "emma") {
  console.error("usage: tools/probe-photos emma [--out <dir>]   (only Emma has a camera roll and selfie so far)");
  process.exit(2);
}
const out = String(args.out ?? join(ROOT, ".cache", "probe-photos", persona));

// Her photos in the scan, in order: her-01 is the one-photo card's, her-02 and her-03 are also the second
// and third in her gallery (new_look_probe). Whole outfits, clearly her, the ones the ads already use.
const HERS = [
  "photo.emma.r30-walk-to-work.v1",
  "photo.emma.r12-dumbo-walk.v1",
  "photo.emma.r26-ferry.v1",
  "photo.emma.r01-coffee-shop.v1",
  "photo.emma.r21-museum-steps.v1",
  "photo.emma.r07-rooftop-golden-hour.v1",
  "photo.emma.r03-brooklyn-street.v1",
];

// Her face in the 1200-px copy of her selfie: Apple Vision's face box (x, y from the top, width). Measured
// once; the selfie is approved, so it never changes.
const SELFIE_FACE: Record<string, [number, number, number]> = { "selfie.emma.selfie.v1": [259, 267, 414] };

// Who she is in the app (persona.json: the probe's profile and weather place), and her face for the avatar
// (Apple Vision's box in the approved face image, measured once). Name and username: her account.json;
// city: persona.md.
const PERSONAS: Record<string, { city: string; lat: number; lon: number; face: string; faceBox: [number, number, number] }> = {
  emma: { city: "Astoria", lat: 40.7644, lon: -73.9235, face: "face.emma.b.v1", faceBox: [531, 550, 715] },
};

const idx = loadIndex().assets;
const byId = new Map(idx.map((e) => [e.id, e]));
const original = (e: IndexEntry) => join(LIB, (e.files.find((f) => f.role === "original") ?? e.files[0]).path);
// The rest of her library: everyday stock photos with nobody in them (no grounds, no HDRIs).
const others = idx.filter((e) => e.kind === "stock" && e.status !== "retired" && e.id.startsWith("stock.unsplash.") && original(e).endsWith(".jpg"));
const selfie = idx.find((e) => e.kind === "selfie" && e.id.startsWith(`selfie.${persona}.`) && e.status !== "retired");

const jobs: [string, string][] = [
  ...HERS.map((id, i): [string, string] => {
    const e = byId.get(id);
    if (!e) throw new Error(`not in the catalog: ${id}`);
    return [original(e), `her-${String(i + 1).padStart(2, "0")}.jpg`];
  }),
  ...others.map((e, i): [string, string] => [original(e), `other-${String(i + 1).padStart(2, "0")}.jpg`]),
];
const missing = jobs.filter(([from]) => !existsSync(from));
if (missing.length) {
  console.error(`not on this Mac (tools/sync pull):\n${missing.map(([f]) => `  ${f}`).join("\n")}`);
  process.exit(1);
}

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
const phone = (from: string, to: string) =>
  execFileSync("sips", ["-Z", "1200", "-s", "format", "jpeg", "-s", "formatOptions", "85", from, "--out", join(out, to)], { stdio: "ignore" });
for (const [from, to] of jobs) phone(from, to);
// The selfie, framed as the probe's stand-in camera expects its picture (tools/lib/frame_selfie.py).
if (selfie && existsSync(original(selfie))) {
  const face = SELFIE_FACE[selfie.id];
  if (!face) throw new Error(`no face box for ${selfie.id}: measure it (Apple Vision) and add it to SELFIE_FACE`);
  phone(original(selfie), "selfie-full.jpg");
  execFileSync("python3", [join(ROOT, "tools", "lib", "frame_selfie.py"), join(out, "selfie-full.jpg"), join(out, "selfie.jpg"), ...face.map(String)]);
  rmSync(join(out, "selfie-full.jpg"));
}
const who = PERSONAS[persona];
const account = readJson<{ displayName?: string; username?: string }>(join(LIB, "people", persona, "account.json"));
writeFileSync(
  join(out, "persona.json"),
  JSON.stringify({ firstName: account.displayName, lastName: null, username: account.username && `@${account.username}`, city: who.city, lat: who.lat, lon: who.lon }, null, 2) + "\n",
);
const faceAsset = byId.get(who.face);
if (faceAsset && existsSync(original(faceAsset))) {
  const [x, y, w] = who.faceBox;
  const side = Math.round(w * 1.8);
  const [cx, cy] = [x + w / 2, y + w / 2];
  execFileSync("python3", ["-c", `from PIL import Image; Image.open(${JSON.stringify(original(faceAsset))}).convert("RGB").crop((${Math.round(cx - side / 2)}, ${Math.round(cy - side / 2)}, ${Math.round(cx + side / 2)}, ${Math.round(cy + side / 2)})).resize((600, 600), Image.LANCZOS).save(${JSON.stringify(join(out, "avatar.jpg"))}, quality=90)`]);
}
console.log(`${out}: ${HERS.length} of her, ${others.length} others${selfie ? ", her selfie" : ""}, persona.json${faceAsset ? ", avatar" : ""}`);
