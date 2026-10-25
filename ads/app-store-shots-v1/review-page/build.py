"""The founder's page for the App Store screenshot sets (2026-10-24). First the six calm layouts O1–O6 for S-V3 blue
(screenshots 1–3 each, picks section 'layout'), then the two rendered in full (O2, O5), then every earlier set folded:
S-V3 blue with the thrown garments, S-V3 cream, and S-V1 v1/v2 and S-V2, rejected 10-24. Earlier: S-V1 "colour campaign"
(ads/app-store-shots-v1) and S-V2 "editorial" (ads/app-store-shots-v2). Each set as it shows in
search (the first three) and on the product page (all six), then each screenshot large.
Picks: studies/picks_kit.py, section 'layout' (O1–O6), section 'shots' (the set) + Keep yes/no per screenshot.

python3 ads/app-store-shots-v1/review-page/build.py → review-page/site/index.html
(publish with capabilities {"db": {}}).
"""
import base64, importlib.util, io, os
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
MOTION = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
STUDIES = os.path.abspath(os.path.join(MOTION, '..', 'studies'))
spec = importlib.util.spec_from_file_location('picks_kit', os.path.join(STUDIES, 'picks_kit.py'))
pk = importlib.util.module_from_spec(spec); spec.loader.exec_module(pk)


def jpeg(path, w, q=90):
    im = Image.open(path).convert('RGB')
    im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    b = io.BytesIO(); im.save(b, 'JPEG', quality=q, optimize=True)
    return 'data:image/jpeg;base64,' + base64.b64encode(b.getvalue()).decode()


V3_COPY = [
    ('Today’s look, already picked.', 'Today with the art fair look; that look’s blazer, skirt and boots on the linen.'),
    ('Your closet, from your photos.', 'Her real Wardrobe; the coat, denim jacket and scarf in front, two of the photos they came from behind.'),
    ('See it on you, before you wear it.', 'Studio’s board, her try-on in the black tee as a print, the tee itself.'),
    ('Rain or shine, you’re dressed.', 'Today on a rainy morning; the screen’s own facts as chips; the trench and boots.'),
    ('Your stylist, one message away.', 'Chat with Zee and her starters; the skirt, boots and cami those starters name.'),
    ('Your photos, your call.', 'Three of her photos, two chosen, and the app’s own three privacy lines.'),
]

CALM_COPY = [
    ('Today’s look, already picked.', 'Today with the art fair look; that look’s blazer, cami, skirt and boots.'),
    ('Your closet, from your photos.', 'Her real Wardrobe; the coat, denim jacket and scarf from it.'),
    ('See it on you, before you wear it.', 'Studio with her try-on in the black tee; the tee, tote and loafers.'),
    ('Rain or shine, you’re dressed.', 'Today on a rainy morning; the trench, dark jeans, tote and boots.'),
    ('Your stylist, one message away.', 'Chat with Zee and her starters; the cami, skirt and boots those starters name.'),
    ('Your photos, your call.', 'Three of her photos in a row, two chosen, the app’s own three privacy lines.'),
]

OPT = f'{MOTION}/ads/app-store-shots-v3/out/options'
OPTIONS = [
    ('O1', 'Phone only', 'The tilted phone on its own, a little larger. Nothing else.'),
    ('O2', 'Phone + tidy row', 'The tilted phone, and the look’s pieces standing upright in one even row along the bottom.'),
    ('O3', 'Two phones', 'Two straight phones, one a step lower: two real screens for the same idea.'),
    ('O4', 'Phone + one hero', 'The tilted phone and one piece standing upright beside it, on the same floor.'),
    ('O5', 'Big phone, cropped', 'One big tilted phone running off the bottom edge: the real screen is the picture.'),
    ('O6', 'No phone, UI cards', 'The real screen cut into clean straight cards: the header, the look, the note.'),
]
FULL = ('O2', 'O5')

