# fixbat.py NAME REF : the status bar override was briefly "charging" in that take; paste the plain full battery
# from REF (same screen ground colour) over the battery glyph. Only the battery box changes.
import sys
from PIL import Image
D='/private/tmp/claude-501/-Users-saikumar-Desktop-Curate-curate-app/8dfb7189-122d-440a-a9c0-c4ad2cfe63b8/scratchpad/ss'
n,r=sys.argv[1],sys.argv[2]
im=Image.open(f'{D}/raw/{n}.png').convert('RGB'); ref=Image.open(f'{D}/raw/{r}.png').convert('RGB')
box=(1085,55,1225,135)
a=im.getpixel((1240,95)); b=ref.getpixel((1240,95)); c=im.getpixel((1075,95)); d=ref.getpixel((1075,95))
assert max(abs(x-y) for x,y in zip(a,b))<=3 and max(abs(x-y) for x,y in zip(c,d))<=3, (a,b,c,d)
im.paste(ref.crop(box),box[:2]); im.save(f'{D}/raw/{n}.png'); im.resize((400,869),Image.LANCZOS).save(f'{D}/v/{n}.jpg',quality=85); print('fixed',n)
