# sheet.py VIDEO OUTPREFIX STEP [start] [end]  -> contact sheets with time labels
import sys, subprocess, os, glob, tempfile
from PIL import Image, ImageDraw
v, out, step = sys.argv[1], sys.argv[2], float(sys.argv[3])
st = float(sys.argv[4]) if len(sys.argv) > 4 else 0
en = float(sys.argv[5]) if len(sys.argv) > 5 else None
d = tempfile.mkdtemp()
args = ['ffmpeg', '-v', 'error', '-ss', str(st)] + (['-t', str(en - st)] if en else []) + ['-i', v, '-vf', f'fps=1/{step},scale=160:-1', f'{d}/%04d.jpg']
subprocess.run(args, check=True)
fs = sorted(glob.glob(f'{d}/*.jpg')); W, H = Image.open(fs[0]).size
cols, rows = 10, 6
for p in range(0, len(fs), cols * rows):
    page = fs[p:p + cols * rows]
    im = Image.new('RGB', (cols * W, ((len(page) + cols - 1) // cols) * (H + 16)), 'white'); dr = ImageDraw.Draw(im)
    for i, f in enumerate(page):
        x, y = (i % cols) * W, (i // cols) * (H + 16)
        im.paste(Image.open(f), (x, y + 16)); t = st + (p + i) * step
        dr.text((x + 4, y + 2), f'{t:.1f}', fill='red')
    im.save(f'{out}-{p // (cols * rows)}.jpg', quality=80)
print(len(fs), 'frames')
