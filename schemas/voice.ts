// The voiceover as CONFIG (decisions/0009). Three modes, one switch:
//   captions  no voice; the script runs as burned-in captions (silent autoplay on social)
//   human     a recorded take (one file per line, or one take + line timestamps)
//   tts       a text-to-speech voice from a pluggable provider (tools/voice generate)
// Captions are ALWAYS available whatever the mode: burned in, as a sidecar .srt/.vtt, or both.
//
// Where it lives:
//   config/voice.json           the default mode + every mode's settings        (VoiceConfig)
//   ads/<ad>/ad.json › voice     a per-ad override                                (VoiceOverride)
//   tools/render --voice <mode> [--tts <profile>]   a per-render override         (VoiceOverride)
//   ads/<ad>/script.json         the words, as data                               (Script)
// Precedence: render flag > ad.json > config/voice.json.
//
// Imports only zod (see asset.ts): loaded by Node (tools/) and by the Remotion bundle (motion/).
import { z } from "zod";
import { AssetId, SEGMENT } from "./asset.ts";

export const VOICE_MODES = ["captions", "human", "tts"] as const;
export const VoiceMode = z.enum(VOICE_MODES);
export type VoiceMode = z.infer<typeof VoiceMode>;

/** TTS providers with an adapter in tools/lib/voice.ts. Add one there, then add its name here. */
export const TTS_PROVIDERS = ["openai", "elevenlabs", "say"] as const;
export const TtsProvider = z.enum(TTS_PROVIDERS);

// ---------------------------------------------------------------- captions

/** Colour tokens from motion/theme.ts (never a hex here: RULES.md › House style). */
export const ColourToken = z.enum(["ink", "strong", "winterGrey", "t2", "t3", "card", "ground"]);

/**
 * A caption look. The brand preset is BRAND.md's signature device: Geist, body text in Winter
 * Gray, the key phrases in near-black Medium, on a soft white plate so it reads over any picture.
 */
export const CaptionStyle = z.object({
  font: z.literal("Geist").default("Geist"),
  bodyWeight: z.number().int().default(400),
  keyWeight: z.number().int().default(500),
  bodyColour: ColourToken.default("winterGrey"),
  keyColour: ColourToken.default("ink"),
  /** "card" = a soft white rounded plate behind the line; "none" = text only. */
  plate: z.enum(["card", "none"]).default("card"),
  /** Type size in u (1% of the frame's short side). */
  size: z.number().positive().default(4.3),
  /** Width of the caption block, % of the frame width. */
  maxWidth: z.number().positive().max(100).default(84),
  /** lower = above the platform's bottom safe area; upper = below the top one. */
  position: z.enum(["lower", "upper"]).default("lower"),
});
export type CaptionStyle = z.infer<typeof CaptionStyle>;

export const CaptionsSettings = z.object({
  /** A key of captionPresets. */
  preset: z.string().default("brand-keyphrase"),
  /** Draw the captions into the picture. Forced on in captions mode (otherwise it would be silent and wordless). */
  burnIn: z.boolean().default(true),
  /** Sidecar caption files tools/render writes next to each mp4 (for platforms that take them). */
  sidecar: z.array(z.enum(["srt", "vtt"])).default(["srt", "vtt"]),
});

// ---------------------------------------------------------------- tts

/** One named TTS voice: provider + voice + delivery. Switching voices = changing `tts.use`. */
export const TtsProfile = z.object({
  provider: TtsProvider,
  /** Provider model, e.g. "gpt-4o-mini-tts" (OpenAI) or "eleven_multilingual_v2" (ElevenLabs). Not used by `say`. */
  model: z.string().optional(),
  /** Provider voice: a name, e.g. "marin" (OpenAI) or "Samantha" (macOS say), or a voice id (ElevenLabs, e.g. "EXAVITQu4vr4xnSDxMaL"). */
  voice: z.string().min(1),
  /** What people call the voice, when `voice` is an id (ElevenLabs "Sarah"). Display only: not part of the cache key. */
  name: z.string().optional(),
  /** 1 = the provider's normal pace. */
  speed: z.number().min(0.5).max(2).default(1),
  /** Delivery direction in plain words (OpenAI `instructions`). Ignored by providers that can't take it. */
  style: z.string().optional(),
  /** File format the provider returns. */
  format: z.enum(["mp3", "m4a", "wav"]).default("mp3"),
  /** True for offline previews whose output may never ship (macOS say). */
  previewOnly: z.boolean().default(false),
  note: z.string().optional(),
});
export type TtsProfile = z.infer<typeof TtsProfile>;

export const TtsSettings = z.object({
  /** The profile in use: a key of `profiles`. THE one-line edit to change the AI voice. */
  use: z.string().regex(SEGMENT),
  /**
   * The most USD that paid TTS may ever cost, summed over every voice asset in the catalog plus
   * the run about to happen. 0 = no paid generation at all. Only the founder raises it
   * (no paid calls without their OK). Free providers (say) don't count against it.
   */
  spendCapUsd: z.number().nonnegative().default(0),
  profiles: z.record(z.string().regex(SEGMENT), TtsProfile),
});

// ---------------------------------------------------------------- human

/** Which recordings an ad uses. Either one file per line, or one take with line marks, or both (per-line wins). */
export const HumanVoice = z.object({
  /** A whole take (a voice asset whose `lines[]` mark where each script line is). */
  take: AssetId.optional(),
  /** Per-line files: { "l01": "voice.explainer.l01-take-1.v1" }. */
  lines: z.record(z.string(), AssetId).default({}),
});

