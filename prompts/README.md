# prompts/

The prompt library: **every prompt we used, with how it went**. Worked or didn't, the founder's own
words and the ones agents wrote, so the next image, video, voice or brief starts from what worked,
and two good ones can be mixed into a hybrid.

- **One file per prompt:** `prompts/<area>/<name>.v<N>.md`, id `prompt.<area>.<name>.v<N>`.
  Front matter (YAML, schema `schemas/prompt.ts`): `id, title, author (founder | agent:<name> | other),
  area, target, outcome (worked | didn't | mixed | untested), rating (1–5), why, inputs, outputs,
  parents, tags, template, createdAt, usedAt[], costUsd, source, addedBy`. **The body is the prompt
  text itself**, exactly as sent.
- **Areas (folders):** `image-gen`, `video-gen`, `voice`, `music`, `copy`, `motion-brief`, `agent-brief`,
  `research`, `other`.
- **Templates** (`template: true`) have `{placeholders}`; the filled-in prompts list them as a parent.
  Remakes list the version they fixed as a parent; remixes list everything they were mixed from.
- **Links both ways:** `outputs` lists the library assets a prompt made; each of those assets has
  `source.promptId` pointing back. `tools/catalog validate` checks both, and that every id exists.
- **A used or rated prompt's text never changes** (CI checks it): `tools/prompts revise` makes vN+1.
  Rating, outcome, why, usedAt, outputs and tags can change any time.
- **Use it:** `tools/prompts search …` before writing a new prompt; `tools/prompts add | use | rate`
  after. Or the founder's page, `tools/library-ui` › Prompts. Full guide: AGENTS.md › "Prompts: find,
  use, rate, remix".
- **Doesn't go here:** secrets (refused on write; put keys in AWS SSM and write the NAME), media,
  outputs (those are library assets), one-off notes that aren't a prompt.
- **Example:** `tools/prompts search --area image-gen --outcome worked --text "ghost mannequin"`, then
  `tools/prompts show prompt.image-gen.garment-product-shot.v1 --text-only`.

Seeded 2026-10-15 from real history (pure extraction, no model calls): the image prompts behind Emma's
assets (rebuilt from `marketing/videos/assets/_tools/*.py`, outcomes from the picks and remakes, cost and
call times from `calls.jsonl`'s safe fields only), the founder's own asks and the main session's agent
briefs from the curate-app session (anything containing a key was left out), and the OpenAI voice
styles in `config/voice.json`. Seed ratings: 5 = the founder picked it, 4 = the first take that was used
(or the fix that worked), 3 = good but not chosen or partly worked, 2 = had to be remade. Founder asks
are unrated until the founder rates them.
