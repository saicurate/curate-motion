import React from "react";
import { AbsoluteFill, Img } from "remotion";
import { z } from "zod";
import { FormatId } from "../../schemas/ad";
import { C, Device, dims, GEIST, Piece, src, StableImg, useBrandFonts } from "../../motion";

// App Store screenshots, set S-V2 ("editorial"): six stills for iPhone 6.9" (1320 × 2868), one per `shot`.
// A bright magazine page: an oversized two-tone Geist headline (the key phrase Primary Black, the rest
// grey, as on the app's front door), big real photography of Emma, her own garments as cut-outs with
// their shadows, and the real build-284 screens in Apple's bezel (straight on, nothing over it). The
// colour is the photos'. Render frame 0 of `app-store-shots-v2--store-shot--6s` with props {"shot": n}.
//
//   1 Always know what to wear.      her look today: the photo, and the pieces laid out under it
//   2 Your closet, from your photos.  three photos, the three pieces they hold, her real Wardrobe
//   3 See it on you.                  before / on you, the tee, Studio's real try-on screen
//   4 A look for every day.           a week of her looks, Monday to Sunday
//   5 Ask your stylist.               her question, Zee's answer from her own wardrobe
//   6 Your photos stay yours.         her roll, the photos she chose, the app's three promises

export const schema = z.object({ format: FormatId, length: z.number(), shot: z.number().int().min(1).max(6) });
export const defaults = { shot: 1 };

const W = 1320;
const M = 96; // page margin
const CW = W - 2 * M; // content width
const GREY = C.t3; // the headline's second tone
const PHONE = { model: "iphone-17-pro-max", color: "silver" } as const;
const PRINT_SHADOW = "0 4px 10px rgba(16,20,24,0.06), 0 28px 60px rgba(16,20,24,0.12)";

type Tok = { t: string; key?: boolean };

/** The kicker (a magazine section line) and the two-tone headline, top left. */
const Head: React.FC<{ kicker: string; lines: Tok[][]; size?: number }> = ({ kicker, lines, size = 150 }) => (
  <div style={{ position: "absolute", left: M, top: 170, width: CW }}>
    <div style={{ fontFamily: GEIST, fontWeight: 600, fontSize: 30, letterSpacing: "0.18em", color: C.t3, textTransform: "uppercase" }}>{kicker}</div>
    <div style={{ marginTop: 34, fontFamily: GEIST, fontWeight: 500, fontSize: size, letterSpacing: "-0.045em", lineHeight: 0.98 }}>
      {lines.map((l, i) => (
        <div key={i} style={{ whiteSpace: "nowrap" }}>
          {l.map((w, j) => (
            <span key={j} style={{ color: w.key ? C.ink : GREY }}>
              {w.t}
            </span>
          ))}
        </div>
      ))}
    </div>
  </div>
);

/** A photo, cropped to its box like object-fit: cover around a focus point, as a lit print. */
const Photo: React.FC<{ id: string; x: number; y: number; w: number; h: number; fx?: number; fy?: number; r?: number; rot?: number; dim?: number; shadow?: boolean }> = ({
  id,
  x,
  y,
  w,
  h,
  fx = 0.5,
  fy = 0.5,
  r = 36,
  rot = 0,
  dim = 0,
  shadow = true,
}) => {
  const d = dims(id);
  const a = d.w / d.h;
  const iw = a > w / h ? h * a : w;
  const ih = a > w / h ? h : w / a;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, borderRadius: r, overflow: "hidden", transform: rot ? `rotate(${rot}deg)` : undefined, boxShadow: shadow ? PRINT_SHADOW : undefined, background: C.deskMid }}>
      <StableImg src={src(id)} style={{ position: "absolute", left: -(iw - w) * fx, top: -(ih - h) * fy, width: iw, height: ih }} />
      {dim > 0 ? <div style={{ position: "absolute", inset: 0, background: `rgba(255,255,255,${dim})` }} /> : null}
    </div>
  );
};

