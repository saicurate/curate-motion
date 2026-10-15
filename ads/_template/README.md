# ads/_template

Copy this folder to start an ad: `cp -R ads/_template ads/<ad-id>`. Then:
1. Fill `ad.json` (id = folder name, brief, channels, formats, lengths, track, every asset id, status `draft`).
2. Rename `TemplateAd` in `index.tsx` and build the ad from `motion/` components; media only by id.
3. Add one line to `ads/registry.ts`.
4. Replace this README with the ad's own (what it is, how it's built, what's reusable).
5. `npx tsc --noEmit && tools/catalog validate`, then `tools/render <ad-id> --draft`.
Not registered itself, so it never renders.
