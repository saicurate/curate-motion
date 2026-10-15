# pair.py OUT a b c ... : side-by-side view of v/NAME.jpg at 330px wide, labelled
import sys
from PIL import Image, ImageDraw
D='/private/tmp/claude-501/-Users-saikumar-Desktop-Curate-curate-app/8dfb7189-122d-440a-a9c0-c4ad2cfe63b8/scratchpad/ss'
ims=[Image.open(f'{D}/raw/{n}.png').convert('RGB').resize((400,869)) for n in sys.argv[2:]]
o=Image.new('RGB',(404*len(ims),889),'white'); d=ImageDraw.Draw(o)
for i,(n,im) in enumerate(zip(sys.argv[2:],ims)): o.paste(im,(i*404,20)); d.text((i*404+4,4),n,fill='red')
o.save(sys.argv[1],quality=85)