const Caps: React.FC<{ x: number; y: number; text: string; align?: "left" | "center"; w?: number; color?: string; size?: number }> = ({ x, y, text, align = "left", w, color = C.t3, size = 26 }) => (
  <div style={{ position: "absolute", left: align === "center" && w ? x - w / 2 : x, top: y, width: w, textAlign: align, fontFamily: GEIST, fontWeight: 600, fontSize: size, letterSpacing: "0.16em", color, textTransform: "uppercase", whiteSpace: "nowrap" }}>
    {text}
  </div>
);

/** A dark caps tag on a photo (never on the phone). */
const Tag: React.FC<{ x: number; y: number; text: string }> = ({ x, y, text }) => (
  <div style={{ position: "absolute", left: x, top: y, padding: "14px 24px", borderRadius: 40, background: C.ink, fontFamily: GEIST, fontWeight: 600, fontSize: 26, letterSpacing: "0.16em", color: C.card, textTransform: "uppercase", whiteSpace: "nowrap" }}>
    {text}
  </div>
);

const Small: React.FC<{ x: number; y: number; w: number; text: string }> = ({ x, y, w, text }) => (
  <div style={{ position: "absolute", left: x - w / 2, top: y, width: w, textAlign: "center", fontFamily: GEIST, fontWeight: 400, fontSize: 25, color: C.t2, whiteSpace: "nowrap" }}>{text}</div>
);

/** A garment standing on the page: its cut-out, `h` tall, its base at `base`. */
const Garment: React.FC<{ id: string; x: number; base: number; h: number; rot?: number; label?: string }> = ({ id, x, base, h, rot = 0, label }) => (
  <>
    <Piece id={id} x={x} y={base - h / 2} h={h} rot={rot} shadow={1.1} />
    {label ? <Small x={x} y={base + 34} w={300} text={label} /> : null}
  </>
);

const Paper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill style={{ background: `linear-gradient(180deg, ${C.card} 0%, ${C.card} 40%, ${C.ground} 100%)` }}>{children}</AbsoluteFill>
);

// ── 1 · Always know what to wear ─────────────────────────────────────────────
const S1: React.FC = () => (
  <Paper>
    <Head kicker="01 · Today" lines={[[{ t: "Always know" }], [{ t: "what to wear.", key: true }]]} />
    <Photo id="photo.emma.r12-dumbo-walk.v1" x={M} y={600} w={CW} h={1560} fx={0.5} fy={0.35} r={40} />
    <Caps x={M} y={2236} text="Today · from your wardrobe" />
    <Garment id="garment.emma.coat-wool-camel.v1" x={250} base={2720} h={420} label="Camel wool coat" />
    <Garment id="garment.emma.turtleneck-black.v1" x={530} base={2720} h={330} label="Black turtleneck" />
    <Garment id="garment.emma.jeans-straight-dark-wash.v1" x={800} base={2720} h={420} label="Dark-wash jeans" />
    <Garment id="garment.emma.boots-ankle-black.v1" x={1080} base={2720} h={230} label="Black ankle boots" />
  </Paper>
);

// ── 2 · Your closet, from your photos ────────────────────────────────────────
const S2: React.FC = () => (
  <Paper>
    <Head kicker="02 · Wardrobe" size={140} lines={[[{ t: "Your closet," }], [{ t: "from your photos.", key: true }]]} />
    <Photo id="photo.emma.r12-dumbo-walk.v1" x={M + 10} y={640} w={450} h={600} fx={0.5} fy={0.3} r={28} rot={-3} />
    <Photo id="photo.emma.r26-ferry.v1" x={M + 40} y={1270} w={450} h={600} fx={0.5} fy={0.35} r={28} rot={2.5} />
    <Photo id="photo.emma.r04-park-autumn.v1" x={M + 6} y={1900} w={450} h={600} fx={0.5} fy={0.35} r={28} rot={-1.5} />
    <Device {...PHONE} width={600} x={966} y={1540} screen={{ id: "screenshot.emma.b284-wardrobe-rails.v1" }} />
    <Garment id="garment.emma.coat-wool-camel.v1" x={750} base={2740} h={380} rot={-2} />
    <Garment id="garment.emma.jacket-denim.v1" x={975} base={2740} h={310} rot={2} />
    <Garment id="garment.emma.scarf-plaid-camel.v1" x={1180} base={2740} h={310} rot={-3} />
  </Paper>
);

