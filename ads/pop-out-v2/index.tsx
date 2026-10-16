import React, { createContext, useContext } from "react";
import { AbsoluteFill, Freeze, Img, OffthreadVideo, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { z } from "zod";
import { FormatId } from "../../schemas/ad";
import { frameCount, frameSrc, GEIST, has, pieceAspect, src, useBrandFonts } from "../../motion";
import { P } from "./palette";
import { B, FPS, FROM_SEC, LAST, PER_BEAT } from "./timeline";
import {
  alongPolyline,
  crit,
  expoIn,
  expoInOut,
  expoOut,
  garmentPts,
  lerp,
  lerpPts,
  markPts,
  N,
  polyLen,
  roundedRect,
  starPts,
  toPath,
  tw,
  type Pt,
} from "./shapes";

// Pop out v2: one continuous line of thought, no cuts, no fades (README). Every shot is made out of
// the one before: a piece's outline pops out of her photo; the last outline becomes the scan's grid;
// the words become the line that draws the phone; her photo's tiles flip into the real scan; the
// scan's tiles fold into the Wardrobe's tiles; her pieces rise out of the Wardrobe; the denim jacket
// collapses into Curate's star; the star becomes the end card, and opens back into the first frame.
// One typeface (Geist), black + white + denim/camel/sage, one camera: locked, straight-on, it only
// dollies or orbits forward. Built for 9:16 (the brief's format); every position is in its pixels.

export const schema = z.object({
  format: FormatId,
  length: z.number(),
  track: z.string(),
  /** Seconds into the track at frame 0: the drop's kick (29.545 s), so beat 0 is frame 0. */
  fromSec: z.number().nonnegative(),
  /** Music gain (Cat Walk is mastered near −10 LUFS). */
  volume: z.number().min(0).max(1),
  /** Designed sound gain (sfx.curate.pop-out-v2-sound.v1: kicks, riser, hits, made in code). */
  sfxVolume: z.number().min(0).max(1),
  /** Sub-frame samples for the motion blur (3 = the brief's minimum). */
  samples: z.number().int().min(1).max(8),
});
export type Props = z.infer<typeof schema>;
export const defaults: Omit<Props, "format" | "length"> = { track: "music.mixkit.cat-walk-arulo.v1", fromSec: FROM_SEC, volume: 0.66, sfxVolume: 0.6, samples: 4 };

const SFX = "sfx.curate.pop-out-v2-sound.v1";
const SCAN = "footage.emma.scan-roll.v1";
const WARD = "footage.emma.wardrobe-scroll-float.v1";
const g = (n: string) => `garment.emma.${n}.v1`;

// ── geometry (1080 × 1920; the phone's screen is the app's 1320 × 2868 at K) ──
const K = 600 / 1320;
const SCR = { x: 240, w: 600, h: 2868 * K, r: 66 }; // screen (and the hook card: the same rectangle)
const BEZ = 17;
const PH = { x: SCR.x - BEZ, w: SCR.w + 2 * BEZ, h: SCR.h + 2 * BEZ, r: SCR.r + BEZ };
const CY_HOOK = 1150; // the card's centre in bars 1–2
const CY = 960; // the phone's centre (the frame's centre)
const top = (cy: number) => cy - SCR.h / 2;
const PHOTO = { s: SCR.h / 2400, w: (1792 * SCR.h) / 2400 }; // photos are 1792 × 2400, cover-fitted
const EXTRA = PHOTO.w - SCR.w;

// ── the sub-frame accumulation (motion blur): `samples` copies of the scene, each frozen a fraction
// of a frame earlier, stacked at 1/k opacity, so the frame is their exact average ──
const Sample = createContext(0);
const useUid = (name: string) => `${name}-${useContext(Sample)}`;
const SubframeBlur: React.FC<{ samples: number; shutter: number; children: React.ReactNode }> = ({ samples, shutter, children }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      {Array.from({ length: samples }, (_, i) => {
        const t = samples === 1 ? frame : frame - (shutter * (samples - 1 - i)) / (samples - 1);
        return (
          <AbsoluteFill key={i} style={{ opacity: 1 / (i + 1) }}>
            <Sample.Provider value={i}>
              <Freeze frame={Math.max(0, t)}>{children}</Freeze>
            </Sample.Provider>
          </AbsoluteFill>
        );
      })}
    </AbsoluteFill>
  );
};

/** Directional blur that follows speed: an SVG Gaussian stretched along x / y by the velocity. */
const SpeedBlur: React.FC<{ name: string; vx: number; vy: number; children: React.ReactNode }> = ({ name, vx, vy, children }) => {
  const id = useUid(name);
  const sx = Math.min(40, Math.abs(vx) * 0.16);
  const sy = Math.min(40, Math.abs(vy) * 0.16);
  const on = sx > 0.6 || sy > 0.6;
  return (
    <div style={{ position: "absolute", inset: 0, filter: on ? `url(#${id})` : undefined }}>
      {on ? (
        <svg width="0" height="0" style={{ position: "absolute" }}>
          <filter id={id} x="-30%" y="-30%" width="160%" height="160%" colorInterpolationFilters="sRGB">
            <feGaussianBlur stdDeviation={`${sx.toFixed(1)} ${sy.toFixed(1)}`} edgeMode="none" />
          </filter>
        </svg>
      ) : null}
      {children}
    </div>
  );
};

