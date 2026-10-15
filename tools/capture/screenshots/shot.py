# shot.py NAME : simctl screenshot -> raw/NAME.png (RGB). If SpringBoard dropped the Dynamic Island from this capture
# (it comes and goes in simctl screenshots), the island is drawn back from its measured mask so every shot matches the recordings.
import subprocess, sys, os, time
from PIL import Image
D=os.path.dirname(os.path.abspath(__file__)); U=os.environ.get('SIMU','B0202502-C8FB-4DAA-8E29-EAE4866B0C14'); n=sys.argv[1]
tmp=f'{D}/_t.png'
subprocess.run(['xcrun','simctl','io',U,'screenshot','--type=png',tmp],capture_output=True)
im=Image.open(tmp).convert('RGB')
fixed=''
if not all(im.getpixel((x,90))[0]<20 for x in (560,660,760)):
    m=Image.open(f'{D}/island_mask.png'); x0,y0=map(int,open(f'{D}/island_box.txt').read().split())
    im.paste(Image.new('RGB',m.size,(0,0,0)),(x0,y0),m); fixed=' (island drawn)'
im.save(f'{D}/raw/{n}.png'); im.resize((400,869),Image.LANCZOS).save(f'{D}/v/{n}.jpg',quality=85); print(n+fixed)
