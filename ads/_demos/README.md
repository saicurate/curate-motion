# ads/_demos: concept animatics (gate "explore")

Rough demo videos of new ad ideas, made BEFORE the studio process (pre-G2) so the founder can judge
the idea, the hook, the story and the transitions fast. Not polished, never posted.

- Six concepts (2026-10-16), one folder each: `nothing-to-wear`, `camera-roll-closet`, `zee-critic`,
  `speed-run`, `outfit-change`, `satisfying-sort`.
- `concepts.ts` is the one source for every concept's hook, beats, transitions, AI-video shots,
  music direction and "why it stops the scroll"; `make-specs.ts` writes each `ad.json` from it
  (status `draft`, `gate: "explore"`, 30 fps).
- Each folder: `timeline.ts` (beats, sound cues, timing: pure data) and `index.tsx` (the picture).
  Shared: `kit.tsx` (beat labels, the grey "AI VIDEO SHOT LATER" box, TikTok captions, a plain phone),
  `data.ts` (her pieces by colour, her camera roll, the app's real looks), `module.ts` (props, length).
- Render: `node ads/_demos/render.ts [slug…]` stages each demo's assets, renders 540×960 at 30 fps
  (`--scale 0.5` of the 9x16 composition `<id>--9x16--15s`; `metadata` sets the real 11–12 s),
  synthesises its sound (`sound.ts`, motion/sound) and mixes it in, into
  `../marketing/videos/cuts/demo-<n>-<slug>-v<N>.mp4` (never overwritten).
- Temp music: six Kevin MacLeod tracks from Incompetech (`music.incompetech.*`, draft, CC BY 4.0:
  the credit line is in each asset's licence; or $30 a track for the no-credit Standard licence).
- Grey boxes are placeholders for shots that would be AI video later; garments, Zee, her camera
  roll, screenshots and footage are the real library assets.

Promote a concept by copying its folder to `ads/<new-id>/` and running it through `/motion-reel`.
