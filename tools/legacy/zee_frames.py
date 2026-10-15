# Convert Zee's 720px 16-bit frame renders (the zee-sharp-v1 source) to 8-bit WebP for Remotion.
import os, sys, json
from concurrent.futures import ProcessPoolExecutor
from PIL import Image
S = os.path.expanduser('~/Desktop/Curate/research/zee-pack/zee-v2/sharp/frames-720-f18cL-v2')
O = '/Users/saikumar/Desktop/Curate/marketing/videos/remotion/public/zee'
def one(job):
    src, dst = job
    if os.path.exists(dst): return
    im = Image.open(src)
    im = im.convert('RGBA') if im.mode != 'I;16' else im
    # 16-bit RGBA PNG: Pillow opens as RGBA (it reduces to 8 bit)
    im.save(dst, 'WEBP', quality=90, alpha_quality=95, method=4)
def main():
  jobs = []; meta = {}
  for e in sorted(os.listdir(S)):
      meta[e] = {}
      for seg in ('intro', 'loop', 'outro'):
          d = os.path.join(S, e, 'a', seg); od = os.path.join(O, e, seg); os.makedirs(od, exist_ok=True)
          fs = sorted(f for f in os.listdir(d) if f.endswith('.png'))
          meta[e][seg] = len(fs)
          for i, f in enumerate(fs):
              jobs.append((os.path.join(d, f), os.path.join(od, '%04d.webp' % (i + 1))))
  json.dump(meta, open(os.path.join(O, 'meta.json'), 'w'), indent=1)
  with ProcessPoolExecutor(8) as ex: list(ex.map(one, jobs, chunksize=16))
  print('done', len(jobs))

if __name__ == '__main__':
  main()