// ---------------------------------------------------------------- timing

export const VoiceTiming = z.object({
  /** Shortest pause between two voiced lines. */
  gapSec: z.number().nonnegative().default(0.3),
  /** Room after a scene's last voiced line before the next scene starts. */
  tailSec: z.number().nonnegative().default(0.6),
  /** How far the music dips under the voice, in dB (negative). */
  duckDb: z.number().max(0).default(-14),
});

// ---------------------------------------------------------------- the config file

export const VoiceConfig = z
  .object({
    $schema: z.string().optional(),
    /** THE switch: captions | human | tts. */
    mode: VoiceMode,
    captions: CaptionsSettings.default({ preset: "brand-keyphrase", burnIn: true, sidecar: ["srt", "vtt"] }),
    captionPresets: z.record(z.string(), CaptionStyle),
    timing: VoiceTiming.default({ gapSec: 0.3, tailSec: 0.6, duckDb: -14 }),
    tts: TtsSettings,
    /** Default human settings (normally per ad, in ad.json › voice.human). */
    human: HumanVoice.default({ lines: {} }),
  })
  .superRefine((c, ctx) => {
    if (!c.captionPresets[c.captions.preset]) ctx.addIssue({ code: "custom", message: `captions.preset "${c.captions.preset}" is not in captionPresets`, path: ["captions", "preset"] });
    if (!c.tts.profiles[c.tts.use]) ctx.addIssue({ code: "custom", message: `tts.use "${c.tts.use}" is not in tts.profiles`, path: ["tts", "use"] });
    if (!c.captions.burnIn && c.captions.sidecar.length === 0) ctx.addIssue({ code: "custom", message: "captions must always be available: burnIn or at least one sidecar", path: ["captions"] });
  });
export type VoiceConfig = z.infer<typeof VoiceConfig>;

/** A partial override: ad.json › voice, or tools/render --voice / --tts. */
export const VoiceOverride = z.object({
  mode: VoiceMode.optional(),
  captions: CaptionsSettings.partial().optional(),
  tts: z.object({ use: z.string().regex(SEGMENT).optional() }).optional(),
  human: HumanVoice.partial().optional(),
});
export type VoiceOverride = z.infer<typeof VoiceOverride>;

// ---------------------------------------------------------------- the script

export const ScriptScene = z.object({
  key: z.string().regex(SEGMENT),
  title: z.string(),
  /** Where the scene starts and ends in the full film, seconds. Captions-only timing uses these as they are. */
  startHint: z.number().nonnegative(),
  endHint: z.number().positive(),
  /** What's on screen (for whoever builds the scene; not shown). */
  picture: z.string().optional(),
});

export const ScriptLine = z.object({
  /** Stable id: l01, l02 … Never renumber; a new line gets the next free id. */
  id: z.string().regex(/^l\d{2,3}$/, "line ids are l01, l02 …"),
  scene: z.string().regex(SEGMENT),
  /** What is said, and what the caption shows. */
  text: z.string().min(1),
  /** Optional pronunciation for TTS only (the caption still shows `text`). */
  spoken: z.string().optional(),
  /** Seconds in the full film: when the line should start / end. Voiced lines start here or later. */
  startHint: z.number().nonnegative(),
  endHint: z.number().positive(),
  /** Phrases (exact substrings of `text`) the caption sets in near-black: the brand's key-phrase device. */
  keyPhrases: z.array(z.string()).default([]),
});
export type ScriptLine = z.infer<typeof ScriptLine>;

export const Script = z
  .object({
    $schema: z.string().optional(),
    ad: z.string().regex(SEGMENT),
    title: z.string(),
    /** Where the words came from. */
    source: z.string().optional(),
    language: z.string().default("en-US"),
    scenes: z.array(ScriptScene).min(1),
    lines: z.array(ScriptLine).min(1),
    /** Which scenes each length variant plays, by length in seconds: { "30": ["problem", "meet-zee", "photos"] }. Absent = every scene. */
    cuts: z.record(z.string(), z.array(z.string().regex(SEGMENT))).default({}),
  })
  .superRefine((s, ctx) => {
    const keys = new Set(s.scenes.map((x) => x.key));
    const ids = new Set<string>();
    s.lines.forEach((l, i) => {
      if (ids.has(l.id)) ctx.addIssue({ code: "custom", message: `duplicate line id ${l.id}`, path: ["lines", i, "id"] });
      ids.add(l.id);
      if (!keys.has(l.scene)) ctx.addIssue({ code: "custom", message: `line ${l.id}: no scene "${l.scene}"`, path: ["lines", i, "scene"] });
      if (l.endHint <= l.startHint) ctx.addIssue({ code: "custom", message: `line ${l.id}: endHint must be after startHint`, path: ["lines", i, "endHint"] });
      for (const k of l.keyPhrases) if (!l.text.includes(k)) ctx.addIssue({ code: "custom", message: `line ${l.id}: key phrase "${k}" is not in its text`, path: ["lines", i, "keyPhrases"] });
    });
    for (const [len, ks] of Object.entries(s.cuts)) for (const k of ks) if (!keys.has(k)) ctx.addIssue({ code: "custom", message: `cut ${len}: no scene "${k}"`, path: ["cuts", len] });
    s.scenes.forEach((sc, i) => {
      if (sc.endHint <= sc.startHint) ctx.addIssue({ code: "custom", message: `scene ${sc.key}: endHint must be after startHint`, path: ["scenes", i] });
    });
  });
export type Script = z.infer<typeof Script>;
