# grab.py NAME SRC T  : one exact frame of a clip (.cache/clips/SRC.mp4) or take (.cache/takes/SRC) -> raw/NAME.png + v/NAME.jpg
import sys, subprocess, os
from PIL import Image
D=os.path.dirname(os.path.abspath(__file__))
C='/Users/saikumar/Desktop/Curate/curate-motion/.cache'
n,src,t=sys.argv[1],sys.argv[2],sys.argv[3]
f=f'{C}/clips/{src}.mp4' if os.path.exists(f'{C}/clips/{src}.mp4') else f'{C}/takes/{src}'
subprocess.run(['ffmpeg','-nostdin','-v','error','-y','-i',f,'-ss',t,'-frames:v','1',f'{D}/_g.png'],check=True)
im=Image.open(f'{D}/_g.png').convert('RGB'); assert im.size==(1320,2868), im.size
im.save(f'{D}/raw/{n}.png'); im.resize((400,869),Image.LANCZOS).save(f'{D}/v/{n}.jpg',quality=85); print(n)
