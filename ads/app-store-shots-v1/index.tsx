import React from "react";
import { AbsoluteFill } from "remotion";
import { z } from "zod";
import { FormatId } from "../../schemas/ad";
import { ContactShadow, Device, deviceLayout, GEIST, Grain, pieceAspect, StableImg, src, useBrandFonts, Vignette } from "../../motion";
import { ShotV2 } from "./v2";

// S-V1 "colour campaign": six App Store screenshots (iPhone 6.9", 1320 × 2868), one outcome each, in the
// colourful header's world (A2): fields sampled from Emma's own photos and deepened into lit campaign
// colour, her real photos as prints, her real wardrobe cut-outs with real shadows, the real build-284
// screens in Apple's bezel (straight on, nothing over it), Geist Medium headlines.
//
//   1 Always know what to wear.   her, dressed (the Off-duty black look) + Studio showing that look
//   2 Your closet, from your photos.   three of her photos → the items in them → her Wardrobe
//   3 See it on you.   her photo before and after the black tee, the tee between them
//   4 A look for every day.   seven of her days, each on its own colour
//   5 Ask your stylist.   her question, the look that answers it, Zee small
//   6 Your photos, your call.   the app's own three privacy lines, her mirror selfie
//
// Colour is the founder's ask for the store set (2026-10-24: "a bit more colorful"); the app itself stays
// mono. The palette below is this set's, not motion/theme.ts's (the brand ramp stays there).

export const SHOTS = [1, 2, 3, 4, 5, 6] as const;
// version: "v1" the first colour campaign (kept); "v2" the subtle, one-hero redo (v2.tsx).
export const schema = z.object({ format: FormatId, length: z.number(), shot: z.number().int().min(1).max(6), version: z.enum(["v1", "v2"]) });
export const defaults = { shot: 1, version: "v1" as const };

const W = 1320;
const PHONE = { model: "iphone-17-pro-max", color: "silver" } as const;

/** The set's colours: sampled from her photos (DUMBO brick, ferry blue, park orange, dinner wine, night
 *  navy, brunch olive), deepened, plus the cream the phone sits on in A2. */
const P = {
  brick: "#9C4A36",
  blue: "#4F7FC9",
  orange: "#C2702A",
  wine: "#6B2E38",
  navy: "#24324D",
  olive: "#5F6B3C",
  sand: "#B98B5E",
  cream: "#F2ECE3",
  ink: "#181818",
  body: "#656565",
} as const;

/** A lit campaign field: the colour under a soft key light from above, falling off to the edges. */
const lit = (c: string) =>
  `radial-gradient(140% 70% at 50% 8%, color-mix(in srgb, ${c} 72%, white) 0%, ${c} 58%, color-mix(in srgb, ${c} 80%, black) 100%)`;

const Field: React.FC<{ c: string; floor?: number }> = ({ c, floor }) => (
  <>
    <AbsoluteFill style={{ background: lit(c) }} />
    {floor !== undefined ? (
      // the floor: the wall turns into a slightly darker floor, with a soft horizon (a studio sweep)
      <div style={{ position: "absolute", left: 0, right: 0, top: floor - 160, bottom: 0, background: `linear-gradient(180deg, rgba(0,0,0,0) 0px, rgba(20,12,8,0.10) 160px, rgba(20,12,8,0.16) 100%)` }} />
    ) : null}
    <Vignette strength={0.22} />
  </>
);