// ── 3 · See it on you ───────────────────────────────────────────────────────
const S3: React.FC = () => (
  <Paper>
    <Head kicker="03 · Studio" lines={[[{ t: "See it " }, { t: "on you.", key: true }]]} size={160} />
    <Photo id="photo.emma.r30-walk-to-work-tryon-tee-black.v1" x={M} y={520} w={780} h={1860} fx={0.5} fy={0.45} r={40} />
    <Tag x={M + 36} y={556} text="On you" />
    <Photo id="photo.emma.r30-walk-to-work.v1" x={M - 40} y={2190} w={340} h={454} fx={0.5} fy={0.45} r={24} rot={-4} />
    <Caps x={M - 20} y={2690} text="Before" />
    <Device {...PHONE} width={500} x={1040} y={1330} screen={{ id: "screenshot.emma.b284-studio-offduty-tryon.v1" }} />
    <Garment id="garment.emma.tee-black.v1" x={1040} base={2690} h={340} rot={3} label="Your black tee" />
  </Paper>
);

// ── 4 · A look for every day ─────────────────────────────────────────────────
// Rows that read Monday to Sunday, left to right, top to bottom (coordinator, 2026-10-24: the masonry
// read "… Sun Fri Sat"). Mixed sizes by width: wide · narrow / three / narrow · wide.
const G = 24; // gutter
const ROW = [600, 600 + 660 + 56 + 20, 600 + 660 + 56 + 20 + 600 + 56 + 20]; // tops of the three rows
const WEEK: { day: string; id: string; x: number; w: number; y: number; h: number; fy?: number }[] = [
  { day: "Mon", id: "photo.emma.r05-office.v1", x: M, w: 640, y: ROW[0], h: 660, fy: 0.3 },
  { day: "Tue", id: "photo.emma.r23-rainy-day.v1", x: M + 640 + G, w: CW - 640 - G, y: ROW[0], h: 660, fy: 0.4 },
  { day: "Wed", id: "photo.emma.r16-bookstore.v1", x: M, w: (CW - 2 * G) / 3, y: ROW[1], h: 600, fy: 0.35 },
  { day: "Thu", id: "photo.emma.r22-stoop.v1", x: M + (CW - 2 * G) / 3 + G, w: (CW - 2 * G) / 3, y: ROW[1], h: 600, fy: 0.45 },
  { day: "Fri", id: "photo.emma.r10-night-out.v1", x: M + 2 * ((CW - 2 * G) / 3 + G), w: (CW - 2 * G) / 3, y: ROW[1], h: 600, fy: 0.45 },
  { day: "Sat", id: "photo.emma.r08-beach-day.v1", x: M, w: CW - 640 - G, y: ROW[2], h: 660, fy: 0.4 },
  { day: "Sun", id: "photo.emma.r28-couch-cozy.v1", x: M + CW - 640, w: 640, y: ROW[2], h: 660, fy: 0.42 },
];
const S4: React.FC = () => (
  <Paper>
    <Head kicker="04 · This week" lines={[[{ t: "A look for" }], [{ t: "every day.", key: true }]]} />
    {WEEK.map((d) => (
      <React.Fragment key={d.day}>
        <Photo id={d.id} x={d.x} y={d.y} w={d.w} h={d.h} fy={d.fy} r={26} />
        <Caps x={d.x + 4} y={d.y + d.h + 14} text={d.day} color={C.ink} size={30} />
      </React.Fragment>
    ))}
  </Paper>
);

