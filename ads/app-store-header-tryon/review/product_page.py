"""The App Store product page (iOS 27) with a header still on top, for the G2 review: python3 product_page.py
→ out/g2/<set>-product-page.png (1179 × 2556, a 393 pt phone at 3×). Real 284 screens as the screenshots."""
import base64, io, json, os, subprocess, sys
from PIL import Image

AD = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ROOT = os.path.dirname(os.path.dirname(AD))
CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'


def lib(asset_id):
    d = json.loads(subprocess.run([f'{ROOT}/tools/catalog', 'show', asset_id], capture_output=True, text=True, cwd=ROOT).stdout)
    return f"{ROOT}/library/{d['files'][0]['path']}"


def uri(path, w=None, fmt='JPEG'):
    im = Image.open(path).convert('RGB')
    if w:
        im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    b = io.BytesIO(); im.save(b, fmt, quality=90)
    return f'data:image/{fmt.lower()};base64,' + base64.b64encode(b.getvalue()).decode()


icon = uri(lib('brand.curate.splash-mark.v1') if False else '/Users/saikumar/Desktop/Curate/studies/ob172-app-store-header/assets/icon.png', 300, 'PNG')
studio = uri(lib('screenshot.emma.b284-studio-offduty-tryon.v1'), 600)
wardrobe = uri(lib('screenshot.emma.b284-wardrobe-rails.v1'), 600)
SETS = [('tryon', 'tryon/app-store-header-tryon_store-header_f0258.png', '#111'), ('tryon-b2', 'tryon-b2/app-store-header-tryon_store-header_f0258.png', '#fff'), ('tryon-b3', 'tryon-b3/app-store-header-tryon_store-header_f0258.png', '#111')]
only = sys.argv[1:]
for name, still, sb in [x for x in SETS if not only or x[0] in only]:
    hdr = uri(f'{AD}/out/g2/{still}', 1179)
    html = f'''<meta charset="utf-8"><style>
body{{margin:0;background:#fff;font-family:-apple-system,"SF Pro Text","Helvetica Neue",Arial,sans-serif;}}
.ph{{width:393px;height:852px;position:relative;overflow:hidden;background:#fff;zoom:3}}
.hdr{{position:absolute;top:0;left:0;width:393px;height:168px;background:url("{hdr}") center/100% 100% no-repeat}}
.sb{{position:absolute;top:16px;left:30px;right:26px;display:flex;justify-content:space-between;font-size:16px;font-weight:600;color:{sb}}}
.back{{position:absolute;top:54px;left:14px;width:34px;height:34px;border-radius:17px;background:rgba(255,255,255,.82);display:grid;place-items:center;font-size:24px;line-height:1;color:#111}}
.app{{position:absolute;top:186px;left:20px;right:20px;display:flex;gap:14px;align-items:center}}
.icon{{width:100px;height:100px;border-radius:23px;background:url("{icon}") center/cover;flex:none}}
.an{{font-size:21px;font-weight:600;color:#111}} .as{{font-size:14px;color:#6b6d72;margin-top:1px}}
.get{{margin-top:10px;width:72px;height:30px;border-radius:15px;background:#0a84ff;color:#fff;display:grid;place-items:center;font-size:15px;font-weight:700}}
.facts{{position:absolute;top:310px;left:20px;right:20px;display:grid;grid-template-columns:repeat(3,1fr);border-top:1px solid #e5e5ea;padding-top:11px;text-align:center;font-size:13px;color:#6b6d72}}
.facts span{{display:block;font-size:10px;letter-spacing:.05em;color:#9a9ca1;margin-bottom:3px}}
.shots{{position:absolute;top:384px;left:20px;display:flex;gap:10px}}
.shots i{{display:block;width:196px;height:425px;border-radius:20px;border:1px solid #e5e5ea;background-size:cover;background-position:top center}}
</style><div class="ph"><div class="hdr"></div><div class="sb"><span>9:41</span><span>●●● ▭</span></div><div class="back">‹</div>
<div class="app"><div class="icon"></div><div><div class="an">Curate</div><div class="as">AI stylist &amp; try-on</div><div class="get">Get</div></div></div>
<div class="facts"><div><span>CATEGORY</span>Lifestyle</div><div><span>DEVELOPER</span>Intuitive Fashions</div><div><span>LANGUAGE</span>EN</div></div>
<div class="shots"><i style="background-image:url('{studio}')"></i><i style="background-image:url('{wardrobe}')"></i></div></div>'''
    p = f'{AD}/review/_{name}.html'; open(p, 'w').write(html)
    out = f'{AD}/out/g2/{name}-product-page.png'
    subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1', '--window-size=1179,2556', f'--screenshot={out}', f'file://{p}'], capture_output=True)
    os.remove(p)
    print(out, Image.open(out).size)