/** Real app footage at an exact source second (time-remapped, so a scroll can land on a beat). */
const Clip: React.FC<{ id: string; sec: number }> = ({ id, sec }) => (
  <Freeze frame={sec * FPS}>
    <OffthreadVideo src={src(id)} muted style={{ position: "absolute", left: 0, top: 0, width: SCR.w, height: SCR.h }} />
  </Freeze>
);

/** One of her photos laid into the card (cover-fitted; posX picks the crop like object-position). */
const Photo: React.FC<{ id: string; posX: number }> = ({ id, posX }) => (
  <Img src={src(id)} style={{ position: "absolute", left: -EXTRA * posX, top: 0, width: PHOTO.w, height: SCR.h }} />
);

/** The hook card / the phone's screen rectangle, at centre y. */
const Card: React.FC<{ cy: number; children: React.ReactNode }> = ({ cy, children }) => (
  <div style={{ position: "absolute", left: SCR.x, top: top(cy), width: SCR.w, height: SCR.h, borderRadius: SCR.r, overflow: "hidden", background: P.white }}>{children}</div>
);

// ── bar 1: her pieces, the photos they come out of, and where they float to ──
type Hook = { id: string; photo: string; posX: number; at: [number, number, number]; to: [number, number, number]; rot: number; color: string; flood: number | null; draw: number; pop: number };
const HOOK: Hook[] = [
  { id: g("jacket-denim"), photo: "photo.emma.r26-ferry.v1", posX: 0.5, at: [875, 1820, 1180], to: [215, 770, 380], rot: -6, color: P.camel, flood: null, draw: B(0), pop: B(0.5) },
  { id: g("coat-wool-camel"), photo: "photo.emma.r12-dumbo-walk.v1", posX: 0.5, at: [865, 1255, 1090], to: [885, 1110, 540], rot: 5, color: P.denim, flood: B(1), draw: B(1) + 3, pop: B(1.5) },
  { id: g("leggings-sage"), photo: "photo.emma.r29-gym-mirror.v1", posX: 1, at: [1510, 1675, 860], to: [200, 1470, 540], rot: -4, color: P.camel, flood: B(2), draw: B(2) + 3, pop: B(2.5) },
  { id: g("sports-bra-sage"), photo: "photo.emma.r29-gym-mirror.v1", posX: 1, at: [1510, 855, 300], to: [875, 650, 200], rot: 7, color: P.denim, flood: null, draw: B(3), pop: B(3.5) },
];
const homeOf = (p: Hook) => ({ x: SCR.x + p.at[0] * PHOTO.s - EXTRA * p.posX, y: top(CY_HOOK) + p.at[1] * PHOTO.s, h: p.at[2] * PHOTO.s });
const hookPose = (p: Hook, i: number, f: number) => {
  const home = homeOf(p);
  if (f < p.pop) return { ...home, rot: 0, popped: false, gone: false };
  const t = crit(tw(f, p.pop, 11));
  let x = lerp(home.x, p.to[0], t);
  let y = lerp(home.y, p.to[1], t) + Math.sin((f - p.pop) / 15 + i * 1.7) * 5 * t;
  let h = lerp(home.h, p.to[2], t);
  const rot = p.rot * t + Math.sin((f - p.pop) / 21 + i * 2.3) * 1.4 * t;
  // bar 3: the camera dollies forward past the near pieces (parallax), except the sage leggings
  let gone = false;
  if (i !== 2) {
    const e = expoIn(tw(f, B(8), 9));
    const dx = x - 540;
    const dy = y - CY;
    const d = Math.hypot(dx, dy) || 1;
    x += (dx / d) * 1400 * e;
    y += (dy / d) * 1400 * e;
    h *= 1 + 1.8 * e;
    gone = f > B(8) + 9.5;
  }
  return { x, y, h, rot, popped: true, gone };
};
const basePhoto = (f: number) => (f >= B(2) + 10 ? HOOK[2] : f >= B(1) + 10 ? HOOK[1] : HOOK[0]);
const floodOf = (f: number) => HOOK.find((p) => p.flood !== null && f >= p.flood && f < p.flood + 10);

// ── bar 2: the line, one beat a line ──
const TYPE_SIZE = 104;
const LINES = [
  { y: 156, w: 518, parts: [{ t: "Your closet", at: B(4), c: P.ink }] },
  { y: 262, w: 543, parts: [{ t: "is already in", at: B(5), c: P.ink }] },
  { y: 368, w: 569, parts: [{ t: "your ", at: B(6), c: P.denim }, { t: "photos.", at: B(7), c: P.denim }] },
];
const TYPE_X = 86;
const LINE_Y = top(CY) - BEZ / 2; // the phone's top bezel, where the words collapse to
const LINE_X: [number, number] = [340, 740];