// ── 5 · Ask your stylist ────────────────────────────────────────────────────
const Bubble: React.FC<{ x: number; y: number; w: number; text: string; zee?: boolean; align?: "left" | "right" }> = ({ x, y, w, text, zee = false, align = "left" }) => (
  <div style={{ position: "absolute", left: align === "left" ? x : undefined, right: align === "right" ? W - x : undefined, top: y, maxWidth: w }}>
    <div
      style={{
        fontFamily: GEIST,
        fontWeight: zee ? 500 : 400,
        fontSize: 46,
        lineHeight: 1.22,
        letterSpacing: "-0.01em",
        color: zee ? C.card : C.ink,
        background: zee ? C.ink : C.card,
        padding: "30px 40px",
        borderRadius: 48,
        boxShadow: "0 6px 18px rgba(16,20,24,0.10), 0 26px 60px rgba(16,20,24,0.12)",
      }}
    >
      {text}
    </div>
  </div>
);
const S5: React.FC = () => (
  <Paper>
    <Head kicker="05 · Your stylist" lines={[[{ t: "Ask your " }, { t: "stylist.", key: true }]]} size={156} />
    <Photo id="photo.emma.r24-dinner.v1" x={M} y={520} w={CW} h={1420} fx={0.5} fy={0.42} r={40} />
    <Bubble x={W - M - 40} y={1800} w={820} text="What should I wear to dinner tonight?" align="right" />
    <Img src={src("zee.happy.still.v1")} style={{ position: "absolute", left: M - 6, top: 2010, width: 150, height: 150 }} />
    <Bubble x={M + 160} y={2030} w={900} text="Your black satin cami, the camel midi skirt and your black heels." zee />
    <Garment id="garment.emma.camisole-satin-black.v1" x={420} base={2740} h={300} rot={-2} />
    <Garment id="garment.emma.skirt-midi-satin-camel.v1" x={720} base={2740} h={380} rot={1.5} />
    <Garment id="garment.emma.heels-black.v1" x={1010} base={2740} h={190} rot={-3} />
  </Paper>
);

// ── 6 · Your photos stay yours ───────────────────────────────────────────────
const ROLL = [
  "photo.emma.r01-coffee-shop.v1",
  "photo.emma.r03-brooklyn-street.v1",
  "photo.emma.r06-farmers-market.v1",
  "photo.emma.r07-rooftop-golden-hour.v1",
  "photo.emma.r13-winter-street.v1",
  "photo.emma.r17-brunch.v1",
  "photo.emma.r19-fall-game-day.v1",
  "photo.emma.r21-museum-steps.v1",
  "photo.emma.r22-stoop.v1",
  "photo.emma.r26-ferry.v1",
  "photo.emma.r04-park-autumn.v1",
  "photo.emma.r16-bookstore.v1",
];
const CHOSEN = new Set([1, 6, 9]);
const TILE = (CW - 2 * 20) / 3;
const Check: React.FC<{ x: number; y: number; d: number; dark?: boolean }> = ({ x, y, d, dark = true }) => (
  <svg style={{ position: "absolute", left: x, top: y, width: d, height: d }} viewBox="0 0 64 64">
    <circle cx="32" cy="32" r="30" fill={dark ? C.ink : C.card} />
    <path d="M19 33 L28 42 L46 23" fill="none" stroke={dark ? C.card : C.ink} strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const PROMISES = ["We don’t sell your data", "You choose which photos", "Delete anytime"]; // the app's privacy shield, word for word
const S6: React.FC = () => (
  <Paper>
    <Head kicker="06 · Privacy" lines={[[{ t: "Your photos" }], [{ t: "stay yours.", key: true }]]} />
    {ROLL.map((id, i) => {
      const x = M + (i % 3) * (TILE + 20);
      const y = 600 + Math.floor(i / 3) * (TILE * 1.12 + 20);
      const on = CHOSEN.has(i);
      return (
        <React.Fragment key={id}>
          <Photo id={id} x={x} y={y} w={TILE} h={TILE * 1.12} fy={0.3} r={22} dim={on ? 0 : 0.42} shadow={on} />
          {on ? <Check x={x + TILE - 84} y={y + 22} d={62} dark={false} /> : null}
        </React.Fragment>
      );
    })}
    {PROMISES.map((p, i) => (
      <React.Fragment key={p}>
        <Check x={M} y={2350 + i * 140} d={70} />
        <div style={{ position: "absolute", left: M + 106, top: 2350 + i * 140 + 4, fontFamily: GEIST, fontWeight: 500, fontSize: 56, letterSpacing: "-0.02em", color: C.ink, whiteSpace: "nowrap" }}>{p}</div>
      </React.Fragment>
    ))}
  </Paper>
);

const SHOTS: Record<number, React.FC> = { 1: S1, 2: S2, 3: S3, 4: S4, 5: S5, 6: S6 };

export const AppStoreShotsV2: React.FC<z.infer<typeof schema>> = ({ shot }) => {
  useBrandFonts();
  const S = SHOTS[shot] ?? S1;
  return <S />;
};
