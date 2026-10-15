#!/usr/bin/env python3
"""Probe-only worktree (app-capture-262): swap every stand-in image the probes use for Emma's real assets.
- assets/onboarding/face.jpg            -> Emma's selfie (and StandInFace constants)
- assets/gallery_import/{n,b,y,f}*.jpg  -> Emma's camera-roll photos (stock for n/b, her photos for y/f)
- assets/gallery_import/p_*.jpg         -> her real app pieces
- assets/images/wardrobe/*.jpg          -> her real app pieces (names fixed in the probes)
- the probes' founder closet folder     -> a folder of her real app pieces under the same file keys, names rewritten
- the probes' "you" folder              -> her camera-roll photos under the same keys
Never touches anything outside .worktrees/app-capture-262 and curate-motion/.cache.
"""
import json, os, re, glob, shutil
from PIL import Image

W = '/Users/saikumar/Desktop/Curate/.worktrees/app-capture-262'
E = '/Users/saikumar/Desktop/Curate/curate-motion/.cache/emma-app'
LIB = '/Users/saikumar/Desktop/Curate/curate-motion/library'
ROLL = f'{LIB}/camera-roll/emma'
STOCK = f'{LIB}/stock/unsplash'
pieces = json.load(open(f'{E}/pieces.json'))
by_cat = {}
for p in pieces: by_cat.setdefault(p['category'], []).append(p)

def save_jpg(src, dst, size=None, fit=None):
    im = Image.open(src).convert('RGB')
    if fit:  # cover-crop to fit size
        tw, th = fit; r = max(tw / im.width, th / im.height)
        im = im.resize((round(im.width * r), round(im.height * r)), Image.LANCZOS)
        l = (im.width - tw) // 2; t = (im.height - th) // 2
        im = im.crop((l, t, l + tw, t + th))
    elif size:
        im.thumbnail(size, Image.LANCZOS)
    im.save(dst, 'JPEG', quality=90)

