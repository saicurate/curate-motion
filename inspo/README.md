# inspo/

The inspo board: things we love and want to come back to. Reels, ads, videos, images, links,
screenshots of competitors' apps, typefaces, colour ideas.

- **One file per inspiration:** `inspo/<id>.md`, id `inspo.<source>.<name>.v<N>` (source = where it's
  from: `creator`, `competitor`, `founder`, `tiktok`, `app`…). Front matter (YAML, schema
  `schemas/inspo.ts`): `id, title, kind (video | image | link | audio | app-screen | ad | other),
  status (active | archived), url, asset, source, addedBy, addedAt, love[], techniques {transitions,
  pacing, type, colour, other}, useFor[], tags[], links[]`. The body is free notes, plus a
  `## Breakdown` section that `tools/inspo breakdown` writes (between `<!-- breakdown:… -->` markers;
  re-running replaces it).
- **Media lives in the library, not here:** as kind `reference` (`library/references/<name>/`, S3),
  licence "Third-party content, reference only", restriction `never-ship`. Contact sheets from a
  breakdown are derived reference assets (`reference.<source>.<name>-sheet.vN`).
- **Never shipped.** An ad that lists a `reference` asset fails `tools/catalog validate`, and
  `tools/render` refuses it (RULES.md › 9). Borrow the technique, never the footage.
- **Use it:** `tools/inspo add <file | url> --title … --love … --tags …`, `tools/inspo search --use-for
  c14`, `tools/inspo breakdown <id>` (free and local: ffprobe/ffmpeg), `tools/inspo archive <id>`. Or the
  founder's page, `tools/library-ui` › Inspo (drag and drop or paste a link). Full guide: AGENTS.md ›
  "Inspo: add and reference".
- **Doesn't go here:** media files, our own assets that ship (those are library assets), secrets.
- **Example:** `inspo/inspo.creator.pop-off-reel.v1.md`, the founder's WhatsApp reel behind concept
  c14 and the `pop-out` ad.
