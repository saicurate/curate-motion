#!/usr/bin/env node
// tools/persona: make a persona's REAL Curate account and test phone match the library.
// The library is the desired state; library/people/<persona>/account-state.json records the actual.
//
//   tools/persona status <persona>                       desired vs recorded vs (if signed in) live
//   tools/persona sync   <persona> --dry-run              what would be added to / removed from her wardrobe
//   tools/persona sync   <persona> --yes                  do it (each add costs ~$0.07-0.08 of server AI: founder OK first)
//        [--include-drafts] [--max 10]
//   tools/persona roll   <persona> --dry-run | --yes      rebuild the simulator's Photos from her camera roll
//        [--device <udid>] [--with-stock] [--include-drafts]
//
// Wardrobe: desired = garments in library/wardrobe/<persona>/ that are approved (and not retired;
// --include-drafts adds drafts). Adds go through POST /api/v1/wardrobe/add-photo as her (photoId
// "cm:<library id>", so the items come back with sourcePhotoId = that and can be matched); removes
// through DELETE /api/v1/wardrobe/items/{itemId} (a soft delete). Items the library doesn't know
// about are listed as `unmanaged` and never touched.
// Sign-in: Firebase email/password REST sign-in. The password is read from AWS SSM
// (/curate/marketing/<persona>-password, SecureString) into memory only; never printed or written.
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { AccountState, PersonaAccount } from "../schemas/account.ts";
import { aws, LIB, parseArgs, readJson, ROOT, sha256File, writeJson } from "./lib/core.ts";
import { loadIndex, type IndexEntry } from "./lib/catalog.ts";

const args = parseArgs(process.argv.slice(2));
const [cmd, persona] = [args._[0], args._[1]];
const API = process.env.CURATE_API_BASE ?? "https://api.curatefashions.com";
const ADD_COST_USD = 0.075; // per piece, from ACCOUNT-PLAN.md (look + one NB2 drawing + tags)
const dry = !!args["dry-run"] || !args.yes;

type State = ReturnType<typeof AccountState.parse>;
type Item = { id: string; itemName?: string; sourcePhotoId?: string };

const pdir = () => join(LIB, "people", persona);
const account = () => PersonaAccount.parse(readJson(join(pdir(), "account.json")));
const statePath = () => join(pdir(), "account-state.json");
const loadState = (uid: string, env: "prod" | "staging"): State =>
  existsSync(statePath()) ? AccountState.parse(readJson(statePath())) : AccountState.parse({ persona, uid, env, updatedAt: new Date().toISOString(), updatedBy: "tools/persona" });
const saveState = (s: State) => {
  s.updatedAt = new Date().toISOString();
  s.updatedBy = `tools/persona (${process.env.CURATE_AGENT ?? "agent"})`;
  writeJson(statePath(), { $schema: "../../../catalog/schemas/account-state.schema.json", ...AccountState.parse(s) });
};

// Derived layers made from her photos (tools/photo3d: depth maps, cut-outs, plates) share her camera-roll
// manifest but are not photos on her phone: never load them into the simulator.
const desired = (kind: string, folder: string): IndexEntry[] =>
  loadIndex().assets.filter((e) => e.kind === kind && e.manifest === `library/${folder}/${persona}/manifest.json` && (e.asset as { source?: { type?: string } }).source?.type !== "derived" && (e.status === "approved" || (args["include-drafts"] && e.status === "draft")));

// ---------------------------------------------------------------- auth + API

const firebaseKey = (): string => {
  if (process.env.CURATE_FIREBASE_WEB_API_KEY) return process.env.CURATE_FIREBASE_WEB_API_KEY;
  const f = join(ROOT, "..", "curate-app", "lib", "firebase_options.dart");
  const m = existsSync(f) ? /FirebaseOptions web = FirebaseOptions\(\s*apiKey: '([^']+)'/.exec(readFileSync(f, "utf8")) : null;
  if (!m) throw new Error("No Firebase web API key: set CURATE_FIREBASE_WEB_API_KEY or keep ../curate-app checked out");
  return m[1];
};