def piece_on_white(p, dst, size=(420, 420)):
    im = Image.open(f"{E}/{p['image']}").convert('RGBA')
    bg = Image.new('RGBA', im.size, (255, 255, 255, 255)); bg.alpha_composite(im)
    bg = bg.convert('RGB'); bg.thumbnail(size, Image.LANCZOS)
    out = Image.new('RGB', size, (255, 255, 255)); out.paste(bg, ((size[0] - bg.width) // 2, (size[1] - bg.height) // 2))
    out.save(dst, 'JPEG', quality=90)

def find(name):
    for p in pieces:
        if p['name'] == name: return p
    raise SystemExit('no piece ' + name)

# 1. the selfie stand-in: 560x750, face centre and width measured on her selfie (1792x2400: centre 942,840; width 660)
k = 560 / 1792
save_jpg(f'{LIB}/people/emma/selfie/selfie.v1.jpg', f'{W}/assets/onboarding/face.jpg', fit=(560, 750))
fk = f'{W}/lib/dev/selfie_camera_fakes.dart'
s = open(fk).read()
s = s.replace('static const size = Size(560, 700);', 'static const size = Size(560, 750);')
s = s.replace('static const face = Offset(285, 172);', f'static const face = Offset({942*k:.0f}, {840*k:.0f});')
s = s.replace('static const faceWidth = 130.0;', f'static const faceWidth = {660*k:.1f};')
open(fk, 'w').write(s)

# 2. gallery_import stand-ins
stock = sorted(glob.glob(f'{STOCK}/*.jpg'))
roll = sorted(glob.glob(f'{ROLL}/r*.jpg'))
gi = f'{W}/assets/gallery_import'
for i, f in enumerate(sorted(glob.glob(f'{gi}/n*.jpg') + glob.glob(f'{gi}/b*.jpg'))):
    w, h = Image.open(f).size; save_jpg(stock[i % len(stock)], f, fit=(w, h))
for i, f in enumerate(sorted(glob.glob(f'{gi}/y*.jpg') + glob.glob(f'{gi}/f*.jpg'))):
    w, h = Image.open(f).size; save_jpg(roll[(i * 7) % len(roll)], f, fit=(w, h))
for key, name in {'p_bag': 'Tan Leather Crossbody Bag', 'p_denim': 'Blue Denim Jacket', 'p_jeans': 'Blue Jeans', 'p_knit': 'Beige Cable Knit Sweater',
                  'p_tote': 'Black Tote Bag', 'p_trench': 'Beige Trench Coat', 'p_wide': 'Black Trousers'}.items():
    f = f'{gi}/{key}.jpg'; w, h = Image.open(f).size; piece_on_white(find(name), f, (w, h))
for d in glob.glob(f'{gi}/*x'):
    for f in glob.glob(f'{d}/*.jpg'):
        base = os.path.join(gi, os.path.basename(f))
        if os.path.exists(base):
            w, h = Image.open(f).size; im = Image.open(base); im.resize((w, h), Image.LANCZOS).save(f, 'JPEG', quality=90)

# 3. the probes' Wardrobe-tab packshots
WARD = {'knit': 'Beige Cable Knit Sweater', 'denim': 'Blue Jeans', 'slip-dress': 'Beige Satin Slip Midi Dress', 'loafers': 'Black Loafers',
        'blazer': 'Black Blazer', 'bag': 'Black Tote Bag'}
for key, name in WARD.items():
    f = f'{W}/assets/images/wardrobe/{key}.jpg'; w, h = Image.open(f).size; piece_on_white(find(name), f, (w, h))
NAMEFIX = {"'Cream Cable Knit'": "'Beige Cable Knit Sweater'", "'Straight Leg Denim'": "'Blue Jeans'", "'Black Slip Dress'": "'Beige Satin Slip Midi Dress'",
           "'Leather Loafers'": "'Black Loafers'", "'Double-Breasted Blazer'": "'Black Blazer'", "'Structured Tote'": "'Black Tote Bag'"}

# 4/5. closet + you folders
CL = f'{E}/closet'; YOU = f'{E}/you-keys'
os.makedirs(CL, exist_ok=True); os.makedirs(YOU, exist_ok=True)
YOUMAP = {'mirror1': 'r09', 'look_work': 'r30', 'h5': 'r04', 'look_summer': 'r08', 'h1': 'r01', 'look_knit': 'r28', 'h6': 'r12',
          'look_coat': 'r13', 'h3': 'r03', 'h2': 'r02', 'selfie_full': 'r11', 'look_date': 'r24', 'h4': 'r06'}
for key, r in YOUMAP.items():
    src = [f for f in roll if os.path.basename(f).startswith(r + '-')][0]
    save_jpg(src, f'{YOU}/{key}.jpg', size=(1200, 1600))
save_jpg(f'{LIB}/people/emma/selfie/selfie.v1.jpg', f'{YOU}/selfie.jpg', size=(1200, 1600))

CATS = {'top', 'bottom', 'footwear', 'bag', 'outerwear', 'dress', 'accessory', 'shoes', 'outer', 'jewelry'}
KEYW = [('shoe|sneaker|boot|loafer|heel|sandal|flat', 'footwear'), ('bag|tote|clutch|crossbody', 'bag'), ('jean|trouser|pant|skirt|short|legging', 'bottom'),
        ('coat|blazer|jacket|trench|parka|cardigan', 'outerwear'), ('dress', 'dress'), ('cap|hat|scarf|belt|sunglass|beanie', 'accessory')]
def cat_of(name, fields):
    for f in fields:
        if f in CATS: return {'shoes': 'footwear', 'outer': 'outerwear', 'jewelry': 'accessory'}.get(f, f)
    for rx, c in KEYW:
        if re.search(rx, name.lower()): return c
    return 'top'
used = {}
assign = {}
def emma_for(fid, name, fields):
    if fid in assign: return assign[fid]
    c = cat_of(name, fields)
    pool = by_cat.get(c) or by_cat.get('bag' if c == 'accessory' else 'top')
    if c == 'bag': pool = by_cat.get('bag', []) + [p for p in by_cat['accessory'] if 'Bag' in p['name']]
    i = used.get(c, 0); used[c] = i + 1
    p = pool[i % len(pool)]; assign[fid] = p
    shutil.copy(f"{E}/{p['image']}", f'{CL}/{fid}.webp')
    Image.open(f"{E}/{p['image']}").convert('RGB').save(f'{CL}/{fid}.jpg', 'JPEG', quality=92)
    return p

TUP = re.compile(r"\('([0-9a-f]{24})', '([^']*)'((?:, '[^']*')*)\)")
for probe in ['pieces_wait_probe', 'scan_face_down_probe', 'wardrobe_leave_probe', 'zee_extras_probe', 'photos_off_probe', 'wardrobe_tab_probe']:
    f = f'{W}/lib/dev/{probe}.dart'
    if not os.path.exists(f): continue
    s = open(f).read()
    def rep(m):
        fields = re.findall(r"'([^']*)'", m.group(3))
        p = emma_for(m.group(1), m.group(2), fields)
        return f"('{m.group(1)}', '{p['name']}'{m.group(3)})"
    s = TUP.sub(rep, s)
    s = s.replace('/Users/saikumar/Desktop/Curate/research/ob72-one-stylist-build/e2e/img/f_founder', CL)
    s = s.replace("'$_research/ob72-one-stylist-build/e2e/img/f_founder'", f"'{CL}'")
    s = s.replace('/Users/saikumar/Desktop/Curate/studies/ob91-finding-you-zee/assets/you', YOU)
    for a, b in NAMEFIX.items(): s = s.replace(a, b)
    open(f, 'w').write(s)
    print(probe, 'founder refs left:', s.count('f_founder'), '| ids mapped so far:', len(assign))
json.dump({k: v['name'] for k, v in assign.items()}, open(f'{E}/closet-map.json', 'w'), indent=1)
