#!/usr/bin/env node
// tools/motion-check: checks the motion library and an ad's code against the render contract
// (decisions/0011, proposed).
//
//   tools/motion-check                 the spring presets (measured overshoot + settle vs. their spec),
//                                      stacked-track continuity, seeded-noise determinism
//   tools/motion-check <ad-id> …       + scans ads/<ad>/ for anything that breaks frame purity
//                                      (Math.random, Date, timers, rAF, performance.now)
//   --json                             machine-readable
//
// Exit code 1 if anything fails.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { MOTION_CLASSES, overshoot, PRESETS, settleTime, spring, springVel, track, trackVel, type MotionClass } from "../motion/springs.ts";
import { fbm1, hash, noise1 } from "../motion/noise.ts";
import { parseArgs, ROOT } from "./lib/core.ts";

const args = parseArgs(process.argv.slice(2));
const fails: string[] = [];

// what each object class promises (the spec the presets are tuned to)
const SPEC: Record<MotionClass, { overshoot: [number, number]; settle99: [number, number]; what: string }> = {
  ui: { overshoot: [0.02, 0.04], settle99: [0.15, 0.45], what: "snaps, minimal overshoot" },
  panel: { overshoot: [0, 0.0005], settle99: [0.35, 0.8], what: "settles, no overshoot" },
  camera: { overshoot: [0, 0.0005], settle99: [1.5, 2.4], what: "glides, long, critically damped" },
  headline: { overshoot: [0, 0.006], settle99: [0.1, 0.35], what: "lands hard, holds to read" },
  mascot: { overshoot: [0.15, 0.3], settle99: [0.6, 1.4], what: "bounces on purpose (Zee only)" },
  piece: { overshoot: [0.005, 0.02], settle99: [0.3, 0.8], what: "mass, a slight settle" },
};

const rows = MOTION_CLASSES.map((c) => {
  const os = overshoot(c);
  // measured overshoot from the curve itself, not the formula
  let peak = 0;
  for (let t = 0; t < 5; t += 0.0005) peak = Math.max(peak, spring(t, c));
  const measured = Math.max(0, peak - 1);
  const s2 = settleTime(c, 0.02);
  const s99 = settleTime(c, 0.01);
  const sp = SPEC[c];
  const ok = measured >= sp.overshoot[0] - 1e-4 && measured <= sp.overshoot[1] + 1e-4 && s99 >= sp.settle99[0] && s99 <= sp.settle99[1];
  if (!ok) fails.push(`preset ${c}: overshoot ${(measured * 100).toFixed(2)}% (spec ${sp.overshoot.map((x) => (x * 100).toFixed(1)).join("–")}%), 99% at ${s99.toFixed(2)} s (spec ${sp.settle99.join("–")} s)`);
  return { class: c, ...PRESETS[c], overshootPct: +(measured * 100).toFixed(2), formulaPct: +(os * 100).toFixed(2), settle98: +s2.toFixed(3), settle99: +s99.toFixed(3), spec: sp.what, ok };
});

// stacked tracks: position and velocity continuous through every retarget, ends on the last value
const keys = [
  { t: 0.2, v: 100 },
  { t: 0.35, v: -40, spring: "piece" as const },
  { t: 0.9, v: 250, spring: "camera" as const },
];
let maxJump = 0;
let maxVelJump = 0;
const dt = 1 / 240;
for (let t = 0; t < 4; t += dt) {
  maxJump = Math.max(maxJump, Math.abs(track(t + dt, 0, keys) - track(t, 0, keys)));
  maxVelJump = Math.max(maxVelJump, Math.abs(trackVel(t + dt, 0, keys) - trackVel(t, 0, keys)));
}
// numeric derivative matches the analytic one
let velErr = 0;
for (let t = 0.01; t < 3; t += 0.013) {
  const num = (track(t + 1e-5, 0, keys) - track(t - 1e-5, 0, keys)) / 2e-5;
  velErr = Math.max(velErr, Math.abs(num - trackVel(t, 0, keys)));
}
let springVelErr = 0;
for (const c of MOTION_CLASSES)
  for (let t = 0.01; t < 2; t += 0.017) springVelErr = Math.max(springVelErr, Math.abs((spring(t + 1e-6, c) - spring(t - 1e-6, c)) / 2e-6 - springVel(t, c)));
