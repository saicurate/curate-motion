import React from "react";
import { AbsoluteFill } from "remotion";
import { Device, deviceLayout, GEIST, Grain, pieceAspect, StableImg, src } from "../../motion";

// S-V1 v2 (2026-10-24): the founder on v1, "feeling cheap… the colours please subtle colours". One quiet
// palette (each ground a low-saturation tone taken from its photo and pushed toward the Mist neutral, lit
// softly from above), ONE hero per screenshot (the phone, or her photo), lots of air, the phone the same
// size and place on every phone screenshot, her photo the same size and place on every photo screenshot,
// soft real shadows, nothing tilted. Grammar studied from the Essembl store set (inspo, never shipped):
// a calm ground, a centred two-line headline whose second line is a deep tone of the ground, real
// garments peeking out from BEHIND the phone (Apple's bezel takes nothing over it, no tilt, no crop, no
// added shadow).

const W = 1320;
const H = 2868;
const PHONE = { model: "iphone-17-pro-max", color: "silver" } as const;

/** The grounds and their deep tones (the headline's second line). */
const G = {
  oat: { ground: "#EEE8DF", deep: "#7C6A58" },
  blue: { ground: "#E2E7ED", deep: "#4D5E74" },
  stone: { ground: "#E9E3DB", deep: "#6F6457" },
  sage: { ground: "#E3E8DF", deep: "#56634E" },
  blush: { ground: "#F0E5E1", deep: "#7A5550" },
  sand: { ground: "#EDE5D9", deep: "#7A6A55" },
} as const;
type Tone = (typeof G)[keyof typeof G];
const INK = "#181818";

/** The ground: the tone under a soft key light from above, a touch deeper at the floor. */
const Ground: React.FC<{ t: Tone }> = ({ t }) => (
  <>
    <AbsoluteFill style={{ background: `linear-gradient(180deg, color-mix(in srgb, ${t.ground} 70%, white) 0%, ${t.ground} 42%, color-mix(in srgb, ${t.ground} 94%, black) 100%)` }} />
    <AbsoluteFill style={{ background: "radial-gradient(90% 45% at 50% 18%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 70%)" }} />
    <AbsoluteFill style={{ background: "radial-gradient(160% 110% at 50% 45%, rgba(0,0,0,0) 60%, rgba(40,30,20,0.06) 100%)" }} />
  </>
);

/** The centred two-line headline: line 1 in ink, line 2 in the ground's deep tone. */
const Headline: React.FC<{ a: string; b: string; t: Tone; top?: number }> = ({ a, b, t, top = 210 }) => (
  <div style={{ position: "absolute", left: 60, right: 60, top, textAlign: "center", fontFamily: GEIST, fontWeight: 500, fontSize: 138, lineHeight: 1.0, letterSpacing: "-0.05em" }}>
    <div style={{ color: INK }}>{a}</div>
    <div style={{ color: t.deep }}>{b}</div>
  </div>
);

/** The phone, the same on every phone screenshot: centred, its body 1720 tall, 130 above the bottom edge. */
const PHONE_BODY_H = 1720;
const phoneBox = () => {
  const width = (PHONE_BODY_H / deviceLayout({ ...PHONE, width: 100 }).body.h) * 100;
  const cy = H - 130 - PHONE_BODY_H / 2;
  return { width, cy, l: deviceLayout({ ...PHONE, width, x: W / 2, y: cy }) };
};
const Phone: React.FC<{ screen: string }> = ({ screen }) => {
  const { width, cy } = phoneBox();
  return <Device {...PHONE} width={width} x={W / 2} y={cy} screen={{ id: screen }} />;
};

/** Her photo, the same on every photo screenshot: centred, 1000 wide (3:4), its top on the phone's top line. */
const HERO = { w: 1000, top: 1010 };
const Photo: React.FC<{ id: string; x?: number; y?: number; w?: number; tag?: string; dark?: boolean }> = ({ id, x, y = HERO.top, w = HERO.w, tag, dark = false }) => {
  const h = (w * 2400) / 1792;
  const left = x ?? (W - w) / 2;
  return (
    <div
      style={{
        position: "absolute",
        left,
        top: y,
        width: w,
        height: h,
        borderRadius: w * 0.035,
        overflow: "hidden",
        boxShadow: `0 ${h * 0.004}px ${h * 0.012}px rgba(40,30,20,0.08), 0 ${h * 0.03}px ${h * 0.07}px rgba(40,30,20,0.14)`,
      }}
    >
      <StableImg src={src(id)} style={{ position: "absolute", inset: 0, width: w, height: h }} />
      {tag ? <Tag text={tag} dark={dark} x={w * 0.04} y={w * 0.04} size={Math.max(30, w * 0.04)} /> : null}
    </div>
  );
};

