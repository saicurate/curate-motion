"""The founder's review page for the App Store previews: the three previews playing at the head of the
screenshot row on a phone-width App Store mock, then each one large with what it shows, a Keep yes/no
under each (studies/picks_kit.py, key `previews`, db capability).

python3 build.py → site/index.html + site/p1.mp4 … p3.mp4 (web copies, 886 × 1920 at ~2.5 Mbps: the
page's own files). Publish site/index.html with files {"p1.mp4": "site/p1.mp4", …} and {"db": {}}.
"""
import base64, importlib.util, io, json, os, subprocess
from PIL import Image

D = os.path.dirname(os.path.abspath(__file__))
AD = os.path.dirname(D)
ROOT = os.path.dirname(os.path.dirname(AD))
SITE = f'{D}/site'
spec = importlib.util.spec_from_file_location('picks_kit', '/Users/saikumar/Desktop/Curate/studies/picks_kit.py')
pk = importlib.util.module_from_spec(spec); spec.loader.exec_module(pk)
os.makedirs(SITE, exist_ok=True)

STORE = '/Users/saikumar/Desktop/Curate/research/app-store-previews/store'
PREVIEWS = [
    (1, 'Your closet, from your photos.', 'Extract all on the empty Wardrobe: her photos sorted into her pile and the rest, “Finding your wardrobe items”, then the landing: “Added 14 wardrobe items from 7 photos” and her rails.'),
    (2, 'See it on you, before you wear it.', 'The Try-ons tab: her photo the whole screen, a knit from a shop link (“Which one is the piece?”), navy trousers from her wardrobe, Try on 2 items, the curtain, the reveal, “Here you are, wearing both”, and hold to see the before.'),
    (3, 'Always know what to wear.', 'Today: the art fair look tonight, then For work. Then Chat: “Hey Emma”, her question, Zee looking through her wardrobe with her closet orbiting, and the look it picks.'),
]
SV3 = f'{ROOT}/ads/app-store-shots-v3/out/final-blue-w500'


def web_copy(n):
    src = f'{STORE}/curate-preview-{n}.mp4'
    out = f'{SITE}/p{n}.mp4'
    if not os.path.exists(out) or os.path.getmtime(out) < os.path.getmtime(src):
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-an', '-c:v', 'libx264', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
                        '-b:v', '2500k', '-maxrate', '3000k', '-bufsize', '6000k', '-movflags', '+faststart', out], check=True)
    info = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration,size', '-of', 'json', src], capture_output=True, text=True).stdout)
    return float(info['format']['duration']), int(info['format']['size'])


def poster(n, sec=5.0):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(sec), '-i', f'{STORE}/curate-preview-{n}.mp4', '-frames:v', '1', '/tmp/_poster.png'], check=True)
    im = Image.open('/tmp/_poster.png').convert('RGB'); im = im.resize((443, 960), Image.LANCZOS)
    b = io.BytesIO(); im.save(b, 'JPEG', quality=82)
    return 'data:image/jpeg;base64,' + base64.b64encode(b.getvalue()).decode()


def shot_thumb(path):
    im = Image.open(path).convert('RGB'); im = im.resize((330, round(330 * im.height / im.width)), Image.LANCZOS)
    b = io.BytesIO(); im.save(b, 'JPEG', quality=80)
    return 'data:image/jpeg;base64,' + base64.b64encode(b.getvalue()).decode()


rows, cards = [], []
for n, title, what in PREVIEWS:
    dur, size = web_copy(n)
    post = poster(n)
    rows.append(f'<div class="tile vid"><video src="p{n}.mp4" poster="{post}" autoplay muted loop playsinline></video></div>')
    cards.append(f'''<section class="pv">
  <div class="big"><video src="p{n}.mp4" poster="{post}" controls muted loop playsinline preload="metadata"></video></div>
  <div class="txt"><div class="kick">Preview {n} · {dur:.1f} s · 886 × 1920 · 30 fps</div><h2>{title}</h2><p>{what}</p>
  <p class="spec">App Store file: H.264 High 4.0, ~11 Mbps, silent stereo AAC track, {size / 1e6:.0f} MB (Apple: 15–30 s, ≤ 500 MB).</p>
  <div class="keep">{pk.yesno("previews", f"Keep preview {n}")}</div></div>
</section>''')
for f in sorted(os.listdir(SV3))[:6] if os.path.isdir(SV3) else []:
    rows.append(f'<div class="tile"><img src="{shot_thumb(os.path.join(SV3, f))}" alt=""></div>')

