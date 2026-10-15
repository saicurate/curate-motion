# rows.py OUT clip1 clip2 ... : one row per clip, N frames evenly spaced, labelled "clip t"
import sys, subprocess, json, os
from PIL import Image, ImageDraw
C='/Users/saikumar/Desktop/Curate/curate-motion/.cache/clips'; T='/Users/saikumar/Desktop/Curate/curate-motion/.cache/takes'
N=9; W=150; H=326
out=sys.argv[1]; clips=sys.argv[2:]
im=Image.new('RGB',(N*W,len(clips)*(H+14)),'white'); d=ImageDraw.Draw(im)
for r,c in enumerate(clips):
    f=f'{C}/{c}.mp4' if os.path.exists(f'{C}/{c}.mp4') else f'{T}/{c}'
    dur=float(subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',f],capture_output=True,text=True).stdout)
    for i in range(N):
        t=dur*(i+0.5)/N
        p=subprocess.run(['ffmpeg','-v','error','-ss',f'{t:.2f}','-i',f,'-frames:v','1','-vf',f'scale={W}:{H}','-f','image2pipe','-vcodec','png','-'],capture_output=True).stdout
        from io import BytesIO
        try: fr=Image.open(BytesIO(p))
        except Exception: continue
        im.paste(fr,(i*W,r*(H+14)+14)); d.text((i*W+2,r*(H+14)+1),f'{c[:16]} {t:.1f}',fill='red')
im.save(out,quality=80)
