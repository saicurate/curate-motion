// The narration plan: config + ad override + render override + script + catalog → one timeline.
// Pure TypeScript (zod schemas only, no Remotion), so the SAME code runs in the Remotion bundle
// (<Narration>, an ad's calculateMetadata) and in Node (tools/render stages the audio and writes
// the sidecar captions; tools/voice prints the plan). See decisions/0009-voice-as-config.md.
//
// Timing:
//   captions  every scene and line sits exactly on the script's hints.
//   voiced    (human / tts) each line starts at its hint or right after the previous line
//             (+ timing.gapSec), whichever is later, and lasts as long as its audio. A scene ends
//             timing.tailSec after its last line, and is never shorter than its hint: scenes grow to
//             fit the voice, they are never squashed.
import { VoiceConfig, type CaptionStyle, type Script, type ScriptLine, type TtsProfile, type VoiceMode, type VoiceOverride } from "../schemas/voice.ts";

// ---------------------------------------------------------------- resolve the config

export type ResolvedVoice = {
  mode: VoiceMode;
  captions: { preset: string; style: CaptionStyle; burnIn: boolean; sidecar: ("srt" | "vtt")[] };
  timing: { gapSec: number; tailSec: number; duckDb: number };
  tts: { use: string; profile: TtsProfile };
  human: { take?: string; lines: Record<string, string> };
  /** Where each setting came from, for `tools/voice plan`. */
  from: { mode: "render" | "ad" | "config" };
};

export const resolveVoice = (configRaw: unknown, adVoice?: VoiceOverride, override?: VoiceOverride): ResolvedVoice => {
  const cfg = VoiceConfig.parse(configRaw);
  const mode = override?.mode ?? adVoice?.mode ?? cfg.mode;
  const captions = { ...cfg.captions, ...(adVoice?.captions ?? {}), ...(override?.captions ?? {}) };
  const style = cfg.captionPresets[captions.preset];
  if (!style) throw new Error(`caption preset "${captions.preset}" is not in config/voice.json › captionPresets`);
  const use = override?.tts?.use ?? adVoice?.tts?.use ?? cfg.tts.use;
  const profile = cfg.tts.profiles[use];
  if (!profile) throw new Error(`TTS profile "${use}" is not in config/voice.json › tts.profiles (have: ${Object.keys(cfg.tts.profiles).join(", ")})`);
  return {
    mode,
    // Captions-only must show the words: burn-in is forced on in that mode.
    captions: { preset: captions.preset, style, burnIn: mode === "captions" ? true : captions.burnIn, sidecar: captions.sidecar },
    timing: cfg.timing,
    tts: { use, profile },
    human: {
      take: override?.human?.take ?? adVoice?.human?.take ?? cfg.human.take,
      lines: { ...cfg.human.lines, ...(adVoice?.human?.lines ?? {}), ...(override?.human?.lines ?? {}) },
    },
    from: { mode: override?.mode ? "render" : adVoice?.mode ? "ad" : "config" },
  };
};

// ---------------------------------------------------------------- find the audio for a line

/** The parts of a catalog index entry the plan reads (motion/assets.ts and tools/lib/catalog.ts both have them). */
export type IndexLike = { id: string; kind: string; status: string; files: { role: string; path: string }[]; asset: Record<string, unknown> };

export type VoiceLineMark = { line: string; text?: string; startSec: number; endSec: number };
type VoiceRec = {
  ad: string;
  origin: "tts" | "human";
  durationSec: number;
  lines: VoiceLineMark[];
  previewOnly?: boolean;
  tts?: { provider: string; model?: string; voice: string; speed: number; style?: string; format: string; text: string };
};

/** What TTS is asked to say for a line (its pronunciation override, else its text). */
export const spokenText = (l: ScriptLine) => l.spoken ?? l.text;

/** The fields that make a TTS clip unique: same text + same voice settings = same clip (the cache key hashes these). */
export const ttsIdentity = (text: string, p: TtsProfile) => ({
  text,
  provider: p.provider,
  model: p.model ?? "",
  voice: p.voice,
  speed: p.speed,
  style: p.style ?? "",
  format: p.format,
});

const voiceOf = (e: IndexLike) => e.asset as unknown as VoiceRec;

export const findTtsClip = (index: IndexLike[], ad: string, line: ScriptLine, p: TtsProfile): IndexLike | undefined => {
  const want = ttsIdentity(spokenText(line), p);
  return index.find((e) => {
    if (e.kind !== "voice" || e.status === "retired") return false;
    const v = voiceOf(e);
    if (v.ad !== ad || v.origin !== "tts" || !v.tts || v.lines[0]?.line !== line.id) return false;
    return JSON.stringify(ttsIdentity(v.tts.text, v.tts as unknown as TtsProfile)) === JSON.stringify(want);
  });
};

export type LineAudio = { id: string; path: string; trimBeforeSec: number; durSec: number; previewOnly: boolean; status: string };

const audioFor = (index: IndexLike[], r: ResolvedVoice, ad: string, line: ScriptLine): LineAudio | null => {
  const byId = (id: string) => index.find((e) => e.id === id && e.kind === "voice");
  const fileOf = (e: IndexLike) => (e.files.find((f) => f.role === "original") ?? e.files[0]).path;
  if (r.mode === "tts") {
    const e = findTtsClip(index, ad, line, r.tts.profile);
    if (!e) return null;
    const v = voiceOf(e);
    return { id: e.id, path: fileOf(e), trimBeforeSec: 0, durSec: v.durationSec, previewOnly: !!v.previewOnly, status: e.status };
  }
  if (r.mode === "human") {
    const per = r.human.lines[line.id];
    const e = per ? byId(per) : r.human.take ? byId(r.human.take) : undefined;
    if (!e) return null;
    const v = voiceOf(e);
    const m = v.lines.find((x) => x.line === line.id) ?? (per ? { line: line.id, startSec: 0, endSec: v.durationSec } : undefined);
    if (!m) return null;
    return { id: e.id, path: fileOf(e), trimBeforeSec: m.startSec, durSec: m.endSec - m.startSec, previewOnly: !!v.previewOnly, status: e.status };
  }
  return null;
};

