# 0014: Ads redraw the app; only App Store previews show real recordings

2026-10-24 · the founder, after Pop out v4 (the real build-284 scan in Apple's bezel): "it need not exactly
be the exact recording of the screen… it's just the ad… it should convey make the user to install the
app… we have the full freedom to build out your own and just take some references of our existing app…
it should be interesting for the user. Should not skip the ad… going forward, it's not necessary for us
to record exactly the screen and display only that."

**Context.** The studio process (decisions/0011) held every ad to real footage: "REVEAL: a real interaction
(real footage)", "PROOF: one real screen", "HARD LINE: never invent product screens". That rule was ours, not
the founder's, and it boxed social ads into screen recordings.

**Decision.**
- Social ads (TikTok, Reels, Shorts, Meta) design the app's UI in motion: redraw, simplify, exaggerate, lift
  pieces out of screens, cut between moments. The real app is the reference (`library/footage/INVENTORY-b<build>.md`,
  the captures in `../app-media/b<build>/`), not the picture. The aim is the hook and the install.
- Show only what the app really does: stylised, never a feature it doesn't have.
- A redrawn screen never goes in Apple's bezel: its licence requires the app as it really runs
  (decisions/0012). Designed UI goes in our generic phone (`<Device variant="3d">`) or floats free.
- App Store previews stay real screen captures (App Review 2.3.4).

**Consequences.** `.claude/skills/motion-reel/SKILL.md` and AGENTS.md › "Making a motion film" say so. Pop out v4
(the real recording) is kept as made ("since anyways you made it, just save it"); it isn't the template.
The app captures remain the reference library and the raw material for other uses.