SETS = [
    {
        'key': 'S-V3-O2', 'name': 'O2 in full · Phone + tidy row',
        'line': 'The most product-led of the six: the real screen on the tilted phone, and below it the very pieces that screen shows, standing upright on one line, evenly spaced, soft cool shadows. Nothing thrown or rotated. Screenshot 6 has no phone in any layout (there is no privacy screen to show yet): her photos in a straight row and the app’s three privacy lines. Headlines in Geist SemiBold; the same set in Medium is just below.',
        'files': [f'{MOTION}/ads/app-store-shots-v3/out/final-o2-w600/s-v3-o2-{i}.png' for i in range(1, 7)],
        'medium': [f'{MOTION}/ads/app-store-shots-v3/out/final-o2-w500/s-v3-o2-{i}.png' for i in range(1, 7)],
        'copy': CALM_COPY,
    },
    {
        'key': 'S-V3-O5', 'name': 'O5 in full · Big phone, cropped',
        'line': 'The one that reads best small: the phone is as big as the frame allows and runs off the bottom, so in search the real screen is what you see. No clothes outside the phone at all; the clothes are the ones in her app. Screenshot 6 is the same calm one as O2. Headlines in Geist SemiBold; Medium just below.',
        'files': [f'{MOTION}/ads/app-store-shots-v3/out/final-o5-w600/s-v3-o5-{i}.png' for i in range(1, 7)],
        'medium': [f'{MOTION}/ads/app-store-shots-v3/out/final-o5-w500/s-v3-o5-{i}.png' for i in range(1, 7)],
        'copy': CALM_COPY,
    },
    {
        'key': 'S-V3-blue', 'name': 'S-V3 · Subtle blue, garments thrown', 'fold': 'the layout you didn’t like (thrown garments)',
        'line': 'Your note on the cream: “subtle blue”. The same set on a quiet pale blue linen (the same free Poly Haven texture, recoloured), soft cool light, the headline’s second line in a deep slate-navy, shadows tinted cool to match. Her clothes keep their own colours. Headlines in Geist SemiBold; the same set in Medium is just below.',
        'files': [f'{MOTION}/ads/app-store-shots-v3/out/final-blue-w600/s-v3-blue-{i}.png' for i in range(1, 7)],
        'medium': [f'{MOTION}/ads/app-store-shots-v3/out/final-blue-w500/s-v3-blue-{i}.png' for i in range(1, 7)],
        'copy': V3_COPY,
    },
    {
        'key': 'S-V3', 'name': 'S-V3 · Cream (the first colour)', 'fold': 'kept as a version (you asked for blue)',
        'line': 'Your pick from the board: Essembl’s theme, no editorial. A warm cream linen ground, huge two-tone headlines, our own 3D phone tilted and running off the edge with the real build-284 screen on it, and Emma’s own clothes in front of it with soft shadows. One idea each, no model photography. Headlines here in Geist SemiBold; the same set in Medium is just below.',
        'files': [f'{MOTION}/ads/app-store-shots-v3/out/final-w600/s-v3-{i}.png' for i in range(1, 7)],
        'medium': [f'{MOTION}/ads/app-store-shots-v3/out/final-w500/s-v3-{i}.png' for i in range(1, 7)],
        'copy': [
            ('Today’s look, already picked.', 'Today with the art fair look; that look’s blazer, skirt and boots on the linen.'),
            ('Your closet, from your photos.', 'Her real Wardrobe; the coat, denim jacket and scarf in front, two of the photos they came from behind.'),
            ('See it on you, before you wear it.', 'Studio’s board, her try-on in the black tee as a print, the tee itself.'),
            ('Rain or shine, you’re dressed.', 'Today on a rainy morning; the screen’s own facts as chips; the trench and boots.'),
            ('Your stylist, one message away.', 'Chat with Zee and her starters; the skirt, boots and cami those starters name.'),
            ('Your photos, your call.', 'Three of her photos, two chosen, and the app’s own three privacy lines.'),
        ],
    },
    {
        'key': 'S-V1-v2', 'name': 'S-V1 v2 · Quiet palette', 'rejected': True,
        'line': 'Your note on v1, “subtle colours”: one quiet palette (oat, dusty blue, warm stone, pale sage, soft blush, sand), each taken from its photo and pushed toward Mist. One hero each, the phone the same size and place, her photo on the same line, clothes only behind the phone, nothing tilted.',
        'files': [f'{MOTION}/ads/app-store-shots-v1/out/final-v1v2/s-v1v2-{i}.png' for i in range(1, 7)],
        'copy': [
            ('Always know what to wear.', 'Studio showing her Off-duty black look; the tote and loafers behind the phone.'),
            ('Your closet, from your photos.', 'Her real Wardrobe; two of the photos it came from behind the phone.'),
            ('See it on you.', 'Her in the black tee, the before in the corner.'),
            ('A look for every day.', 'Seven of her days, side by side, Mon to Sun.'),
            ('Ask your stylist.', 'Her question, and her at dinner.'),
            ('Your photos, your call.', 'Her mirror selfie and the app’s own three privacy lines.'),
        ],
    },
    {
        'key': 'S-V1', 'name': 'S-V1 v1 · Colour campaign (first version)', 'rejected': True,
        'line': 'Each screenshot on its own lit colour, taken from Emma’s photos: brick, ferry blue, autumn orange, wine. Her real photos and clothes with real shadows, the real build-284 screens.',
        'files': [f'{MOTION}/ads/app-store-shots-v1/out/final-v1/s-v1-{i}.png' for i in range(1, 7)],
        'copy': [
            ('Always know what to wear.', 'Her, dressed in Off-duty black, beside Studio showing that same look.'),
            ('Your closet, from your photos.', 'Three of her photos, the coat, scarf and jacket from them, her real Wardrobe.'),
            ('See it on you.', 'Her photo before, and with the black tee tried on.'),
            ('A look for every day.', 'Seven of her days, each on its own colour.'),
            ('Ask your stylist.', 'Her question, the look from her own wardrobe, her at dinner in it.'),
            ('Your photos, your call.', 'The app’s own three privacy lines, word for word.'),
        ],
    },
    {
        'key': 'S-V2', 'name': 'S-V2 · Editorial', 'rejected': True,
        'line': 'A bright magazine look: white pages, small kickers, oversized two-tone headlines, her photos large, the real build-284 screens.',
        'files': [f'{MOTION}/ads/app-store-shots-v2/out/s{i}.png' for i in range(1, 7)],
        'copy': [
            ('Always know what to wear.', 'Her in DUMBO, and today’s look below as four of her own pieces.'),
            ('Your closet, from your photos.', 'Three of her photos beside her real Wardrobe and the pieces from them.'),
            ('See it on you.', 'Her in the black tee, the before print, the real Studio try-on.'),
            ('A look for every day.', 'A week of her looks, Mon to Sun.'),
            ('Ask your stylist.', 'Her at dinner, her question and Zee’s answer from her wardrobe.'),
            ('Your photos stay yours.', 'Her roll with the three she chose, and the app’s privacy lines.'),
        ],
    },
]