// ---------------------------------------------------------------- the plan

export type PlannedLine = { id: string; scene: string; text: string; keyPhrases: string[]; from: number; durationInFrames: number; audio: LineAudio | null };
export type PlannedScene = { key: string; from: number; durationInFrames: number };
export type NarrationPlan = {
  ad: string;
  fps: number;
  voice: ResolvedVoice;
  scenes: PlannedScene[];
  lines: PlannedLine[];
  totalFrames: number;
  /** Lines that should be voiced but have no audio yet (tools/voice generate / import). */
  missing: string[];
  /** True if any clip is a preview-only voice (macOS say): never for release. */
  previewOnly: boolean;
};

export const planNarration = (o: { script: Script; voice: ResolvedVoice; index: IndexLike[]; fps?: number; scenes?: string[] }): NarrationPlan => {
  const fps = o.fps ?? 30;
  const f = (sec: number) => Math.round(sec * fps);
  const keys = o.scenes ?? o.script.scenes.map((s) => s.key);
  const voiced = o.voice.mode !== "captions";
  const scenes: PlannedScene[] = [];
  const lines: PlannedLine[] = [];
  const missing: string[] = [];
  let at = 0;
  for (const key of keys) {
    const sc = o.script.scenes.find((s) => s.key === key);
    if (!sc) throw new Error(`${o.script.ad}: no scene "${key}" in script.json`);
    const hintDur = f(sc.endHint - sc.startHint);
    let cursor = 0;
    let lastEnd = 0;
    for (const l of o.script.lines.filter((x) => x.scene === key)) {
      const hintRel = f(l.startHint - sc.startHint);
      const audio = voiced ? audioFor(o.index, o.voice, o.script.ad, l) : null;
      if (voiced && !audio) missing.push(l.id);
      const start = voiced ? Math.max(hintRel, cursor) : hintRel;
      const dur = audio ? Math.max(1, f(audio.durSec)) : f(l.endHint - l.startHint);
      lines.push({ id: l.id, scene: key, text: l.text, keyPhrases: l.keyPhrases, from: at + start, durationInFrames: dur, audio });
      cursor = start + dur + f(o.voice.timing.gapSec);
      lastEnd = start + dur;
    }
    const d = voiced ? Math.max(hintDur, lastEnd + f(o.voice.timing.tailSec)) : hintDur;
    scenes.push({ key, from: at, durationInFrames: d });
    at += d;
  }
  return { ad: o.script.ad, fps, voice: o.voice, scenes, lines, totalFrames: at, missing, previewOnly: lines.some((l) => l.audio?.previewOnly) };
};

// ---------------------------------------------------------------- reading the plan (for ads)

export const sceneOf = (p: NarrationPlan, key: string): PlannedScene => {
  const s = p.scenes.find((x) => x.key === key);
  if (!s) throw new Error(`scene "${key}" is not in this cut`);
  return s;
};
export const lineOf = (p: NarrationPlan, id: string): PlannedLine => {
  const l = p.lines.find((x) => x.id === id);
  if (!l) throw new Error(`line "${id}" is not in this cut`);
  return l;
};
/** Roughly when a phrase is said inside a line (by its place in the text), so a picture can land on the word. */
export const phraseFrame = (p: NarrationPlan, id: string, phrase: string): number => {
  const l = lineOf(p, id);
  const i = Math.max(0, l.text.indexOf(phrase));
  return l.from + Math.round((l.durationInFrames * i) / Math.max(1, l.text.length));
};
/** Is a voiced line playing at this frame? */
export const speaking = (p: NarrationPlan, frame: number) => p.lines.some((l) => l.audio && frame >= l.from && frame < l.from + l.durationInFrames);
/** Music gain under the voice: 1, or timing.duckDb down while a line plays, with 6-frame ramps. */
export const duckGain = (p: NarrationPlan, frame: number): number => {
  const low = Math.pow(10, p.voice.timing.duckDb / 20);
  let g = 1;
  for (const l of p.lines) {
    if (!l.audio) continue;
    const a = l.from - 6;
    const b = l.from + l.durationInFrames + 6;
    if (frame <= a || frame >= b) continue;
    const t = Math.min(1, (frame - a) / 6, (b - frame) / 6);
    g = Math.min(g, 1 - (1 - low) * t);
  }
  return g;
};

// ---------------------------------------------------------------- sidecar captions

const stamp = (frame: number, fps: number, sep: "," | ".") => {
  const ms = Math.round((frame / fps) * 1000);
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const pad = (n: number, w = 2) => String(n).padStart(w, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}${sep}${pad(ms % 1000, 3)}`;
};

export const toSrt = (p: NarrationPlan) =>
  p.lines.map((l, i) => `${i + 1}\n${stamp(l.from, p.fps, ",")} --> ${stamp(l.from + l.durationInFrames, p.fps, ",")}\n${l.text}\n`).join("\n");

export const toVtt = (p: NarrationPlan) =>
  `WEBVTT\n\n${p.lines.map((l) => `${l.id}\n${stamp(l.from, p.fps, ".")} --> ${stamp(l.from + l.durationInFrames, p.fps, ".")}\n${l.text}\n`).join("\n")}`;