const Tag: React.FC<{ text: string; x: number; y: number; dark?: boolean; size?: number }> = ({ text, x, y, dark = false, size = 36 }) => (
  <div style={{ position: "absolute", left: x, top: y, padding: `${size * 0.34}px ${size * 0.66}px`, borderRadius: size, background: dark ? "rgba(24,24,24,0.82)" : "rgba(255,255,255,0.92)", color: dark ? "#FFFFFF" : INK, fontFamily: GEIST, fontWeight: 500, fontSize: size, lineHeight: 1, letterSpacing: "-0.01em" }}>{text}</div>
);

/** A real garment, centred on (cx, cy), `h` tall, with a soft shadow of its own (a prop, behind the phone). */
const Prop: React.FC<{ id: string; cx: number; cy: number; h: number }> = ({ id, cx, cy, h }) => {
  const w = h * pieceAspect(id);
  return (
    <div style={{ position: "absolute", left: cx - w / 2, top: cy - h / 2, width: w, height: h, filter: `drop-shadow(0 ${h * 0.03}px ${h * 0.05}px rgba(40,30,20,0.20)) drop-shadow(0 ${h * 0.005}px ${h * 0.01}px rgba(40,30,20,0.12))` }}>
      <StableImg src={src(id, "cutout")} style={{ position: "absolute", inset: 0, width: w, height: h }} />
    </div>
  );
};

/** A print of her photo standing behind the phone (straight, never tilted), soft shadow. */
const BackPrint: React.FC<{ id: string; x: number; y: number; w: number }> = ({ id, x, y, w }) => <Photo id={id} x={x} y={y} w={w} />;

const Line: React.FC<{ text: string; top: number; size?: number; color?: string }> = ({ text, top, size = 60, color = INK }) => (
  <div style={{ position: "absolute", left: 80, right: 80, top, textAlign: "center", fontFamily: GEIST, fontWeight: 500, fontSize: size, lineHeight: 1.2, letterSpacing: "-0.03em", color }}>{text}</div>
);

// ── the six ───────────────────────────────────────────────────────────────────────────────────────

const S1: React.FC = () => {
  const { l } = phoneBox();
  return (
    <>
      <Ground t={G.oat} />
      <Headline a="Always know" b="what to wear." t={G.oat} />
      {/* two pieces of the look on the screen, behind the phone's edges */}
      <Prop id="garment.emma.bag-tote-leather-black.v1" cx={l.body.x - 30} cy={1560} h={470} />
      <Prop id="garment.emma.loafers-black.v1" cx={l.body.x + l.body.w + 40} cy={2480} h={250} />
      <Phone screen="screenshot.emma.b284-studio-offduty-tryon.v1" />
    </>
  );
};

const S2: React.FC = () => {
  const { l } = phoneBox();
  return (
    <>
      <Ground t={G.blue} />
      <Headline a="Your closet," b="from your photos." t={G.blue} />
      {/* two of the photos the first rail came from, standing behind the phone */}
      <BackPrint id="photo.emma.r12-dumbo-walk.v1" x={36} y={1200} w={l.body.x + 150 - 36} />
      <BackPrint id="photo.emma.r26-ferry.v1" x={l.body.x + l.body.w - 150} y={2000} w={W - 36 - (l.body.x + l.body.w - 150)} />
      <Phone screen="screenshot.emma.b284-wardrobe-rails.v1" />
    </>
  );
};

const S3: React.FC = () => (
  <>
    <Ground t={G.stone} />
    <Headline a="See it" b="on you." t={G.stone} />
    <Photo id="photo.emma.r30-walk-to-work-tryon-tee-black.v1" tag="On you" dark />
    <Photo id="photo.emma.r30-walk-to-work.v1" x={96} y={2190} w={330} tag="Before" />
  </>
);

