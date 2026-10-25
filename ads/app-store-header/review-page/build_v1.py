"""The founder's G2 page for app-store-header: three directions for the iOS 27 App Store header.

Each direction: one line, the draft loop in the header crop (21:9), its storyboard stills, the same film
on a product page and as a search card (phones at true size: laid out at 393 pt, shown 320 wide), and a
Pick (picks_kit, collection `picks`, section `header2`). Redo of studies/ob172 ("cheap quality").

python3 ads/app-store-header/review-page/build.py → ads/app-store-header/review-page/site/index.html
(publish with capabilities {"db": {}}). Needs the stills in out/g2/ and the drafts in renders/.
"""
import base64, glob, importlib.util, io, os, subprocess, tempfile
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
AD = os.path.dirname(HERE)
ROOT = os.path.dirname(os.path.dirname(AD))
G2 = f'{AD}/out/g2'
STUDIES = '/Users/saikumar/Desktop/Curate/studies'
spec = importlib.util.spec_from_file_location('picks_kit', f'{STUDIES}/picks_kit.py')
pk = importlib.util.module_from_spec(spec); spec.loader.exec_module(pk)


def jpeg(path, w, q=84):
    im = Image.open(path).convert('RGB')
    im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    b = io.BytesIO(); im.save(b, 'JPEG', quality=q, optimize=True)
    return 'data:image/jpeg;base64,' + base64.b64encode(b.getvalue()).decode()


def video(film):
    """The newest draft of [film], re-encoded small for the page (960 wide, 30 fps, h264, no audio)."""
    fs = sorted(glob.glob(f'{ROOT}/renders/app-store-header/**/app-store-header-{film}_*store-header*.mp4', recursive=True), key=os.path.getmtime)
    if not fs:
        return None
    out = tempfile.mktemp(suffix='.mp4')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', fs[-1], '-vf', 'scale=960:-2,fps=30', '-c:v', 'libx264', '-crf', '27', '-preset', 'slow',
                    '-pix_fmt', 'yuv420p', '-an', '-movflags', '+faststart', out], check=True)
    b = open(out, 'rb').read(); os.remove(out)
    return 'data:video/mp4;base64,' + base64.b64encode(b).decode(), os.path.basename(fs[-1])


def still(film, fmt, sec, w):
    f = round(sec * 60)
    d = f'{G2}/{film}' + ('' if fmt == 'store-header' else '-search')
    return jpeg(f'{d}/app-store-header_{fmt}_f{f:04d}.png', w)


# B (tryon) moved to its own agent and folder on 2026-10-24: its stills come from there, whatever it has
# rendered (header stills in tryon/, 3:2 stills in tryon-search/). C (zee) is parked by the founder.
B_DIR = f'{ROOT}/ads/app-store-header-tryon/out/g2'

A = ('A', 'roll', 'Pulled from her photos',
     'What she’s wearing lifts out of her real photos (the coat from DUMBO, the denim jacket from the ferry, the scarf from the park), the photos fall away, and the pieces become her real Wardrobe on the phone. “Your closet is already in your photos.” → “Every item you own, from your photos.”',
     [(0.6, 'Her photos, lit on the stage'), (2.2, 'The line; the coat lifts off her DUMBO photo'), (9.0, 'The pieces beside her real Wardrobe'), (12.8, 'Back into her photos (the loop)')], [2.2, 9.0])

ICON = jpeg('/Users/saikumar/Desktop/Curate/studies/ob172-app-store-header/assets/curate-logo-512.png', 180)
SHOTS = [jpeg(f'{ROOT}/library/screenshots/emma/{n}.v1.png', 300) for n in ('nl-today-look', 'nl-chat-monday', 'nl-studio-tryon')]

STATUS = '<div class="sb"><span>9:41</span><span class="sbr"><i></i><i></i><i></i><b></b></span></div>'


