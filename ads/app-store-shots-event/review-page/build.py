"""The founder's page for the Event Draw custom product page's screenshots (2026-10-25). The booth's QR → the event's
web page → this store page. First the store page as it shows on a phone (the four in the row), then each screenshot
large with Keep yes/no. Earlier rounds folded. Picks: studies/picks_kit.py, section 'event' (Keep per screenshot).

python3 ads/app-store-shots-event/review-page/build.py → review-page/site/index.html
(publish with capabilities {"db": {}}).
"""
import base64, importlib.util, io, os
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
AD = os.path.abspath(os.path.join(HERE, '..'))
MOTION = os.path.abspath(os.path.join(AD, '..', '..'))
STUDIES = os.path.abspath(os.path.join(MOTION, '..', 'studies'))
spec = importlib.util.spec_from_file_location('picks_kit', os.path.join(STUDIES, 'picks_kit.py'))
pk = importlib.util.module_from_spec(spec); spec.loader.exec_module(pk)


def jpeg(path, w, q=90):
    im = Image.open(path).convert('RGB')
    im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    b = io.BytesIO(); im.save(b, 'JPEG', quality=q, optimize=True)
    return 'data:image/jpeg;base64,' + base64.b64encode(b.getvalue()).decode()


COPY = [
    ('At a Curate event? Win the prize.', 'The draw’s real waiting screen: the prize photo, “Win a Dyson Supersonic hair dryer”, the two steps to a ticket. The caption keeps the prize generic, so one page serves every event.'),
    ('Add your clothes to your closet.', 'The Closet tab with the draw’s ticket card at 1/2: “Clothes added · now try one thing on”. Her clothes upright in a tidy row under the phone.'),
    ('Do one try-on, see it on you.', 'The Studio try-on from the main set: the look on her photo. The look’s tee, tote and loafers in the row.'),
    ('That’s it. You’re in the draw.', 'The real “You’re in!” ticket, #0087, drawn live at 7 pm. Under it the line the sweepstakes rule asks for: “Official rules in the app. Apple is not a sponsor.”'),
]
FINAL = [f'{AD}/out/final-w600/event-o2-{i}.png' for i in range(1, 5)]
R1 = [f'{AD}/out/r1/s{i}/app-store-shots-event_store-shot_f0000.png' for i in range(1, 5)]
ICON = jpeg(os.path.join(STUDIES, 'ob172-app-store-header/assets/icon.png'), 180)

css_pics = [f'.e{i + 1}{{background-image:url("{jpeg(f, 760)}")}}' for i, f in enumerate(FINAL)]
css_pics += [f'.r{i + 1}{{background-image:url("{jpeg(f, 420, 84)}")}}' for i, f in enumerate(R1)]

STATUS = '<div class="sb"><span>9:41</span><span class="sbr"><i></i><i></i><i></i><b></b></span></div>'
PROMO = 'At a Curate event? Install, add a few clothes, do one try-on, and you’re in the draw.'

product = f'''<div class="ph">{STATUS}
  <div class="back">‹</div>
  <div class="app big"><div class="icon" style="background-image:url('{ICON}')"></div><div><div class="an">Curate: Your Personal Stylist</div><div class="get">Get</div></div></div>
  <div class="promo">{PROMO}</div>
  <div class="row6">{"".join(f'<i class="pic e{i}"></i>' for i in range(1, 5))}</div>
</div>'''

large = ''.join(
    f'''<figure><div class="pic shot e{i + 1}"></div><figcaption><b>{i + 1} · {h}</b>{d}</figcaption>
    {pk.yesno("event", f"#{i + 1} keep")}</figure>'''
    for i, (h, d) in enumerate(COPY))

