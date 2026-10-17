import React, { useEffect, useRef, useState } from "react";
import { continueRender, delayRender } from "remotion";

// StableImg: an image that renders the same pixels on every frame, whatever was drawn before.
//
// Why: Chrome decodes a big JPEG at a reduced size when it is drawn small ("decode to scale") and
// keeps that decode in a cache. So a frame rendered right after a zoomed-out frame can reuse a
// smaller decode than the same frame rendered fresh: the determinism check (tools/stills
// --determinism) caught it on Pop out v3 (whole photo tiles differing by up to 3/255).
// StableImg decodes the file ONCE at full size (createImageBitmap) into a canvas at its natural
// pixel size; CSS scales the canvas, so the GPU always starts from the same full bitmap.
//
// Use it for photos and cut-outs that are drawn at many scales (camera moves). Size it with
// `style` (width / height); it fills its box like object-fit: fill, so give it the image's aspect.

const cache = new Map<string, Promise<ImageBitmap>>();
const load = (src: string) => {
  let p = cache.get(src);
  if (!p) {
    p = fetch(src)
      .then((r) => {
        if (!r.ok) throw new Error(`StableImg: ${r.status} for ${src}`);
        return r.blob();
      })
      .then((b) => createImageBitmap(b, { premultiplyAlpha: "premultiply", colorSpaceConversion: "default" }));
    cache.set(src, p);
  }
  return p;
};

// `fit` (cover): decode ONCE straight to the drawn size, cropped like object-fit: cover, with high-quality
// resampling, and cache that small bitmap per photo and size. For many small copies of big photos (a camera-roll
// grid under sub-frame motion blur: hundreds of tiles a frame), where a full-size canvas each would be far too
// heavy. Deterministic for the same reason as the full decode: it is made once, never by the compositor.
const fitCache = new Map<string, Promise<ImageBitmap>>();
const loadFit = (src: string, w: number, h: number) => {
  const key = `${src}@${w}x${h}`;
  let p = fitCache.get(key);
  if (!p) {
    p = fetch(src)
      .then((r) => {
        if (!r.ok) throw new Error(`StableImg: ${r.status} for ${src}`);
        return r.blob();
      })
      .then(async (b) => {
        const full = await createImageBitmap(b);
        const s = Math.max(w / full.width, h / full.height);
        const sw = w / s;
        const sh = h / s;
        const small = await createImageBitmap(full, (full.width - sw) / 2, (full.height - sh) / 2, sw, sh, { resizeWidth: w, resizeHeight: h, resizeQuality: "high", premultiplyAlpha: "premultiply" });
        full.close();
        return small;
      });
    fitCache.set(key, p);
  }
  return p;
};

export const StableImg: React.FC<{ src: string; style?: React.CSSProperties; className?: string; fit?: { w: number; h: number } }> = ({ src, style, className, fit }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [handle] = useState(() => delayRender(`StableImg ${src.slice(-60)}`));
  const fw = fit ? Math.round(fit.w) : 0;
  const fh = fit ? Math.round(fit.h) : 0;
  useEffect(() => {
    let done = false;
    (fw ? loadFit(src, fw, fh) : load(src))
      .then((bmp) => {
        const c = ref.current;
        if (c && !done) {
          c.width = bmp.width;
          c.height = bmp.height;
          c.getContext("2d")!.drawImage(bmp, 0, 0);
        }
        continueRender(handle);
      })
      .catch((e) => {
        console.error(e);
        continueRender(handle);
      });
    return () => {
      done = true;
    };
  }, [src, handle, fw, fh]);
  return <canvas ref={ref} className={className} style={{ display: "block", ...style }} />;
};
