# explainer: Curate, explained

The app explainer (2:50 when complete). **Built so far: the opening chapter** (the problem, Meet
Zee, "Already in your photos"), ported from the round-2 ExOpen motion test
(`ads/_legacy/remotion-src/mt/ExOpen.tsx`). Compositions: `explainer--9x16--30s`,
`explainer--16x9--30s`.

## Files

- `ad.json`: the ad as data. No `voice` override yet, so it uses `config/voice.json`.
- `script.json`: **the voiceover, all 26 lines (244 words, 1,270 characters)** of the 2:50 film, with
  scenes, start/end hints and key phrases, from the round-2 script (tracker "explainer" entry).
  `cuts["30"]` = the scenes the 30-s variant plays.
- `index.tsx`: the opening. Every beat hangs off the narration plan (`sceneOf`, `lineOf`,
  `phraseFrame`), so it works on the script's hints (captions) and on a real voice's durations.
  The music's swell (Drawing the Sky, 14.8 s into the file) always lands where Meet Zee starts.
- `PhotoTile.tsx`: stand-in camera-roll tiles until Emma's real roll footage replaces them.
- `VOICE-OPTIONS.md`: the plain-English note for the founder (options and cost).

## The voice

One edit (AGENTS.md › "How to change the voice"). Today: `captions`. Preview clips exist for lines
l01–l07 with the free `say-preview` profile (macOS `say`, preview only). No paid voice has been made.

```bash
tools/voice plan explainer --length 30                 # what the current config gives
tools/render explainer --format 9x16 --length 30 --draft
tools/render explainer --format 9x16 --length 30 --draft --voice tts   # say-preview, for timing
```

## Reusable

`Narration` + `narration-plan.ts` (any ad with a `script.json`), the pile-shuffle and the
photo-pops-out-of-the-roll moves (candidates for `motion/` once a second ad needs them).

## Still to build

The scenes after the opening (scan, pure-float, chat, weather, try-ons, ready, outro) need Emma's
real app footage; their words and timings are already in `script.json`.