CSS = r'''
:root { --ground:#eef2f6; --card:#fff; --ink:#171b21; --deep:#33475e; --t2:#5d6773; --t3:#8d96a1; --line:#dfe4ea; color-scheme: light; }
* { box-sizing: border-box; }
body { margin:0; background: var(--ground); color: var(--ink); font: 15px/1.45 Geist, -apple-system, "Helvetica Neue", Arial, sans-serif; padding: 28px 16px 64px; }
main { max-width: 1040px; margin: 0 auto; display: grid; gap: 36px; }
h1 { font-size: 30px; font-weight: 500; letter-spacing: -.02em; margin: 0; text-wrap: balance; }
.lede { color: var(--t2); margin: 6px 0 0; max-width: 72ch; }
h2 { font-size: 24px; font-weight: 500; letter-spacing: -.02em; margin: 4px 0 6px; text-wrap: balance; }
.kick { font-size: 12px; letter-spacing: .06em; text-transform: uppercase; color: var(--t3); }
.store { display: flex; gap: 28px; flex-wrap: wrap; align-items: flex-start; }
.ph { width: 393px; height: 852px; zoom: .8142; border-radius: 54px; background: #fff; border: 1px solid #d5dbe2; position: relative; overflow: hidden; box-shadow: 0 14px 40px rgba(20,30,40,.10); flex: none; }
.sb { position: absolute; top: 18px; left: 44px; right: 34px; display: flex; justify-content: space-between; font-size: 17px; font-weight: 600; }
.app { position: absolute; top: 64px; left: 20px; right: 20px; display: flex; gap: 14px; align-items: center; }
.icon { width: 80px; height: 80px; border-radius: 18px; background: #151515; color: #fff; display: grid; place-items: center; font-size: 34px; font-weight: 600; }
.an { font-size: 20px; font-weight: 600; } .as { font-size: 14px; color: var(--t2); }
.get { margin-top: 8px; width: 72px; height: 30px; border-radius: 15px; background: #0a84ff; color: #fff; display: grid; place-items: center; font-size: 15px; font-weight: 700; }
.row { position: absolute; top: 172px; left: 20px; right: 0; display: flex; gap: 10px; overflow-x: auto; padding-right: 20px; }
.tile { flex: none; width: 190px; height: 412px; border-radius: 20px; overflow: hidden; border: 1px solid var(--line); background: #eef2f6; }
.tile video, .tile img { width: 100%; height: 100%; object-fit: cover; display: block; }
.note { max-width: 46ch; color: var(--t2); }
.pv { display: flex; gap: 28px; flex-wrap: wrap; align-items: flex-start; background: var(--card); border: 1px solid var(--line); border-radius: 20px; padding: 18px; }
.big video { width: 320px; height: auto; border-radius: 18px; display: block; background: #e6edf5; }
.txt { flex: 1 1 300px; min-width: 0; } .txt p { color: var(--t2); margin: 0 0 10px; } .spec { font-size: 13px; }
.keep { display: flex; gap: 10px; align-items: center; margin-top: 8px; }
'''

html = f'''<title>App Store Previews</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&display=swap">
<style>{CSS}{pk.CSS}</style>
<main>
  <header><h1>App Store previews</h1>
  <p class="lede">Three App Previews for the screenshot row, one feature each, cut from real screen recordings of build 284 (the new look) on the iPhone 17 Pro Max simulator, with S-V3’s headline and linen (blue). Everything on the phone is the real app; nothing is mocked up. Draft: nothing is uploaded.</p></header>
  <section class="store">
    <div class="ph"><div class="sb"><span>9:41</span><span>●●●</span></div>
      <div class="app"><div class="icon">C</div><div><div class="an">Curate</div><div class="as">AI stylist &amp; try-on</div><div class="get">Get</div></div></div>
      <div class="row">{"".join(rows)}</div></div>
    <p class="note">How they sit in the App Store: the previews play first in the screenshot row, muted, then the S-V3 screenshots follow. Scroll the row sideways. Apple shows a preview’s frame at 5 s until it plays.</p>
  </section>
  {"".join(cards)}
  {pk.summary([("previews", "Keep")])}
</main>
<script>{pk.JS}</script>
'''
open(f'{SITE}/index.html', 'w').write(html)
print(round(len(html) / 1024), 'KB', [round(os.path.getsize(f'{SITE}/p{n}.mp4') / 1e6, 1) for n in (1, 2, 3)])