CSS = r'''
:root { --ground:#f5f6f4; --ink:#181818; --t2:#656565; --t3:#9a9c98; --line:#e3e4e0; color-scheme: light; }
* { box-sizing: border-box; }
body { margin:0; background: var(--ground); color: var(--ink); font: 15px/1.45 Geist, -apple-system, "Helvetica Neue", Arial, sans-serif; padding: 28px 16px 64px; }
main { max-width: 1180px; margin: 0 auto; display: grid; grid-template-columns: minmax(0, 1fr); gap: 44px; }
h1 { font-size: 30px; font-weight: 500; letter-spacing: -.02em; margin: 0; text-wrap: balance; }
.lede { color: var(--t2); margin: 6px 0 0; max-width: 74ch; }
section h2 { font-size: 22px; font-weight: 500; margin: 0; letter-spacing: -.01em; }
section > p { color: var(--t2); margin: 4px 0 16px; max-width: 74ch; }
.cap { font-size: 13px; color: var(--t2); margin-bottom: 8px; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr)); gap: 22px; margin-top: 18px; }
.mrow { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 6px; }
.mrow i { flex: 0 0 150px; aspect-ratio: 1320 / 2868; border-radius: 12px; border: 1px solid var(--line); }
section.old summary { cursor: pointer; font-size: 17px; font-weight: 500; color: var(--t2); }
section.old details[open] summary { margin-bottom: 12px; }
figure { margin: 0; }
.pic { background-size: cover; background-position: center; background-repeat: no-repeat; }
.shot { width: 100%; aspect-ratio: 1320 / 2868; border-radius: 18px; border: 1px solid var(--line); box-shadow: 0 10px 30px rgba(20,20,20,.08); }
figcaption { font-size: 13.5px; color: var(--t2); margin-top: 8px; }
figcaption b { display: block; color: var(--ink); font-weight: 500; font-size: 15px; margin-bottom: 2px; }
.flow { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; font-size: 14px; color: var(--t2); margin-top: 10px; }
.flow span { background: #fff; border: 1px solid var(--line); border-radius: 999px; padding: 4px 12px; color: var(--ink); }

/* the phone: laid out at 393 × 852, shown 320 wide */
.ph { width: 393px; height: 852px; zoom: .8142; border-radius: 54px; position: relative; overflow: hidden; background: #fff; border: 1px solid #d8d9d5; box-shadow: 0 14px 40px rgba(20,20,20,.10); }
.sb { position: absolute; top: 18px; left: 44px; right: 34px; display: flex; justify-content: space-between; font-size: 17px; font-weight: 600; }
.sbr { display: flex; gap: 5px; align-items: center; } .sbr i { width: 4px; height: 10px; background: #111; border-radius: 1px; } .sbr b { width: 26px; height: 12px; border: 1.5px solid #111; border-radius: 4px; margin-left: 4px; }
.back { position: absolute; top: 58px; left: 16px; font-size: 34px; line-height: 1; color: #0a84ff; }
.app { position: absolute; top: 108px; left: 16px; right: 16px; display: flex; gap: 12px; align-items: center; }
.app .icon { width: 96px; height: 96px; border-radius: 22px; background-size: cover; flex: none; }
.app .an { font-size: 18px; font-weight: 600; }
.app .get { margin: 8px 0 0; width: 74px; height: 30px; border-radius: 15px; background: #0a84ff; color: #fff; display: grid; place-items: center; font-size: 15px; font-weight: 700; }
.promo { position: absolute; top: 222px; left: 16px; right: 16px; font-size: 14px; line-height: 1.35; color: #3c3c43; }
.row6 { position: absolute; top: 284px; left: 16px; right: 0; display: flex; gap: 10px; overflow-x: auto; padding-right: 16px; }
.row6 i { flex: 0 0 236px; height: 513px; border-radius: 18px; border: 1px solid var(--line); }
'''

html = f'''<title>Event Draw Store Page</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&display=swap">
<style>{"".join(css_pics)}{CSS}{pk.CSS}</style>
<main>
  <header>
    <h1>Event Draw store page · screenshots</h1>
    <p class="lede">The App Store page the booth’s QR will open: a custom product page, so people at an event see the draw instead of the usual page. Four screenshots in the submitted O2 look (blue linen, the same phone, garments upright in a tidy row), iPhone 6.9", 1320 × 2868. The screens are the app’s real Event Draw screens on the patch-1 code, so they say Closet, over a faked draw with the Dyson test event’s prize photo. The captions say “the prize”, never the brand, so App Review has nothing to object to and one page serves every event; the prize shows only inside the real screen.</p>
    <div class="flow"><span>Booth QR</span>→<span>event web page</span>→<span>this store page</span>→<span>Open: the event code</span></div>
  </header>
  <section><h2>On the phone</h2>
    <p>How the page shows on an iPhone, at true size: the name, Get, the promo text (a suggestion, the custom page’s own line), then the four. Scroll the row.</p>
    {product}
  </section>
  <section><h2>The four</h2>
    <p>Keep or not, each. Notes in the box under the picks.</p>
    <div class="grid">{large}</div>
  </section>
  <section class="old"><details><summary>Round 1 · the draw time read 2:54 am, now 7 pm</summary>
    <div class="mrow">{"".join(f'<i class="pic r{i}"></i>' for i in range(1, 5))}</div></details></section>
  {pk.summary([("event", "Event Draw screenshots")])}
</main>
<script>{pk.JS}</script>
'''
os.makedirs(os.path.join(HERE, 'site'), exist_ok=True)
open(os.path.join(HERE, 'site', 'index.html'), 'w').write(html)
print(len(html) // 1024, 'KB')
