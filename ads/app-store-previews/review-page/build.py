"""The founder's review page for the App Store previews (v4, 2026-10-24): the three HYBRID previews first, in
S-V3's subtle blue only (the founder: "Use the subtle blue only"); the earlier hybrids on warm sets and the
screen-recording cuts folded underneath. (v2 put the hybrids first
(ads/app-store-previews-hybrid: the header's world around the real build-284 recordings), playing at the
head of the screenshot row on a phone-width App Store mock, then each one large with what it shows and a
Keep yes/no; the screen-recording cuts (v1, ads/app-store-previews) folded underneath with the picks the
founder gave them.) studies/picks_kit.py, key `previews`, db capability. The v1 page is build_v1.py.

python3 build.py → site/index.html + site/h1–h3.mp4 (blue), hw1–hw3.mp4 (warm, kept), p1–p3.mp4 (kept), web copies at ~2.5 Mbps.
Publish site/index.html with files {"h1.mp4": "site/h1.mp4", …, "p1.mp4": "site/p1.mp4", …} and {"db": {}}.
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
HYBRIDS = [
    (1, 'Your closet, from your photos.', 'Her DUMBO photo, with depth (her cut-out over the street): the camel coat lifts out and glides down beside the phone, where the real Wardrobe is already starting Extract all. The camera pushes into the phone: the sort of her photos, the found photos, then “Added 14 wardrobe items from 7 photos” and her rails, the Tan Wool Coat among them.'),
    (2, 'See it on you, before you wear it.', 'Her walk-to-work photo and the black tee hovering beside it; the tee glides down beside the phone, where Studio shows Weekend in black (that tee, trousers, tote, loafers) and her photo. In: Try it on, the shimmer, and she’s in it, her real Studio try-on of those very items; then her try-on full screen.'),
    (3, 'Always know what to wear.', 'Day cards glide on a rail, Thu, Fri, then Today: the art fair look. The camera pushes into the phone, where Today shows that same look, then For work. Then Chat: her question, Zee’s ring of her items (“It drops to 57°F after sunset, so I’m keeping a layer”), and “Here’s your art fair look.”'),
]
WARM = [
    (1, 'Your closet, from your photos.', 'The same film on warm cream sets (blush to sand).'),
    (2, 'See it on you, before you wear it.', 'The same film; the set warmed from blue to oat on the reveal.'),
    (3, 'Always know what to wear.', 'The same film; the day cards on cream and oat paper.'),
]
V1 = [
    (1, 'Your closet, from your photos.', 'Extract all on the empty Wardrobe: the sort, the found photos, the landing in her rails.'),
    (2, 'See it on you, before you wear it.', 'The old Try-ons tab (the founder: no; it shows the old tab bar).'),
    (3, 'Always know what to wear.', 'Today, then Chat: her question, Zee’s ring and the look.'),
]
SV3 = f'{ROOT}/ads/app-store-shots-v3/out/final-blue-w500'


def web_copy(store_name, site_name):
    src = f'{STORE}/{store_name}'
    out = f'{SITE}/{site_name}'
    if not os.path.exists(out) or os.path.getmtime(out) < os.path.getmtime(src):
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-an', '-c:v', 'libx264', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
                        '-b:v', '2500k', '-maxrate', '3000k', '-bufsize', '6000k', '-movflags', '+faststart', out], check=True)
    info = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration,size', '-of', 'json', src], capture_output=True, text=True).stdout)
    return float(info['format']['duration']), int(info['format']['size'])


def poster(store_name, sec=5.0):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(sec), '-i', f'{STORE}/{store_name}', '-frames:v', '1', '/tmp/_poster.png'], check=True)
    im = Image.open('/tmp/_poster.png').convert('RGB'); im = im.resize((443, 960), Image.LANCZOS)
    b = io.BytesIO(); im.save(b, 'JPEG', quality=82)
    return 'data:image/jpeg;base64,' + base64.b64encode(b.getvalue()).decode()


def shot_thumb(path):
    im = Image.open(path).convert('RGB'); im = im.resize((330, round(330 * im.height / im.width)), Image.LANCZOS)
    b = io.BytesIO(); im.save(b, 'JPEG', quality=80)
    return 'data:image/jpeg;base64,' + base64.b64encode(b.getvalue()).decode()


rows, cards, warm, older = [], [], [], []
for n, title, what in HYBRIDS:
    store = f'curate-preview-hybrid-{n}.mp4'
    dur, size = web_copy(store, f'h{n}.mp4')
    post = poster(store)
    rows.append(f'<div class="tile vid"><video src="h{n}.mp4" poster="{post}" autoplay muted loop playsinline></video></div>')
    cards.append(f'''<section class="pv">
  <div class="big"><video src="h{n}.mp4" poster="{post}" controls muted loop playsinline preload="metadata"></video></div>
  <div class="txt"><div class="kick">Preview {n} · hybrid · {dur:.1f} s · 886 × 1920 · 30 fps</div><h2>{title}</h2><p>{what}</p>
  <p class="spec">App Store file: H.264 High 4.0, ~11 Mbps, silent stereo AAC track, {size / 1e6:.0f} MB (Apple: 15–30 s, ≤ 500 MB).</p>
  <div class="keep">{pk.yesno("previews", f"Keep blue hybrid {n}")}</div></div>
</section>''')
for f in sorted(os.listdir(SV3))[:6] if os.path.isdir(SV3) else []:
    rows.append(f'<div class="tile"><img src="{shot_thumb(os.path.join(SV3, f))}" alt=""></div>')
for n, title, what in WARM:
    store = f'curate-preview-hybrid-{n}.warm.mp4'
    dur, _ = web_copy(store, f'hw{n}.mp4')
    warm.append(f'''<div class="old">
  <video src="hw{n}.mp4" poster="{poster(store)}" controls muted loop playsinline preload="none"></video>
  <div class="txt"><div class="kick">warm sets · hybrid {n} · {dur:.1f} s</div><h3>{title}</h3><p>{what}</p>
  <div class="keep">{pk.yesno("previews", f"Keep hybrid {n}")}</div></div>
</div>''')
for n, title, what in V1:
    store = f'curate-preview-{n}.mp4'
    dur, _ = web_copy(store, f'p{n}.mp4')
    older.append(f'''<div class="old">
  <video src="p{n}.mp4" poster="{poster(store)}" controls muted loop playsinline preload="none"></video>
  <div class="txt"><div class="kick">v1 · preview {n} · {dur:.1f} s</div><h3>{title}</h3><p>{what}</p>
  <div class="keep">{pk.yesno("previews", f"Keep preview {n}")}</div></div>
</div>''')

CSS = r'''
:root { --ground:#eef2f6; --card:#fff; --ink:#171b21; --t2:#5d6773; --t3:#8d96a1; --line:#dfe4ea; color-scheme: light; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --ground:#12161b; --card:#1b2028; --ink:#eef2f6; --t2:#aab4bf; --t3:#7f8a96; --line:#2c333d; color-scheme: dark; } }
:root[data-theme="dark"] { --ground:#12161b; --card:#1b2028; --ink:#eef2f6; --t2:#aab4bf; --t3:#7f8a96; --line:#2c333d; color-scheme: dark; }
* { box-sizing: border-box; }
body { margin:0; background: var(--ground); color: var(--ink); font: 15px/1.45 Geist, -apple-system, "Helvetica Neue", Arial, sans-serif; padding: 28px 16px 64px; }
main { max-width: 1040px; margin: 0 auto; display: grid; gap: 36px; }
h1 { font-size: 30px; font-weight: 500; letter-spacing: -.02em; margin: 0; text-wrap: balance; }
.lede { color: var(--t2); margin: 6px 0 0; max-width: 74ch; }
h2 { font-size: 24px; font-weight: 500; letter-spacing: -.02em; margin: 4px 0 6px; text-wrap: balance; }
h3 { font-size: 18px; font-weight: 500; margin: 2px 0 4px; }
.kick { font-size: 12px; letter-spacing: .06em; text-transform: uppercase; color: var(--t3); }
.store { display: flex; gap: 28px; flex-wrap: wrap; align-items: flex-start; }
.ph { width: 393px; height: 852px; zoom: .8142; border-radius: 54px; background: #fff; color: #171b21; border: 1px solid #d5dbe2; position: relative; overflow: hidden; box-shadow: 0 14px 40px rgba(20,30,40,.10); flex: none; }
.sb { position: absolute; top: 18px; left: 44px; right: 34px; display: flex; justify-content: space-between; font-size: 17px; font-weight: 600; }
.app { position: absolute; top: 64px; left: 20px; right: 20px; display: flex; gap: 14px; align-items: center; }
.icon { width: 80px; height: 80px; border-radius: 18px; background: #151515; color: #fff; display: grid; place-items: center; font-size: 34px; font-weight: 600; }
.an { font-size: 20px; font-weight: 600; } .as { font-size: 14px; color: var(--t2); }
.get { margin-top: 8px; width: 72px; height: 30px; border-radius: 15px; background: #0a84ff; color: #fff; display: grid; place-items: center; font-size: 15px; font-weight: 700; }
.row { position: absolute; top: 172px; left: 20px; right: 0; display: flex; gap: 10px; overflow-x: auto; padding-right: 20px; }
.tile { flex: none; width: 190px; height: 412px; border-radius: 20px; overflow: hidden; border: 1px solid var(--line); background: #e6edf5; }
.tile video, .tile img { width: 100%; height: 100%; object-fit: cover; display: block; }
.note { max-width: 46ch; color: var(--t2); }
.pv { display: flex; gap: 28px; flex-wrap: wrap; align-items: flex-start; background: var(--card); border: 1px solid var(--line); border-radius: 20px; padding: 18px; }
.big video { width: 320px; max-width: 100%; height: auto; border-radius: 18px; display: block; background: #e6edf5; }
.txt { flex: 1 1 300px; min-width: 0; } .txt p { color: var(--t2); margin: 0 0 10px; } .spec { font-size: 13px; }
.keep { display: flex; gap: 10px; align-items: center; margin-top: 8px; flex-wrap: wrap; }
details { background: var(--card); border: 1px solid var(--line); border-radius: 20px; padding: 14px 18px; }
summary { cursor: pointer; font-weight: 500; }
summary span { color: var(--t3); font-weight: 400; }
.olds { display: grid; gap: 18px; margin-top: 14px; }
.old { display: flex; gap: 18px; flex-wrap: wrap; align-items: flex-start; }
.old video { width: 200px; max-width: 100%; border-radius: 14px; background: #e6edf5; display: block; }
'''

html = f'''<title>App Store Previews</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&display=swap">
<style>{CSS}{pk.CSS}</style>
<main>
  <header><h1>App Store previews</h1>
  <p class="lede">Three App Previews in the header’s world, in S-V3’s subtle blue only: Emma’s photos with depth, her garments lifting with soft cool shadows, the blue linen, the same camera glide and the lockup. In the phone, at the centre of almost every frame, is the real build 284: the new look, with a clean status bar. Apple’s preview rule is screen captures of the app, with overlays allowed. Apple’s bezel licence forbids anything that appears to enter the screen, so each garment comes to rest beside the phone and the camera pushes in past it. Draft: nothing is uploaded.</p></header>
  <section class="store">
    <div class="ph"><div class="sb"><span>9:41</span><span>●●●</span></div>
      <div class="app"><div class="icon">C</div><div><div class="an">Curate</div><div class="as">AI stylist &amp; try-on</div><div class="get">Get</div></div></div>
      <div class="row">{"".join(rows)}</div></div>
    <p class="note">How they sit in the App Store: the previews play first in the screenshot row, muted, then the S-V3 screenshots. Scroll the row sideways. Apple shows a preview’s frame at 5 s until it plays.</p>
  </section>
  {"".join(cards)}
  <details><summary>Earlier version: the hybrids on warm sets <span>(you asked for the subtle blue only)</span></summary>
    <div class="olds">{"".join(warm)}</div>
  </details>
  <details><summary>Earlier version: the screen-recording cuts <span>(v1 · your picks: keep 1 and 3, not 2)</span></summary>
    <div class="olds">{"".join(older)}</div>
  </details>
  {pk.summary([("previews", "Keep")])}
</main>
<script>{pk.JS}</script>
'''
open(f'{SITE}/index.html', 'w').write(html)
print(round(len(html) / 1024), 'KB', {f: round(os.path.getsize(f'{SITE}/{f}') / 1e6, 1) for f in sorted(os.listdir(SITE)) if f.endswith('.mp4')})
