"""The founder's one review page for the iOS 27 App Store header: every direction and variant.

Scans ads/app-store-header*/out/g2/<variant>/ (each agent's stills; <variant>-search/ is its 3:2 card,
<variant>-product-page.png its product-page mock) and shows each variant with its draft loop (newest
render whose name matches), its stills, its 3:2 card, a product-page view, two 100% crops, and a Pick
(picks_kit, collection `picks`, section `header2`).

Sharp on purpose (founder, 2026-10-24: "why is it so blurry?"): full-size stills (3840 × 1646 and
2880 × 1920), shown at ≥ 2× their display width, JPEG q92, plus 100% crops. Every image and loop is its
own file in site/media/ (named by its content), so the page has no size squeeze however many directions land.
python3 ads/app-store-header/review-page/build.py → review-page/site/index.html + site/media/ + site/files.json
(publish index.html with {"db": {}}, root site/, and files = the list in files.json).
The page before this (A + B coming, C parked): build_v1.py.
"""
import glob, hashlib, importlib.util, io, json, os, re, shutil, subprocess, tempfile
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))
ADS = f'{ROOT}/ads'
STUDIES = '/Users/saikumar/Desktop/Curate/studies'
spec = importlib.util.spec_from_file_location('picks_kit', f'{STUDIES}/picks_kit.py')
pk = importlib.util.module_from_spec(spec); spec.loader.exec_module(pk)
BUDGET = 15 * 1024 * 1024  # per file (the page and each image or loop)
CRF = 22
MEDIA = f'{HERE}/site/media'
shutil.rmtree(MEDIA, ignore_errors=True)
os.makedirs(MEDIA)


def keep(data, ext):
    """Writes one media file (named by its content, so the same picture is one file) → its page path."""
    name = hashlib.sha1(data).hexdigest()[:16] + ext
    if len(data) > BUDGET:
        raise SystemExit(f'{name} is {len(data) / 1024 / 1024:.1f} MB, over the {BUDGET / 1024 / 1024:.0f} MB a file')
    open(f'{MEDIA}/{name}', 'wb').write(data)
    return f'media/{name}'


def jpeg(img_or_path, w, q=92):
    im = img_or_path if isinstance(img_or_path, Image.Image) else Image.open(img_or_path)
    im = im.convert('RGB')
    if w and im.width > w:
        im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    b = io.BytesIO(); im.save(b, 'JPEG', quality=q, optimize=True, subsampling=0)
    return keep(b.getvalue(), '.jpg')


def frame_of(path):
    m = re.search(r'_f(\d+)\.png$', path)
    return int(m.group(1)) if m else 0


# A face and a garment at 100% for each variant whose hero still we know: (ad, variant, frame) → centres in
# pixels. A still with another frame number (re-rendered, re-timed) falls back to the most detailed windows.
CROP_SPOTS = {
    # the one film: one crop per beat, each from its own still (a fourth item names the frame)
    ('app-store-header-all', 'one', 960): [('coat', 998, 920, 270), ('face', 2240, 560, 600), ('card', 1920, 1060, 1430), ('mark', 1410, 700, 1560)],
    ('app-store-header', 'roll', 216): [('face', 2880, 700), ('coat', 1912, 900)],
    ('app-store-header', 'roll-tonal', 276): [('face', 2880, 700), ('coat', 1920, 900)],
    ('app-store-header-tryon', 'tryon', 165): [('face', 2252, 540), ('tee', 2192, 820)],
    ('app-store-header-tryon', 'tryon-b3', 165): [('face', 2240, 575), ('tee', 2192, 835)],
}


