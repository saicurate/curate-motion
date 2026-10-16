# reviews/

The critic's evidence, per ad and round (`tools/critic <ad>`, the studio process: decisions/0011,
`.claude/skills/motion-reel/SKILL.md`).

`reviews/<ad>/<YYYY-MM-DD>/round-<N>/`: `contact.jpg`, `strip.jpg`, `strip-zoom.jpg`, `phone.jpg`,
`loop.mp4`, `seam.jpg`, `audio.wav`, `waveform.png`, `det/` (local only: media never goes in git)
and `metrics.json` + `review.md` (tracked). `reviews/<ad>/scores.json`: every round's scores
(`tools/critic score`).

- **Goes here:** critic rounds and their scores.
- **Doesn't:** renders (→ `renders/`), stills for a board (→ `ads/<ad>/out/`).
- **Example:** `reviews/pop-out-v2/2026-10-15/round-1/review.md` (the strip test that shows v2's echo).