// ── bar 3: the scan's grid (gutters measured on footage.emma.scan-roll.v1 at 1.25 s, app px) ──
const GX = [0, 328, 659.5, 991.5, 1320];
const GY = [695, 984, 1280.5, 1576, 1860];
const latticeVerts = (cy: number): Pt[] => {
  const X = (x: number) => SCR.x + x * K;
  const Y = (y: number) => top(cy) + y * K;
  const v: Pt[] = [];
  GY.forEach((y, r) => {
    const l2r = r % 2 === 0;
    v.push([X(l2r ? 0 : 1320), Y(y)], [X(l2r ? 1320 : 0), Y(y)]);
  });
  // back along the last row, up and down the inner columns
  [3, 2, 1].forEach((c, i) => {
    const down = i % 2 === 1;
    v.push([X(GX[c]), Y(down ? GY[0] : GY[4])], [X(GX[c]), Y(down ? GY[4] : GY[0])]);
  });
  return v;
};
type R = [number, number, number, number]; // x, y, w, h in app px
const flipTiles = (): { r: R; row: number; col: number; axis: "x" | "y" }[] => {
  const t: { r: R; row: number; col: number; axis: "x" | "y" }[] = [{ r: [0, 0, 1320, GY[0]], row: -1, col: 1.5, axis: "x" }];
  for (let row = 0; row < 4; row++) for (let col = 0; col < 4; col++) t.push({ r: [GX[col], GY[row], GX[col + 1] - GX[col], GY[row + 1] - GY[row]], row, col, axis: "y" });
  t.push({ r: [0, GY[4], 1320, 2868 - GY[4]], row: 4, col: 1.5, axis: "x" });
  return t;
};
const FLIP = flipTiles();

// footage time maps (source seconds at frame f): the scan's moves and the Wardrobe's scrolls on the beat
const srcScan = (f: number) => {
  if (f < B(12)) return lerp(1.25, 1.45, tw(f, B(11), B(12) - B(11)));
  if (f < B(14.5)) return lerp(1.45, 2.8, tw(f, B(12), B(14.5) - B(12)));
  if (f < B(16)) return lerp(5.7, 6.2, tw(f, B(14.5), B(16) - B(14.5)));
  return 6.2;
};
// static in between, so each jump lands on an identical frame (checked: mean diff < 0.5/255)
const BURSTS: [number, number, number][] = [
  [19, 5.04, 5.52],
  [20, 7.66, 8.17],
  [21, 10.36, 10.9],
  [22, 12.76, 13.28],
  [23, 5.04, 5.52],
];
const srcWard = (f: number) => {
  if (f < B(19)) return 3.2;
  for (const [n, s, e] of BURSTS) if (f < B(n + 1)) return lerp(s, e, tw(f, B(n), 0.9 * PER_BEAT));
  return 6.0;
};

// ── bar 5: the fold. Scan tiles (6.2 s) → Wardrobe tiles (3.2 s), app px ──
const SROWS = [750, 1044, 1341, 1638];
const TCOLS = [0, 442, 852, 1320];
const TROWS = [595, 1228, 1868, 2508];
type Fold = { s: R; t: R | null; j: number; axis: "x" | "y" };
const STATUS = 170; // the status bar (9:41, the island) is the same on both screens: it stays put
const FOLD: Fold[] = (() => {
  const out: Fold[] = [{ s: [0, STATUS, 1320, SROWS[0] - STATUS], t: [0, STATUS, 1320, TROWS[0] - STATUS], j: 0, axis: "x" }];
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 4; c++) {
      const s: R = [GX[c], SROWS[r], GX[c + 1] - GX[c], SROWS[r + 1] - SROWS[r]];
      out.push({ s, t: c < 3 ? [TCOLS[c], TROWS[r], TCOLS[c + 1] - TCOLS[c], TROWS[r + 1] - TROWS[r]] : null, j: 1 + r * 3 + Math.min(c, 2), axis: "y" });
    }
  out.push({ s: [0, SROWS[3], 1320, 2868 - SROWS[3]], t: [0, TROWS[3], 1320, 2868 - TROWS[3]], j: 10, axis: "x" });
  return out;
})();

// ── bar 7: her pieces rise out of the Wardrobe (bboxes measured at wardrobe-scroll-float 6.0 s, app px) ──
const RISE: { id: string; box: [number, number, number, number]; row: number; col: number }[] = [
  { id: g("bag-mini-black"), box: [142, 664, 361, 950], row: 0, col: 0 },
  { id: g("bag-crossbody-tan"), box: [544, 760, 775, 950], row: 0, col: 1 },
  { id: g("tee-black"), box: [914, 560, 1221, 951], row: 0, col: 2 },
  { id: g("flats-ballet-black"), box: [146, 1391, 357, 1590], row: 1, col: 0 },
  { id: g("bag-tote-leather-black"), box: [562, 1304, 757, 1590], row: 1, col: 1 },
  { id: g("sports-bra-sage"), box: [914, 1200, 1221, 1591], row: 1, col: 2 },
  { id: g("sweater-crewneck-navy"), box: [100, 1878, 403, 2232], row: 2, col: 0 },
  { id: g("boots-cowboy-tan"), box: [592, 2031, 727, 2231], row: 2, col: 1 },
  { id: g("camisole-satin-black"), box: [953, 1840, 1189, 2231], row: 2, col: 2 },
];
const ORBIT_RX = [0, 8, 13, 18, 24];
const ORBIT_RY = [0, 4, 7, 9, 10];
const orbit = (f: number) => {
  let rx = 0;
  let ry = 0;
  for (let i = 0; i < 4; i++) {
    const t = crit(tw(f, B(24 + i), 10));
    rx += (ORBIT_RX[i + 1] - ORBIT_RX[i]) * t;
    ry += (ORBIT_RY[i + 1] - ORBIT_RY[i]) * t;
  }
  rx += (90 - ORBIT_RX[4]) * expoIn(tw(f, B(28), 9)); // the phone closes to a line
  return { rx, ry };
};
const PERSP = 2600;
/** A point on the phone's screen (app px), lifted z px toward the lens, through the phone's 3D pose → world px. */
const project = (ax: number, ay: number, z: number, rx: number, ry: number) => {
  let x = BEZ + ax * K - PH.w / 2;
  let y = BEZ + ay * K - PH.h / 2;
  let zz = z;
  const a = (ry * Math.PI) / 180;
  const b = (rx * Math.PI) / 180;
  [x, zz] = [x * Math.cos(a) + zz * Math.sin(a), -x * Math.sin(a) + zz * Math.cos(a)];
  [y, zz] = [y * Math.cos(b) - zz * Math.sin(b), y * Math.sin(b) + zz * Math.cos(b)];
  const k = PERSP / (PERSP - zz);
  return { x: 540 + x * k, y: CY + y * k, k };
};