const end = track(20, 0, keys);
if (Math.abs(end - 250) > 1e-6) fails.push(`track: ends at ${end}, not 250`);
if (velErr > 1e-3 || springVelErr > 1e-3) fails.push(`velocity: analytic vs numeric differs by ${Math.max(velErr, springVelErr)}`);
// at 240 Hz, the biggest per-step change of a ≤ 290-unit move must stay small (no jump at a retarget)
if (maxJump > 12) fails.push(`track: a ${maxJump.toFixed(2)}-unit jump in 1/240 s (a discontinuity)`);

// seeded noise: same in, same out; spread sane
const n1 = [0.1, 1.7, 3.3].map((t) => noise1(7, t));
const n2 = [0.1, 1.7, 3.3].map((t) => noise1(7, t));
if (n1.some((x, i) => x !== n2[i]) || hash(1, 2) !== hash(1, 2) || fbm1(3, 2.5) !== fbm1(3, 2.5)) fails.push("noise: not deterministic");

// frame purity scan of the ads asked for
const BANNED: [RegExp, string][] = [
  [/\bMath\.random\s*\(/, "Math.random (use motion/noise: rand01(seed, i))"],
  [/\bDate\.now\s*\(|\bnew Date\s*\(/, "Date (frames come from time alone)"],
  [/\bsetTimeout\s*\(|\bsetInterval\s*\(/, "timers"],
  [/\brequestAnimationFrame\s*\(/, "requestAnimationFrame"],
  [/\bperformance\.now\s*\(/, "performance.now"],
];
const scans: { ad: string; file: string; line: number; what: string }[] = [];
for (const ad of args._) {
  const dir = join(ROOT, "ads", ad);
  if (!existsSync(dir)) {
    fails.push(`no ads/${ad}`);
    continue;
  }
  const walk = (d: string): string[] => readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : /\.(tsx?|jsx?)$/.test(n) && !/sound\.ts$/.test(n) ? [join(d, n)] : []));
  for (const f of walk(dir)) {
    readFileSync(f, "utf8")
      .split("\n")
      .forEach((l, i) => {
        if (/^\s*(\/\/|\*)/.test(l)) return; // comments may name them
        for (const [re, what] of BANNED) if (re.test(l)) scans.push({ ad, file: f.slice(ROOT.length + 1), line: i + 1, what });
      });
  }
}
for (const s of scans) fails.push(`${s.file}:${s.line}: ${s.what}`);

if (args.json) console.log(JSON.stringify({ presets: rows, track: { maxJump, maxVelJump, velErr, springVelErr }, scans, fails }, null, 2));
else {
  console.log("preset     ζ      response  overshoot  98% in   99% in   promise");
  for (const r of rows) console.log(`${r.ok ? "ok " : "BAD"} ${r.class.padEnd(9)} ${r.zeta.toFixed(2).padEnd(6)} ${(r.response + " s").padEnd(9)} ${(r.overshootPct + "%").padEnd(10)} ${(r.settle98.toFixed(2) + " s").padEnd(8)} ${(r.settle99.toFixed(2) + " s").padEnd(8)} ${r.spec}`);
  console.log(`track: continuous (max step ${maxJump.toFixed(2)} units at 240 Hz), analytic velocity within ${Math.max(velErr, springVelErr).toExponential(1)}`);
  console.log("noise: deterministic");
  if (args._.length) console.log(`purity scan (${args._.join(", ")}): ${scans.length ? scans.length + " problem(s)" : "clean"}`);
  console.log(fails.length ? `\nFAIL\n- ${fails.join("\n- ")}` : "\nall checks pass");
}
process.exit(fails.length ? 1 : 0);