ICON = jpeg(os.path.join(STUDIES, 'ob172-app-store-header/assets/icon.png'), 180)

css_pics = []
for s in SETS:
    s['cls'] = []
    folded = s.get('fold') or s.get('rejected')
    for i, f in enumerate(s['files']):
        cls = f'p-{s["key"].lower().replace("-", "")}-{i + 1}'
        css_pics.append(f'.{cls}{{background-image:url("{jpeg(f, 560 if folded else 760, 84 if folded else 90)}")}}')
        s['cls'].append(cls)
    s['mcls'] = []
    for i, f in enumerate(s.get('medium', [])):
        cls = f'm-{s["key"].lower().replace("-", "")}-{i + 1}'
        css_pics.append(f'.{cls}{{background-image:url("{jpeg(f, 420, 86)}")}}')
        s['mcls'].append(cls)
for key, _, _ in OPTIONS:
    for n in range(1, 4):
        css_pics.append(f'.o-{key.lower()}-{n}{{background-image:url("{jpeg(f"{OPT}/{key.lower()}-s{n}.png", 420, 86)}")}}')

STATUS = '<div class="sb"><span>9:41</span><span class="sbr"><i></i><i></i><i></i><b></b></span></div>'


def search_mock(s):
    shots = ''.join(f'<i class="pic {c}"></i>' for c in s['cls'][:3])
    return f'''<div class="ph">{STATUS}
  <div class="sbar">⌕ curate</div>
  <div class="app"><div class="icon" style="background-image:url('{ICON}')"></div><div class="an">Curate Fashions - AI Stylist</div><div class="get">Get</div></div>
  <div class="row3">{shots}</div>
  <div class="ghost"></div>
</div>'''


def product_mock(s):
    shots = ''.join(f'<i class="pic {c}"></i>' for c in s['cls'])
    return f'''<div class="ph">{STATUS}
  <div class="back">‹</div>
  <div class="app big"><div class="icon" style="background-image:url('{ICON}')"></div><div><div class="an">Curate Fashions - AI Stylist</div><div class="get">Get</div></div></div>
  <div class="pv">Preview</div>
  <div class="row6">{shots}</div>
</div>'''


cards = ''.join(
    f'''<div class="opt"><div class="otop"><b>{key} · {name}</b>{'<span class="tag">in full below</span>' if key in FULL else ''}</div>
  <div class="cap">{desc}</div>
  <div class="orow">{"".join(f'<i class="pic o-{key.lower()}-{n}"></i>' for n in range(1, 4))}</div>
  <div class="verdict">{pk.choose("layout", key, text=f"Pick {key}")}</div></div>'''
    for key, name, desc in OPTIONS)
