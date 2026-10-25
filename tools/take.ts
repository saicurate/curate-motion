#!/usr/bin/env node
// tools/take: record the app on a simulator from a shot list (captures/b<build>.json), straight into the
// library as drafts. The app is a curate-app lib/dev probe (every server call faked: free), driven through
// its control file (PROBE_CONTROL): a location, `tap:<key>`, `drag:x,y,dx,dy,ms`, `today:<state>`…
//
//   tools/take build captures/b284.json --app tabs     flutter build ios --simulator for that app's probe and
//                                                      dart-defines → .cache/apps/b284-tabs.app
//   tools/take captures/b284.json [--only id,id] [--app tabs]
//                                                      record each shot → .cache/takes/b284/<id>.mp4 (+ stills),
//                                                      then add it to the catalog (footage / screenshot, draft)
//   --sim <udid>      default: .cache/motion-sim-udid.txt. Never a "… Marketing" simulator (kept for real accounts).
//   --no-register     record only          --register-only   add the takes an earlier --no-register run made
//   --dry-run         say what it would do
//
// A shot: { id, app, area, title, setup: [lines, each waited for], steps: [[seconds, line]…], end: seconds,
//           stills: [{ at, id, title }], tags: [free tags, e.g. third-party-marks] }. Step times count from when the recording is running. Afterwards run
// `tools/export-media --build <N>` for the plain copy.
import { spawn, execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { parseArgs, readJson, ROOT } from "./lib/core.ts";
import { addAsset, loadIndex } from "./lib/catalog.ts";

type Still = { at: number; id: string; title: string };
type Shot = { id: string; app: string; area: string; title: string; setup?: string[]; steps?: [number, string][]; end: number; stills?: Still[]; tags?: string[] };
type App = { target: string; control: string; defines: Record<string, string>; setup?: string[] };
type List = { build: number; version: string; commit: string; appDir: string; bundle: string; persona: string; apps: Record<string, App>; shots: Shot[] };

const args = parseArgs(process.argv.slice(2));
const build = args._[0] === "build";
const listPath = resolve(build ? args._[1] : args._[0]);
const CACHE = join(ROOT, ".cache");
const expand = (s: string) => s.replaceAll("$CACHE", CACHE);
const L = readJson<List>(listPath);
const dry = Boolean(args["dry-run"]);
const appPath = (name: string) => join(CACHE, "apps", `b${L.build}-${name}.app`);
const control = (a: App) => join(CACHE, "ctl", a.control);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------- build

const sim = String(args.sim ?? readFileSync(join(CACHE, "motion-sim-udid.txt"), "utf8").trim());

if (build) {
  // `flutter build ios --simulator` fails here with a bogus lipo error ("does not contain architectures arm64
  // x86_64"); `flutter run` on the simulator builds fine. So: run it until the app is up, stop, keep the app.
  const name = String(args.app);
  const a = L.apps[name];
  if (!a) throw new Error(`no app "${name}" in ${listPath} (${Object.keys(L.apps).join(", ")})`);
  const defs = Object.entries({ ...a.defines, PROBE_CONTROL: control(a) }).map(([k, v]) => `--dart-define=${k}=${expand(v)}`);
  console.log(`flutter run -d ${sim} --debug -t ${a.target} ${defs.join(" ")}  (in ${L.appDir})`);
  if (dry) process.exit(0);
  const run = spawn("flutter", ["run", "-d", sim, "--debug", "-t", a.target, ...defs], { cwd: L.appDir, stdio: ["pipe", "pipe", "inherit"] });
  await new Promise<void>((up, fail) => {
    run.stdout.on("data", (d: Buffer) => {
      process.stdout.write(d);
      if (/Dart VM Service|Flutter run key commands/.test(String(d))) up();
    });
    run.once("exit", (code) => fail(new Error(`flutter run ended (${code}) before the app was up`)));
  });
  run.removeAllListeners("exit");
  run.kill("SIGINT");
  mkdirSync(join(CACHE, "apps"), { recursive: true });
  rmSync(appPath(name), { recursive: true, force: true });
  cpSync(join(L.appDir, "build/ios/iphonesimulator/Runner.app"), appPath(name), { recursive: true });
  console.log(`→ ${appPath(name)}`);
  process.exit(0);
}

// ---------------------------------------------------------------- the simulator

const devices = JSON.parse(execFileSync("xcrun", ["simctl", "list", "devices", "-j"], { encoding: "utf8" })).devices as Record<string, { udid: string; name: string; state: string }[]>;
const device = Object.values(devices).flat().find((d) => d.udid === sim);
if (!device) throw new Error(`no simulator ${sim}`);
if (/marketing/i.test(device.name)) throw new Error(`${device.name} is kept for real-account footage; use your own simulator`);
const simctl = (...a: string[]) => execFileSync("xcrun", ["simctl", ...a], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
if (!dry && device.state !== "Booted") simctl("boot", sim);

let installed = "";
const install = (name: string) => {
  if (installed === name) return;
  if (!existsSync(appPath(name))) throw new Error(`build it first: tools/take build ${args._[0]} --app ${name}`);
  simctl("install", sim, appPath(name));
  installed = name;
};

/** Write a control line and wait until the probe says it has done it (it writes the line to <file>.done). */
const send = async (file: string, line: string, timeoutMs = 45_000) => {
  writeFileSync(file, line);
  const t = Date.now();
  while (Date.now() - t < timeoutMs) {
    if (existsSync(`${file}.done`) && readFileSync(`${file}.done`, "utf8").trim() === line.trim()) return;
    await sleep(100);
  }
  throw new Error(`the probe never did "${line}" (no ${file}.done)`);
};

// ---------------------------------------------------------------- record

const only = args.only ? String(args.only).split(",") : null;
const shots = L.shots.filter((s) => (!only || only.includes(s.id)) && (!args.app || s.app === args.app));
const out = join(CACHE, "takes", `b${L.build}`);
mkdirSync(out, { recursive: true });
const nextVersion = (prefix: string) => {
  const ids = loadIndex().assets.map((e) => e.id).filter((id) => id.startsWith(`${prefix}.v`));
  return Math.max(0, ...ids.map((id) => Number(id.slice(prefix.length + 2)))) + 1;
};
const appInfo = { build: L.build, version: L.version, commit: L.commit, env: "local" };

type Take = { marks: Record<string, number>; device: string; stills: { id: string; file: string }[] };

/** Record one shot: a clean launch, its setup lines, then the recording while its steps and stills play. */
const record = async (shot: Shot): Promise<Take> => {
  const a = L.apps[shot.app];
  install(shot.app);
  const ctl = control(a);
  mkdirSync(join(CACHE, "ctl"), { recursive: true });
  simctl("status_bar", sim, "override", "--time", "9:41", "--dataNetwork", "wifi", "--wifiMode", "active", "--wifiBars", "3", "--cellularMode", "active", "--cellularBars", "4", "--batteryState", "charged", "--batteryLevel", "100");
  try {
    simctl("terminate", sim, L.bundle);
  } catch {
    // not running
  }
  writeFileSync(ctl, "");
  rmSync(`${ctl}.done`, { force: true });
  simctl("launch", sim, L.bundle);
  for (const [i, line] of [...(a.setup ?? []), ...(shot.setup ?? [])].entries()) await send(ctl, line, i === 0 ? 60_000 : 40_000);
  await sleep(600);

  const mp4 = join(out, `${shot.id}.mp4`);
  const rec = spawn("xcrun", ["simctl", "io", sim, "recordVideo", "--codec=h264", "--force", mp4], { stdio: "ignore" });
  const t0 = Date.now();
  await sleep(1200); // recordVideo needs a moment before its first frame
  const lead = (Date.now() - t0) / 1000;
  const take: Take = { marks: {}, device: device.name, stills: [] };
  const events = [
    ...(shot.steps ?? []).map(([at, line]) => ({
      at,
      run: () => {
        writeFileSync(ctl, line);
        const key = line.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
        let name = key;
        for (let n = 2; name in take.marks; n++) name = `${key}-${n}`; // the same line again keeps its own time
        take.marks[name] = +((Date.now() - t0) / 1000).toFixed(2);
      },
    })),
    ...(shot.stills ?? []).map((still) => ({
      at: still.at,
      run: () => {
        const file = join(out, `${still.id}.png`);
        take.stills.push({ id: still.id, file });
        spawn("xcrun", ["simctl", "io", sim, "screenshot", "--type=png", file], { stdio: "ignore" });
      },
    })),
  ].sort((x, y) => x.at - y.at);
  for (const e of events) {
    const wait = t0 + (lead + e.at) * 1000 - Date.now();
    if (wait > 0) await sleep(wait);
    e.run();
  }
  const wait = t0 + (lead + shot.end) * 1000 - Date.now();
  if (wait > 0) await sleep(wait);
  await new Promise<void>((done) => {
    rec.once("exit", () => done());
    rec.kill("SIGINT");
  });
  await sleep(800); // the last screenshot lands
  writeFileSync(join(out, `${shot.id}.json`), JSON.stringify(take, null, 2) + "\n");
  console.log(`  → ${mp4}${take.stills.length ? ` + ${take.stills.length} still(s)` : ""}  marks ${JSON.stringify(take.marks)}`);
  return take;
};

/** Add a recorded take (and its stills) to the catalog as drafts. */
const register = (shot: Shot, take: Take) => {
  const moment = `b${L.build}-${shot.id}`;
  const fid = `footage.${L.persona}.${moment}`;
  const footage = addAsset({
    file: join(out, `${shot.id}.mp4`),
    kind: "footage",
    id: `${fid}.v${nextVersion(fid)}`,
    title: `${shot.title} (build ${L.build} probe)`,
    licence: "curate",
    tags: [`persona=${L.persona}`, `moment=${moment}`, "origin:probe", `build:${L.build}`, `area:${shot.area}`, ...(shot.tags ?? [])],
    fields: { moment, account: L.persona, device: `${take.device} (simulator)`, cleanStatusBar: true, app: appInfo, marks: take.marks },
    source: { tool: "tools/take", from: [] },
    aiGenerated: false,
    by: "agent:tools/take",
  });
  console.log(`  + ${footage.id}`);
  for (const { id, file } of take.stills) {
    const still = (shot.stills ?? []).find((x) => x.id === id);
    if (!still || !existsSync(file)) {
      console.log(`  ! no screenshot for ${id}`);
      continue;
    }
    const sid = `screenshot.${L.persona}.b${L.build}-${id}`;
    const shotAsset = addAsset({
      file,
      kind: "screenshot",
      id: `${sid}.v${nextVersion(sid)}`,
      title: `${still.title} (build ${L.build} probe)`,
      licence: "curate",
      tags: [`persona=${L.persona}`, "origin:probe", `build:${L.build}`, `area:${shot.area}`, ...(shot.tags ?? [])],
      fields: { screen: shot.area, state: id, app: appInfo, capture: "screenshot", origin: "probe", variant: "native" },
      source: { tool: "tools/take", from: [footage.id] },
      aiGenerated: false,
      by: "agent:tools/take",
    });
    console.log(`  + ${shotAsset.id}`);
  }
};

for (const shot of shots) {
  console.log(`\n${shot.id} (${shot.app}): ${shot.steps?.length ?? 0} steps; ${shot.end} s`);
  if (dry) continue;
  // --register-only: the takes reviewed from an earlier --no-register run, as they are.
  const take = args["register-only"] ? readJson<Take>(join(out, `${shot.id}.json`)) : await record(shot);
  if (!args["no-register"]) register(shot, take);
}
