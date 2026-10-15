#!/usr/bin/env python3
"""Round 2 (2026-10-15): transition concepts c6-c13 + the app explainer, as tracker entries.

  round2.py            -> adds/refreshes every round-2 concept in status.js (keeps c1-c5 untouched)
  round2.py c9 ...     -> only those ids

Each concept keeps the round-1 shape (id, title, idea, status, progress, steps, files, hook,
words, storyboard, music, channels, footage) plus round-2 fields the artifact uses:
length, made_for, transition, cutdowns, notes. Steps/files/status already in status.js are
kept, so re-running never loses progress.
"""
import json, os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))

S = lambda text, state="todo": {"text": text, "done": state == "done", "running": state == "running"}

C = [
    {
        "id": "c6",
        "title": "Lift it out",
        "made_for": "6 s",
        "length": "6 s bumper (made for) · 15 s",
        "transition": "Match cut: the jacket in a camera-roll photo lifts out and becomes the floating piece in the app",
        "idea": "A photo from your camera roll; the jacket you're wearing peels straight out of it and lands as a floating piece in your Curate wardrobe. One match cut, done.",
        "hook": "0–0.5 s: a photo of Emma fills the screen, a finger presses on her denim jacket and the jacket peels off the photo toward the camera.",
        "storyboard": [
            "0.0 s: a full-screen camera-roll photo of Emma in her denim jacket, opened like it is in Photos.",
            "0.4 s: a tap ring on the jacket; its outline flashes white for two frames.",
            "0.6–1.6 s: the jacket lifts out on a soft shadow and the photo drops back. MATCH CUT: the jacket keeps its size and spot while the background swaps to the Wardrobe tab's Mist ground.",
            "1.6–3.5 s: the jacket shrinks into its tile; jeans and a tee lift out of two more photos that fly past, one per beat, and land beside it.",
            "3.5–4.5 s: Zee pops up in the corner: 'Denim jacket! 🧥'.",
            "4.5–6 s: end card 'Already in your photos.' + logo (same line as c1, so they run as a family).",
            "15 s version: three photos (weekday, weekend, night out); a piece lifts out of each, the closet fills, Zee builds one look from them, end card.",
        ],
        "words": ["Already in your photos."],
        "music": "Cat Walk (Arulo), the same track as c1 so the two read as one series; the lift lands on the drop.",
        "channels": "6 s (made for) and 15 s · YouTube 6 s bumper ads, TikTok/Reels/Shorts pre-roll, Stories.",
        "footage": "Emma's camera-roll photos wearing her pieces (the assets agent is making them), the matching cut-outs (ready), the Wardrobe tab grid and Zee's piece-name bubble from her account.",
        "cutdowns": "6 s is the master. 15 s = three lifts + one look. 30 s = add the selfie ring and the closet filling (it then becomes c1).",
        "status": "storyboard",
        "progress": 25,
        "steps": [S("Storyboard written", "done"), S("Motion test (waits for Emma's camera-roll photos)"), S("Real footage from the marketing account")],
    },
    {
        "id": "c7",
        "title": "Zee wipe",
        "made_for": "6 s",
        "length": "6 s bumpers (made for) · 15 s compilation",
        "transition": "Body wipe and mask through Zee: she leaps at the lens, her black fur fills the frame, and a new look is behind her",
        "idea": "Zee leaps at the lens and her black fur wipes the frame; every time she passes, you're in a new look. A black plush kitten is the perfect wipe, and nobody else has her.",
        "hook": "0–0.6 s: Zee crouches small under a look, then launches straight at the camera.",
        "storyboard": [
            "0.0 s: look 1 floats on Mist (denim jacket, white tee, light jeans); Zee small at the bottom, getting ready.",
            "0.4–1.0 s: Zee leaps at the lens; her body fills the frame black. The drop hits as she clears and look 2 is there (oxford shirt, black trousers).",
            "3.0 s: mask through Zee: a Zee-shaped window, filled with look 3, grows from where she sits until it swallows the frame.",
            "5.5 s: Zee whips across sideways, a swipe wipe, into look 4 (the little black dress: night out).",
            "8.0 s: a shuffle, one look per beat (gym, weekend, linen), Zee popping in a different mood each time.",
            "10.5 s: one last leap at the lens; black; the logo comes out of the black. 'Styled by Zee.'",
            "Each wipe is a 6 s bumper on its own: look → leap → look → end card.",
        ],
        "words": ["Styled by Zee."],
        "music": "Can't Get You Off My Mind (Michael Ramir C.) from 0:23.9, so the big drop lands as Zee clears the lens.",
        "channels": "6 s (made for) and 15 s · TikTok/Reels/Shorts, YouTube bumpers, a looping sticker for Stories; the leap also works as the transition between scenes in longer videos.",
        "footage": "None for the motion test: only Zee and Emma's pieces. The real cut swaps each look for Emma's look cards or try-on photos from her account.",
        "cutdowns": "6 s = one leap + 'Styled by Zee.' + logo. 15 s = five wipes (the motion test). 30 s = a week of wipes with the day names (joins c12).",
        "status": "running",
        "progress": 30,
        "steps": [S("Storyboard written", "done"), S("Motion test with Zee and Emma's pieces", "running"), S("Real footage from the marketing account")],
    },
    {
        "id": "c8",
        "title": "Outfit check",
        "made_for": "15 s",
        "length": "15 s (made for) · 6 s · 30 s",
        "transition": "Snap transitions: Zee's paw snaps, a white flash, and the look changes on the same pose",
        "idea": "The 'outfit check' trend: snap, flash, new look. Every look is styled by Zee from the same closet.",
        "hook": "0–0.8 s: 'Outfit check.' slams in with a shutter flash, and Zee's paw snaps.",
        "storyboard": [
            "0.0 s: a mirror-selfie frame with Emma in look 1.",
            "0.8 s: Zee snaps, two white frames, look 2 on the same pose in the same mirror (a match on the pose).",
            "1–9 s: six looks, one per two beats, each with a small chip in Zee's words ('Rain later', 'Office Friday', 'Dinner downtown').",
            "9 s: speed ramp: four looks in one second.",
            "10.5 s: freeze on one look card from the app; a 'Which one? 1–6' sticker to pull comments.",
            "12–15 s: end card 'Outfit check, by Zee.' + logo.",
        ],
        "words": ["Outfit check.", "Which one?", "Outfit check, by Zee."],
        "music": "Cat Walk from the drop, or a trending sound from TikTok's Commercial Music Library (a business account can only use that library).",
        "channels": "15 s (made for) · TikTok first (trend format), Reels; the comment prompt drives replies.",
        "footage": "Emma in six looks in the same mirror pose (stills from the assets agent; try-on images cost money, so ask first) and the app's look cards.",
        "cutdowns": "6 s = three snaps + logo. 15 s = six looks. 30 s = ten looks plus one chat moment showing where the looks come from.",
        "status": "storyboard",
        "progress": 25,
        "steps": [S("Storyboard written", "done"), S("Motion test (waits for Emma's mirror photos)"), S("Real footage from the marketing account")],
    },
    {
        "id": "c9",
        "title": "Rain or shine",
        "made_for": "15 s",
        "length": "15 s (made for) · 6 s · 30 s",
        "transition": "Weather swap: a windshield-wiper sweep clears the rainy glass, and the look swaps with the weather",
        "idea": "The forecast changes, the look changes. Zee sweeps the rain off the screen and the outfit swaps with the weather.",
        "hook": "0–1 s: rain runs down the screen over a look; 'Rain at 4.' drops in big.",
        "storyboard": [
            "0.0–1.0 s: rainy glass over look 1 (navy hoodie, dark jeans); 'Rain at 4.' and a forecast chip '58°F · Rain at 4'.",
            "1.0–5.0 s: Zee watches the rain; one thinking line in her voice: 'Rain at 4. Skip the cutoffs.' The track sits in its quiet part.",
            "5.3 s: the music comes back and a wiper sweep (Zee at its pivot) clears the glass: sun. The look swaps piece by piece: white tee and denim cutoffs; the chip flips to '78°F · Sunny'.",
            "8.7 s: 'Tonight 61°F': the denim jacket drops onto the look from above (layering).",
            "11.5 s: end card 'Dressed for the weather.' + logo.",
        ],
        "words": ["Rain at 4.", "Sunny.", "Dressed for the weather."],
        "music": "Better Times are Coming (Alejandro Magaña) from 0:33, so the rain plays over its breakdown and the song comes back on the wiper sweep.",
        "channels": "15 s (made for) · Reels/TikTok; the rain cut can run on rainy days in New York (weather-timed ads), the sun cut on sunny ones.",
        "footage": "Chat with Zee: the location ask (foggy window), Zee's thinking lines about the weather, and the look card's weather line in °F.",
        "cutdowns": "6 s = rain → wiper → sun + logo. 15 s = rain, sun, cool night (the motion test). 30 s = a whole day: the location ask, Zee's thinking, morning/noon/night looks, end card.",
        "status": "running",
        "progress": 30,
        "steps": [S("Storyboard written", "done"), S("Motion test with Emma's pieces and type", "running"), S("Real footage from the marketing account")],
    },
    {
        "id": "c10",
        "title": "Chaos to calm",
        "made_for": "30 s",
        "length": "30 s (made for) · 15 s · 6 s",
        "transition": "Closet-door reveal + hand-tap freeze: the doors burst open, clothes fly, a tap freezes them mid-air and they glide into a calm grid",
        "idea": "Before: a closet that explodes every morning. One tap. After: every piece floats in a calm grid and Zee hands you today's look.",
        "hook": "0–1 s: two closet doors swing open toward the lens and clothes burst out at the camera; 'my closet at 8:02 am'.",
        "storyboard": [
            "0–3 s: chaos: pieces tumbling, spinning, overlapping; a shaky camera and fast cuts; 'nothing to wear'.",
            "3.0 s: a finger (or Zee's paw) taps the screen: everything freezes mid-air, and the music cuts to silence for one beat.",
            "3.5–7 s: the drop: the frozen pieces turn upright and glide into a grid, one per beat; the shake stops and the colours calm.",
            "7–12 s: the grid becomes the Wardrobe tab inside a phone that flips in from flat (3D flip).",
            "12–20 s: Zee pulls three pieces out into a look card; a question card ('Office or out?'), tap 'Office'.",
            "20–26 s: the look lands; a Style note close-up on one detail.",
            "26–30 s: 'From chaos to calm.' + logo.",
        ],
        "words": ["my closet at 8:02 am", "nothing to wear", "From chaos to calm."],
        "music": "Can't Get You Off My Mind: its build under the chaos, its one-beat silence (0:24.2) on the tap, its drop on the calm.",
        "channels": "30 s (made for) · TikTok/Reels/Shorts, YouTube in-stream; the 15 s is a strong paid-social cut.",
        "footage": "A real messy chair or bed (shot on a phone, or licensed stock), the Wardrobe tab, a look card, a question card and Style notes from Emma's account.",
        "cutdowns": "6 s = burst → tap → grid + logo. 15 s = chaos, tap, grid, one look. 30 s = the full story.",
        "status": "storyboard",
        "progress": 25,
        "steps": [S("Storyboard written", "done"), S("Motion test"), S("Real footage from the marketing account")],
    },
    {
        "id": "c11",
        "title": "POV: you never know what to wear",
        "made_for": "15 s",
        "length": "15 s (made for) · 30 s",
        "transition": "3D phone flips: the phone flips toward the lens and its screen becomes the whole frame, then flips again into the next step",
        "idea": "The POV text-overlay format: a first-person morning in front of the closet, then the phone flips in 3D and Zee takes over.",
        "hook": "0–1 s: 'POV: you have 50 pieces and nothing to wear' over a first-person view of an open closet.",
        "storyboard": [
            "0–2 s: POV text over a closet; hands flicking through hangers.",
            "2.0 s: a tap, and the phone flips toward the lens in 3D until its screen fills the frame.",
            "2–6 s: inside the app: 'What do I wear today?' typed; Zee's thinking lines, one per beat.",
            "6.0 s: the phone flips again → the look laid out on the bed (real pieces, a flat-lay).",
            "8–12 s: flip number three → Try-ons: Emma wearing it.",
            "12–15 s: 'POV: Zee picked it.' + logo.",
        ],
        "words": ["POV: you have 50 pieces and nothing to wear", "POV: Zee picked it."],
        "music": "Lo-Fi 01 (Lily J), or a trending sound from TikTok's Commercial Music Library.",
        "channels": "15 s (made for) · TikTok (a native POV format), Reels.",
        "footage": "First-person closet shots (phone or licensed stock), a chat question, Zee's thinking lines, a look card, one try-on (try-ons cost money: ask first).",
        "cutdowns": "15 s is the master. 30 s = add the question card and Adjust between flips.",
        "status": "storyboard",
        "progress": 25,
        "steps": [S("Storyboard written", "done"), S("Motion test"), S("Real footage from the marketing account")],
    },
    {
        "id": "c12",
        "title": "Mon to Sun, one move",
        "made_for": "30 s",
        "length": "30 s (made for) · 15 s · 60 s · 6 s",
        "transition": "One continuous camera move with speed ramps; each day's name sweeps across as a kinetic-type wipe",
        "idea": "One continuous move through a week: seven looks from one closet, the day names sweeping past like wipes. Same closet, a new look every day.",
        "hook": "0–1 s: 'MON' fills the screen and the camera is already moving.",
        "storyboard": [
            "0.0–1.0 s: the camera is moving right; MON passes in huge letters and wipes onto the first look.",
            "1–12 s: one look per day, three beats each. The camera never stops: it whips between days (speed ramps) and eases on each look for a beat. Each day's name sweeps across in front as the wipe. A small chip under each look: 'Office', 'Gym', 'Rain at 4', 'Dinner', 'Friday jeans', 'Farmers market', 'Lazy Sunday'.",
            "12 s: the camera pulls back: all seven looks in a row are the week, and the same jeans turn up three times. 'Same closet. New look every day.'",
            "13.5–15 s: logo.",
            "30 s version: each day holds three seconds with Zee's reason for the look; 60 s adds the chat moment where you plan the week.",
        ],
        "words": ["MON … SUN", "Same closet. New look every day."],
        "music": "Deep Urban (Eugenio Mininni) from 0:13.3, so the drop lands on Monday.",
        "channels": "30 s (made for) · TikTok/Reels on Sunday night ('plan my week'), Shorts; an Instagram carousel version with seven slides.",
        "footage": "The Wardrobe tab's This week strip, the day's look cards and Emma wearing each look (stills; try-ons cost money, so ask first).",
        "cutdowns": "6 s = MON→SUN strobe in four seconds + logo. 15 s = the motion test. 30 s = each day with Zee's reason. 60 s = plus planning the week in chat.",
        "status": "running",
        "progress": 30,
        "steps": [S("Storyboard written", "done"), S("Motion test with Emma's pieces and kinetic type", "running"), S("Real footage from the marketing account")],
    },
    {
        "id": "c13",
        "title": "Get ready with Zee",
        "made_for": "90 s–2 min",
        "length": "90 s–2 min (made for) · 60 s · 30 s",
        "transition": "Match cuts from the app to real life: each piece in the look card cuts to the same piece on its hanger; snap cuts in the dressing montage",
        "idea": "A full 'get ready with me' morning, with Zee as the friend on the phone. The long story that shows the whole app without feeling like an ad.",
        "hook": "0–1 s: the alarm at 7:30, Emma's hand slaps it; 'GRWM, but my stylist is a cat.'",
        "storyboard": [
            "0–5 s: the alarm, a look out of the window (grey sky), the hook line.",
            "5–15 s: coffee; she asks Zee 'What do I wear today?' (the screen composited into the phone on the counter).",
            "15–30 s: Zee's thinking lines in real time ('Rain at 4, so the boots'); a question card: 'Office or client meeting?'",
            "30–45 s: the look card lands; a Style notes close-up; Adjust: 'a bit comfier'.",
            "45–60 s: she pulls the pieces from her real closet: each app piece match-cuts to the real hanger.",
            "60–80 s: dressing montage with snap cuts and a mirror check; Try-ons to check the jacket.",
            "80–100 s: out of the door, the rain starts, and she's dressed for it. Zee: 'Told you ☔'.",
            "100–115 s: end card and the call to action.",
            "Emma never vouches for the app ('changed my life' and the like are out); the captions only say what happens. Posted from Curate's own account it's brand content; with a creator it needs the paid-partnership label.",
        ],
        "words": ["GRWM, but my stylist is a cat.", "Told you ☔"],
        "music": "Lo-Fi 01 for the morning, switching to Cat Walk at the out-of-the-door moment.",
        "channels": "90 s–2 min (made for) · TikTok (up to 10 min), Reels and YouTube Shorts (both up to 3 min).",
        "footage": "Live action of Emma. Two ways: (a) a real actress who matches Emma, shot on a phone (the most native look); (b) a photo-led version from Emma's stills with slow push-ins plus the app recordings. AI-generated live action would cost money and needs your OK first.",
        "cutdowns": "2 min is the master. 60 s = the ask → look → closet → out of the door. 30 s = the hook, the look landing, 'Told you ☔'.",
        "status": "storyboard",
        "progress": 20,
        "steps": [S("Storyboard written", "done"), S("Pick the live-action route (actress or photo-led)"), S("Real footage from the marketing account")],
    },
]