def product_page(media):
    shots = ''.join(f'<img src="{s}" alt="">' for s in SHOTS)
    return f'''<div class="ph"><div class="hdr">{media}</div>{STATUS}<div class="back">‹</div>
  <div class="app"><img class="icon" src="{ICON}" alt=""><div><div class="an">Curate</div><div class="as">Your AI stylist</div><div class="get">Get</div></div></div>
  <div class="shots">{shots}</div></div>'''


def search_page(img):
    return f'''<div class="ph">{STATUS}<div class="sbar">Search · curate</div>
  <div class="scard"><img src="{img}" alt=""></div>
  <div class="app srow"><img class="icon" src="{ICON}" alt=""><div><div class="an">Curate</div><div class="as">Your AI stylist</div></div><div class="get">Get</div></div>
  <div class="ghost"></div></div>'''


def section_a():
    key, film, title, idea, frames, search_secs = A
    v = video(film)
    hero = f'<video class="hero" src="{v[0]}" autoplay muted loop playsinline></video>'
    board = ''.join(f'<figure><img src="{still(film, "store-header", s, 760)}" alt="{c}"><figcaption>{s:.1f} s · {c}</figcaption></figure>' for s, c in frames)
    search_imgs = [still(film, 'store-search', s, 760) for s in search_secs]
    searches = ''.join(f'<figure class="s32"><img src="{im}" alt=""><figcaption>3:2 search card · {s:.1f} s</figcaption></figure>' for im, s in zip(search_imgs, search_secs))
    return f'''<section class="dir">
  <div class="dh"><span class="dk">{key}</span><h2>{title}</h2></div>
  <p class="idea">{idea}</p>
  {hero}
  <p class="cap">Draft loop: 21:9 header, 15 s, muted, half size, re-encoded for this page ({v[1]}). Critic round 7: hook 8 · phone 8 · smooth 8 · variety 8 · brand 8; loop seamless, no echo on the fastest move.</p>
  <div class="board">{board}</div>
  <div class="board">{searches}</div>
  <div class="phones">
    <div><p class="cap2">On the product page (iOS 27)</p>{product_page(f'<video src="{v[0]}" autoplay muted loop playsinline></video>')}</div>
    <div><p class="cap2">As the search card (3:2, always muted)</p>{search_page(search_imgs[-1])}</div>
  </div>
  <div class="verdict">{pk.choose("header2", key)}</div>
</section>'''


def section_b():
    hs = sorted(glob.glob(f'{B_DIR}/tryon/*.png'))
    ss = sorted(glob.glob(f'{B_DIR}/tryon-search/*.png'))
    head = '''<div class="dh"><span class="dk">B</span><h2>See it on you</h2></div>
  <p class="idea">The black tee flies onto her walk-to-work photo and Studio’s real try-on wipes down over her: same street, same bag, only the striped tee turns black. Then Studio on the phone, with that same try-on.</p>'''
    if not hs:
        return f'''<section class="dir">{head}<div class="coming">B is coming: it moved to its own studio folder today and its stills aren’t rendered yet. This page will carry them once they are.</div></section>'''
    board = ''.join(f'<figure><img src="{jpeg(f, 760)}" alt=""><figcaption>{os.path.basename(f)}</figcaption></figure>' for f in hs[:4])
    searches = ''.join(f'<figure class="s32"><img src="{jpeg(f, 760)}" alt=""><figcaption>3:2 search card</figcaption></figure>' for f in ss[:3])
    return f'''<section class="dir">{head}<div class="board">{board}</div><div class="board">{searches}</div>
  <div class="verdict">{pk.choose("header2", "B")}</div></section>'''


sections = [section_a(), section_b(), '''<section class="dir parked"><div class="dh"><span class="dk off">C</span><h2>Zee knows your closet</h2></div>
  <p class="idea">Parked (founder, 2026-10-24). Its draft and stills stay in the studio folder.</p></section>''']

