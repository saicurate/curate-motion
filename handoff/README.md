# Curate: the kit for making videos

For anyone making Curate videos: another agent, an editor, a designer. Read this page first. Then
`kit/CONTENTS.md` lists every file in the kit, and `b284/CONTENTS.md` lists the app recordings.

## What Curate is

Curate is an iPhone app that styles you from the clothes you already own. Show only what it really does:

- **Closet.** *Whole closet scan* finds the photos of you in your camera roll (picked / not picked) and pulls
  each of your clothes out of them as a closet item. *Add one closet item* adds a single one. Items sit in rails
  by type.
- **Today.** Looks for your day, made from your closet, for the weather and the day's plans (Date night,
  For work). You can *Save* a look or say *Not for me*.
- **Chat with Zee.** Zee is your stylist, a small black plush kitten (users can rename him). Ask "what should
  I wear tonight?" and he answers with a look from your closet. *Try it on* works from the chat too.
- **Studio.** Build a look on a board from your closet tray, swap items, then *Try it on* to see the look on a
  photo of you.
- **Settings.** Profile, colours, body, city, saved looks.

Never show shopping, prices or stores, friends or messages (hidden in the app), pasting a link, or Android
(the iPhone app leads).

**The app's words:** Closet (not "wardrobe"), closet item(s) or item(s) (never "piece"), Whole closet scan,
Add one closet item, picked / not picked, Try it on, Zee. The current line: "Try it. Style it. *Wear it.*"

> The b284 recordings were made before the app's words changed: they show the Wardrobe tab, "Extract all
> wardrobe items" and "Added 14 wardrobe items". Use them for how the app looks and moves, not for its
> words. New recordings come with the next build.

## The look

Match the approved App Store header film: `kit/look/header-film_3840x1646.mp4`. The founder's words: "perfect
the header video is soo good".

- **Ground:** one quiet tone at a time, a photo's own colour pushed close to Mist, lit softly from the top.
  Mist `#F4F3F0`, blush `#ECDFD7`, blue `#DDE5EC`, oat `#EFE5D3`, sand `#F3EDE3`, slate `#D9DEE4`. Never loud,
  flat or saturated colour.
- **Her photos are prints:** rounded corners (about 2.4% of the height), a soft shadow and a contact shadow
  on the ground. Shadows are warm (`rgb(58,46,36)` at 10–30%), never black.
- **Clothes are cut-outs** that lift out of a photo or fly in, and land with a soft shadow. Looks are laid
  flat, the way the app lays them out.
- **One camera:** it glides, pushes and pulls. Between scenes it pans through a soft column of light. Cut on
  the beat.
- **Words:** Geist Medium (500), never bold. One key phrase in ink `#181818`, the rest in `#656565`: the brand's
  signature. Short lines, set top-left, about 76–92 px on a 1080-wide frame.
- **Close:** the lockup (the mark and "Curate"), one line, then "On the App Store", held 2 s or more. Then glide
  back to the first frame, so the video loops.
- **Motion:** springs that settle with no bounce. Only Zee bounces. 60 fps.
- **Brand book** (`kit/brand/curate-brand-guidelines-2026.pdf`): a monochrome ramp `181818 383838 656565
  8B8B8B B3B3B3 DDDDDD EBEBEB F6F6F6 FCFBFC FFFFFF`, Geist only, never recolour the mark, 1× clear space round
  the logo.

**Social formats:** 9:16 at 1080 × 1920, 15 s, with the hook in the first 2 s. Keep words and UI inside the
platform's safe area: 8% from the top (154 px), 20% from the bottom (384 px) and 6% from each side (65 px).

## Showing the app: draw it, don't record it

Social ads (TikTok, Reels, Shorts, Meta) redraw the app as motion: white cards, black pills, chat bubbles,
items that fly. Use `b284/` as the reference for layout and feel. You can simplify, exaggerate and cut
between moments, but never show a feature the app doesn't have.

- **A redrawn screen never goes inside an Apple iPhone frame.** Use Curate's own phone
  (`kit/devices/curate-phone-generic.glb`) or let the UI float free.