/** The headline: Geist Medium, two-tone (`*key*` full, the rest softer). */
const Headline: React.FC<{ text: string; y?: number; x?: number; size?: number; light?: boolean; width?: number }> = ({ text, y = 170, x = 96, size = 128, light = true, width = W - 192 }) => {
  const key = light ? "#FFFFFF" : P.ink;
  const rest = light ? "rgba(255,255,255,0.70)" : P.body;
  const lines = text.split("\n");
  return (
    <div style={{ position: "absolute", left: x, top: y, width, fontFamily: GEIST, fontWeight: 500, fontSize: size, lineHeight: 1.02, letterSpacing: "-0.042em" }}>
      {lines.map((ln, i) => (
        <div key={i}>
          {ln.split(/(\*[^*]+\*)/).filter(Boolean).map((seg, j) => (
            <span key={j} style={{ color: seg.startsWith("*") ? key : rest }}>
              {seg.replace(/\*/g, "")}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
};

/** The one line under a headline: what the outcome means, in plain words. */
const Sub: React.FC<{ text: string; y?: number; light?: boolean }> = ({ text, y = 472, light = true }) => (
  <div style={{ position: "absolute", left: 100, top: y, width: W - 200, fontFamily: GEIST, fontWeight: 500, fontSize: 52, lineHeight: 1.18, letterSpacing: "-0.02em", color: light ? "rgba(255,255,255,0.84)" : P.body }}>{text}</div>
);

/** One of her photos as a print: rounded, lit from above (an ambient and a key shadow). */
const Print: React.FC<{ id: string; x: number; y: number; w: number; rot?: number; aspect?: number; children?: React.ReactNode }> = ({ id, x, y, w, rot = 0, aspect = 1792 / 2400, children }) => {
  const h = w / aspect;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        borderRadius: w * 0.04,
        overflow: "hidden",
        transform: rot ? `rotate(${rot}deg)` : undefined,
        boxShadow: `0 ${h * 0.006}px ${h * 0.016}px rgba(20,14,10,0.16), 0 ${h * 0.04}px ${h * 0.1}px rgba(20,14,10,0.26)`,
      }}
    >
      <StableImg src={src(id)} style={{ position: "absolute", inset: 0, width: w, height: h }} />
      {children}
    </div>
  );
};

/** A garment cut-out, `h` tall, centred on (cx, cy), its own soft shadow and, with `ground`, one on the floor. */
const Item: React.FC<{ id: string; cx: number; cy: number; h: number; rot?: number; ground?: number; lift?: number }> = ({ id, cx, cy, h, rot = 0, ground, lift = 0.6 }) => {
  const w = h * pieceAspect(id);
  return (
    <>
      {ground !== undefined ? <ContactShadow x={cx} y={ground} w={w * 0.9} squash={0.14} opacity={0.34} lift={lift} /> : null}
      <div
        style={{
          position: "absolute",
          left: cx - w / 2,
          top: cy - h / 2,
          width: w,
          height: h,
          transform: rot ? `rotate(${rot}deg)` : undefined,
          filter: `drop-shadow(0 ${h * 0.025}px ${h * 0.04}px rgba(20,14,10,0.30)) drop-shadow(0 ${h * 0.004}px ${h * 0.008}px rgba(20,14,10,0.18))`,
        }}
      >
        <StableImg src={src(id, "cutout")} style={{ position: "absolute", inset: 0, width: w, height: h }} />
      </div>
    </>
  );
};

/** Her cut-out (a 1792 × 2400 frame), standing with her feet at (fx, fy), `h` tall from head to feet. */
const Person: React.FC<{ id: string; fx: number; fy: number; h: number; bbox: [number, number, number, number] }> = ({ id, fx, fy, h, bbox }) => {
  const [x0, y0, x1, y1] = bbox;
  const k = h / (y1 - y0);
  const left = fx - ((x0 + x1) / 2) * k;
  const top = fy - y1 * k;
  return (
    <>
      <ContactShadow x={fx} y={fy - 6} w={(x1 - x0) * k * 0.75} squash={0.12} opacity={0.5} />
      <div style={{ position: "absolute", left, top, width: 1792 * k, height: 2400 * k, filter: "drop-shadow(0 30px 40px rgba(20,12,8,0.22))" }}>
        <StableImg src={src(id)} style={{ position: "absolute", inset: 0, width: 1792 * k, height: 2400 * k }} />
      </div>
    </>
  );
};

/** The phone by its visible height, centred on cy, its whole bezel (buttons included) `right` px from the
 *  frame's right edge: Apple's bezel, straight on, never cropped, the real screen. */
const Phone: React.FC<{ screen: string; cy: number; bodyH: number; right?: number }> = ({ screen, cy, bodyH, right = 64 }) => {
  const width = (bodyH / deviceLayout({ ...PHONE, width: 100 }).body.h) * 100;
  const l = deviceLayout({ ...PHONE, width, x: 0, y: cy });
  const cx = W - right - (l.image.x + l.image.w);
  return <Device {...PHONE} width={width} x={cx} y={cy} screen={{ id: screen }} />;
};

/** A small label on a print ("Before", "Mon"). */
const Tag: React.FC<{ text: string; x: number; y: number; dark?: boolean; size?: number }> = ({ text, x, y, dark = false, size = 34 }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      padding: `${size * 0.32}px ${size * 0.62}px`,
      borderRadius: size,
      background: dark ? "rgba(24,24,24,0.82)" : "rgba(255,255,255,0.92)",
      color: dark ? "#FFFFFF" : P.ink,
      fontFamily: GEIST,
      fontWeight: 500,
      fontSize: size,
      letterSpacing: "-0.01em",
      lineHeight: 1,
    }}
  >
    {text}
  </div>
);

const R30_BBOX: [number, number, number, number] = [483, 630, 1197, 2246];

// ── the six ───────────────────────────────────────────────────────────────────────────────────────

const Shot1: React.FC = () => (
  <>
    <Field c={P.brick} floor={2500} />
    <Headline text={"Always know\n*what to wear.*"} />
    <Sub text="Today’s look, from your own clothes." />
    <Person id="photo.emma.r30-walk-to-work-tryon-tee-black-cutout.v1" fx={405} fy={2720} h={1720} bbox={R30_BBOX} />
    <Phone screen="screenshot.emma.b284-studio-offduty-tryon.v1" cy={1930} bodyH={1400} right={52} />
  </>
);

const Shot2: React.FC = () => (
  <>
    <Field c={P.blue} />
    <Headline text={"Your closet,\n*from your photos.*"} />
    <Sub text="Every item you wear, found in your photos." />
    <Print id="photo.emma.r26-ferry.v1" x={96} y={660} w={330} rot={-6} />
    <Print id="photo.emma.r04-park-autumn.v1" x={420} y={660} w={330} rot={5} />
    <Print id="photo.emma.r12-dumbo-walk.v1" x={250} y={710} w={350} rot={-1} />
    <Item id="garment.emma.coat-wool-camel.v1" cx={215} cy={1730} h={700} rot={-2} />
    <Item id="garment.emma.scarf-plaid-camel.v1" cx={395} cy={2150} h={480} rot={-6} />
    <Item id="garment.emma.jacket-denim.v1" cx={225} cy={2520} h={420} rot={3} />
    <Phone screen="screenshot.emma.b284-wardrobe-rails.v1" cy={2010} bodyH={1460} />
  </>
);

const Shot3: React.FC = () => (
  <>
    <Field c={P.orange} />
    <Headline text={"See it\n*on you.*"} />
    <Sub text="Try anything you own on your own photo." />
    <Print id="photo.emma.r30-walk-to-work.v1" x={86} y={780} w={600} rot={-4}>
      <Tag text="Before" x={36} y={36} />
    </Print>
    <Item id="garment.emma.tee-black.v1" cx={1030} cy={760} h={430} rot={10} />
    <Print id="photo.emma.r30-walk-to-work-tryon-tee-black.v1" x={500} y={1250} w={740} rot={3}>
      <Tag text="On you" x={40} y={40} dark />
    </Print>
  </>
);

const WEEK = [
  { day: "Mon", id: "photo.emma.r12-dumbo-walk.v1", c: P.brick },
  { day: "Tue", id: "photo.emma.r30-walk-to-work.v1", c: P.blue },
  { day: "Wed", id: "photo.emma.r26-ferry.v1", c: P.sand },
  { day: "Thu", id: "photo.emma.r21-museum-steps.v1", c: P.olive },
  { day: "Fri", id: "photo.emma.r10-night-out.v1", c: P.navy },
  { day: "Sat", id: "photo.emma.r17-brunch.v1", c: P.orange },
  { day: "Sun", id: "photo.emma.r14-sunday-errands.v1", c: P.wine },
] as const;

const Shot4: React.FC = () => {
  // two staggered columns of colour tiles, each holding one day's photo; the right column starts lower
  const tileW = 540;
  const tileH = 540;
  const gap = 30;
  const cols = [96, 96 + tileW + 48];
  const top = 520;
  return (
    <>
      <Field c={P.cream} />
      <Headline text={"A look for\n*every day.*"} light={false} />
      {WEEK.map((d, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = cols[col];
        const y = top + row * (tileH + gap) + (col === 1 ? tileH * 0.5 : 0);
        const pw = tileW - 72;
        return (
          <div key={d.day} style={{ position: "absolute", left: x, top: y, width: tileW, height: tileH, borderRadius: 36, background: lit(d.c), boxShadow: "0 18px 50px rgba(30,20,12,0.16)" }}>
            <div style={{ position: "absolute", left: 36, top: 30, fontFamily: GEIST, fontWeight: 500, fontSize: 46, letterSpacing: "-0.02em", color: d.c === P.sand || d.c === P.orange ? "rgba(255,255,255,0.96)" : "#FFFFFF" }}>{d.day}</div>
            <div style={{ position: "absolute", left: 36, top: 104, width: pw, height: tileH - 140, borderRadius: 24, overflow: "hidden", boxShadow: "0 10px 26px rgba(10,6,4,0.24)" }}>
              <StableImg src={src(d.id)} style={{ position: "absolute", left: 0, top: -(pw / (1792 / 2400) - (tileH - 140)) * 0.42, width: pw, height: pw / (1792 / 2400) }} />
            </div>
          </div>
        );
      })}
    </>
  );
};

const Shot5: React.FC = () => (
  <>
    <Field c={P.wine} />
    <Headline text={"*Ask*\nyour stylist."} />
    <div style={{ position: "absolute", left: 100, top: 470, width: W - 200, fontFamily: GEIST, fontWeight: 500, fontSize: 70, lineHeight: 1.12, letterSpacing: "-0.03em", color: "#FFFFFF" }}>
      “What should I wear
      <br />
      to dinner tonight?”
    </div>
    <Item id="garment.emma.camisole-satin-black.v1" cx={300} cy={1120} h={500} rot={-4} />
    <Item id="garment.emma.skirt-midi-satin-camel.v1" cx={300} cy={1790} h={800} rot={2} />
    <Item id="garment.emma.heels-black.v1" cx={330} cy={2420} h={360} rot={-6} />
    <Item id="garment.emma.bag-mini-black.v1" cx={1080} cy={2420} h={300} rot={7} />
    <Item id="garment.emma.earrings-hoops-gold.v1" cx={640} cy={2470} h={170} rot={-4} />
    <Print id="photo.emma.r24-dinner.v1" x={600} y={960} w={640} rot={3}>
      <Tag text="Tonight" x={36} y={36} />
    </Print>
    <div style={{ position: "absolute", left: 100, top: 2650, display: "flex", alignItems: "center", gap: 24 }}>
      <div style={{ width: 104, height: 104, borderRadius: 52, background: "rgba(255,255,255,0.92)", overflow: "hidden", position: "relative" }}>
        <StableImg src={src("zee.happy.still.v1")} style={{ position: "absolute", left: 6, top: 8, width: 92, height: 92 }} />
      </div>
      <div style={{ fontFamily: GEIST, fontWeight: 500, fontSize: 46, letterSpacing: "-0.02em", color: "rgba(255,255,255,0.9)" }}>Zee picks it from your own wardrobe.</div>
    </div>
  </>
);

const Check: React.FC<{ size?: number }> = ({ size = 56 }) => (
  <svg width={size} height={size} viewBox="0 0 56 56">
    <circle cx="28" cy="28" r="28" fill={P.ink} />
    <path d="M16 29 L24.5 37 L40 20" stroke="#FFFFFF" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Shot6: React.FC = () => (
  <>
    <Field c={P.cream} />
    <Headline text={"Your photos,\n*your call.*"} light={false} />
    <Print id="photo.emma.r09-mirror-selfie-weekend.v1" x={230} y={590} w={860} rot={-2} />
    {/* the app's own three lines (the privacy shield, gallery import), word for word */}
    {["You choose which photos", "We don’t sell your data", "Delete anytime"].map((t, i) => (
      <div key={t} style={{ position: "absolute", left: 150, top: 1910 + i * 175, display: "flex", alignItems: "center", gap: 34 }}>
        <Check />
        <div style={{ fontFamily: GEIST, fontWeight: 500, fontSize: 66, letterSpacing: "-0.03em", color: P.ink }}>{t}</div>
      </div>
    ))}
    {/* the sign-off: the splash lockup, as is (scaled only) */}
    <StableImg src={src("brand.curate.logo-splash.v1")} style={{ position: "absolute", left: (W - 190 * (670 / 742)) / 2, top: 2500, width: 190 * (670 / 742), height: 190 }} />
  </>
);

const BY_SHOT: Record<number, React.FC> = { 1: Shot1, 2: Shot2, 3: Shot3, 4: Shot4, 5: Shot5, 6: Shot6 };

export const AppStoreShotsV1: React.FC<z.infer<typeof schema>> = ({ shot, version }) => {
  useBrandFonts();
  if (version === "v2") return <ShotV2 shot={shot} />;
  const S = BY_SHOT[shot] ?? Shot1;
  return (
    <AbsoluteFill style={{ background: P.cream, overflow: "hidden" }}>
      <S />
      <Grain amount={0.035} />
    </AbsoluteFill>
  );
};
