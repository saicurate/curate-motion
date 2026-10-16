#!/usr/bin/env node
// Register the phone frames in the library (kind "device", library/devices/), measured, licensed and
// uploaded to S3 by the catalog's own addAsset (the same code as tools/catalog add).
//
//   node tools/device/register.ts bezels --dmg17 <mounted Bezel-iPhone-17.dmg> --dmg18 <mounted Bezel-iPhone-18.dmg> \
//        --guidelines <snapshot.txt> [--no-push]
//   node tools/device/register.ts generic --glb <phone-generic.glb> --hdri <studio_small_09_2k.hdr> [--no-push]
//
// Getting the bezels (free, no login): developer.apple.com/design/resources › Product Bezels ›
//   https://devimages-cdn.apple.com/design/resources/download/Bezel-iPhone-18.dmg (and -17). The DMG asks
//   you to accept the Apple Design Resources licence; mount it read-only:
//   hdiutil attach -nobrowse -readonly -mountpoint <dir> Bezel-iPhone-18.dmg
// The guidelines snapshot: the text of developer.apple.com/app-store/marketing/guidelines/ on the day.
// Measurements come from tools/device/bezel_fit.py (ffmpeg + numpy + scipy). Read decisions/0012 first.
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { addAsset, LICENCES } from "../lib/catalog.ts";
import { ROOT, today } from "../lib/core.ts";

const argv = process.argv.slice(2);
const cmd = argv[0];
const opt = (k: string) => {
  const i = argv.indexOf(`--${k}`);
  return i >= 0 ? argv[i + 1] : undefined;
};
const push = !argv.includes("--no-push");
const BY = "claude-code (device frames)";

// The two DMGs as downloaded on 2026-10-16 (Apple's CDN; Last-Modified and sha256 of the .dmg).
const DMG = {
  "17": { url: "https://devimages-cdn.apple.com/design/resources/download/Bezel-iPhone-17.dmg", sha256: "d82865f755b94576a61ee29e306193de600b6a4aba81315f6651fd4b652ce222", modified: "2025-09-12" },
  "18": { url: "https://devimages-cdn.apple.com/design/resources/download/Bezel-iPhone-18.dmg", sha256: "b27e827d156c9646048c2462cbba1c55c4267917083d8d43141086ea285d1792", modified: "2026-09-09" },
} as const;

// Pro Max only: its 1320 x 2868 display is exactly our footage and screenshots (the 6.9-inch simulator).
const BEZELS: { gen: "17" | "18"; colour: string; file: string }[] = [
  { gen: "17", colour: "silver", file: "iPhone 17 Pro Max - Silver - Portrait.png" },
  { gen: "17", colour: "deep-blue", file: "iPhone 17 Pro Max - Deep Blue - Portrait.png" },
  { gen: "17", colour: "cosmic-orange", file: "iPhone 17 Pro Max - Cosmic Orange - Portrait.png" },
  { gen: "18", colour: "silver", file: "iPhone 18 Pro Max - Silver - Portrait.png" },
  { gen: "18", colour: "black", file: "iPhone 18 Pro Max - Black - Portrait.png" },
  { gen: "18", colour: "burgundy", file: "iPhone 18 Pro Max - Burgundy - Portrait.png" },
  { gen: "18", colour: "glacier", file: "iPhone 18 Pro Max - Glacier - Portrait.png" },
];

export const APPLE_RULES = [
  "Use it as is and straight on: never rotate, tilt, flip, spin or animate the device itself.",
  "In video, show the whole device first; then you may pan and zoom to the app. Transitions: fades or dissolves.",
  "Never add shadows, reflections or highlights to it, never crop or cover any part of it, and nothing may appear to come out of (or go into) its screen: no Pop out from this phone.",
  "Words, badges and stickers go beside it, never on top of it.",
  "At least 200 px tall on screen; keep the right relative sizes when several devices are shown.",
  "Show the app exactly as it runs on the latest iOS: a full status bar, fictional account data (Emma), never a blank screen, the Home Screen or another app's content.",
  "Use the latest-generation device the app is built for; no cases or covers; no competing products in the same picture.",
  "Wherever an ad has legal copy, add the credit line \"iPhone is a trademark of Apple Inc., registered in the U.S. and other countries.\" (US-only body copy: iPhone® on first mention, never in headlines).",
  "Only to market Curate while it is on the App Store and we are in the Apple Developer Program. Never share, sell or post the bezel file itself; it stays in the private library.",
];

const fits = (paths: string[]) => {
  const r = spawnSync("python3", ["-I", join(ROOT, "tools", "device", "bezel_fit.py"), ...paths], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`bezel_fit.py failed: ${r.stderr}`);
  return r.stdout.trim().split("\n").map((l) => JSON.parse(l));
};