# ── 2026-10-15 founder reference: a creator "how to: Pop Off" reel (Meta Edits tutorial) ──
# Breakdown https://claude.ai/artifact/BfnhPC2vDLECNgQnyC5Fet, sheets in references/whatsapp-2026-10-15-102224/.
REF = "Technique from the founder's reference reel ('how to: Pop Off', a creator tutorial for Meta's Edits app; breakdown in references/whatsapp-2026-10-15-102224/). We take the moves only: no tutorial format, no Instagram/Edits look, no other people's faces, always a Curate/Zee end card."

C.append({
    "id": "c14",
    "title": "Pop out",
    "made_for": "15 s",
    "length": "15 s (made for) · 6 s opener · 30 s",
    "transition": "Pop-out-and-return: a cut-out scales from about 15% to 100% out of its source photo in 0.2 s with an overshoot, holds about 0.5 s, then sinks back home; a new one every two beats, overlapping",
    "idea": "Your pieces pop out of your own camera roll, one every two beats, and sink back home, until Zee builds the look. Straight from the founder's reference reel, turned into our story: the pieces come out of your photos.",
    "hook": "0–0.5 s: a phone lies flat on a pale desk showing a camera roll; on the first kick a denim jacket bursts out of a photo toward the lens.",
    "storyboard": [
        "0.0 s, kick 1: top-down phone with Emma's camera roll. Scan dots run over one photo, a white outline traces the jacket, and it bursts out of the photo (15% → 100% in 0.2 s, with an overshoot), holds with a little sway, then sinks back.",
        "kick 3: jeans pop out of another photo, rising before the jacket is fully home (never an empty beat).",
        "1.0 s: 'Already in your photos.' types on letter by letter BEHIND the pieces, so the pieces sit in front of the words (depth).",
        "kick 5: the whole look pops out together (jacket, tee, jeans). In the real cut: Emma herself rising out of her photo wearing it.",
        "kick 7: Zee peeks over the phone's edge.",
        "kick 9–12: every piece bursts up at once and settles into a floating grid; Zee rings two pieces with a hand-drawn ellipse ('These two.').",
        "kick 13: a white flash, and the look card drops in as a tilted print that sticks (about 4°), then two alternatives stack under it like prints.",
        "kick 17: a stroke draws all the way round the phone frame, and the end card: 'Your closet, styled by Zee.' + logo, Zee waving.",
        "30 s version adds Try-ons: Emma rises out of her selfie in look 1, sinks back, rises in look 2, every two beats (needs her try-on images, which cost money: ask first).",
    ],
    "words": ["Already in your photos.", "These two.", "Your closet, styled by Zee."],
    "music": "Cat Walk (Arulo): about 130 bpm, the same four-on-the-floor kick feel as the reference (129 bpm); from 0:30.2 so the first pop sits on the drop.",
    "channels": "15 s (made for) · TikTok/Reels/Shorts lead ad; the first 4 s are a 6 s opener with the end card; a 30 s with Try-ons.",
    "footage": "Emma's camera roll on a phone (photographed top-down for real, or our 3D phone), the cut-outs of her pieces (ready), cut-outs of Emma in her looks (from her photos), the Wardrobe grid and a look card from her account.",
    "cutdowns": "6 s = kicks 1–7 + end card. 15 s = the motion test. 30 s = plus the selfie ring drawing on and the Try-ons pop (look 1 → look 2).",
    "reference": REF,
    "status": "running",
    "progress": 30,
    "steps": [S("Storyboard written (from the founder's reference reel)", "done"), S("Motion test with the pop-out technique and Emma's pieces", "running"), S("Real footage from the marketing account")],
})