CSS = r'''
:root { --ground:#f6f6f6; --ink:#181818; --t2:#656565; --t3:#8b8b8b; --line:#e2e2e0; color-scheme: light; }
* { box-sizing: border-box; }
body { margin:0; background: var(--ground); color: var(--ink); font: 15px/1.5 Geist, -apple-system, "Helvetica Neue", Arial, sans-serif; padding: 28px 16px 72px; }
main { max-width: 1120px; margin: 0 auto; display: grid; gap: 56px; }
h1 { font-size: 30px; font-weight: 500; letter-spacing: -.02em; margin: 0; text-wrap: balance; }
.lede { color: var(--t2); margin: 8px 0 0; max-width: 74ch; }
.notes { margin: 14px 0 0; padding: 14px 18px; background: #fff; border-radius: 14px; border: 1px solid var(--line); color: var(--t2); font-size: 14px; display: grid; gap: 4px; }
.dh { display: flex; align-items: center; gap: 10px; } .dh h2 { font-size: 22px; font-weight: 500; margin: 0; letter-spacing: -.01em; }
.dk { width: 30px; height: 30px; border-radius: 15px; background: var(--ink); color: #fff; display: grid; place-items: center; font-size: 14px; font-weight: 500; flex: none; }
.idea { color: var(--t2); margin: 6px 0 16px; max-width: 76ch; }
.hero { width: 100%; height: auto; border-radius: 16px; display: block; box-shadow: 0 10px 30px rgba(20,20,20,.08); background: #eee; }
.cap { font-size: 13px; color: var(--t3); margin: 8px 0 18px; }
.cap2 { font-size: 13px; color: var(--t2); margin: 0 0 8px; }
.board { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 12px; margin-bottom: 12px; }
.board figure { margin: 0; } .board img { width: 100%; border-radius: 10px; display: block; border: 1px solid var(--line); }
.board figcaption { font-size: 12.5px; color: var(--t3); margin-top: 4px; }
.phones { display: flex; gap: 28px; flex-wrap: wrap; margin-top: 20px; }
.verdict { margin-top: 16px; display: flex; gap: 10px; }
.coming { padding: 28px 22px; border: 1.5px dashed #cfcfcc; border-radius: 16px; color: var(--t2); background: #fbfbfb; }
.parked .idea { margin: 4px 0 0; } .dk.off { background: #c9c9c6; }
/* phones: laid out at 393 × 852 pt, shown 320 wide */
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
.scard img { width: 100%; height: 100%; object-fit: cover; display: block; }
.srow { top: 374px; left: 16px; right: 16px; } .srow .icon { width: 62px; height: 62px; border-radius: 14px; } .srow .get { margin: 0 0 0 auto; }
.ghost { position: absolute; top: 470px; left: 16px; right: 16px; height: 330px; border-radius: 18px; background: #f2f3f1; }
'''

html = f'''<title>App Store Header Films</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&display=swap">
<style>{CSS}{pk.CSS}</style>
<main>
  <header>
    <h1>The App Store header, as films</h1>
    <p class="lede">Directions for iOS 27’s product-page header and search card, made in the motion studio (the Pop out v3 pipeline): her real photos as lit prints, her real wardrobe cut-outs, Studio’s real try-on, Zee’s renders, real new-look screens in Apple’s iPhone bezel, Geist type, a slow camera, physical shadows and motion blur. Each is a 15 s muted loop. Pick one; the pick goes to G3 (stills critiqued) and then the full-quality cut. B is being finished by a second studio agent; C is parked.</p>
    <div class="notes">
      <div>Real: every photo, cut-out, try-on and app screen is ours (Emma is our AI persona). The screens are build-264 captures on her data; the final cut would use fresh footage from build 284.</div>
      <div>Not yet: these are half-size drafts at G2. No App Store upload; it would ship with the new-look App Store release.</div>
    </div>
  </header>
  {"".join(sections)}
  {pk.summary([("header2", "Direction")])}
</main>
<script>{pk.JS}</script>
'''
os.makedirs(f'{HERE}/site', exist_ok=True)
open(f'{HERE}/site/index.html', 'w').write(html)
print(len(html) // 1024, 'KB')
