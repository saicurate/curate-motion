# 0009: The voiceover is config, not code

2026-10-15 · founder: "the explainer voice… it should be a config change"

**Context.** The explainer needs a voiceover, and the voice isn't picked yet: no voice (captions
only, for silent autoplay), a human recording, or an AI text-to-speech voice. Each choice changes
the audio and the timing (a real voice takes as long as it takes). If that choice lived in an ad's
code, every switch would mean editing and re-checking React.

**Decision.**
- `config/voice.json` (`schemas/voice.ts › VoiceConfig`) holds the default `mode`
  (`captions | human | tts`) and every mode's settings: the caption preset (BRAND.md's key-phrase
  device in Geist), TTS profiles (provider, voice, speed, style) with `tts.use` naming the one in
  use, the spend cap, timing (gaps, tail, music duck).
- An ad may override it in `ad.json › voice`, and one render may override both with
  `tools/render --voice <mode> [--tts <profile>]`.
- The words are data: `ads/<ad>/script.json` (line id, text, scene, start/end hints, key phrases,
  which scenes each length plays).
- `motion/narration-plan.ts` turns config + script + catalog into one timeline, the same code in the
  Remotion bundle and in Node. Captions-only follows the script's hints; a voiced cut follows the
  audio (scenes grow to fit, never squash). Ads hang their picture off the plan and render
  `<Narration>`; the video's length comes from the plan (`calculateMetadata`).
- Audio is ordinary library assets of kind `voice` (scope = the ad): TTS clips, one per line, cached
  by a sha256 of text + voice + settings; human takes with line marks. Licences are recorded per
  provider. Made by `tools/voice generate` (pluggable adapters: OpenAI, macOS `say`) and
  `tools/voice import`.
- Captions are always available: burned in (forced in captions mode) and/or `.srt` + `.vtt` sidecars.

**Why.** Switching voice is one line, so the founder can hear all three without an agent touching
code; the same ad code serves every voice. Making clips once and caching them keeps paid calls rare.

**Consequences.**
- Paid TTS is gated twice: `--yes` and `tts.spendCapUsd` ≥ spent + estimate (0 by default; only
  the founder raises it). Dry run is the default and costs nothing.
- macOS `say` is preview only (Apple's licence covers personal, non-commercial use): `previewOnly`
  clips can't be approved, are labelled on screen, and approved/live ads refuse them.
- An ad that wants a voice needs a `script.json` and must time its picture from the plan rather
  than hard-coded frames.
- A changed line makes a new clip version (new text, new hash); the old one stays until retired.
