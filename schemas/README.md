# schemas/

The zod source of truth. Imports nothing but zod, so Node tools and the Remotion bundle share it.

- `asset.ts`: the id grammar, one schema per asset kind (13), the manifest and index shapes.
- `ad.ts`: `ad.json`, the format presets (9x16 … appstore), lengths, channels, composition and render naming.
- `voice.ts`: `config/voice.json` (VoiceConfig), the per-ad / per-render VoiceOverride, `ads/<ad>/script.json` (Script).
- `prompt.ts`: a prompt file's front matter (`prompts/<area>/<name>.v<N>.md`), the prompt id grammar, `catalog/prompts.json`.
- `inspo.ts`: an inspo entry's front matter (`inspo/<id>.md`), the inspo id grammar, `catalog/inspo.json`.
- `account.ts`: a persona's `account.json` and `account-state.json` (no passwords, ever).
- **Doesn't go here:** data or logic beyond validation.
- **Example:** add a field to `GarmentAsset`, then `tools/catalog build` regenerates `catalog/schemas/asset.garment.schema.json`.