def crops(path, n=2, size=440, spots=None):
    """[(caption, image)]: size × size windows of a still at 100% (where sharpness can be judged), at the given
    spots, else the n most detailed ones."""
    im = Image.open(path).convert('RGB')
    if spots:
        return [(name, im.crop((x - size // 2, y - size // 2, x + size // 2, y + size // 2))) for name, x, y in spots]
    g = np.asarray(im.convert('L'), dtype=np.float32)
    gy, gx = np.gradient(g)
    e = np.hypot(gx, gy)
    step = size // 2
    cells = []
    for y in range(0, im.height - size, step):
        for x in range(0, im.width - size, step):
            cells.append((float(e[y:y + size, x:x + size].mean()), x, y))
    cells.sort(reverse=True)
    out = []
    for score, x, y in cells:
        if all(abs(x - ox) >= size or abs(y - oy) >= size for _, ox, oy in out):
            out.append((score, x, y))
        if len(out) == n:
            break
    return [('detail', im.crop((x, y, x + size, y + size))) for _, x, y in out]


def video(ad, names, w=1600, fmt='store-header'):
    """The newest header render of the first name (in order) that has one; '' = the ad's own name (a
    direction's base variant renders as `<ad>_master_…`)."""
    fs = []
    for n in names:
        fs = glob.glob(f'{ROOT}/renders/{ad}/**/{ad}{"-" + n if n else ""}_*{fmt}*.mp4', recursive=True)
        if fs:
            break
    if not fs:
        return None
    src = max(fs, key=os.path.getmtime)
    out = tempfile.mktemp(suffix='.mp4')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-vf', f'scale={w}:-2:flags=lanczos,fps=30', '-c:v', 'libx264', '-crf', str(CRF), '-preset', 'slow',
                    '-pix_fmt', 'yuv420p', '-an', '-movflags', '+faststart', out], check=True)
    b = open(out, 'rb').read(); os.remove(out)
    return keep(b, '.mp4'), os.path.basename(src)


# Directions, in order, by folder; their variants' names and lines where we know them (else the folder name
# and the ad's brief). Zee (the old film C) is parked and not listed.
# the one film leads (the App Store takes one header video), its loop shown wider than the single films'
VIDEO_W = {'app-store-header-all': 1920}

DIRECTIONS = [
    ('app-store-header-all', '1', 'The one film',
     'The App Store takes one header video and one search card, so the directions become one 30 s loop in the subtle palette: A (her photos give up the coat, jacket and scarf; her real Wardrobe) → B (the black tee onto her photo; Studio’s real try-on) → C (a week of looks) → the Curate lockup → back to the first frame. The first 5 s land on their own. Every beat arrives on the same slow camera glide through a soft column of light: one camera through one studio.',
     {'one': ('ALL', 'A → B → C → Curate, 30 s', 'A2 tonal, B3 and C2 subtle, each its own film reused inside this one; the lockup is the mark with “Curate” beside it and the app’s own line, “Try it. Style it. Wear it.”')}),
    ('app-store-header', 'A', 'Pulled from her photos',
     'What she’s wearing lifts out of her real photos (the coat from DUMBO, the denim jacket from the ferry, the scarf from the park); the photos fall away and the pieces become her real Wardrobe (build 284) on the phone.',
     {'roll': ('A1', 'Studio white', 'The Mist studio sweep; her photos as lit prints.'),
      'roll-tonal': ('A2', 'Tonal', 'One soft tonal ground at a time, each photo’s own colour pushed close to Mist: blush stone as the coat lifts from DUMBO, dusty blue for the ferry’s jacket, oat for the park’s scarf, sand under the phone. One hero at a time; the others dim back.'),
      'roll-colour': ('A2-loud', 'Colour-blocked (superseded)', 'Superseded: saturated blue, brick and orange fields read cheap (the founder, 2026-10-24: “subtle colours”). Kept as a version; A2 is the subtle one.', True)}),
    ('app-store-header-tryon', 'B', 'See it on you', None,
     {'tryon': ('B1', 'Mist studio', ''),
      'tryon-b3': ('B3', 'Tonal', 'The same film on a subtle tonal set: pale dusty blue before the try-on, soft blush oat once she’s wearing the black tee; softer, wider shadows, more air.'),
      'tryon-b2': ('B2', 'Colour-blocked set (superseded)', 'Superseded: the saturated set read cheap (the founder, 2026-10-24: “subtle colours”). Kept as a version; B3 is the subtle one.', True)}),
    ('app-store-header-week', 'C', 'A week of looks', None, {}),
    ('app-store-header-colour', 'D', 'Colour story', None, {}),
]


def brief_of(ad):
    try:
        d = json.load(open(f'{ADS}/{ad}/ad.json'))
        b = d.get('brief', '')
        # the first sentence after "Direction X of …: " that says what it is (not "a 15 s muted loop.")
        said = [s for s in b.split(': ', 1)[-1].split('. ') if not re.match(r'\s*an? \d+ s muted loop', s)]
        return (said[0][:1].upper() + said[0][1:]).rstrip('.') + '.' if said else ''
    except Exception:
        return ''


ICON = jpeg('/Users/saikumar/Desktop/Curate/studies/ob172-app-store-header/assets/curate-logo-512.png', 184)
SHOTS = [jpeg(f'{ROOT}/library/screenshots/emma/{n}.v1.png', 400) for n in ('b284-wardrobe-rails', 'b284-studio-offduty-tryon')]
STATUS = '<div class="sb"><span>9:41</span><span class="sbr"><i></i><i></i><i></i><b></b></span></div>'


def product_page(media):
    shots = ''.join(f'<img src="{s}" alt="">' for s in SHOTS)
    return f'''<div class="ph"><div class="hdr">{media}</div>{STATUS}<div class="back">‹</div>
  <div class="app"><img class="icon" src="{ICON}" alt=""><div><div class="an">Curate</div><div class="as">Your AI stylist</div><div class="get">Get</div></div></div>
  <div class="shots">{shots}</div></div>'''


def search_page(img, loop=None):
    card = f'<video src="{loop}" autoplay muted loop playsinline></video>' if loop else f'<img src="{img}" alt="">'
    return f'''<div class="ph">{STATUS}<div class="sbar">Search · curate</div>
  <div class="scard">{card}</div>
  <div class="app srow"><img class="icon" src="{ICON}" alt=""><div><div class="an">Curate</div><div class="as">Your AI stylist</div></div><div class="get">Get</div></div>
  <div class="ghost"></div></div>'''


def superseded_block(key, label, line, folder):
    """A loud version the founder turned down: kept and still pickable, but small (no loop, no crops)."""
    heads = sorted(glob.glob(f'{folder}/*.png'), key=frame_of)
    board = ''.join(f'<figure><img src="{jpeg(f, 560)}" alt=""><figcaption>{frame_of(f) / 60:.2f} s</figcaption></figure>' for f in heads[1::max(1, len(heads) // 3)][:3])
    return f'''<div class="var old">
  <div class="vh"><span class="vk">{key}</span><h3>{label}</h3></div>
  <p class="idea">{line or 'Superseded: the loud first cut (the founder, 2026-10-24: “subtle colours”). Kept as a version.'}</p>
  <div class="board">{board}</div>
  <div class="verdict">{pk.choose("header2", key)}</div>
</div>'''


def variant_block(ad, key, label, line, folder, with_video):
    heads = sorted(glob.glob(f'{folder}/*.png'), key=frame_of)
    searches = sorted(glob.glob(f'{folder}-search/*.png'), key=frame_of)
    pp = f'{folder}-product-page.png'
    hero_still = heads[len(heads) // 2] if heads else None
    name = os.path.basename(folder)
    # the folder's own name, then its short name's subtle / quiet cut (C's and D's renders), then the short name
    short = name.split('-')[-1]
    names = [name, f'{short}-subtle', f'{short}-quiet', short] + ([''] if ad.endswith('-' + name) else [])
    v = video(ad, names, VIDEO_W.get(ad, 1600)) if with_video else None
    secs = int(re.search(r'_(\d+)s_', v[1]).group(1)) if v and re.search(r'_(\d+)s_', v[1]) else 15
    hero = (f'<video class="hero" src="{v[0]}" autoplay muted loop playsinline></video>' if v else (f'<img class="hero" src="{jpeg(hero_still, 2176)}" alt="">' if hero_still else ''))
    fps = 60
    board = ''.join(f'<figure><img src="{jpeg(f, 760)}" alt=""><figcaption>{frame_of(f) / fps:.2f} s</figcaption></figure>' for f in heads[:6])
    sboard = ''.join(f'<figure class="s32"><img src="{jpeg(f, 760)}" alt=""><figcaption>3:2 · {frame_of(f) / fps:.2f} s</figcaption></figure>' for f in searches[:3])
    spots = CROP_SPOTS.get((ad, name, frame_of(hero_still))) if hero_still else None
    at_frame = {frame_of(h): h for h in heads}
    if spots and any(len(sp) == 4 for sp in spots):
        # spots that name their own frame: one crop from each still
        cs = [(w, crops(at_frame[fr], spots=[(w, x, y)])[0][1], fr) for w, x, y, fr in spots if fr in at_frame]
    else:
        cs = [(w, c, frame_of(hero_still)) for w, c in (crops(hero_still, spots=spots) if hero_still else [])]
    detail = ''.join(f'<figure class="crop"><img src="{jpeg(c, 0)}" alt=""><figcaption>100% crop · {what} · {fr / fps:.2f} s</figcaption></figure>' for what, c, fr in cs)
    media = (f'<video src="{v[0]}" autoplay muted loop playsinline></video>' if v else f'<img src="{jpeg(hero_still, 800)}" alt="">') if hero_still else ''
    pp_html = (f'<div><p class="cap2">On the product page</p><img class="ppimg" src="{jpeg(pp, 640)}" alt=""></div>' if os.path.exists(pp)
               else (f'<div><p class="cap2">On the product page (iOS 27)</p>{product_page(media)}</div>' if media else ''))
    # the 3:2 card's own loop when the variant has one rendered (shown at 2× the mock's width)
    sv = video(ad, names, 760, 'store-search') if with_video else None
    sp_html = f'<div><p class="cap2">As the search card (3:2, always muted)</p>{search_page(jpeg(searches[-1], 760), sv[0] if sv else None)}</div>' if searches else ''
    vnote = f'Draft loop, rendered full size, shown here at {VIDEO_W.get(ad, 1600)} wide ({v[1]}).' if v else 'Stills (no film rendered yet).'
    return f'''<div class="var">
  <div class="vh"><span class="vk">{key}</span><h3>{label}</h3></div>
  {f'<p class="idea">{line}</p>' if line else ''}
  {hero}
  <p class="cap">{vnote} 21:9 header, {secs} s, muted, loops. Stills at 3840 × 1646 and 2880 × 1920.</p>
  <div class="board">{board}</div>
  {f'<div class="board">{sboard}</div>' if sboard else ''}
  <div class="detail">{detail}</div>
  <div class="phones">{pp_html}{sp_html}</div>
  <div class="verdict">{pk.choose("header2", key)}</div>
</div>'''


sections, keys, total_video = [], [], 0
for ad, letter, title, idea, known in DIRECTIONS:
    g2 = f'{ADS}/{ad}/out/g2'
    # the variants in out/g2/, plus any loud ones moved to out/g2-old/superseded/; superseded ones go last
    folders = [d for g in (g2, f'{ADS}/{ad}/out/g2-old/superseded') for d in sorted(glob.glob(f'{g}/*'))
               if os.path.isdir(d) and not d.endswith('-search') and not os.path.basename(d).startswith('_') and glob.glob(f'{d}/*.png')]
    found = []
    for i, folder in enumerate(folders):
        # a variant we don't know is named by its folder: week-c2 → C2, colour-d1-bold → D1-bold
        m = re.search(r'([a-z])(\d)(-bold|-loud)?$', os.path.basename(folder))
        auto = f'{m.group(1).upper()}{m.group(2)}{m.group(3) or ""}' if m else f'{letter}{i + 1}'
        k = known.get(os.path.basename(folder), (auto, os.path.basename(folder), ''))
        old = len(k) > 3 and k[3] or '/superseded/' in folder or re.search(r'-(bold|loud)$', folder) is not None
        found.append((old, k[:3], folder))
    blocks = []
    for old, (key, label, line), folder in sorted(found, key=lambda f: (f[0], f[1][0])):
        blocks.append(superseded_block(key, label, line, folder) if old else variant_block(ad, key, label, line, folder, with_video=True))
        keys.append((key, key))
    body = ''.join(blocks) if blocks else '<div class="coming">Coming: this direction’s stills aren’t rendered yet. The page picks them up from its folder when they are.</div>'
    sections.append(f'''<section class="dir">
  <div class="dh"><span class="dk">{letter}</span><h2>{title}</h2></div>
  <p class="idea">{idea or brief_of(ad)}</p>
  {body}
</section>''')

CSS = r'''
:root { --ground:#f6f6f6; --ink:#181818; --t2:#656565; --t3:#8b8b8b; --line:#e2e2e0; color-scheme: light; }
* { box-sizing: border-box; }
body { margin:0; background: var(--ground); color: var(--ink); font: 15px/1.5 Geist, -apple-system, "Helvetica Neue", Arial, sans-serif; padding: 28px 16px 72px; }
main { max-width: 1120px; margin: 0 auto; display: grid; gap: 64px; }
h1 { font-size: 30px; font-weight: 500; letter-spacing: -.02em; margin: 0; text-wrap: balance; }
.lede { color: var(--t2); margin: 8px 0 0; max-width: 76ch; }
.notes { margin: 14px 0 0; padding: 14px 18px; background: #fff; border-radius: 14px; border: 1px solid var(--line); color: var(--t2); font-size: 14px; display: grid; gap: 4px; }
.dh { display: flex; align-items: center; gap: 10px; } .dh h2 { font-size: 24px; font-weight: 500; margin: 0; letter-spacing: -.01em; }
.dk { width: 32px; height: 32px; border-radius: 16px; background: var(--ink); color: #fff; display: grid; place-items: center; font-size: 15px; font-weight: 500; flex: none; }
.var { margin-top: 26px; padding-top: 22px; border-top: 1px solid var(--line); }
.vh { display: flex; align-items: center; gap: 10px; } .vh h3 { font-size: 19px; font-weight: 500; margin: 0; }
.vk { padding: 3px 10px; border-radius: 12px; background: #fff; border: 1px solid var(--line); font-size: 13px; font-weight: 600; }
.idea { color: var(--t2); margin: 6px 0 14px; max-width: 78ch; }
.hero { width: 100%; height: auto; border-radius: 16px; display: block; box-shadow: 0 10px 30px rgba(20,20,20,.08); background: #eee; }
.cap { font-size: 13px; color: var(--t3); margin: 8px 0 16px; }
.cap2 { font-size: 13px; color: var(--t2); margin: 0 0 8px; }
.board { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px; margin-bottom: 12px; }
.board figure, .detail figure { margin: 0; } .board img { width: 100%; border-radius: 10px; display: block; border: 1px solid var(--line); }
figcaption { font-size: 12.5px; color: var(--t3); margin-top: 4px; }
.detail { display: flex; gap: 12px; flex-wrap: wrap; margin: 6px 0 4px; }
.detail img { width: 220px; height: 220px; display: block; border-radius: 10px; border: 1px solid var(--line); image-rendering: auto; }
.phones { display: flex; gap: 28px; flex-wrap: wrap; margin-top: 18px; }
.ppimg { width: 320px; border-radius: 40px; display: block; border: 1px solid var(--line); }
.verdict { margin-top: 16px; display: flex; gap: 10px; }
.var.old { opacity: .78; } .var.old .board { grid-template-columns: repeat(3, minmax(0, 1fr)); max-width: 760px; }
.var.old .vk { background: transparent; color: var(--t3); }
.coming { margin-top: 18px; padding: 28px 22px; border: 1.5px dashed #cfcfcc; border-radius: 16px; color: var(--t2); background: #fbfbfb; }
.ph { width: 393px; height: 852px; zoom: .8142; border-radius: 54px; position: relative; overflow: hidden; background: #fff; border: 1px solid #d8d9d5; box-shadow: 0 14px 40px rgba(20,20,20,.10); }
.sb { position: absolute; top: 18px; left: 44px; right: 34px; display: flex; justify-content: space-between; font-size: 17px; font-weight: 600; z-index: 2; }
.sbr { display: flex; gap: 5px; align-items: center; } .sbr i { width: 4px; height: 10px; background: #111; border-radius: 1px; } .sbr b { width: 26px; height: 12px; border: 1.5px solid #111; border-radius: 4px; margin-left: 4px; }
.hdr { position: absolute; top: 0; left: 0; width: 393px; height: 168px; overflow: hidden; }
.hdr video, .hdr img { width: 393px; height: 168px; object-fit: cover; display: block; }
.back { position: absolute; top: 58px; left: 16px; width: 36px; height: 36px; border-radius: 18px; background: rgba(255,255,255,.85); display: grid; place-items: center; font-size: 26px; z-index: 2; }
.app { position: absolute; top: 188px; left: 20px; right: 20px; display: flex; gap: 14px; align-items: center; }
.icon { width: 92px; height: 92px; border-radius: 21px; flex: none; }
.an { font-size: 21px; font-weight: 600; } .as { font-size: 14px; color: var(--t2); }
.get { margin-top: 10px; width: 74px; height: 30px; border-radius: 15px; background: #0a84ff; color: #fff; display: grid; place-items: center; font-size: 15px; font-weight: 700; }
.shots { position: absolute; top: 308px; left: 20px; display: flex; gap: 10px; }
.shots img { width: 200px; height: 434px; border-radius: 20px; border: 1px solid var(--line); object-fit: cover; object-position: top; }
.sbar { position: absolute; top: 60px; left: 16px; right: 16px; height: 40px; border-radius: 12px; background: #eeeff1; padding: 9px 12px; font-size: 16px; color: #555; }
.scard { position: absolute; top: 118px; left: 16px; width: 361px; height: 241px; border-radius: 18px; overflow: hidden; }
.scard img, .scard video { width: 100%; height: 100%; object-fit: cover; display: block; }
.srow { top: 374px; left: 16px; right: 16px; } .srow .icon { width: 62px; height: 62px; border-radius: 14px; } .srow .get { margin: 0 0 0 auto; }
.ghost { position: absolute; top: 470px; left: 16px; right: 16px; height: 330px; border-radius: 18px; background: #f2f3f1; }
'''

html = f'''<title>App Store Header Films</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&display=swap">
<style>{CSS}{pk.CSS}</style>
<main>
  <header>
    <h1>The App Store header, as films</h1>
    <p class="lede">Every direction and variant for iOS 27’s product-page header (21:9) and search card (3:2), made in the motion studio: her real photos and wardrobe, the real build-284 screens in Apple’s iPhone bezel, Geist type, real light and shadow. The App Store takes one header video, so the one film (30 s, all three ideas) comes first; the single films (15 s each) follow. Pick one or more; the picks go to G3 and then the final cut.</p>
    <div class="notes">
      <div>Sharp: full-size stills, shown at twice their size on this page, with 100% crops under each variant so the detail can be judged.</div>
      <div>Subtle colour: A2 and B3 are tonal (each set’s colour taken from her photos and pushed close to Mist, one hero at a time). The loud colour-blocked versions sit at the end of their direction, marked superseded, still pickable.</div>
      <div>Real: every photo, cut-out, try-on and app screen is ours (Emma is our AI persona). The screens are build 284 on her data. Not uploaded to the App Store; it would ship with the new-look App Store release. Zee’s film is parked.</div>
    </div>
  </header>
  {"".join(sections)}
  {pk.summary([("header2", "Pick")])}
</main>
<script>{pk.JS}</script>
'''
os.makedirs(f'{HERE}/site', exist_ok=True)
open(f'{HERE}/site/index.html', 'w').write(html)
media = sorted(os.listdir(MEDIA))
json.dump([{'path': f'media/{m}'} for m in media], open(f'{HERE}/site/files.json', 'w'), indent=0)
size = len(html.encode())
total = sum(os.path.getsize(f'{MEDIA}/{m}') for m in media)
print(f'page {size / 1024:.0f} KB + {len(media)} media files, {total / 1024 / 1024:.1f} MB', 'variants:', ', '.join(k for k, _ in keys))
if size > BUDGET:
    raise SystemExit(f'the page is over the {BUDGET / 1024 / 1024:.0f} MB budget')