- **Apple's iPhone frames** (Product Bezels) may only hold the real app as it runs. Use them as they are:
  no tilt, no animation, nothing over the phone. Their licence forbids passing the file on, so they aren't in
  this kit. Download them from Apple: https://developer.apple.com/design/resources/
- **App Store previews** (the videos in the screenshot row) are different: real screen recordings only,
  Apple's rule 2.3.4. See `kit/look/app-store-preview-*.mp4`.

## Rules

1. **No shopping.** No prices, "buy", "shop now", codes, store names or product links. The clothes are hers.
2. **Never show how it works inside.** No "AI is analysing…", model names, step lists or debug text. A scan is
   a flourish, not an explanation.
3. **No other brands.** No third-party logos or trademarks in frame. Apple's badge and frames are allowed
   under Apple's rules.
4. **Personas never vouch for products** (FTC). Emma reacts to the styling ("that works"). She never says
   "worth it", "true to size" or "best jeans". No fake reviews or ratings.
5. **AI label.** Emma, Jake, their photos and the try-ons are AI-generated. Turn on TikTok's "AI-generated
   content", Meta's "AI info" and YouTube's "altered or synthetic content". Zee and plain motion graphics
   don't need it.
6. **Music.**
   - Mixkit tracks are fine for online and social ads. No TV or radio, CDs, games or music-only remixes,
     and never register one with Content ID.
   - Incompetech tracks are CC BY 4.0 and need the credit line given in `kit/CONTENTS.md`.
   - Pixabay tracks: a credit is appreciated, not required.
7. **Approved vs draft.** `approved` is fine in an ad that runs. `draft` is fine for drafts and pitches only,
   until the founder approves it. Nothing runs without the founder's OK.
8. **The App Store badge** (`kit/brand/apple/`) follows Apple's rules:
   - Use Apple's artwork as provided, black preferred.
   - One badge per video, smaller than the main message.
   - Never animate, tilt or change it.
   - Keep clear space of a quarter of its height round it, and make it at least 40 px tall.
   - "App Store" is never translated.

   The header film closes with the words "On the App Store" instead of a badge. Either works.
9. **Credit Apple's trademark** when Apple's frame is shown: "iPhone is a trademark of Apple Inc., registered
   in the U.S. and other countries."

## What's in the folder

- `kit/brand/`: the mark (SVG and PNG), the lockup, the app icon, the brand book, the Geist fonts, Apple's
  App Store badge.
- `kit/people/emma/`: Emma, the main persona (AI-generated): 30 photos of her life in New York, 2.5D layers
  for some of them (her cut-out, the background without her, depth), her selfie, her face, her try-ons.
  `kit/people/jake/` holds a second persona's face options for skits (drafts).
- `kit/closet/`: each persona's clothes as transparent cut-outs (`.png`), plus the product shot on white
  (`on-white/`).
- `kit/zee/`: Zee's 12 moods. Each has an intro, a loop (seamless) and an outro, as `.mov` (ProRes 4444
  with transparency, for editors) and as PNG frames, plus a still. Play the intro, repeat the loop, end on
  the outro.
- `kit/music/`: licensed tracks with their BPM and credit lines.
- `kit/stock/`: licensed stock photos (New York, food, coffee, flowers, beaches, dogs) and grounds.
- `kit/devices/`: Curate's own 3D phone.
- `kit/look/`: the films to match: the approved header film, the three App Store previews, and the ad
  drafts so far.
- `b284/`: the app itself at build 284 (1.5.1), as recordings and screenshots, clean (no frame, no words,
  no music).

Emma at a glance: 27, lives in Astoria, works as a junior designer in the Flatiron District. She wears
black, white, grey, camel and navy on weekdays, jeans and sneakers on weekends, and one dressy look for a
night out. Her problem, in her words: "I have clothes, I just never know what to wear them with."

This folder is generated by `tools/export-kit` and `tools/export-media` in curate-motion, whose library is
the master copy. Don't edit here: ask for a re-run.