sections = [f'''<section><h2>Six calm layouts · screenshots 1–3</h2>
  <p>Your notes: the tilted phone is fine, thrown garments are not. So in all six the pieces stand upright, aligned and evenly spaced with soft shadows; never tossed, rotated or angled across the phone. The same blue linen, headlines, phone and margins in every one; only the layout changes. Each row is how the first three look side by side in search.</p>
  <div class="opts">{cards}</div></section>''']
for s in SETS:
    large = ''.join(
        f'''<figure><div class="pic shot {c}"></div><figcaption><b>{i + 1} · {h}</b>{d}</figcaption>
        {pk.yesno("shots", f"{s['key']} #{i + 1} keep")}</figure>'''
        for i, (c, (h, d)) in enumerate(zip(s['cls'], s['copy'])))
    medium = ''
    if s['mcls']:
        medium = (f'''<div class="medium"><div class="cap">The same set with Medium headlines (the brand rule for titles)</div>
  <div class="mrow">{"".join(f'<i class="pic {c}"></i>' for c in s['mcls'])}</div>
  <div class="verdict">Medium instead of SemiBold? {pk.yesno("shots", f"{s['key']} medium headlines")}</div></div>''')
    body = f'''<p>{s["line"]}</p>
  <div class="mocks">
    <div><div class="cap">In search: the first three</div>{search_mock(s)}</div>
    <div><div class="cap">On the product page: all six (scroll the row)</div>{product_mock(s)}</div>
  </div>
  <div class="verdict">{pk.choose("shots", s["key"], text=f"Pick {s['key']}")}</div>
  {medium}
  <div class="grid">{large}</div>'''
    if s.get('fold'):
        sections.append(f'<section class="old"><details><summary>{s["name"]} · {s["fold"]}</summary>{body}</details></section>')
    elif s.get('rejected'):
        sections.append(f'<section class="old"><details><summary>{s["name"]} · rejected 10-24</summary>{body}</details></section>')
    else:
        sections.append(f'<section><h2>{s["name"]}</h2>{body}</section>')

