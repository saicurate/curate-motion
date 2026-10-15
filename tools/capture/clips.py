#!/usr/bin/env python3
"""clips.py [filter]: trim every moment from its take, register it (draft, curate licence, no push), and add it
to the tracker. Re-runnable: a clip already in the catalog is skipped."""
import json, os, subprocess, sys
C = os.path.dirname(os.path.abspath(__file__))
T = '/Users/saikumar/Desktop/Curate/curate-motion/.cache/takes'
K = '/Users/saikumar/Desktop/Curate/curate-motion/.cache/clips'
IDX = '/Users/saikumar/Desktop/Curate/curate-motion/catalog/index.json'
S, O, G = f'{T}/photo-scan-v1.cfr.mp4', f'{T}/onboarding-v1.cfr.mp4', f'{T}/signup-v1.cfr.mp4'
t = lambda n: f'{T}/{n}.cfr.mp4'

# (moment, v, src, start, end, screen, source, title[, handle])
CLIPS = [
 # launch + front door
 ('cold-launch-splash', 1, t('t02-cold-launch'), 1.6, 4.4, 'splash', 'app', 'Cold launch: the Curate mark pulses, then her Wardrobe'),
 ('cold-launch-splash', 2, S, 2.0, 4.9, 'splash', 'app', 'Cold launch (from the photo-scan take)'),
 ('front-door-type-reel', 1, G, 3.7, 7.4, 'front-door', 'app', 'Front door: "Try it. Style it. Wear it." type reel'),
 ('front-door-doors-open', 1, G, 14.6, 17.6, 'front-door', 'app', 'Front door: Get started rolls to "Sign in." and the doors slide in'),
 ('email-signup-push', 1, G, 22.4, 24.2, 'sign-up', 'app', 'Continue with email: Create your account slides in'),
 # onboarding
 ('ob-about-name-birthday', 1, O, 20.5, 27.5, 'onboarding-about', 'app', 'Onboarding 01: her name typed in, the birthday wheel unfolds'),
 ('ob-username-check', 1, O, 68.45, 72.2, 'onboarding-username', 'app', 'Onboarding 02: handle rows rise, spinners turn to ticks', 0.45),
 ('ob-handle-stamp-fly', 1, O, 86.6, 89.8, 'onboarding-username', 'app', 'Onboarding 02→03: the handle stamps and flies into the name chip; This or that rises'),
 ('ob-pairs-bracket-fold', 1, O, 137.5, 141.5, 'onboarding-style', 'app', 'Onboarding 03: the last pair, the bracket folds into ranked rows'),
 ('ob-budget-card-flip', 1, O, 165.5, 170.0, 'onboarding-budget', 'app', 'Onboarding 04: slider moves, the card flips to the next tier and the price counts up'),
 ('ob-mirror-reading', 1, O, 217.3, 238.6, 'onboarding-mirror', 'app', 'Onboarding 05: her selfie flies into the mirror, the reading sweep, Deep Autumn dots'),
 ('ob-mirror-payoff', 1, O, 234.5, 239.0, 'onboarding-mirror', 'app', 'Onboarding 05: payoff, colour dots fill, Deep Autumn, hand-off'),
 ('ob-body-3d', 1, O, 239.0, 244.0, 'onboarding-body', 'app', 'Onboarding 06: the 3D body loads in'),
 ('ob-body-3d-tapes', 1, O, 364.0, 376.0, 'onboarding-body', 'app', 'Onboarding 06: measuring tapes light one at a time as values change'),
 # empty wardrobe + photo scan (real hero take)
 ('zee-asks-empty-wardrobe', 1, S, 4.6, 8.6, 'wardrobe-empty', 'app', 'Zee asks on the empty Wardrobe: "Hi, I\'m Zee. Let\'s find your clothes."'),
 ('zee-asks-on-it', 1, S, 17.4, 19.9, 'wardrobe-empty', 'app', 'Zee asks: tap Look in my photos, her bubble, "On it."'),
 ('privacy-shield-zee-peek', 1, S, 19.7, 25.2, 'privacy-shield', 'app', 'Privacy shield draws, Zee peeks over it, three ticks, Continue'),
 ('scan-stage-rise-deck', 1, S, 60.6, 63.3, 'scan', 'app', 'Scan stage rises, the deck deals onto the tiles'),
 ('scan-roll', 1, S, 63.0, 68.6, 'scan', 'app', 'The scan roll at real speed: Zee\'s magnifier, photos of her lift into Picked'),
 ('scan-found-end', 1, S, 68.4, 72.3, 'scan', 'app', '"Found 30 photos of you": the fan, Zee'),
 ('pieces-photo-up-big', 1, S, 72.2, 80.5, 'pieces-wait', 'app', '"Your pieces": her photo up big, Zee\'s lines, Tell me when it\'s ready rises'),
 ('style-fact-pill', 1, S, 147.5, 152.2, 'pieces-wait', 'app', 'Pieces wait: the style-fact pill words, "Good things take time"'),
 ('first-piece-lift', 1, S, 151.8, 155.5, 'pieces-wait', 'app', 'The first piece lifts out of her photo: Ballet flats, "Flats!"'),
 ('pieces-up-and-tuck', 1, S, 197.6, 202.4, 'pieces-wait', 'app', 'Pieces rise up big, are named, and tuck into the row'),
 ('wardrobe-ready-cheer', 1, S, 202.2, 207.0, 'pieces-wait', 'app', '"Your wardrobe is ready": Zee walks up and cheers, two rings'),
 ('review-count-up', 1, S, 239.6, 242.2, 'import-review', 'app', 'Import review rises: the count climbs to 41 pieces'),
 ('review-remove-undo', 1, S, 312.4, 317.2, 'import-review', 'app', 'Review: a piece removed, the grid closes up, Undo bar'),
 ('review-add-to-wardrobe', 1, S, 332.6, 337.4, 'import-review', 'app', 'Add 40 to wardrobe: spinner, back to the Wardrobe with New · 40'),
 # Wardrobe tab
 ('wardrobe-chip-filter', 1, t('t11-wardrobe'), 1.2, 5.6, 'wardrobe', 'app', 'Wardrobe chips: Tops, then All'),
 ('wardrobe-scroll-float', 1, t('t11-wardrobe'), 6.0, 22.0, 'wardrobe', 'app', 'Scrolling her 49 pure-float pieces; the glass bar hides and returns'),
 ('item-detail-open', 1, t('t11-wardrobe'), 35.2, 37.6, 'wardrobe-item', 'app', 'Tap a piece: the item page slides in'),
 ('item-edit-sheet', 1, t('t11-wardrobe'), 45.2, 47.6, 'wardrobe-item', 'app', 'Edit details sheet rises'),
 ('item-detail-back', 1, t('t11-wardrobe'), 60.2, 63.6, 'wardrobe-item', 'app', 'Sheet down, back to the Wardrobe'),
 ('add-item-sheet', 1, t('t11-wardrobe'), 65.2, 70.0, 'wardrobe', 'app', 'Add item sheet with Find more in my photos, and closing'),
 ('at-work-pill-rise', 1, t('t16-selfie-step'), 24.5, 28.6, 'wardrobe', 'app', 'The "Curate at work" pill rises with Zee\'s face; the leave snack'),
 ('extraction-wait', 1, t('t17-extraction'), 14.5, 35.5, 'extraction', 'app', 'Add item: Extracting your wardrobe, the light band, the found tag, 1 piece added'),
 ('extraction-found-tag', 1, t('t17-extraction'), 18.6, 22.6, 'extraction', 'app', 'Extraction: the dot and the piece\'s tag pop on the photo'),
 ('duplicate-review-sheet', 1, t('t17-extraction'), 33.6, 37.6, 'duplicate-review', 'app', '"Same piece?" sheet rises after the extraction'),
 ('duplicate-review-pick', 1, t('t17-extraction'), 80.8, 85.0, 'duplicate-review', 'app', 'Same piece? Tap the one to keep: ring and check'),
 ('duplicate-review-keep', 1, t('t18-dup-keep'), 1.2, 8.0, 'duplicate-review', 'app', 'Keep this: the sheet folds and leaves'),
 # shell
 ('tab-switch', 1, t('t10-tabs'), 1.2, 11.6, 'tab-bar', 'app', 'Tab taps: Try-ons, Profile, Wardrobe, then a swipe to Chat (glass capsule moves)'),
 # chat
 ('chat-open-starters', 1, t('t03-chat-hero'), 1.8, 5.6, 'chat', 'app', 'Chat opens: Zee hero, "Evening, Emma", the starters dealt in'),
 ('zee-pet', 1, t('t03-chat-hero'), 6.6, 15.4, 'chat', 'app', 'Three taps on Zee in the empty chat: hop, squish, ring'),
 ('chat-drawer-open', 1, t('t03-chat-hero'), 15.4, 17.8, 'chat-drawer', 'app', 'Chat drawer slides in from the right (Zee asleep, no chats yet)'),
 ('chat-drawer-search', 1, t('t03-chat-hero'), 22.2, 25.4, 'chat-drawer', 'app', 'Drawer search swap'),
 ('notebook-sheet', 1, t('t03-chat-hero'), 36.4, 40.4, 'chat-drawer', 'app', 'What Zee remembers: the notebook sheet rises'),
 ('chat-drawer-close', 1, t('t03-chat-hero'), 52.4, 55.4, 'chat-drawer', 'app', 'Drawer closes back to the chat'),
 ('composer-type-send', 1, t('t04-look1-tonight'), 2.6, 11.0, 'chat', 'app', 'Composer: "What should I wear tonight?" typed and sent, her bubble grows in'),
 ('question-card-arrive', 1, t('t04-look1-tonight'), 21.6, 27.4, 'chat', 'app', 'Zee asks: "What\'s tonight?" question card arrives'),
 ('question-card-answer', 1, t('t04-look1-tonight'), 61.2, 64.6, 'chat', 'app', 'Question card: tap Drinks or date night, the card folds, her answer'),
 ('location-ask-foggy-window', 1, t('t04-look1-tonight'), 64.2, 67.6, 'chat', 'app', 'Location ask: the foggy window card rises with Zee\'s paw'),
 ('location-ask-alert', 1, t('t04-look1-tonight'), 160.0, 165.0, 'chat', 'app', 'Show me your sky: Apple\'s location alert'),
 ('location-ask-sky-wipe', 1, t('t04-look1-tonight'), 175.6, 182.0, 'chat', 'app', 'Allow: the fog wipes away, "There\'s your sky", weather line'),
 ('chat-thinking-lines', 1, t('t04-look1-tonight'), 181.6, 216.6, 'chat', 'app', 'The look being made: her closet orbits, Zee\'s real thinking lines'),
 ('look-card-landing', 1, t('t04-look1-tonight'), 216.2, 223.6, 'chat', 'app', 'The look card lands: head words stream, pieces settle, chips'),
 ('multiple-looks-swipe', 1, t('t05-look1-explore'), 1.4, 15.4, 'chat', 'app', 'Multiple looks: swipe through Look 1, 2, 3 and back'),
 ('style-notes-open', 1, t('t05-look1-explore'), 25.6, 31.6, 'style-notes', 'app', 'Style notes: the notebook sheet rises'),
 ('style-notes-scroll', 1, t('t05-look1-explore'), 31.2, 47.0, 'style-notes', 'app', 'Style notes: scrolling, the strip pins, close-ups float'),
 ('adjust-from-notes', 1, t('t05-look1-explore'), 45.6, 51.4, 'adjust', 'app', 'Adjust priorities from Style notes: the priorities sheet'),
 ('adjust-slider-toast', 1, t('t05-look1-explore'), 53.0, 64.0, 'adjust', 'app', 'Styling priorities: Weather slider dragged, the hint folds in'),
 ('adjust-sheet-dismiss', 1, t('t05-look1-explore'), 73.6, 78.6, 'adjust', 'app', 'Priorities sheet down, back on the card'),
 ('adjust-pill-open', 1, t('t05-look1-explore'), 77.6, 83.2, 'adjust', 'app', 'Adjust pill on the card opens the priorities sheet'),
 ('look-piece-lift', 1, t('t05-look1-explore'), 83.2, 90.4, 'chat', 'app', 'Tap a piece: it lifts, the others dim, swap choices'),
 ('look-piece-keep', 1, t('t05-look1-explore'), 97.4, 103.6, 'chat', 'app', 'Keep: the piece settles back'),
 ('look-love-it', 1, t('t05-look1-explore'), 105.0, 118.4, 'chat', 'app', 'Love it: the heart, Zee says "Me too."'),
 ('chat-new-from-drawer', 1, t('t06-look2-work'), 2.0, 9.2, 'chat-drawer', 'app', 'Drawer → New chat: the empty chat and starters deal in'),
 ('composer-type-send', 2, t('t06-look2-work'), 9.0, 15.0, 'chat', 'app', 'Composer: "What should I wear to work tomorrow?" sent'),
 ('chat-thinking-lines', 2, t('t06-look2-work'), 15.4, 47.0, 'chat', 'app', 'Work look being made: orbit + Zee\'s thinking lines (take 2)'),
 ('look-card-landing', 2, t('t06-look2-work'), 45.6, 54.0, 'chat', 'app', 'Work look lands (take 2)'),
 ('dates-card-arrive', 1, t('t07-look3-trip'), 3.6, 14.0, 'chat', 'app', '"Planning to go to Miami": the dates card arrives'),
 ('dates-card-pick', 1, t('t07-look3-trip'), 22.0, 33.4, 'chat', 'app', 'Dates card: pick Fri 23 – Sun 25, Done folds it'),
 ('chat-thinking-lines', 3, t('t07-look3-trip'), 33.2, 105.0, 'chat', 'app', 'Miami look being made: orbit + thinking lines (take 3, long)'),
 ('look-card-landing', 3, t('t07-look3-trip'), 104.6, 112.4, 'chat', 'app', 'Miami look lands: "Day 1 is here" (take 3)'),
 ('chat-drawer-reopen', 1, t('t08-drawer-chats'), 1.4, 12.0, 'chat-drawer', 'app', 'Drawer with Today\'s chats: reopen an earlier chat'),
 # try-ons
 ('tryon-add-item-sheet', 1, t('t12-tryon'), 0.8, 4.2, 'try-ons', 'app', 'Try-ons: the Add an item sheet rises'),
 ('tryon-item-lands', 1, t('t12-tryon'), 14.8, 21.0, 'try-ons', 'app', 'The slip dress lands in its spot, Zee\'s hint'),
 ('tryon-curtain-reveal', 1, t('t12-tryon'), 45.4, 56.0, 'try-ons', 'app', 'Try on: the curtain draws, sways, opens on her wearing it'),
 ('tryon-curtain-reveal', 2, t('t13-tryon2'), 51.4, 72.0, 'try-ons', 'app', 'Try on 2 items: curtain, reveal (take 2)'),
 # probes (Emma's real selfie, roll photos and app pieces as inputs)
 ('selfie-ring-zee-peek', 1, t('p01-selfie-flow'), 16.6, 20.8, 'selfie-step', 'probe', 'Selfie step: the ring, Zee peeks over it, "Your turn"'),
 ('selfie-ring-opens', 1, t('p01-selfie-flow'), 20.8, 23.0, 'selfie-camera', 'probe', 'Take a selfie: the ring opens into the camera circle, Zee rides its edge'),
 ('selfie-live-hints', 1, t('p01-selfie-flow'), 22.6, 29.2, 'selfie-camera', 'probe', 'Camera hints: Come closer, Into the circle, More light, Perfect (Zee reacts)'),
 ('selfie-shutter-thats-you', 1, t('p01-selfie-flow'), 29.0, 32.0, 'selfie-camera', 'probe', 'Shutter: the blink, the ring closes, Zee jumps, "That\'s you!"'),
 ('selfie-hand-back', 1, t('p01-selfie-flow'), 31.8, 35.6, 'selfie-camera', 'probe', 'Use this: the circle shrinks back into the ring, "There you are"'),
 ('selfie-ring-zee-peek', 2, t('p02-selfie-flow'), 0.4, 4.2, 'selfie-step', 'probe', 'Selfie step (take 2)'),
 ('selfie-ring-opens', 2, t('p02-selfie-flow'), 4.2, 6.4, 'selfie-camera', 'probe', 'Ring opens (take 2)'),
 ('selfie-live-hints', 2, t('p02-selfie-flow'), 6.0, 12.4, 'selfie-camera', 'probe', 'Camera hints (take 2)'),
 ('selfie-shutter-thats-you', 2, t('p02-selfie-flow'), 12.4, 15.4, 'selfie-camera', 'probe', '"That\'s you!" (take 2)'),
 ('selfie-hand-back', 2, t('p02-selfie-flow'), 15.2, 19.2, 'selfie-camera', 'probe', 'Hand-back (take 2)'),
 ('tell-me-notification-ask', 1, t('p03-pieces-wait'), 62.0, 67.4, 'pieces-wait', 'probe', 'Tell me when it\'s ready: Apple\'s notification ask, Allow, down to the Wardrobe with the at-work pill'),
 ('first-piece-lift', 2, t('p03-pieces-wait'), 55.2, 60.0, 'pieces-wait', 'probe', 'First piece lifts out (probe take, her photos and pieces)'),
 ('photos-off-two-taps', 1, t('p04-photos-off'), 7.6, 19.8, 'photos-off', 'probe', 'Photos off: "Two taps", Zee peeks, the two rows light, the tick'),
 ('photos-off-yay', 1, t('p04-photos-off'), 19.6, 24.2, 'photos-off', 'probe', 'Back with Photos on: her pieces pop up, "Yay! 🎉", hand-off to the scan', 0.4),
 ('ready-pill-change', 1, t('p06-wardrobe-leave-b'), 5.4, 7.2, 'wardrobe', 'probe', '"Curate at work" becomes "Your wardrobe is ready ›"'),
 ('ready-pill-to-cheer', 1, t('p06-wardrobe-leave-b'), 7.3, 11.6, 'wardrobe', 'probe', 'Tap the ready pill: the stage rises back onto Zee\'s cheer'),
 ('zee-a4-typing', 1, t('p09-zee-beach'), 1.6, 3.8, 'zee-extras', 'probe', 'a4: Zee listens while she types "Going to the beach"'),
 ('zee-a1-refine', 1, t('p09-zee-beach'), 6.8, 10.6, 'zee-extras', 'probe', 'a1: Make it dressier, Zee listens then thinks'),
 ('zee-a2-look-changed', 1, t('p09-zee-beach'), 10.4, 13.4, 'zee-extras', 'probe', 'a2: Look 2 lands, Zee happy'),
 ('zee-a3-loved', 1, t('p09-zee-beach'), 13.2, 16.4, 'zee-extras', 'probe', 'a3: Love it, the heart, "Me too."'),
 ('zee-a4-typing', 2, t('p09-zee-beach'), 16.6, 20.8, 'zee-extras', 'probe', 'a4: typing a follow-up (take 2)'),
 ('zee-b8-saved', 1, t('p09-zee-kept'), 5.8, 10.4, 'zee-extras', 'probe', 'b8: bookmark the look, "Kept in Saved outfits" toast with Zee cheering'),
 ('zee-b9-idea', 1, t('p10-zee-idea'), 10.4, 15.6, 'zee-extras', 'probe', 'b9: a reply that offers something, Show me / Maybe later'),
 ('zee-b10-long-wait', 1, t('p09-zee-wait'), 18.0, 34.0, 'zee-extras', 'probe', 'b10: a wait past 20 s, "Still looking…", Zee focused'),
 ('zee-b5-night', 1, t('p09-zee-night'), 0.8, 6.0, 'zee-extras', 'probe', 'b5: empty chat late at night, "Up late, Emma?"'),
 ('zee-b6-morning', 1, t('p09-zee-morning'), 0.8, 6.0, 'zee-extras', 'probe', 'b6: first open of the day, "Morning, Emma"'),
 ('zee-b7-pet', 1, t('p09-zee-pet'), 1.5, 7.6, 'zee-extras', 'probe', 'b7: three taps on Zee (probe take)'),
 ('zee-b13-welcome-back', 1, t('p09-zee-back'), 1.0, 6.0, 'zee-extras', 'probe', 'b13: back after a week, "Welcome back, Emma"'),
 ('zee-b11-peek', 1, t('p09-zee-peek'), 0.6, 9.0, 'zee-extras', 'probe', 'b11: Zee peeks from behind the Wardrobe tab bar'),
 ('zee-b12-empty', 1, t('p09-zee-empty'), 0.8, 7.0, 'zee-extras', 'probe', 'b12: the empty wardrobe, Zee asks (probe take)'),
 ('required-update', 1, t('p08-required-update'), 0.6, 3.6, 'app-update', 'probe', 'Required update screen, 1200 ms entrance'),
]

