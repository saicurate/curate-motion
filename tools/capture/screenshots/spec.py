# spec.py -> spec.json: every screenshot, its section, label, screen/state, origin and provenance.
import json, os
D = os.path.dirname(os.path.abspath(__file__))
frames = {l.split()[0]: (l.split()[1], float(l.split()[2])) for l in open(f'{D}/frames.txt') if l.strip()}
patched = set(open(f'{D}/patched.txt').read().split())
PROBE = {'selfie-step', 'selfie-hint-circle', 'selfie-hint-light', 'selfie-hint-perfect', 'selfie-thats-you', 'selfie-there-you-are',
         'photos-off-two-taps', 'photos-off-yay', 'ready-pill', 'tell-me-notification', 'required-update'} | {k for k in frames if k.startswith('zee-a') or k.startswith('zee-b')}
HERO = ['front-door', 'ob-pairs', 'ob-mirror-reading', 'privacy-shield', 'selfie-thats-you', 'photos-off-two-taps', 'scan-roll', 'pieces-up-big',
        'pieces-arriving', 'wardrobe-ready-cheer', 'import-review', 'wardrobe-top', 'piece-detail', 'chat-empty', 'zee-thinking', 'question-card',
        'location-sky', 'look-card', 'multiple-looks-2', 'style-notes', 'adjust', 'tryon-curtain', 'tryon-result-dress', 'profile']