CSS = r'''
:root { --ground:#f5f6f4; --ink:#181818; --t2:#656565; --t3:#9a9c98; --line:#e3e4e0; color-scheme: light; }
* { box-sizing: border-box; }
body { margin:0; background: var(--ground); color: var(--ink); font: 15px/1.45 Geist, -apple-system, "Helvetica Neue", Arial, sans-serif; padding: 28px 16px 64px; }
main { max-width: 1180px; margin: 0 auto; display: grid; grid-template-columns: minmax(0, 1fr); gap: 44px; }
h1 { font-size: 30px; font-weight: 500; letter-spacing: -.02em; margin: 0; text-wrap: balance; }
.lede { color: var(--t2); margin: 6px 0 0; max-width: 74ch; }
section h2 { font-size: 22px; font-weight: 500; margin: 0; letter-spacing: -.01em; }
section > p { color: var(--t2); margin: 4px 0 16px; max-width: 74ch; }
.mocks { display: flex; gap: 28px; flex-wrap: wrap; }
.cap { font-size: 13px; color: var(--t2); margin-bottom: 8px; }
.verdict { margin: 18px 0 8px; }
.medium { margin: 18px 0 6px; } .mrow { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 6px; }
.mrow i { flex: 0 0 150px; aspect-ratio: 1320 / 2868; border-radius: 12px; border: 1px solid var(--line); }
.opts { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 520px), 1fr)); gap: 22px; }
.opt { min-width: 0; background: #fff; border: 1px solid var(--line); border-radius: 18px; padding: 16px; }
.otop { display: flex; align-items: center; gap: 10px; font-size: 17px; margin-bottom: 2px; } .otop b { font-weight: 500; }
.tag { font-size: 12px; color: var(--t2); border: 1px solid var(--line); border-radius: 999px; padding: 2px 9px; }
.orow { display: flex; align-items: flex-start; gap: 8px; margin-top: 10px; } .orow i { flex: 1 1 0; min-width: 0; aspect-ratio: 1320 / 2868; border-radius: 12px; border: 1px solid var(--line); }
section.old summary { cursor: pointer; font-size: 17px; font-weight: 500; color: var(--t2); }
section.old details[open] summary { margin-bottom: 12px; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 22px; margin-top: 18px; }
figure { margin: 0; }
.pic { background-size: cover; background-position: center; background-repeat: no-repeat; }
.shot { width: 100%; aspect-ratio: 1320 / 2868; border-radius: 18px; border: 1px solid var(--line); box-shadow: 0 10px 30px rgba(20,20,20,.08); }
figcaption { font-size: 13.5px; color: var(--t2); margin-top: 8px; }
figcaption b { display: block; color: var(--ink); font-weight: 500; font-size: 15px; margin-bottom: 2px; }

/* phones: laid out at 393 × 852, shown 320 wide */
.ph { width: 393px; height: 852px; zoom: .8142; border-radius: 54px; position: relative; overflow: hidden; background: #fff; border: 1px solid #d8d9d5; box-shadow: 0 14px 40px rgba(20,20,20,.10); }
.sb { position: absolute; top: 18px; left: 44px; right: 34px; display: flex; justify-content: space-between; font-size: 17px; font-weight: 600; }
.sbr { display: flex; gap: 5px; align-items: center; } .sbr i { width: 4px; height: 10px; background: #111; border-radius: 1px; } .sbr b { width: 26px; height: 12px; border: 1.5px solid #111; border-radius: 4px; margin-left: 4px; }
.sbar { position: absolute; top: 60px; left: 16px; right: 16px; height: 40px; border-radius: 12px; background: #eeeff1; padding: 9px 12px; font-size: 16px; color: #333; }
.app { position: absolute; top: 118px; left: 16px; right: 16px; display: flex; gap: 12px; align-items: center; }
.app .icon { width: 62px; height: 62px; border-radius: 14px; background-size: cover; flex: none; }
.app .an { font-size: 18px; font-weight: 600; display: flex; flex-direction: column; } .app .an span { font-size: 13px; font-weight: 400; color: var(--t2); }
.app .get { margin-left: auto; width: 74px; height: 30px; border-radius: 15px; background: #0a84ff; color: #fff; display: grid; place-items: center; font-size: 15px; font-weight: 700; }
.row3 { position: absolute; top: 196px; left: 16px; right: 16px; display: flex; gap: 8px; }
.row3 i { flex: 1; aspect-ratio: 1320 / 2868; border-radius: 12px; border: 1px solid var(--line); }
.ghost { position: absolute; top: 470px; left: 16px; right: 16px; height: 300px; border-radius: 16px; background: #f2f3f1; }
.back { position: absolute; top: 58px; left: 16px; font-size: 34px; line-height: 1; color: #0a84ff; }
.app.big { top: 108px; } .app.big .icon { width: 96px; height: 96px; border-radius: 22px; } .app.big .get { margin: 8px 0 0; }
.facts { position: absolute; top: 230px; left: 16px; right: 16px; display: grid; grid-template-columns: repeat(3, 1fr); border-top: 1px solid var(--line); padding-top: 12px; text-align: center; font-size: 13px; color: var(--t2); }
.facts span { display: block; font-size: 10px; letter-spacing: .06em; color: var(--t3); margin-bottom: 3px; }
.pv { position: absolute; top: 236px; left: 16px; font-size: 21px; font-weight: 700; }
.row6 { position: absolute; top: 276px; left: 16px; right: 0; display: flex; gap: 10px; overflow-x: auto; padding-right: 16px; }
.row6 i { flex: 0 0 236px; height: 513px; border-radius: 18px; border: 1px solid var(--line); }
'''

html = f'''<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>App Store Screenshots</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&display=swap">
<style>{"".join(css_pics)}{CSS}{pk.CSS}</style>
<main>
  <header>
    <h1>App Store screenshots</h1>
    <p class="lede">New first: six calm layouts for S-V3 blue (pick one), then the two I think strongest rendered in full, O2 and O5. Every earlier set is folded below: S-V3 blue with the thrown garments, the cream version, and the three you rejected. Six screenshots (iPhone 6.9", 1320 × 2868), one outcome each, our own words, the real build-284 screens (Today, Wardrobe, Studio, Chat), Emma’s own clothes. No ratings or press: we have 4 ratings, too few to show honestly. The phone is our own 3D phone, not an iPhone (Apple doesn’t allow its iPhone to be tilted or covered). Emma and her photos are AI-generated.</p>
  </header>
  {"".join(sections)}
  {pk.summary([("layout", "Layout"), ("shots", "Set")])}
</main>
<script>{pk.JS}</script>
'''
os.makedirs(os.path.join(HERE, 'site'), exist_ok=True)
open(os.path.join(HERE, 'site', 'index.html'), 'w').write(html)
print(len(html) // 1024, 'KB')
