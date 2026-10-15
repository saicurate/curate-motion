# RULES.md: content and legal rules for every Curate ad

These apply to every asset and every render. `tools/catalog validate` enforces the ones that can
be checked in data; the rest are checked at review. When a rule and a brief disagree, the rule wins.

## 1. Licences are tracked and required
- Every asset's manifest entry has a `licence` (name, commercial yes/no, restrictions, when checked,
  proof). The schema rejects an asset without one.
- Only `reference` assets may be non-commercial, and references are never shipped in an ad.
- Music: respect each track's restrictions. Mixkit's free licence allows web, social and online
  ads; it does NOT allow TV/radio broadcast, CDs/DVDs, video games, music-only remixes or Content ID
  registration. App Store previews count as online ads.
- Stock: Unsplash License (no Unsplash+), Pexels License. No identifiable faces, no logos.
- Fonts: Geist under the SIL Open Font License.
- Generated images: Curate-owned output; record the model and the cost.

## 2. No shopping, no prices
The app's Shop is hidden. No prices, "buy", "shop now", discount codes, store names or product
links in any ad. Garments are shown as the persona's own clothes.

## 3. Never show the pipeline
The consumer never sees how it works inside: no model names, "AI is analysing…", step lists,
progress bars of internals, debug text or JSON. Scans and traces are motion flourishes, not
explanations.

## 4. No logos
No third-party logos or trademarks in frame: garments are logo-free product shots, stock is
checked by eye, app footage must not show other brands. Curate's own logo and Zee are fine.

## 5. FTC: personas never vouch for products
Emma (and every persona) is made up. She shows her own clothes and uses the app; she never says a
product or merchant is good ("worth it", "true to size", "my favourite brand", "best jeans"). No
fake testimonials, ratings or reviews. A persona may react to Curate's styling ("that works"),
never endorse a product.

## 6. "AI-generated" where platforms require it
Each asset carries `aiGenerated`. An ad that shows AI-generated realistic people or scenes
(Emma's photos, try-ons) gets the platform's AI label: TikTok "AI-generated content" toggle,
Meta "AI info", YouTube "altered or synthetic content". Record it in `ad.json` › `disclosures`.
Zee (an animated character) and plain motion graphics don't need one.

## 7. The Remotion licence
Remotion is free for individuals and companies of up to 3 people. Once Curate has 4 or more
people, it needs a Remotion Company License (remotion.pro) before rendering anything new.
Check this when the team grows.

## 8. House style (from the brand book)
- Monochrome Mist palette from `motion/theme.ts` (taken from curate-app's palette); never inline hex.
- Geist only; titles Medium (500), never bold.
- Cuts land on the beat (BeatClock), never on hand-typed frames.
- Every format respects the platform safe areas (`useFrameBox().safe`).

## 9. Inspo is never shipped
- The inspo board (`inspo/`) and its media (`reference` assets in `library/references/`, licence
  "Third-party content, reference only", restriction `never-ship`) are for study only: other people's
  work, kept so we can learn from it.
- No reference asset may appear in an ad. `tools/catalog validate` fails an `ad.json` that lists one, and
  `tools/render` refuses to stage one. Borrow the technique (the transition, the pacing, the type idea),
  never the footage, the audio, the people or the brand.
- Prompts (`prompts/`) never hold a secret: keys live in AWS SSM; write only the parameter NAME.