# Fold the reference's other moves into the existing round-2 concepts.
def _patch(cid, **kw):
    c = next(x for x in C if x["id"] == cid)
    for k, v in kw.items():
        if k.endswith("_add"):
            c[k[:-4]] = c[k[:-4]] + v
        else:
            c[k] = v

_patch("c6", storyboard_add=["From the reference reel: each piece pops out with the 0.2 s overshoot and a white outline trace first, and the next piece starts before the last has landed."], reference=REF)
_patch("c8", storyboard_add=["From the reference reel: every look lands as a flash, then a tilted print that sticks; the prints pile up into a strip along the top as the looks go by, and the 'Which one?' freeze is the strip."], reference=REF)
_patch("c11", storyboard_add=["From the reference reel: the words type on only at about 1 s, after the picture has hooked; Zee's thinking shows as scan dots and an outline trace around the pieces she's weighing (no percentages)."], reference=REF)
_patch("c13", storyboard_add=["From the reference reel: in the Try-ons beat, Emma rises out of her selfie in look 1, sinks back and rises in look 2, every two beats."], reference=REF)


EXPLAINER = {
    "id": "explainer",
    "title": "Curate, explained (the app explainer)",
    "made_for": "2:50",
    "length": "2:50 (16:9 for the website and YouTube; 9:16 reframe for onboarding and social; chapters cut into 15–20 s onboarding clips)",
    "transition": "Chapters linked by Zee: she leaps or walks from one scene into the next, so the whole film reads as one move",
    "idea": "A proper video that walks through the whole app, warm and simple: the problem, Zee, your wardrobe from your photos, chatting with Zee, the weather, Try-ons, and 'Tell me when it's ready'.",
    "hook": "0:00–0:06: a wall of your own clothes that never settles, and 'Nothing to wear.'",
    "storyboard": [
        "0:00–0:14 · THE PROBLEM. VO: \"You've got a closet full of clothes. And somehow, every morning, it's the same thing: nothing to wear.\" On screen: 'Nothing to wear.' Picture: Emma's pieces in a crowded wall that keeps shuffling and never lands; a clock at 8:02. Footage: none from the app (her cut-out pieces are ready).",
        "0:14–0:26 · MEET ZEE. VO: \"Meet Zee. She's your stylist. She lives in Curate, she learns your closet, and she's always up early.\" On screen: 'Meet Zee.' Picture: Zee's hello lands on the music's swell, then a few moods. Footage: Zee's own clips (ready).",
        "0:26–0:58 · YOUR WARDROBE, FROM YOUR PHOTOS. VO: \"First, Zee needs to see what you own. No photo shoots, no typing. Your clothes are already in your photos, because you wear them. Zee asks before she looks. You take one selfie, so she knows which one is you. Then she finds you in your photos, and your pieces start arriving, one by one.\" On screen: 'Already in your photos.' Picture: 0:30 the privacy shield with Zee peeking over it; 0:36 the selfie ring draws on as a stroke, with its live hints and 'Your turn 📸'; 0:44 the scan: Zee's magnifier over the roll, scan dots running over a photo and a white outline tracing the piece (from the founder's reference reel; no percentages, no machinery words); 0:50 'Up big': one photo big, the piece pops out of it (15% → 100% with an overshoot), Zee naming it ('Jeans! 👖'). Footage: Emma's account: the shield, the selfie camera, the scan, the pieces wait.",
        "0:58–1:10 · PURE-FLOAT PIECES. VO: \"Every piece comes out clean, floating on its own, like a product photo of your actual clothes.\" On screen: none. Picture: the Wardrobe tab with pieces floating and bobbing; tap one, it opens up big. Footage: Emma's full Wardrobe tab, one piece opened.",
        "1:10–1:50 · CHAT WITH ZEE. VO: \"Now ask Zee anything. 'What do I wear to dinner on Friday?' You can watch her think: she checks the weather, looks through your closet, and makes her calls. If she needs something only you know, she just asks. Then your look lands. Want it more relaxed? Tap Adjust. Curious why it works? Open the Style notes.\" On screen: 'Ask Zee.' Picture: 1:10 the question typed; 1:16 Zee's thinking lines streaming; 1:26 a question card (the calendar or the fill-in sentence); 1:33 the look card lands as a white flash, then a tilted print that straightens; alternatives stack under it like prints; Zee's chosen pieces get a hand-drawn ellipse; 1:40 the Adjust pill and its sheet; 1:45 the Style notes notebook with a close-up. Footage: Emma's account: one real chat end to end.",
        "1:50–2:05 · WEATHER AND LOCATION. VO: \"Zee dresses you for the weather where you are. She'll ask once to use your location, or you can just tell her your city.\" On screen: '58°F · Rain at 4'. Picture: the foggy-window location ask, Apple's permission popup, the look card's weather line. Footage: Emma's account, a fresh chat with no location yet. (Location is sent to about 1 km, so never say 'only your city'.)",
        "2:05–2:25 · TRY-ONS. VO: \"Not sure? See it on you first. Pick a photo of you, pick your pieces, and Try-ons shows you wearing the look.\" On screen: 'See it on you.' Picture: the Try-ons tab, Emma's photo plus two pieces, the curtain, the result; then she rises out of her selfie in look 1, sinks back and rises in look 2 (the pop-out from the reference reel). Footage: Emma's Try-ons tab and ONE real try-on (it costs money: ask first).",
        "2:25–2:35 · TELL ME WHEN IT'S READY. VO: \"Good things take a minute. Tap 'Tell me when it's ready', put your phone down, and Zee will let you know.\" On screen: none. Picture: the pieces wait with the pill, the notification permission, then the push on the lock screen. Footage: Emma's account during a gallery import, plus the lock-screen push.",
        "2:35–2:50 · OUTRO. VO: \"Curate. Your closet, styled by Zee. Get it on the App Store.\" On screen: the Curate logo, 'Your closet, styled by Zee.', the official 'Download on the App Store' badge. (Say 'free' only if it's true on launch day.) Picture: a stroke draws round the frame and Zee waves from the end card.",
        "VOICEOVER, about 330 words at a calm 120–130 words a minute. Options: (1) a human: the founder, a friend with a warm US voice, or a hired US voice actor (usually about $100–300 for 3 minutes on Voices.com, Voice123 or Fiverr Pro); record in a quiet closet with a USB mic, 3 takes per line. (2) TTS: a paid voice (for example ElevenLabs), not made: it costs money and needs the founder's OK. (3) No voice: the captions-only cut for silent autoplay on social. On screen the VO always runs as captions too.",
        "MUSIC: Drawing the Sky (Eugenio Mininni) under 0:00–0:58, its swell on 'Meet Zee'; Deep Urban under the chat and features (1:10–2:25); back to Drawing the Sky for the outro. Music ducks about 14 dB under the voice. Mixkit allows YouTube and the website; never register it with Content ID.",
    ],
    "words": ["Nothing to wear.", "Meet Zee.", "Already in your photos.", "Ask Zee.", "58°F · Rain at 4", "See it on you.", "Your closet, styled by Zee."],
    "music": "Drawing the Sky → Deep Urban → Drawing the Sky (all Mixkit, already downloaded). Ducked under the voice.",
    "channels": "2:50 (made for) · the website (16:9 hero 'Watch how it works'), YouTube, App Store listing link-outs, and the first-run onboarding (the 9:16 reframe, split into chapters).",
    "footage": "Per scene above. All from Emma's account once it exists; no test data, no old screens. One paid try-on (ask first). Zee clips and Emma's pieces are ready now.",
    "cutdowns": "2:50 master (16:9 and 9:16). 60 s = problem, Zee, photos, one chat, try-on, outro. 30 s = the opening (the motion test) + the look landing + outro. Chapters as 15–20 s onboarding clips.",
    "status": "running",
    "progress": 30,
    "steps": [
        S("Scene-by-scene script with time codes, voiceover, words and footage", "done"),
        S("Opening motion test, 9:16", "running"),
        S("Opening motion test, 16:9"),
        S("Voiceover: the founder picks human, paid TTS (needs OK) or captions only"),
        S("Real footage from the marketing account"),
    ],
}


def main(ids):
    st = json.load(open(os.path.join(HERE, "state.json")))
    have = {c["id"]: c for c in st["concepts"]}
    for c in C + [EXPLAINER]:
        if ids and c["id"] not in ids:
            continue
        c = dict(c)
        old = have.get(c["id"])
        if old:  # keep live progress
            for k in ("steps", "files", "status", "progress"):
                if k in old:
                    c[k] = old[k]
        c.setdefault("files", [])
        subprocess.run([sys.executable, os.path.join(HERE, "status.py"), "addconcept", json.dumps(c, ensure_ascii=False)], check=True)


if __name__ == "__main__":
    main(set(sys.argv[1:]))