# (name, section, label, screen, state)
S = [
 ('Front door and sign-up', [
  ('splash', 'Cold launch: the Curate mark', 'splash', 'mark'),
  ('front-door', 'Front door: Try it. Style it. Wear it.', 'front-door', 'reel'),
  ('front-door-sign-in', 'Front door: Sign in, with Apple, Google or email', 'front-door', 'sign-in'),
  ('email-signup', 'Create your account', 'email-signup', 'empty')]),
 ('Onboarding', [
  ('ob-about', '01 Nice to meet you: name and birthday', 'onboarding-about', 'filled'),
  ('ob-username', '02 Pick your username', 'onboarding-username', 'available'),
  ('ob-pairs', '03 Tell us about your style: this or that', 'onboarding-style', 'pair'),
  ('ob-pairs-ranked', '03 Three styles won a round', 'onboarding-style', 'ranked'),
  ('ob-mirror-reading', '05 Mirror: reading her skin, hair and eyes', 'onboarding-mirror', 'reading'),
  ('ob-mirror-payoff', '05 Mirror: Deep Autumn', 'onboarding-mirror', 'payoff'),
  ('ob-body', '06 Your body: the 3D body', 'onboarding-body', 'height'),
  ('ob-body-tapes', '06 Your body: the bust tape lit', 'onboarding-body', 'tapes')]),
 ('Finding her clothes', [
  ('empty-wardrobe-zee', 'Empty Wardrobe: Hi, I\'m Zee. Let\'s find your clothes.', 'wardrobe', 'empty'),
  ('zee-asks-on-it', 'Empty Wardrobe: Look in my photos, On it.', 'wardrobe', 'empty-on-it'),
  ('privacy-shield', 'Privacy shield: Your photos stay yours', 'privacy-shield', 'consent'),
  ('selfie-step', 'Selfie step: Your turn, Zee on the ring', 'selfie-step', 'ring'),
  ('selfie-hint-circle', 'Selfie camera hint: Into the circle', 'selfie-camera', 'hint-circle'),
  ('selfie-hint-light', 'Selfie camera hint: More light', 'selfie-camera', 'hint-light'),
  ('selfie-hint-perfect', 'Selfie camera hint: Perfect', 'selfie-camera', 'hint-perfect'),
  ('selfie-thats-you', 'Selfie: That\'s you!', 'selfie-camera', 'thats-you'),
  ('selfie-there-you-are', 'Selfie: There you are', 'selfie-step', 'there-you-are'),
  ('photos-permission', 'Apple\'s Photos access prompt', 'photos-access', 'system-prompt'),
  ('photos-off-two-taps', 'Photos off: Two taps', 'photos-off', 'two-taps'),
  ('photos-off-yay', 'Photos off: Yay! Let\'s find your clothes', 'photos-off', 'yay'),
  ('scan-start', 'Scan: Getting your photos ready', 'scan', 'deck'),
  ('scan-roll', 'Scan: Looking for you, Zee\'s magnifier mid-roll', 'scan', 'mid-scan'),
  ('scan-found', 'Scan: Found 30 photos of you', 'scan', 'found')]),
 ('Her pieces arrive', [
  ('pieces-up-big', 'Your pieces: her photo up big', 'pieces-wait', 'up-big'),
  ('pieces-style-fact', 'Your pieces: a style line about her', 'pieces-wait', 'style-fact'),
  ('pieces-first-piece', 'Your pieces: the first piece, Ballet Flats', 'pieces-wait', 'first-piece'),
  ('pieces-arriving', 'Your pieces: 40 so far, pieces tucking into the row', 'pieces-wait', 'arriving'),
  ('tell-me-notification', 'Tell me when it\'s ready: Apple\'s notification prompt', 'pieces-wait', 'notification-prompt'),
  ('wardrobe-ready-cheer', 'Your wardrobe is ready: Zee cheers', 'wardrobe-ready', 'cheer'),
  ('import-review', 'Review: 41 pieces from your photos', 'import-review', 'grid'),
  ('import-review-undo', 'Review: Hoodie removed, Undo', 'import-review', 'removed-undo'),
  ('wardrobe-new-pieces', 'Wardrobe: New · 40', 'wardrobe', 'new-pieces'),
  ('at-work-pill', 'Wardrobe: Curate at work pill', 'wardrobe', 'at-work'),
  ('at-work-pill-longer', 'Wardrobe: Curate at work, pieces taking longer', 'wardrobe', 'at-work-longer'),
  ('ready-pill', 'Wardrobe: Your wardrobe is ready pill', 'wardrobe', 'ready-pill')]),
 ('Wardrobe', [
  ('wardrobe-top', 'Wardrobe tab: This week, ask card, her pieces', 'wardrobe', 'top'),
  ('wardrobe-scrolled-1', 'Wardrobe tab: scrolled to her pieces', 'wardrobe', 'scrolled-1'),
  ('wardrobe-scrolled-2', 'Wardrobe tab: chips pinned, grid', 'wardrobe', 'scrolled-2'),
  ('wardrobe-scrolled-3', 'Wardrobe tab: further down the grid', 'wardrobe', 'scrolled-3'),
  ('wardrobe-chip-tops', 'Wardrobe filter: Tops', 'wardrobe', 'chip-tops'),
  ('wardrobe-chip-bottoms', 'Wardrobe filter: Bottoms', 'wardrobe', 'chip-bottoms'),
  ('wardrobe-chip-dresses', 'Wardrobe filter: Dresses', 'wardrobe', 'chip-dresses'),
  ('wardrobe-chip-shoes', 'Wardrobe filter: Shoes', 'wardrobe', 'chip-shoes'),
  ('wardrobe-chip-outerwear', 'Wardrobe filter: Outerwear', 'wardrobe', 'chip-outerwear'),
  ('wardrobe-chip-accessories', 'Wardrobe filter: Accessories', 'wardrobe', 'chip-accessories'),
  ('wardrobe-chip-bags', 'Wardrobe filter: Bags', 'wardrobe', 'chip-bags'),
  ('calendar', 'Calendar: October', 'calendar', 'month'),
  ('notifications', 'Notifications: People, all caught up', 'notifications', 'people'),
  ('notifications-tryons', 'Notifications: Your try-on is ready', 'notifications', 'tryons'),
  ('create-outfit', 'Create outfit: What are we dressing for?', 'create-outfit', 'sheet')]),
 ('Pieces', [
  ('piece-detail', 'Piece: Beige Satin Slip Midi Dress', 'piece-detail', 'top'),
  ('piece-edit', 'Piece: Edit details', 'piece-detail', 'edit'),
  ('add-item', 'Add item: pick photos of you', 'add-item', 'sheet'),
  ('extraction-wait', 'Add item: Looking at your photo', 'extraction', 'looking'),
  ('extraction-found', 'Add item: Found 1 piece, Navy Blue Baseball Cap', 'extraction', 'found'),
  ('duplicate-review', 'Same piece? Duplicate review', 'duplicate-review', 'sheet'),
  ('duplicate-review-pick', 'Same piece? Picked the one to keep', 'duplicate-review', 'picked')]),
 ('Chat with Zee', [
  ('chat-empty', 'Chat: Evening, Emma, with Zee and starters', 'chat', 'empty'),
  ('composer-typing', 'Chat: typing What should I wear tonight?', 'chat', 'typing'),
  ('question-card', 'Question card: What\'s tonight?', 'chat', 'question-card'),
  ('location-ask', 'Location ask: I can\'t see your sky', 'chat', 'location-ask'),
  ('location-sky', 'There\'s your sky, then Zee puts a look together', 'chat', 'sky-and-thinking'),
  ('zee-thinking', 'Zee thinking: Going through your 49 pieces', 'chat', 'thinking'),
  ('zee-thinking-b', 'Zee thinking: Checking New York tonight', 'chat', 'thinking-weather'),
  ('look-card-landing', 'Look card landing, with her request answered', 'chat', 'look-landing'),
  ('look-card', 'Look card: Date night, Me too.', 'chat', 'look-card'),
  ('tonight-thread', 'Thread: question answered, sky, the reply', 'chat', 'thread-top'),
  ('tonight-reply', 'Thread: the reply and the look', 'chat', 'thread-reply'),
  ('multiple-looks-2', 'Multiple looks: look 3 of 3, wool coat and mini dress', 'chat', 'multiple-looks'),
  ('multiple-looks-3', 'Multiple looks: look 2 of 3, leather jacket', 'chat', 'multiple-looks-alt'),
  ('work-look', 'Work look: drizzly tomorrow', 'chat', 'work-look'),
  ('dates-card', 'Dates card: pick your Miami dates', 'chat', 'dates-card'),
  ('dates-card-picked', 'Dates card: Fri 23 to Sun 25 picked', 'chat', 'dates-picked'),
  ('trip-thread', 'Trip: Miami dates answered, Day 1', 'chat', 'trip-thread'),
  ('trip-look', 'Trip look: For your Miami trip', 'chat', 'trip-look'),
  ('adjust', 'Adjust: Styling priorities', 'adjust', 'sheet'),
  ('style-notes', 'Style notes: How to wear it', 'style-notes', 'top'),
  ('style-notes-scrolled', 'Style notes: Shoulder drape', 'style-notes', 'scrolled'),
  ('chat-drawer', 'Chat drawer: her chats', 'chat-drawer', 'open'),
  ('chat-drawer-search', 'Chat drawer: search', 'chat-drawer', 'search'),
  ('zee-remembers', 'What Curate knows: her notebook', 'notebook', 'sheet'),
  ('saved-outfits', 'Your outfits: Saved', 'outfits', 'saved-empty'),
  ('outfits-recent', 'Your outfits: Recent', 'outfits', 'recent'),
  ('outfits-planned', 'Your outfits: Planned', 'outfits', 'planned-empty'),
  ('outfits-tried', 'Your outfits: Tried on', 'outfits', 'tried-empty')]),
 ('Try-ons', [
  ('tryon-start', 'Try-ons: Start with a photo of you', 'try-ons', 'start'),
  ('tryons', 'Try-ons tab: her photo, add up to 4 items', 'try-ons', 'ready'),
  ('tryon-add-item', 'Try-ons: Add an item', 'try-ons', 'add-item'),
  ('tryon-item-placed', 'Try-ons: the slip dress in its spot', 'try-ons', 'item-placed'),
  ('tryon-curtain', 'Try-ons: the curtain, Trying on', 'try-ons', 'curtain'),
  ('tryon-reveal', 'Try-ons: the reveal', 'try-ons', 'reveal'),
  ('tryon-result-dress', 'Try-on result: the slip dress on her', 'try-ons', 'result-dress'),
  ('tryon-result-tee', 'Try-on result: tee and trousers', 'try-ons', 'result-tee'),
  ('tryons-history', 'Your try-ons', 'try-ons', 'history')]),
 ('Profile and Settings', [
  ('profile', 'Profile: Emma Russo, her try-ons', 'profile', 'try-ons'),
  ('profile-gallery', 'Profile: Gallery', 'profile', 'gallery'),
  ('profile-edit', 'Edit profile', 'profile', 'edit'),
  ('settings', 'Settings', 'settings', 'top'),
  ('settings-scrolled', 'Settings: photos, preferences, help', 'settings', 'scrolled'),
  ('settings-skin-tone', 'Settings: Your shade profile', 'settings', 'skin-tone'),
  ('settings-body-measurements', 'Settings: Your body', 'settings', 'body'),
  ('settings-notifications', 'Settings: Notifications', 'settings', 'notifications'),
  ('settings-appearance', 'Settings: Appearance', 'settings', 'appearance'),
  ('required-update', 'Time to update Curate (blocking update)', 'required-update', 'screen')]),
 ("Zee's moments", [
  ('zee-a1-refine', 'Zee a1: Make it dressier, Zee listens', 'chat', 'zee-a1-refine'),
  ('zee-a2-look-changed', 'Zee a2: the look changed', 'chat', 'zee-a2-look-changed'),
  ('zee-a3-loved', 'Zee a3: Love it, Me too.', 'chat', 'zee-a3-loved'),
  ('zee-a4-typing', 'Zee a4: listening while she types', 'chat', 'zee-a4-typing'),
  ('zee-b5-night', 'Zee b5: Up late, Emma?', 'chat', 'zee-b5-night'),
  ('zee-b6-morning', 'Zee b6: Morning, Emma', 'chat', 'zee-b6-morning'),
  ('zee-b7-pet', 'Zee b7: three taps, Zee purrs', 'chat', 'zee-b7-pet'),
  ('zee-b8-saved', 'Zee b8: Kept in Saved outfits', 'chat', 'zee-b8-saved'),
  ('zee-b9-idea', 'Zee b9: an idea for Friday', 'chat', 'zee-b9-idea'),
  ('zee-b10-long-wait', 'Zee b10: Still looking…', 'chat', 'zee-b10-long-wait'),
  ('zee-b13-welcome-back', 'Zee b13: Welcome back, Emma', 'chat', 'zee-b13-welcome-back')]),
]
RENAME = {'chat-empty': 'chat-empty-b', 'look-card': 'tonight-0', 'tonight-thread': 'tonight-up3', 'tonight-reply': 'tonight-up1',
          'work-look': 'work-up4', 'trip-thread': 'work-up1', 'trip-look': 'work-0'}