const signIn = async (): Promise<{ token: string; uid: string }> => {
  const a = account();
  if (a.status !== "active" || !a.email || !a.secret) throw new Error(`${persona}'s account is "${a.status}" (needs status active, email and secret in account.json)`);
  const pw = aws(["ssm", "get-parameter", "--name", a.secret.name, "--with-decryption", "--query", "Parameter.Value", "--output", "text"], true)?.trim();
  if (!pw) throw new Error(`could not read SSM ${a.secret.name} (does it exist? do you have ssm:GetParameter + kms:Decrypt?)`);
  const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseKey()}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: a.email, password: pw, returnSecureToken: true }),
  });
  if (!r.ok) throw new Error(`Firebase sign-in failed: HTTP ${r.status}`);
  const j = (await r.json()) as { idToken: string; localId: string };
  if (a.uid && a.uid !== j.localId) throw new Error(`signed in as ${j.localId}, but account.json says uid ${a.uid}; refusing`);
  return { token: j.idToken, uid: j.localId };
};

const api = async <T>(token: string, method: string, path: string, body?: unknown): Promise<T> => {
  const r = await fetch(`${API}${path}`, { method, headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  if (!r.ok) throw new Error(`${method} ${path}: HTTP ${r.status}`);
  return (await r.json().catch(() => ({}))) as T;
};
const liveItems = async (token: string) => (await api<{ items?: Item[] }>(token, "GET", "/api/v1/wardrobe")).items ?? [];

// ---------------------------------------------------------------- wardrobe

const plan = (s: State, want: IndexEntry[], live: Item[] | null) => {
  const liveIds = live ? new Set(live.map((i) => i.id)) : null;
  const adds: IndexEntry[] = [];
  const adopt: { e: IndexEntry; items: Item[] }[] = [];
  const removes: State["wardrobe"] = [];
  for (const e of want) {
    const link = s.wardrobe.find((w) => w.libraryId === e.id && (w.status === "synced" || w.status === "pending"));
    const present = link && (!liveIds || link.appItemIds.every((id) => liveIds.has(id)));
    if (present) continue;
    const found = live?.filter((i) => i.sourcePhotoId === `cm:${e.id}`) ?? [];
    if (found.length) adopt.push({ e, items: found });
    else adds.push(e);
  }
  const wantIds = new Set(want.map((e) => e.id));
  for (const w of s.wardrobe) if (w.status === "synced" && w.libraryId && !wantIds.has(w.libraryId) && w.via === "api-add-photo") removes.push(w);
  const known = new Set(s.wardrobe.flatMap((w) => w.appItemIds));
  const unmanaged = (live ?? []).filter((i) => !known.has(i.id) && !adopt.some((a) => a.items.includes(i)));
  return { adds, adopt, removes, unmanaged };
};

const wardrobeSync = async () => {
  const a = account();
  const want = desired("garment", "wardrobe");
  let auth: { token: string; uid: string } | null = null;
  try {
    auth = await signIn();
  } catch (e) {
    if (!dry) throw e;
    console.log(`(offline dry run: ${(e as Error).message})`);
  }
  const s = loadState(auth?.uid ?? a.uid ?? "unknown", a.env);
  const live = auth ? await liveItems(auth.token) : null;
  const p = plan(s, want, live);
  const max = args.max ? Number(args.max) : Infinity;
  console.log(`${persona}: ${want.length} pieces wanted (${args["include-drafts"] ? "approved + drafts" : "approved only"}); ${live ? `${live.length} items live` : "live wardrobe not read"}`);
  for (const e of p.adds.slice(0, max)) console.log(`  ADD     ${e.id}  (${e.title})`);
  for (const x of p.adopt) console.log(`  ADOPT   ${x.e.id}  <- ${x.items.map((i) => i.id).join(", ")} (already in the app)`);
  for (const w of p.removes) console.log(`  REMOVE  ${w.libraryId}  -> items ${w.appItemIds.join(", ")}`);
  for (const u of p.unmanaged) console.log(`  unmanaged (left alone)  ${u.id}  ${u.itemName ?? ""}`);
  const n = Math.min(p.adds.length, max);
  console.log(`plan: ${n} add, ${p.adopt.length} adopt, ${p.removes.length} remove; est. server AI spend $${(n * ADD_COST_USD).toFixed(2)}`);
  if (dry) return console.log(args.yes ? "" : "dry run. Re-run with --yes to apply (adds spend server AI credits: get the founder's OK).");

  const now = () => new Date().toISOString();
  for (const x of p.adopt) {
    s.wardrobe.push({ libraryId: x.e.id, sha256: x.e.files[0].sha256, photoId: `cm:${x.e.id}`, appItemIds: x.items.map((i) => i.id), appNames: x.items.map((i) => i.itemName ?? ""), via: "api-add-photo", status: "synced", at: now() });
    saveState(s);
  }
  for (const w of p.removes) {
    for (const id of w.appItemIds) await api(auth!.token, "DELETE", `/api/v1/wardrobe/items/${encodeURIComponent(id)}`);
    w.status = "removed";
    w.at = now();
    saveState(s);
    console.log(`removed ${w.libraryId}`);
  }
  for (const e of p.adds.slice(0, max)) {
    const f = join(LIB, e.files[0].path);
    if (!existsSync(f)) throw new Error(`${e.id}: file not on disk; run tools/sync pull --only ${e.id}`);
    const photoId = `cm:${e.id}`;
    const link = { libraryId: e.id, sha256: sha256File(f), photoId, appItemIds: [] as string[], appNames: [] as string[], via: "api-add-photo" as const, status: "pending" as "pending" | "synced" | "failed", at: now() };
    s.wardrobe = s.wardrobe.filter((w) => !(w.libraryId === e.id && w.status !== "synced"));
    s.wardrobe.push(link);
    saveState(s);
    await api(auth!.token, "POST", "/api/v1/wardrobe/add-photo", { photoBase64: readFileSync(f).toString("base64"), photoId });
    s.spendUsd += ADD_COST_USD;
    // add-photo is async (202): wait for the pieces to appear
    for (let t = 0; t < 36 && !link.appItemIds.length; t++) {
      await new Promise((r) => setTimeout(r, 5000));
      const got = (await liveItems(auth!.token)).filter((i) => i.sourcePhotoId === photoId);
      if (got.length) {
        link.appItemIds = got.map((i) => i.id);
        link.appNames = got.map((i) => i.itemName ?? "");
        link.status = "synced";
      }
    }
    if (!link.appItemIds.length) Object.assign(link, { status: "failed", note: "no item came back within 3 min; check the app, then run status" });
    saveState(s);
    console.log(`${link.status.padEnd(7)} ${e.id}  ${link.appNames.join(", ")}`);
  }
  s.unmanaged = p.unmanaged.map((u) => ({ appItemId: u.id, appName: u.itemName }));
  saveState(s);
};

// ---------------------------------------------------------------- camera roll (simulator)

const roll = () => {
  const a = account();
  const udid = String(args.device ?? a.devices.find((d) => d.kind === "simulator")?.id ?? readFileSync(join(ROOT, "tools", "sim-udid.txt"), "utf8").trim());
  let want = desired("photo", "camera-roll");
  if (args["with-stock"]) want = want.concat(loadIndex().assets.filter((e) => e.kind === "stock" && (e.status === "approved" || (args["include-drafts"] && e.status === "draft"))));
  const s = loadState(a.uid ?? "unknown", a.env);
  const cur = s.cameraRoll.find((c) => c.device === udid);
  const loaded = new Set(cur?.libraryIds ?? []);
  const wantIds = want.map((e) => e.id);
  const adds = want.filter((e) => !loaded.has(e.id));
  const removes = [...loaded].filter((id) => !wantIds.includes(id));
  const reset = removes.length > 0 || !!args.reset;
  console.log(`${persona} on ${udid}: ${want.length} photos wanted, ${loaded.size} recorded as loaded`);
  for (const e of adds) console.log(`  ADD     ${e.id}`);
  for (const id of removes) console.log(`  REMOVE  ${id}`);
  if (reset) console.log("  simctl can't delete single photos: this RESETS the simulator's photo library and re-adds all wanted photos");
  if (dry) return console.log("dry run. Re-run with --yes to apply.");
  if (!adds.length && !reset) return console.log("nothing to do");
  // copy out of ~/Desktop first: the simulator hangs on Desktop privacy prompts
  const tmp = join("/tmp", "curate-motion-roll", persona);
  rmSync(tmp, { recursive: true, force: true });
  mkdirSync(tmp, { recursive: true });
  const toAdd = reset ? want : adds;
  const paths = toAdd.map((e, i) => {
    const src = join(LIB, e.files[0].path);
    if (!existsSync(src)) throw new Error(`${e.id}: not on disk; run tools/sync pull --only ${e.id}`);
    const dst = join(tmp, `${String(i + 1).padStart(3, "0")}-${e.id.replace(/\./g, "_")}${src.slice(src.lastIndexOf("."))}`);
    copyFileSync(src, dst);
    return dst;
  });
  const sim = (...xs: string[]) => execFileSync("xcrun", ["simctl", ...xs], { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" });
  if (reset) {
    try {
      sim("shutdown", udid);
    } catch {
      /* already shut down */
    }
    const media = join(process.env.HOME!, "Library", "Developer", "CoreSimulator", "Devices", udid, "data", "Media");
    for (const d of ["DCIM", "PhotoData"]) rmSync(join(media, d), { recursive: true, force: true });
    sim("boot", udid);
    sim("bootstatus", udid, "-b");
  }
  sim("addmedia", udid, ...paths);
  const ids = reset ? wantIds : [...loaded, ...adds.map((e) => e.id)];
  s.cameraRoll = s.cameraRoll.filter((c) => c.device !== udid).concat({ device: udid, libraryIds: ids, loadedAt: new Date().toISOString(), method: "simctl-addmedia" });
  saveState(s);
  console.log(`loaded ${paths.length} photos${reset ? " after a reset" : ""}`);
};

const status = () => {
  const a = account();
  const s = existsSync(statePath()) ? AccountState.parse(readJson(statePath())) : null;
  console.log(`${persona}: account ${a.status}${a.email ? ` (${a.email})` : ""}; state file ${s ? `updated ${s.updatedAt} by ${s.updatedBy}` : "not written yet"}`);
  console.log(`  wardrobe wanted: ${desired("garment", "wardrobe").length} approved${args["include-drafts"] ? "+draft" : ""}; recorded: ${s?.wardrobe.filter((w) => w.status === "synced").length ?? 0} synced, ${s?.wardrobe.filter((w) => w.status === "pending" || w.status === "failed").length ?? 0} pending/failed, ${s?.unmanaged.length ?? 0} unmanaged`);
  for (const c of s?.cameraRoll ?? []) console.log(`  photos on ${c.device}: ${c.libraryIds.length} (loaded ${c.loadedAt})`);
};

try {
  if (!persona || !existsSync(join(LIB, "people", persona ?? "", "account.json"))) throw new Error("usage: tools/persona status|sync|roll <persona> (needs library/people/<persona>/account.json)");
  if (cmd === "sync") await wardrobeSync();
  else if (cmd === "roll") roll();
  else status();
} catch (e) {
  console.log(`ERROR ${(e as Error).message}`);
  process.exit(1);
}