// ── the camera: locked, straight-on; it dollies forward a step on every beat (about the frame's centre) ──
const dolly = (f: number) => {
  let s = 0;
  for (let n = 1; n <= 27; n++) s += crit(tw(f, B(n), 8));
  return 1 + 0.0032 * s;
};

// ── bar 8: the end title (screen px) ──
const STAR_C: Pt = [540, 760];
const MARK_PX = 300 / 483; // the mark 300 px wide
const JACKET_END = { x: 540, y: 790, h: 520 };
const CARD_PTS = roundedRect(SCR.x, top(CY_HOOK), SCR.w, SCR.h, SCR.r, N);
const MARK_OUT = markPts(STAR_C[0], STAR_C[1], MARK_PX)[0];
const MARK_LEN = polyLen(MARK_OUT);
const STAR_S = starPts(STAR_C[0], STAR_C[1], MARK_PX);
const scaleAbout = (p: Pt[], c: Pt, s: number): Pt[] => p.map(([x, y]) => [c[0] + (x - c[0]) * s, c[1] + (y - c[1]) * s]);
const mix = (a: string, b: string, t: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(lerp(v, pb[i], t))).join(",")})`;
};

/** Zee by frame (frame-sequence assets; floor the sub-frame times the blur asks for). */
const zeeSrc = (t: number) => {
  const intro = "zee.cheer.intro.v1";
  const n = Math.max(0, Math.floor(t));
  return n < frameCount(intro) ? frameSrc(intro, n) : frameSrc("zee.cheer.loop.v1", n - frameCount(intro));
};

/** Rising type: each part slides up out of its own line box. */
const RiseText: React.FC<{ text: string; size: number; at: number; color: string; f: number; weight?: number }> = ({ text, size, at, color, f, weight = 500 }) => {
  const t = expoOut(tw(f, at, 8));
  if (f < at) return <span style={{ display: "inline-block", visibility: "hidden" }}>{text}</span>;
  return (
    <span style={{ display: "inline-block", overflow: "hidden", verticalAlign: "top", paddingBottom: size * 0.28, marginBottom: -size * 0.28 }}>
      <span style={{ display: "inline-block", color, fontWeight: weight, transform: `translateY(${(1 - t) * size * 1.3}px)` }}>{text}</span>
    </span>
  );
};

const Scene: React.FC = () => {
  const f = useCurrentFrame();
  const gz = dolly(f);
  const sky = useUid("sky");
  const card = f < B(8) ? CY_HOOK : lerp(CY_HOOK, CY, crit(tw(f, B(8), 10)));
  const phoneSolid = f >= B(11);

  // ═══ bars 1–7, in the world (the camera's dolly scales it about the frame's centre) ═══
  const world: React.ReactNode[] = [];
  const svg: React.ReactNode[] = []; // world-space vector layer (outlines, lattice, the line)

  // the card (her photo) until its tiles have flipped into the scan
  if (f < B(11)) {
    const base = basePhoto(f);
    const fl = floodOf(f);
    world.push(
      <Card key="card" cy={card}>
        <Photo id={base.photo} posX={base.posX} />
        {fl ? (
          (() => {
            const h = homeOf(fl);
            const m = 0.1 * Math.pow(70, tw(f, fl.flood!, 10)); // exponential growth through the piece's own shape
            const pts = garmentPts(fl.id, h.x - SCR.x, h.y - top(CY_HOOK), h.h * m);
            return (
              <>
                <div style={{ position: "absolute", inset: 0, clipPath: `path('${toPath(pts)}')` }}>
                  <Photo id={fl.photo} posX={fl.posX} />
                </div>
                <svg width={SCR.w} height={SCR.h} style={{ position: "absolute", inset: 0 }}>
                  <path d={toPath(pts)} fill="none" stroke={fl.color} strokeWidth={6} />
                </svg>
              </>
            );
          })()
        ) : null}
      </Card>,
    );
  }

  // bar 3 → 4: her photo's tiles flip, one by one, into the real scan behind them
  const flipping = f >= B(11) && f < B(11) + 18;

  // the phone (formed from the line at bar 3) with whatever its screen shows
  if (phoneSolid && f < B(28) + 10) {
    const { rx, ry } = orbit(f);
    const screen: React.ReactNode[] = [];
    if (f < B(16)) screen.push(<Clip key="scan" id={SCAN} sec={srcScan(f)} />);
    if (flipping) {
      const base = HOOK[2];
      FLIP.forEach((tile, i) => {
        const delay = (tile.row + 1 + tile.col) * 1.1;
        const a = 180 * expoInOut(tw(f, B(11) + delay, 7));
        if (a >= 90) return;
        const [x, y, w, h] = tile.r;
        screen.push(
          <div
            key={`ft${i}`}
            style={{
              position: "absolute",
              left: x * K,
              top: y * K,
              width: w * K,
              height: h * K,
              overflow: "hidden",
              transform: `perspective(1400px) ${tile.axis === "y" ? "rotateY" : "rotateX"}(${a}deg)`,
            }}
          >
            <div style={{ position: "absolute", left: -x * K, top: -y * K, width: SCR.w, height: SCR.h }}>
              <Photo id={base.photo} posX={base.posX} />
            </div>
          </div>,
        );
      });
    }
    // bar 5: the fold
    const folding = f >= B(16) && f < B(18) + 9;
    if (folding) {
      screen.push(<div key="ground" style={{ position: "absolute", inset: 0, background: P.app }} />);
      screen.push(
        <div key="status" style={{ position: "absolute", left: 0, top: 0, width: SCR.w, height: STATUS * K, overflow: "hidden" }}>
          <Clip id={SCAN} sec={6.2} />
        </div>,
      );
      const lift = crit(tw(f, B(16.5), 7));
      const settle = crit(tw(f, B(18), 8));
      FOLD.forEach((fo, i) => {
        if (!fo.t) {
          // the fourth column folds under the third: four columns become three
          const a = 100 * crit(tw(f, B(16), 7));
          if (a >= 90) return;
          const [x, y, w, h] = fo.s;
          screen.push(
            <div key={`fu${i}`} style={{ position: "absolute", left: x * K, top: y * K, width: w * K, height: h * K, overflow: "hidden", transformOrigin: "0% 50%", transform: `perspective(1400px) rotateY(${a}deg)` }}>
              <div style={{ position: "absolute", left: -x * K, top: -y * K, width: SCR.w, height: SCR.h }}>
                <Clip id={SCAN} sec={6.2} />
              </div>
            </div>,
          );
          return;
        }
        const ft = expoInOut(tw(f, B(17) + fo.j * 0.8, 10));
        const a = 180 * ft;
        const r = fo.s.map((v, k) => lerp(v, fo.t![k], ft)) as R;
        const back = a >= 90;
        const face = back ? fo.t : fo.s;
        const sc = 1 - 0.08 * lift + 0.08 * settle;
        const rot = fo.axis === "y" ? "rotateY" : "rotateX";
        screen.push(
          <div
            key={`fo${i}`}
            style={{
              position: "absolute",
              left: r[0] * K,
              top: r[1] * K,
              width: r[2] * K,
              height: r[3] * K,
              overflow: "hidden",
              transform: `perspective(1600px) translateZ(${30 * lift * (1 - settle)}px) ${rot}(${back ? a - 180 : a}deg) scale(${sc})`,
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: SCR.w,
                height: SCR.h,
                transformOrigin: "0 0",
                transform: `scale(${r[2] / face[2]}, ${r[3] / face[3]}) translate(${-face[0] * K}px, ${-face[1] * K}px)`,
              }}
            >
              <Clip id={back ? WARD : SCAN} sec={back ? 3.2 : 6.2} />
            </div>
          </div>,
        );
      });
    }
    if (f >= B(18) + 9) {
      screen.push(<Clip key="ward" id={WARD} sec={srcWard(f)} />);
      // bar 7: where a piece has lifted off, its place in the grid is empty
      RISE.forEach((p, i) => {
        if (f < B(24 + p.row)) return;
        const [x0, y0, x1, y1] = p.box;
        screen.push(<div key={`gp${i}`} style={{ position: "absolute", left: (x0 - 10) * K, top: (y0 - 10) * K, width: (x1 - x0 + 20) * K, height: (y1 - y0 + 20) * K, background: P.app }} />);
      });
    }
    if (rx < 89.5)
      world.push(
        <div
          key="phone"
          style={{ position: "absolute", left: PH.x, top: CY - PH.h / 2, width: PH.w, height: PH.h, transform: `perspective(${PERSP}px) rotateX(${rx}deg) rotateY(${ry}deg)` }}
        >
          <div style={{ position: "absolute", inset: 0, borderRadius: PH.r, background: P.ink }} />
          <div style={{ position: "absolute", left: BEZ, top: BEZ, width: SCR.w, height: SCR.h, borderRadius: SCR.r, overflow: "hidden", background: P.app }}>{screen}</div>
        </div>,
      );
  }

  // the hook pieces (bars 1–3) and their coloured outlines
  HOOK.forEach((p, i) => {
    if (f < p.draw || f > B(9) + 12) return;
    const ps = hookPose(p, i, f);
    if (ps.gone) return;
    const pv = hookPose(p, i, f - 1);
    const pts = garmentPts(p.id, ps.x, ps.y, ps.h, ps.rot);
    const isLeggings = i === 2;
    const drawn = expoOut(tw(f, p.draw, 7));
    if (ps.popped && f < B(9)) {
      const w = ps.h * pieceAspect(p.id);
      const drain = isLeggings ? crit(tw(f, B(8), 8)) : 0; // the leggings drain to their outline
      world.push(
        <SpeedBlur key={`hp${i}`} name={`hp${i}`} vx={ps.x - pv.x} vy={ps.y - pv.y}>
          <div style={{ position: "absolute", left: ps.x - w / 2, top: ps.y - ps.h / 2, width: w, height: ps.h, transform: `rotate(${ps.rot}deg)`, clipPath: drain > 0 ? `inset(${drain * 100}% 0 0 0)` : undefined }}>
            <Img src={src(p.id, "cutout")} style={{ width: w, height: ps.h }} />
          </div>
        </SpeedBlur>,
      );
    }
    // the outline: drawn on the photo, then it rides the piece; the sage one becomes the grid (bar 3)
    if (isLeggings && f >= B(9)) {
      const t = expoInOut(tw(f, B(9), 10));
      const from = garmentPts(p.id, ...((): [number, number, number, number] => {
        const q = hookPose(p, i, B(9));
        return [q.x, q.y, q.h, q.rot];
      })());
      const to = alongPolyline(latticeVerts(CY), N);
      svg.push(<path key="morph" d={toPath(lerpPts(from, to, t), t < 0.98)} fill="none" stroke={mix(P.camel, P.white, t)} strokeWidth={lerp(5, 9, t)} strokeLinejoin="round" />);
    } else if (f < B(8) + 9.5 || isLeggings) {
      const L = polyLen(pts);
      svg.push(<path key={`ho${i}`} d={toPath(pts)} fill="none" stroke={p.color} strokeWidth={6} strokeLinejoin="round" strokeDasharray={drawn < 1 ? `${drawn * L} ${L}` : undefined} />);
    }
  });

  // the grid itself, once the outline has become it; it thins into the scan's own gutters as the tiles flip
  if (f >= B(9) + 10 && f < B(11) + 14) {
    const v = latticeVerts(CY);
    const sw = lerp(9, 2, expoInOut(tw(f, B(11), 12)));
    if (f < B(11) + 13) svg.push(<path key="lattice" d={toPath(v, false)} fill="none" stroke={P.white} strokeWidth={sw} strokeLinejoin="miter" />);
  }

  // bar 2: the words, behind the pieces; bar 3: they collapse into one line
  if (f >= B(4) && f < B(10)) {
    const tc = expoInOut(tw(f, B(8), 7));
    const tm = expoInOut(tw(f, B(8) + 2, 9));
    LINES.forEach((ln, i) => {
      const cyLine = ln.y + TYPE_SIZE * 0.53;
      const by = lerp(cyLine, LINE_Y, tm);
      const x0 = lerp(TYPE_X, LINE_X[0], tm);
      const x1 = lerp(TYPE_X + ln.w, LINE_X[1], tm);
      if (tc < 1)
        world.push(
          <div
            key={`ln${i}`}
            style={{
              position: "absolute",
              left: TYPE_X,
              top: ln.y,
              fontFamily: GEIST,
              fontSize: TYPE_SIZE,
              letterSpacing: "-0.035em",
              lineHeight: 1.02,
              whiteSpace: "nowrap",
              transformOrigin: `0px ${TYPE_SIZE * 0.53}px`,
              transform: `translate(${x0 - TYPE_X}px, ${by - cyLine}px) scale(${(x1 - x0) / ln.w}, ${1 - tc})`,
            }}
          >
            {ln.parts.map((p, k) => (
              <RiseText key={k} text={p.t} size={TYPE_SIZE} at={p.at} color={p.c} f={f} />
            ))}
          </div>,
        );
      if (tc > 0) {
        const hgt = 6 * Math.min(1, tc * 1.6);
        svg.push(<rect key={`bar${i}`} x={x0} y={by - hgt / 2} width={x1 - x0} height={hgt} fill={i === 2 && tm < 1 ? P.denim : P.ink} />);
      }
    });
  }

  // the line wraps the card and thickens into the phone
  if (f >= B(10) && f < B(11)) {
    const pts = roundedRect(PH.x + BEZ / 2, LINE_Y, PH.w - BEZ, PH.h - BEZ, PH.r - BEZ / 2, 400);
    const L = polyLen(pts);
    const a = lerp((LINE_X[1] - LINE_X[0]) / 2, L / 2, expoInOut(tw(f, B(10), 9)));
    const sw = lerp(6, BEZ, crit(tw(f, B(10.5), 6)));
    svg.push(<path key="wrap" d={toPath(pts)} fill="none" stroke={P.ink} strokeWidth={sw} strokeDasharray={a * 2 >= L - 0.5 ? undefined : `${a} ${L - 2 * a} ${a} 0`} />);
  }

  // bar 7: her pieces rise out of the screen, a row a beat; bar 8: the camera passes them
  const pieces3d: React.ReactNode[] = [];
  if (f >= B(24) && f < B(28) + 11) {
    const posOf = (p: (typeof RISE)[number], i: number, ff: number) => {
      const { rx, ry } = orbit(ff);
      const lt = crit(tw(ff, B(24 + p.row), 12));
      const [x0, y0, x1, y1] = p.box;
      const cx = (x0 + x1) / 2;
      const cy = (y0 + y1) / 2;
      const ax = cx + (cx - 660) * 0.5 * lt;
      const ay = cy + (60 - p.row * 90) * lt;
      const z = lt * (300 + ((i * 7) % 3) * 110);
      // depth makes them nearer (bigger), but only a little of the tilt's parallax, so they stay in frame
      const q0 = project(ax, ay, 0, rx, ry);
      const qz = project(ax, ay, z, rx, ry);
      const q = { x: q0.x + (qz.x - q0.x) * 0.25, y: q0.y + (qz.y - q0.y) * 0.4, k: qz.k };
      const e = expoIn(tw(ff, B(28), 10));
      return { x: 540 + (q.x - 540) * (1 + 2.6 * e), y: CY + (q.y - CY) * (1 + 2.6 * e), k: q.k * (1 + 2.2 * e) * (1 + 0.95 * lt), lt };
    };
    RISE.forEach((p, i) => {
      if (f < B(24 + p.row)) return;
      const a = posOf(p, i, f);
      const b = posOf(p, i, f - 1);
      const [x0, y0, x1, y1] = p.box;
      const asp = pieceAspect(p.id);
      const bw = (x1 - x0) * K;
      const bh = (y1 - y0) * K;
      const h0 = Math.min(bh, bw / asp);
      const h = h0 * a.k;
      const w = h * asp;
      const rot = (p.col - 1) * 7 * a.lt + Math.sin(f / 13 + i) * 2 * a.lt;
      pieces3d.push(
        <SpeedBlur key={`r${i}`} name={`r${i}`} vx={a.x - b.x} vy={a.y - b.y}>
          <Img src={src(p.id, "cutout")} style={{ position: "absolute", left: a.x - w / 2, top: a.y - h / 2, width: w, height: h, transform: `rotate(${rot}deg)` }} />
        </SpeedBlur>,
      );
    });
  }

  // the denim jacket: last out of the Wardrobe, to the front, then it collapses into the star (bar 8)
  let jacketWorld: { x: number; y: number; h: number; rot: number } | null = null;
  if (f >= B(27) && f < B(28) + 13) {
    const at = (ff: number) => {
      const { rx, ry } = orbit(ff);
      const s = project(660, 2760, 140, rx, ry);
      const t = crit(tw(ff, B(27), 11));
      return { x: lerp(s.x, JACKET_END.x, t), y: lerp(s.y, JACKET_END.y, t), h: lerp(260 * s.k, JACKET_END.h, t), rot: lerp(-10, 0, t) };
    };
    jacketWorld = at(Math.min(f, B(28)));
    const prev = at(Math.min(f - 1, B(28)));
    const id = g("jacket-denim");
    if (f < B(28)) {
      const w = jacketWorld.h * pieceAspect(id);
      pieces3d.push(
        <SpeedBlur key="jk" name="jk" vx={jacketWorld.x - prev.x} vy={jacketWorld.y - prev.y}>
          <Img src={src(id, "cutout")} style={{ position: "absolute", left: jacketWorld.x - w / 2, top: jacketWorld.y - jacketWorld.h / 2, width: w, height: jacketWorld.h, transform: `rotate(${jacketWorld.rot}deg)` }} />
        </SpeedBlur>,
      );
    } else {
      // B28: a denim fill rises through the jacket, then its outline collapses into the star
      const fill = expoOut(tw(f, B(28), 4));
      const mt = expoInOut(tw(f, B(28) + 2, 11));
      const from = garmentPts(id, jacketWorld.x, jacketWorld.y, jacketWorld.h, jacketWorld.rot);
      const starW = STAR_S.map(([x, y]) => [540 + (x - 540) / gz, CY + (y - CY) / gz] as Pt);
      const pts = lerpPts(from, starW, mt);
      const w = jacketWorld.h * pieceAspect(id);
      if (mt < 0.05)
        pieces3d.push(
          <div key="jk" style={{ position: "absolute", left: jacketWorld.x - w / 2, top: jacketWorld.y - jacketWorld.h / 2, width: w, height: jacketWorld.h, transform: `rotate(${jacketWorld.rot}deg)` }}>
            <Img src={src(id, "cutout")} style={{ width: w, height: jacketWorld.h }} />
          </div>,
        );
      pieces3d.push(
        <svg key="jks" width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <clipPath id={`${sky}-fill`}>
            <rect x={0} y={jacketWorld.y + jacketWorld.h / 2 - jacketWorld.h * fill} width={1080} height={1920} />
          </clipPath>
          <path d={toPath(pts)} fill={mix(P.denim, P.ink, mt)} clipPath={mt < 0.05 ? `url(#${sky}-fill)` : undefined} />
        </svg>,
      );
    }
  }

  // ═══ bar 8: the end title, in screen space ═══
  const end: React.ReactNode[] = [];
  if (f >= B(28) + 13) {
    const drift = (1 + 0.014 * tw(f, B(28) + 13, 36)) * (1 + 0.006 * crit(tw(f, B(30), 8)) + 0.006 * crit(tw(f, B(31), 8)));
    const through = expoIn(tw(f, B(31.5), 6));
    const S = drift * (1 + 22 * through);
    const tf = (x: number, y: number, s = S) => `translate(${STAR_C[0]}px, ${STAR_C[1]}px) scale(${s}) translate(${-STAR_C[0]}px, ${-STAR_C[1]}px)`;
    // the mark: two pens draw its outline from the star, then it fills from the centre out
    const pen = expoInOut(tw(f, B(28.5), 9));
    const fillR = 260 * expoOut(tw(f, B(28.5) + 6, 7));
    const markPath = toPath(MARK_OUT);
    end.push(
      <svg key="mark" width={1080} height={1920} style={{ position: "absolute", inset: 0, transformOrigin: "0 0", transform: tf(0, 0), overflow: "visible" }}>
        <clipPath id={`${sky}-iris`}>
          <circle cx={STAR_C[0]} cy={STAR_C[1]} r={fillR} />
        </clipPath>
        {/* the mark without its star: the star is drawn (and morphs) on its own, below */}
        <mask id={`${sky}-nostar`} maskUnits="userSpaceOnUse" x={-4000} y={-4000} width={9080} height={9920}>
          <rect x={-4000} y={-4000} width={9080} height={9920} fill="#fff" />
          <path d={toPath(STAR_S)} fill="#000" stroke="#000" strokeWidth={2} />
        </mask>
        {fillR > 0.5 ? (
          <g mask={`url(#${sky}-nostar)`}>
            <path d={markPath} fill={P.ink} clipPath={`url(#${sky}-iris)`} />
          </g>
        ) : null}
        {fillR < 259 ? <path d={markPath} fill="none" stroke={P.ink} strokeWidth={2.2 / S} strokeDasharray={`${(pen * MARK_LEN) / 2} ${MARK_LEN / 2 - (pen * MARK_LEN) / 2}`} /> : null}
      </svg>,
    );
    // the words
    const word = (text: string, size: number, y: number, at: number, weight: number, key: string) => (
      <div key={key} style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transformOrigin: "0 0", transform: tf(0, 0) }}>
        <div style={{ position: "absolute", left: 0, width: 1080, top: y, textAlign: "center", fontFamily: GEIST, fontSize: size, letterSpacing: size > 80 ? "-0.035em" : "-0.01em", lineHeight: 1.02, whiteSpace: "nowrap" }}>
          <RiseText text={text} size={size} at={at} color={P.ink} f={f} weight={weight} />
        </div>
      </div>
    );
    end.push(word("Curate", 120, 950, B(29), 500, "w1"));
    end.push(word("On the App Store", 46, 1092, B(29.5), 500, "w2"));
    // Zee
    if (f >= B(30)) {
      const up = crit(tw(f, B(30), 10));
      const zs = 460;
      end.push(
        <div key="zee" style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transformOrigin: "0 0", transform: tf(0, 0) }}>
          <SpeedBlur name="zee" vx={0} vy={820 * (crit(tw(f - 1, B(30), 10)) - up)}>
            <Img src={zeeSrc(f - B(30))} style={{ position: "absolute", left: 540 - zs / 2, top: 1110 + (1 - up) * 820, width: zs, height: zs }} />
          </SpeedBlur>
        </div>,
      );
    }
    // the star: through it, back to the first frame
    const st = expoInOut(tw(f, B(31.5), 447 - B(31.5)));
    const starNow = scaleAbout(STAR_S, STAR_C, drift);
    const pts = lerpPts(starNow, CARD_PTS, st);
    const iris = 1500 * expoOut(tw(f, B(31.5), 5));
    if (f < 447) {
      end.push(
        <svg key="star" width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          <path d={toPath(pts)} fill={P.ink} />
        </svg>,
      );
      if (iris > 0.5)
        end.push(
          <div key="through" style={{ position: "absolute", inset: 0, clipPath: `circle(${iris}px at ${STAR_C[0]}px ${STAR_C[1]}px)` }}>
            <div style={{ position: "absolute", inset: 0, clipPath: `path('${toPath(pts)}')` }}>
              <div style={{ position: "absolute", left: SCR.x, top: top(CY_HOOK), width: SCR.w, height: SCR.h, overflow: "hidden" }}>
                <Photo id={HOOK[0].photo} posX={HOOK[0].posX} />
              </div>
            </div>
          </div>,
        );
    }
  }

  const loopCard = f >= 447;
  return (
    <AbsoluteFill style={{ background: P.white, overflow: "hidden" }}>
      {!loopCard ? (
        <div style={{ position: "absolute", inset: 0, transformOrigin: `540px ${CY}px`, transform: `scale(${gz})` }}>
          {world}
          <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
            {svg}
          </svg>
          {pieces3d}
        </div>
      ) : null}
      {!loopCard ? end : null}
      {loopCard ? (
        <div style={{ position: "absolute", inset: 0, transformOrigin: `540px ${CY}px`, transform: `scale(1)` }}>
          <Card cy={CY_HOOK}>
            <Photo id={HOOK[0].photo} posX={HOOK[0].posX} />
          </Card>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

export const PopOutV2: React.FC<Props> = ({ track, fromSec, volume, sfxVolume, samples }) => {
  useBrandFonts();
  return (
    <AbsoluteFill style={{ background: P.white }}>
      <Audio src={src(track)} trimBefore={Math.round(fromSec * FPS)} volume={(fr) => volume * Math.min(1, (LAST - fr) / 4)} />
      {has(SFX) ? <Audio src={src(SFX)} volume={sfxVolume} /> : null}
      <SubframeBlur samples={samples} shutter={0.5}>
        <Scene />
      </SubframeBlur>
    </AbsoluteFill>
  );
};