def have(cid):
    try: return any(a['id'] == cid for a in json.load(open(IDX))['assets'])
    except Exception: return False

def state():
    p = f'{C}/state.json'
    return json.load(open(p)) if os.path.exists(p) else {'phase': '', 'total': 0, 'sections': [], 'log': []}

def add_item(screen, item):
    s = state()
    sec = next((x for x in s['sections'] if x['title'] == screen), None)
    if not sec: sec = {'title': screen, 'items': []}; s['sections'].append(sec)
    sec['items'] = [i for i in sec['items'] if i['id'] != item['id']] + [item]
    json.dump(s, open(f'{C}/state.json.tmp', 'w'), indent=1); os.replace(f'{C}/state.json.tmp', f'{C}/state.json')

def run(clips, only=None):
    for c in clips:
        moment, v, src, a, b, screen, source, title = c[:8]; h = c[8] if len(c) > 8 else 0.5
        cid = f'footage.emma.{moment}.v{v}'
        if only and only not in cid: continue
        out = f'{K}/{moment}.v{v}.mp4'
        if not os.path.exists(out):
            subprocess.run([f'{C}/trim.sh', src, str(a), str(b), out, str(h)], check=True)
        if not have(cid):
            r = subprocess.run([f'{C}/reg.sh', cid, moment, screen, source, out, title], capture_output=True, text=True)
            print(cid, (r.stdout + r.stderr).strip()[-300:])
        add_item(screen, {'id': cid, 'moment': moment, 'path': f'../footage/_previews/{moment}.v{v}.mp4',
                          'label': f'{title} · {cid} · {source}'})
        subprocess.run(['python3', f'{C}/tracker.py'], capture_output=True)

if __name__ == '__main__':
    run(CLIPS, sys.argv[1] if len(sys.argv) > 1 else None)