out = []
for sec, items in S:
    for name, label, screen, state in items:
        raw = RENAME.get(name, name)
        assert os.path.exists(f'{D}/raw/{raw}.png'), raw
        e = dict(name=name, raw=raw, section=sec, label=label, screen=screen, state=state,
                 origin='probe' if name in PROBE else 'app', hero=name in HERO, patched=raw in patched)
        if raw in frames:
            src, t = frames[raw]; e.update(capture='frame', frameSec=t)
            if src.endswith('.mp4') and not src.startswith(('ob-', 'cold', 'front')) and '.cfr.' in src: e['fromTake'] = src.replace('.cfr.mp4', '')
            else: e['fromFootage'] = 'footage.emma.' + src.replace('.v', '.v') if False else f"footage.emma.{src.rsplit('.v',1)[0]}.v{src.rsplit('.v',1)[1]}"
        else: e['capture'] = 'screenshot'
        out.append(e)
assert len(HERO) == sum(e['hero'] for e in out), [h for h in HERO if h not in {e['name'] for e in out}]
json.dump(out, open(f'{D}/spec.json', 'w'), indent=1)
used = {e['raw'] for e in out}; extra = [f[:-4] for f in os.listdir(f'{D}/raw') if f[:-4] not in used]
print(len(out), 'shots;', sum(e['origin'] == 'probe' for e in out), 'probe;', sum(e['hero'] for e in out), 'hero; unused raw:', extra)
