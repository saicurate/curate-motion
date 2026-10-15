"""Contact sheet of images for review: python3 sheet.py out.jpg img1 img2 ..."""
import sys, os
from PIL import Image, ImageDraw
out, paths = sys.argv[1], sys.argv[2:]
W, H, cols = 360, 480, 5
rows = (len(paths) + cols - 1) // cols
sheet = Image.new("RGB", (W * cols, (H + 24) * rows), "white")
d = ImageDraw.Draw(sheet)
for i, p in enumerate(paths):
    im = Image.open(p).convert("RGB"); im.thumbnail((W, H))
    x, y = (i % cols) * W, (i // cols) * (H + 24)
    sheet.paste(im, (x + (W - im.size[0]) // 2, y))
    d.text((x + 4, y + H + 4), os.path.basename(p)[:48], fill="black")
sheet.save(out, quality=85)