if (cmd === "bezels") {
  const dirs = { "17": opt("dmg17"), "18": opt("dmg18") };
  const guidelines = opt("guidelines");
  if (!dirs["17"] || !dirs["18"] || !guidelines) throw new Error("usage: register.ts bezels --dmg17 <dir> --dmg18 <dir> --guidelines <snapshot.txt>");
  const paths = BEZELS.map((b) => join(dirs[b.gen]!, "PNG", `iPhone ${b.gen} Pro Max`, b.file));
  for (const p of paths) if (!existsSync(p)) throw new Error(`missing ${p}`);
  const measured = fits(paths);
  BEZELS.forEach((b, i) => {
    const m = measured[i];
    const model = `iphone-${b.gen}-pro-max`;
    const nice = b.colour.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const fits17 = b.gen === "17";
    const r = addAsset({
      file: paths[i],
      kind: "device",
      scope: "apple",
      name: `${model}-${b.colour}`,
      title: `iPhone ${b.gen} Pro Max, ${nice} (Apple bezel, portrait)`,
      licence: { ...LICENCES["apple-bezel"].licence, proof: `files with role "proof": Apple's DMG licence (LYL142 06/21/2023) and a snapshot of the App Store Marketing Guidelines, ${today()}` },
      extras: [
        { role: "proof", file: join(dirs[b.gen]!, "Apple Design Resources License.rtf") },
        { role: "proof", file: guidelines },
      ],
      tags: [`device`, `apple`, `generation:${b.gen}`],
      fields: {
        description: `Apple's official Product Bezel, ${b.file}, from ${DMG[b.gen].url} (Last-Modified ${DMG[b.gen].modified}, dmg sha256 ${DMG[b.gen].sha256.slice(0, 16)}…). A PNG with a transparent display; its own Dynamic Island is drawn on top. ${fits17 ? "Matches our iPhone 17 Pro Max simulator captures pixel for pixel, island included." : "The iPhone 18 Pro Max island is narrower (282 vs 374 px), so captures from the 17 Pro Max simulator show their own island around it: recapture on the iPhone 18 Pro Max simulator to use this one."}`,
        maker: "Apple",
        model,
        colour: b.colour,
        variant: "bezel",
        orientation: "portrait",
        body: m.body,
        screen: m.screen,
        island: m.island,
        fitsCapturesFrom: fits17 ? "iPhone 17 Pro Max" : "iPhone 18 Pro Max",
        moves: ["pan", "zoom", "fade"],
        rules: APPLE_RULES,
        creditLine: "iPhone is a trademark of Apple Inc., registered in the U.S. and other countries.",
      },
      source: { type: "stock", author: "Apple Inc.", url: DMG[b.gen].url, tool: `Bezel-iPhone-${b.gen}.dmg › PNG › iPhone ${b.gen} Pro Max` },
      aiGenerated: false,
      by: BY,
      push,
    });
    console.log(JSON.stringify(r));
  });
} else if (cmd === "generic") {
  const glb = opt("glb");
  const hdri = opt("hdri");
  if (!glb || !hdri) throw new Error("usage: register.ts generic --glb <file> --hdri <file>");
  const env = addAsset({
    file: hdri,
    kind: "stock",
    scope: "polyhaven",
    name: "hdri-studio-small-09",
    title: "Studio Small 09 (HDRI, 2k): softbox studio light for 3D",
    licence: { ...LICENCES.cc0.licence, url: "https://polyhaven.com/license", proof: "https://polyhaven.com/license (All assets on Poly Haven are CC0), checked " + today() },
    tags: ["hdri", "lighting", "3d"],
    fields: {
      description: "Poly Haven's Studio Small 09 by Sergej Majboroda (2048 x 1024 Radiance .hdr, md5 b056fea247bc84b81d2e0987d44c87d8). Lighting and reflections for 3D scenes only: never shown as a picture.",
      shows: "an empty photo studio with umbrellas and softboxes (lighting only, never shown)",
      media: "image",
    },
    source: { type: "stock", author: "Sergej Majboroda (Poly Haven)", url: "https://polyhaven.com/a/studio_small_09", tool: "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/2k/studio_small_09_2k.hdr" },
    aiGenerated: false,
    by: BY,
    push,
  });
  console.log(JSON.stringify(env));
  const r = addAsset({
    file: glb,
    kind: "device",
    scope: "curate",
    name: "phone-generic",
    title: "Generic phone, 3D (Curate's own model)",
    licence: "curate",
    tags: ["device", "3d"],
    fields: {
      description: "Our own generic flat-edged phone, built in Blender by tools/device/phone_generic.py and exported as a GLB (nodes Body [Frame, Back, Border], Screen, Cover, Keys). No Apple-only details: no Dynamic Island hardware, camera plateau, Action button or left-side volume pair; power key and volume rocker on the right. Its screen is 72.0 x 156.4 mm = 1320:2868, so our footage maps onto it 1:1.",
      maker: "Curate",
      model: "phone-generic",
      colour: "graphite",
      variant: "3d",
      screen: { x: 0, y: 0, w: 1320, h: 2868, cornerRadius: 193 },
      sizeMm: { w: 78.2, h: 162.6, d: 8.25 },
      environment: env.id,
      colourways: {
        graphite: { frame: "#5a5c61", back: "#2e2f32", roughness: 0.3 },
        silver: { frame: "#cfd1d5", back: "#dcdddf", roughness: 0.22 },
      },
      moves: ["pan", "zoom", "fade", "rotate", "tilt", "orbit", "shadow", "reflection", "pop-out"],
      rules: [
        "It is a generic phone, not an iPhone: never add Apple-only details (a hardware Dynamic Island, the camera plateau, the Action button, the left-side volume pair) and never call it an iPhone.",
        "Our captures carry the simulator's island pixels at the top of the screen: that is the app's screen content, and fine.",
        "Any move is allowed: rotate, tilt, orbit, shadows, reflections, things coming out of the screen.",
      ],
    },
    source: { type: "original", tool: "tools/device/phone_generic.py (Blender 5.1.1)", from: [] },
    aiGenerated: false,
    by: BY,
    push,
  });
  console.log(JSON.stringify(r));
} else {
  console.log("usage: node tools/device/register.ts bezels|generic …  (see the header)");
  process.exit(1);
}