const WEEK = [
  ["Mon", "photo.emma.r12-dumbo-walk.v1"],
  ["Tue", "photo.emma.r30-walk-to-work.v1"],
  ["Wed", "photo.emma.r26-ferry.v1"],
  ["Thu", "photo.emma.r21-museum-steps.v1"],
  ["Fri", "photo.emma.r10-night-out.v1"],
  ["Sat", "photo.emma.r17-brunch.v1"],
  ["Sun", "photo.emma.r14-sunday-errands.v1"],
] as const;

const S4: React.FC = () => {
  // one quiet strip: seven tall slices of her days, the same size, side by side
  const n = WEEK.length;
  const gap = 14;
  const w = (W - 120 - gap * (n - 1)) / n;
  const h = 1560;
  const top = HERO.top + 20;
  return (
    <>
      <Ground t={G.sage} />
      <Headline a="A look for" b="every day." t={G.sage} />
      {WEEK.map(([day, id], i) => {
        const x = 60 + i * (w + gap);
        const ph = h; // the photo's height in the slice; its 3:4 width is wider than the slice, centred
        const pw = (ph * 1792) / 2400;
        return (
          <React.Fragment key={day}>
            <div style={{ position: "absolute", left: x, top, width: w, height: h, borderRadius: 22, overflow: "hidden", boxShadow: "0 6px 16px rgba(40,30,20,0.08), 0 30px 60px rgba(40,30,20,0.12)" }}>
              <StableImg src={src(id)} style={{ position: "absolute", left: (w - pw) / 2, top: 0, width: pw, height: ph }} />
            </div>
            <div style={{ position: "absolute", left: x, top: top + h + 34, width: w, textAlign: "center", fontFamily: GEIST, fontWeight: 500, fontSize: 40, letterSpacing: "-0.01em", color: G.sage.deep }}>{day}</div>
          </React.Fragment>
        );
      })}
    </>
  );
};

const S5: React.FC = () => (
  <>
    <Ground t={G.blush} />
    <Headline a="Ask" b="your stylist." t={G.blush} />
    <Line text="“What should I wear to dinner tonight?”" top={HERO.top - 180} size={62} color={G.blush.deep} />
    <Photo id="photo.emma.r24-dinner.v1" tag="Tonight" />
  </>
);

const Check: React.FC<{ color: string }> = ({ color }) => (
  <svg width={50} height={50} viewBox="0 0 56 56">
    <circle cx="28" cy="28" r="28" fill={color} />
    <path d="M16 29 L24.5 37 L40 20" stroke="#FFFFFF" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const S6: React.FC = () => {
  const w = 760; // the selfie, smaller, so the three lines sit with it on the page
  const h = (w * 2400) / 1792;
  return (
    <>
      <Ground t={G.sand} />
      <Headline a="Your photos," b="your call." t={G.sand} />
      <Photo id="photo.emma.r09-mirror-selfie-weekend.v1" x={(W - w) / 2} y={HERO.top - 40} w={w} />
      {/* the app's own three lines (its privacy shield), word for word */}
      {["You choose which photos", "We don’t sell your data", "Delete anytime"].map((t, i) => (
        <div key={t} style={{ position: "absolute", left: 0, right: 0, top: HERO.top - 40 + h + 110 + i * 120, display: "flex", justifyContent: "center", alignItems: "center", gap: 26 }}>
          <Check color={G.sand.deep} />
          <div style={{ fontFamily: GEIST, fontWeight: 500, fontSize: 58, letterSpacing: "-0.03em", color: INK }}>{t}</div>
        </div>
      ))}
    </>
  );
};

const V2: Record<number, React.FC> = { 1: S1, 2: S2, 3: S3, 4: S4, 5: S5, 6: S6 };

export const ShotV2: React.FC<{ shot: number }> = ({ shot }) => {
  const S = V2[shot] ?? S1;
  return (
    <AbsoluteFill style={{ background: G.oat.ground, overflow: "hidden" }}>
      <S />
      <Grain amount={0.022} />
    </AbsoluteFill>
  );
};

