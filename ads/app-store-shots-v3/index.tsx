import React from "react";
import { AbsoluteFill } from "remotion";
import { z } from "zod";
import { FormatId } from "../../schemas/ad";
import { Device, GEIST, Grain, pieceAspect, StableImg, src, useBrandFonts } from "../../motion";

// S-V3 (2026-10-24): the founder picked Essembl's store set on the reference board ("I liked the theme of
// this but don't do editorial for me"). Its THEME, product-led, no magazine layouts and no model
// photography: a warm cream linen ground (Poly Haven's CC0 Rough Linen, recoloured), huge tight two-line
// headlines in two tones, a big phone tilted and running off the edge with the real build-284 screen on
// it, Emma's real wardrobe cut-outs in front of it with soft contact shadows, one idea per screenshot.
// Studied from inspo.competitor.essembl-redesign.v1, never copied: our words, our screens, our layouts.
//
// The phone is Curate's own generic 3D phone (Device variant "3d", decisions/0012): Apple's bezel may not
// be tilted, cropped, covered or shadowed, and those are exactly the theme's moves. It is not an iPhone and
// is never called one.
//
//   1 Today's look, already picked.     Today (the art fair look) + three of its pieces
//   2 Your closet, from your photos.    Wardrobe rails + the coat, jacket and scarf + two of her photos
//   3 See it on you, first.             Studio's board + her try-on in the black tee + the tee
//   4 Rain or shine, you're dressed.    Today on a rainy morning + the screen's own facts as chips
//   5 Your stylist, one message away.   Chat with Zee (her starters) + the pieces the starters name
//   6 Your photos, your call.           the app's own three privacy lines, three of her photos, chosen

export const SHOTS = [1, 2, 3, 4, 5, 6] as const;
// weight: the headline at Medium (500, the brand rule for titles) or SemiBold (600), to compare.
// palette: "cream" (the first S-V3) or "blue" (the founder, 2026-10-24: "can we make it to subtle blue?").
// layout: "scatter" (the first S-V3, garments thrown around the phone) or one of the six calmer options the
// founder asked to compare (2026-10-24: "the wardrobe items being thrown is not fine"; tilted phones are):
//   o1 phone only · o2 phone + one tidy row · o3 two phones · o4 phone + one upright hero · o5 big phone,
//   cropped by the bottom · o6 no phone, the app's own UI pieces as straight cards.
export const LAYOUTS = ["scatter", "o1", "o2", "o3", "o4", "o5", "o6"] as const;
export const schema = z.object({ format: FormatId, length: z.number(), shot: z.number().int().min(1).max(6), weight: z.union([z.literal(500), z.literal(600)]), palette: z.enum(["cream", "blue"]), layout: z.enum(LAYOUTS) });
export const defaults = { shot: 1, weight: 500 as const, palette: "cream" as const, layout: "scatter" as const };

export const W = 1320;
export const H = 2868;

/** The two palettes: the linen ground, ink, the headline's deep second tone, and the shadows' tint
 *  ("r,g,b": warm brown on cream, cool slate on blue). Garment colours are never touched. */
export const PALETTES = {
  cream: { ground: "stock.polyhaven.linen-cream-ground.v1", fill: "#F3EBE2", ink: "#1C1916", deep: "#6A5443", shade: "70,46,28", shade2: "50,32,20", chip: "28,25,22" },
  blue: { ground: "stock.polyhaven.linen-blue-ground.v1", fill: "#E6EDF5", ink: "#171B21", deep: "#33475E", shade: "28,42,62", shade2: "20,30,46", chip: "23,28,36" },
} as const;
type Palette = (typeof PALETTES)[keyof typeof PALETTES];
export const Pal = React.createContext<Palette>(PALETTES.cream);
export const usePal = () => React.useContext(Pal);
const CARD = "#FFFFFF";
const HDRI = "stock.polyhaven.hdri-studio-small-09.v1";

export const Ground: React.FC = () => <StableImg src={src(usePal().ground)} style={{ position: "absolute", inset: 0, width: W, height: H }} />;

/** The headline: two centred lines, ink then the deep tone, as big as the width allows. */
export const Headline: React.FC<{ a: string; b: string; weight: 500 | 600; size?: number; top?: number }> = ({ a, b, weight, size = 150, top = 176 }) => {
  const p = usePal();
  return (
    <div style={{ position: "absolute", left: 40, right: 40, top, textAlign: "center", fontFamily: GEIST, fontWeight: weight, fontSize: size, lineHeight: 1.0, letterSpacing: "-0.055em" }}>
      <div style={{ color: p.ink }}>{a}</div>
      <div style={{ color: p.deep }}>{b}</div>
    </div>
  );
};

/** The phone: Curate's generic 3D phone, graphite, lit by the studio HDRI, its own soft floor shadow. */
export const Phone: React.FC<{ screen: string; x: number; y: number; width?: number; rx?: number; ry?: number; rz?: number }> = ({ screen, x, y, width = 980, rx = 6, ry = -14, rz = -4 }) => (
  <Device
    variant="3d"
    model="phone-generic"
    color="graphite"
    screen={{ id: screen }}
    width={width}
    x={x}
    y={y}
    rotation={{ x: rx, y: ry, z: rz }}
    camera={{ fov: 16 }}
    shadow={0.42}
    floorGap={0.04}
    environment={{ id: HDRI, rotation: 120, intensity: 1.0 }}
    quality={2}
  />
);

/** A real wardrobe item, centred on (cx, cy), `h` px tall, turned `rot`°, with a soft contact shadow
 *  falling down-right from a key light above-left (it lies on the linen, in front of the phone). */
export const Item: React.FC<{ id: string; cx: number; cy: number; h: number; rot?: number }> = ({ id, cx, cy, h, rot = 0 }) => {
  const w = h * pieceAspect(id);
  const p = usePal();
  return (
    <div
      style={{
        position: "absolute",
        left: cx - w / 2,
        top: cy - h / 2,
        width: w,
        height: h,
        transform: `rotate(${rot}deg)`,
        filter: `drop-shadow(${h * 0.018}px ${h * 0.034}px ${h * 0.04}px rgba(${p.shade},0.26)) drop-shadow(${h * 0.004}px ${h * 0.008}px ${h * 0.008}px rgba(${p.shade2},0.22))`,
      }}
    >
      <StableImg src={src(id, "cutout")} style={{ position: "absolute", inset: 0, width: w, height: h }} />
    </div>
  );
};

/** One of her photos as a small mounted print (white border, soft shadow), turned `rot`°. */
const Print: React.FC<{ id: string; x: number; y: number; w: number; rot?: number; tag?: string }> = ({ id, x, y, w, rot = 0, tag }) => {
  const m = w * 0.045;
  const ih = ((w - 2 * m) * 2400) / 1792;
  const p = usePal();
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: ih + 2 * m, background: CARD, borderRadius: w * 0.03, transform: `rotate(${rot}deg)`, boxShadow: `0 ${w * 0.012}px ${w * 0.03}px rgba(${p.shade},0.14), 0 ${w * 0.05}px ${w * 0.1}px rgba(${p.shade},0.16)` }}>
      <div style={{ position: "absolute", left: m, top: m, width: w - 2 * m, height: ih, borderRadius: w * 0.018, overflow: "hidden" }}>
        <StableImg src={src(id)} style={{ position: "absolute", inset: 0, width: w - 2 * m, height: ih }} />
      </div>
      {tag ? <Chip text={tag} x={m + w * 0.04} y={m + w * 0.04} size={Math.max(30, w * 0.06)} dark /> : null}
    </div>
  );
};

/** A floating chip, as the app draws its own (white, Geist Medium), with a soft shadow. */
const Chip: React.FC<{ text: string; x: number; y: number; size?: number; dark?: boolean; rot?: number }> = ({ text, x, y, size = 50, dark = false, rot = 0 }) => {
  const p = usePal();
  return (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      padding: `${size * 0.42}px ${size * 0.78}px`,
      borderRadius: size * 2,
      background: dark ? `rgba(${p.chip},0.9)` : CARD,
      color: dark ? "#FFFFFF" : p.ink,
      fontFamily: GEIST,
      fontWeight: 500,
      fontSize: size,
      lineHeight: 1,
      letterSpacing: "-0.02em",
      whiteSpace: "nowrap",
      transform: `rotate(${rot}deg)`,
      boxShadow: `0 ${size * 0.08}px ${size * 0.2}px rgba(${p.shade},0.12), 0 ${size * 0.4}px ${size * 0.9}px rgba(${p.shade},0.16)`,
    }}
  >
    {text}
  </div>
  );
};

// ── the six ───────────────────────────────────────────────────────────────────────────────────────

type ShotProps = { weight: 500 | 600 };

const S1: React.FC<ShotProps> = ({ weight }) => (
  <>
    <Ground />
    <Headline a="Today’s look," b="already picked." weight={weight} />
    <Phone screen="screenshot.emma.b284-today-artfair.v1" x={700} y={1720} width={980} ry={-15} rz={-4} />
    {/* three pieces of that very look, on the linen in front of the phone, clear of its words */}
    <Item id="garment.emma.blazer-black.v2" cx={120} cy={1930} h={760} rot={-9} />
    <Item id="garment.emma.skirt-midi-satin-camel.v2" cx={1170} cy={2380} h={860} rot={8} />
    <Item id="garment.emma.boots-ankle-black.v2" cx={300} cy={2620} h={360} rot={-4} />
  </>
);

const S2: React.FC<ShotProps> = ({ weight }) => (
  <>
    <Ground />
    <Headline a="Your closet," b="from your photos." weight={weight} />
    {/* two of the photos her wardrobe came from, behind the phone */}
    <Print id="photo.emma.r12-dumbo-walk.v1" x={30} y={640} w={360} rot={-7} />
    <Print id="photo.emma.r26-ferry.v1" x={150} y={1010} w={330} rot={4} />
    <Phone screen="screenshot.emma.b284-wardrobe-rails.v2" x={740} y={1800} width={1000} ry={13} rz={4} />
    {/* the items those photos gave her, in front */}
    <Item id="garment.emma.coat-wool-camel.v3" cx={1170} cy={1400} h={1000} rot={7} />
    <Item id="garment.emma.jacket-denim.v3" cx={250} cy={2230} h={720} rot={-8} />
    <Item id="garment.emma.scarf-plaid-camel.v2" cx={1080} cy={2600} h={560} rot={10} />
  </>
);

const S3: React.FC<ShotProps> = ({ weight }) => (
  <>
    <Ground />
    <Headline a="See it on you," b="before you wear it." weight={weight} size={140} />
    <Phone screen="screenshot.emma.b284-studio-offduty-tryon.v2" x={570} y={1810} width={980} ry={-14} rz={-4} />
    {/* Studio's own try-on of that board, on her photo */}
    <Print id="photo.emma.r30-walk-to-work-tryon-tee-black.v1" x={830} y={960} w={470} rot={6} tag="On you" />
    <Item id="garment.emma.tee-black.v1" cx={1080} cy={2420} h={560} rot={9} />
  </>
);

const S4: React.FC<ShotProps> = ({ weight }) => (
  <>
    <Ground />
    <Headline a="Rain or shine," b="you’re dressed." weight={weight} />
    <Phone screen="screenshot.emma.b284-today-rain.v1" x={650} y={1810} width={1000} ry={14} rz={4} />
    {/* the screen's own facts, as chips beside it */}
    <Chip text="Rain till 4 pm" x={60} y={880} size={58} rot={-4} />
    <Chip text="54°" x={1030} y={1060} size={64} rot={5} />
    <Chip text="Covered" x={60} y={1560} size={58} dark rot={-3} />
    <Item id="garment.emma.coat-trench-khaki.v1" cx={1185} cy={1950} h={760} rot={7} />
    <Item id="garment.emma.boots-ankle-black.v2" cx={250} cy={2560} h={370} rot={-5} />
  </>
);

const S5: React.FC<ShotProps> = ({ weight }) => (
  <>
    <Ground />
    <Headline a="Your stylist," b="one message away." weight={weight} size={130} />
    <Phone screen="screenshot.emma.b284-chat-hello.v1" x={660} y={1800} width={1000} ry={-14} rz={-4} />
    {/* the pieces her starters name: the brown midi skirt, the black ankle boots */}
    <Item id="garment.emma.skirt-midi-satin-camel.v2" cx={1195} cy={1780} h={900} rot={8} />
    <Item id="garment.emma.boots-ankle-black.v2" cx={1050} cy={2600} h={360} rot={6} />
    <Item id="garment.emma.camisole-satin-black.v1" cx={170} cy={2380} h={520} rot={-8} />
  </>
);

const Tick: React.FC = () => (
  <svg width={58} height={58} viewBox="0 0 56 56">
    <circle cx="28" cy="28" r="28" fill={usePal().ink} />
    <path d="M16 29 L24.5 37 L40 20" stroke="#FFFFFF" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const S6: React.FC<ShotProps> = ({ weight }) => {
  const ink = usePal().ink;
  return (
  <>
    <Ground />
    <Headline a="Your photos," b="your call." weight={weight} />
    {/* three of her photos, the two she chose ticked: the app's own picker idea */}
    <Print id="photo.emma.r04-park-autumn.v1" x={40} y={690} w={480} rot={-7} />
    <Print id="photo.emma.r09-mirror-selfie-weekend.v1" x={410} y={620} w={500} rot={2} />
    <Print id="photo.emma.r17-brunch.v1" x={800} y={720} w={470} rot={7} />
    {[{ x: 820, y: 1300 }, { x: 1190, y: 1390 }].map((p, i) => (
      <div key={i} style={{ position: "absolute", left: p.x, top: p.y }}>
        <Tick />
      </div>
    ))}
    {/* the app's own three lines (its privacy shield), word for word */}
    {["You choose which photos", "We don’t sell your data", "Delete anytime"].map((t, i) => (
      <div key={t} style={{ position: "absolute", left: 0, right: 0, top: 1690 + i * 170, display: "flex", justifyContent: "center", alignItems: "center", gap: 30 }}>
        <Tick />
        <div style={{ fontFamily: GEIST, fontWeight: 500, fontSize: 70, letterSpacing: "-0.035em", color: ink }}>{t}</div>
      </div>
    ))}
    <StableImg src={src("brand.curate.logo-splash.v1")} style={{ position: "absolute", left: (W - 200 * (670 / 742)) / 2, top: 2330, width: 200 * (670 / 742), height: 200 }} />
  </>
  );
};

const BY_SHOT: Record<number, React.FC<ShotProps>> = { 1: S1, 2: S2, 3: S3, 4: S4, 5: S5, 6: S6 };

export const AppStoreShotsV3: React.FC<z.infer<typeof schema>> = ({ shot, weight, palette, layout }) => {
  useBrandFonts();
  const S = BY_SHOT[shot] ?? S1;
  const p = PALETTES[palette] ?? PALETTES.cream;
  return (
    <Pal.Provider value={p}>
      <AbsoluteFill style={{ background: p.fill, overflow: "hidden" }}>
        {layout && layout !== "scatter" ? <OptionShot layout={layout} shot={shot} weight={weight} /> : <S weight={weight} />}
        <Grain amount={0.016} />
      </AbsoluteFill>
    </Pal.Provider>
  );
};

// ── the six calmer layouts (2026-10-24) ──────────────────────────────────────────────────────────────
// Garments, wherever they appear, stand upright, aligned and evenly spaced with soft shadows: never tossed,
// rotated or laid over the phone. The phone is S-V3's tilted one where it suits; straight in o3 (two side by side).

const CAP = { w: 1206, h: 2622 }; // every build-284 capture (iPhone 17 Pro simulator, 3x)
const PHONE_AR = 2.13; // the generic phone's body, height ÷ width, facing the camera

/** The headlines, the same as S-V3, for every shot. */
const HEADS: Record<number, { a: string; b: string; size?: number }> = {
  1: { a: "Today’s look,", b: "already picked." },
  2: { a: "Your closet,", b: "from your photos." },
  3: { a: "See it on you,", b: "before you wear it.", size: 140 },
  4: { a: "Rain or shine,", b: "you’re dressed." },
  5: { a: "Your stylist,", b: "one message away.", size: 130 },
  6: { a: "Your photos,", b: "your call." },
};

/** Each shot's main screen, a second screen (o3), its look's garments (o2) and its one hero (o4). */
const CONTENT: Record<number, { screen: string; second: string; row: string[]; hero: string; tilt: number }> = {
  1: { screen: "screenshot.emma.b284-today-artfair.v1", second: "screenshot.emma.b284-chat-artfair-look.v1", row: ["garment.emma.blazer-black.v2", "garment.emma.camisole-satin-black.v1", "garment.emma.skirt-midi-satin-camel.v2", "garment.emma.boots-ankle-black.v2"], hero: "garment.emma.skirt-midi-satin-camel.v2", tilt: -1 },
  2: { screen: "screenshot.emma.b284-wardrobe-rails.v2", second: "screenshot.emma.b284-today-artfair.v1", row: ["garment.emma.coat-wool-camel.v3", "garment.emma.jacket-denim.v3", "garment.emma.scarf-plaid-camel.v2"], hero: "garment.emma.coat-wool-camel.v3", tilt: 1 },
  3: { screen: "screenshot.emma.b284-studio-offduty-tryon.v2", second: "screenshot.emma.b284-chat-artfair-look.v1", row: ["garment.emma.tee-black.v1", "garment.emma.bag-tote-leather-black.v1", "garment.emma.loafers-black.v1"], hero: "garment.emma.tee-black.v1", tilt: -1 },
  4: { screen: "screenshot.emma.b284-today-rain.v1", second: "screenshot.emma.b284-today-artfair.v1", row: ["garment.emma.coat-trench-khaki.v1", "garment.emma.jeans-straight-dark-wash.v1", "garment.emma.bag-tote-leather-black.v1", "garment.emma.boots-ankle-black.v2"], hero: "garment.emma.coat-trench-khaki.v1", tilt: 1 },
  5: { screen: "screenshot.emma.b284-chat-hello.v1", second: "screenshot.emma.b284-chat-artfair-look.v1", row: ["garment.emma.camisole-satin-black.v1", "garment.emma.skirt-midi-satin-camel.v2", "garment.emma.boots-ankle-black.v2"], hero: "garment.emma.skirt-midi-satin-camel.v2", tilt: -1 },
  6: { screen: "screenshot.emma.b284-chat-hello.v1", second: "screenshot.emma.b284-today-artfair.v1", row: [], hero: "", tilt: 1 },
};

/** A tidy row: the pieces upright on one baseline, centred in equal columns across [x0, x1], each fitted
 *  inside a box (boxW × boxH) at its own aspect, soft shadows. */
export const Row: React.FC<{ ids: string[]; baseline: number; boxW: number; boxH: number; x0?: number; x1?: number }> = ({ ids, baseline, boxW, boxH, x0 = 90, x1 = W - 90 }) => (
  <>
    {ids.map((id, i) => {
      const col = (x1 - x0) / ids.length;
      const ar = pieceAspect(id);
      const h = Math.min(boxH, boxW / ar);
      return <Item key={id} id={id} cx={x0 + col * (i + 0.5)} cy={baseline - h / 2} h={h} />;
    })}
  </>
);

/** A piece of the real app (a crop of a build-284 capture), as a straight white card with a soft shadow. */
const UiCard: React.FC<{ id: string; sx: number; sy: number; sw: number; sh: number; x: number; y: number; w: number; radius?: number; bare?: boolean }> = ({ id, sx, sy, sw, sh, x, y, w, radius = 46, bare = false }) => {
  const k = w / sw;
  const h = sh * k;
  const p = usePal();
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, borderRadius: radius, overflow: "hidden", background: bare ? "transparent" : CARD, boxShadow: `0 ${h * 0.012}px ${h * 0.03}px rgba(${p.shade},0.10), 0 26px 64px rgba(${p.shade},0.14)` }}>
      <StableImg src={src(id)} style={{ position: "absolute", left: -sx * k, top: -sy * k, width: CAP.w * k, height: CAP.h * k }} />
    </div>
  );
};

/** o6's cards per shot: [sx, sy, sw, sh] crops of that shot's capture, stacked down the page. */
const CARDS: Record<number, { id: string; crops: [number, number, number, number][]; bare?: number[] }> = {
  1: { id: "screenshot.emma.b284-today-artfair.v1", crops: [[0, 330, 1206, 170], [0, 720, 1206, 1390], [150, 2160, 1040, 180]], bare: [2] },
  2: { id: "screenshot.emma.b284-wardrobe-rails.v2", crops: [[0, 170, 1206, 360], [0, 560, 1206, 690], [0, 1320, 1206, 700]] },
  3: { id: "screenshot.emma.b284-studio-offduty-tryon.v2", crops: [[0, 170, 1206, 170], [24, 360, 1158, 1310], [0, 1780, 1206, 470]] },
  4: { id: "screenshot.emma.b284-today-rain.v1", crops: [[0, 330, 1206, 170], [0, 720, 1206, 1390], [150, 2160, 1040, 180]], bare: [2] },
  5: { id: "screenshot.emma.b284-chat-hello.v1", crops: [[0, 360, 1206, 620], [60, 1020, 1086, 660], [0, 1700, 1206, 180]] },
  6: { id: "screenshot.emma.b284-chat-hello.v1", crops: [[0, 360, 1206, 620]] },
};

/** Screenshot 6 in every calm layout: three of her photos upright in one row, the two she chose ticked, then
 *  the app's own three privacy lines and the logo. */
const CalmS6: React.FC<{ weight: 500 | 600 }> = ({ weight }) => {
  const ink = usePal().ink;
  const pw = 360;
  const xs = [90, 480, 870];
  return (
    <>
      <Ground />
      <Headline a="Your photos," b="your call." weight={weight} />
      <Print id="photo.emma.r04-park-autumn.v1" x={xs[0]} y={760} w={pw} />
      <Print id="photo.emma.r09-mirror-selfie-weekend.v1" x={xs[1]} y={760} w={pw} />
      <Print id="photo.emma.r17-brunch.v1" x={xs[2]} y={760} w={pw} />
      {[xs[1], xs[2]].map((x) => (
        <div key={x} style={{ position: "absolute", left: x + pw / 2 - 29, top: 760 + 500 }}>
          <Tick />
        </div>
      ))}
      {["You choose which photos", "We don’t sell your data", "Delete anytime"].map((t, i) => (
        <div key={t} style={{ position: "absolute", left: 0, right: 0, top: 1560 + i * 170, display: "flex", justifyContent: "center", alignItems: "center", gap: 30 }}>
          <Tick />
          <div style={{ fontFamily: GEIST, fontWeight: 500, fontSize: 70, letterSpacing: "-0.035em", color: ink }}>{t}</div>
        </div>
      ))}
      <StableImg src={src("brand.curate.logo-splash.v1")} style={{ position: "absolute", left: (W - 200 * (670 / 742)) / 2, top: 2290, width: 200 * (670 / 742), height: 200 }} />
    </>
  );
};

const OptionShot: React.FC<{ layout: string; shot: number; weight: 500 | 600 }> = ({ layout, shot, weight }) => {
  const head = HEADS[shot] ?? HEADS[1];
  const c = CONTENT[shot] ?? CONTENT[1];
  if (shot === 6) return <CalmS6 weight={weight} />;
  const ry = 14 * c.tilt;
  const rz = 4 * c.tilt;
  const body = (() => {
    switch (layout) {
      case "o1": // one tilted phone, large, whole, nothing else
        return <Phone screen={c.screen} x={W / 2} y={1690} width={960} ry={ry} rz={rz} />;
      case "o2": { // a smaller tilted phone, and the look's garments in one tidy row under it
        return (
          <>
            <Phone screen={c.screen} x={W / 2} y={1400} width={740} ry={ry} rz={rz} />
            <Row ids={c.row} baseline={2740} boxW={c.row.length > 3 ? 250 : 320} boxH={440} />
          </>
        );
      }
      case "o3": // two straight phones, staggered: the second a step lower and just over the first's edge
        return (
          <>
            <Phone screen={c.screen} x={370} y={1520} width={640} rx={0} ry={0} rz={0} />
            <Phone screen={c.second} x={W - 370} y={1930} width={640} rx={0} ry={0} rz={0} />
          </>
        );
      case "o4": { // a tilted phone and ONE garment standing upright beside it, on the phone's floor line
        const pw = 760;
        const px = c.tilt < 0 ? 460 : W - 460;
        const py = 1500;
        const floor = py + (pw * PHONE_AR) / 2;
        const hx = c.tilt < 0 ? 1075 : W - 1075;
        const ar = c.hero ? pieceAspect(c.hero) : 1;
        const hh = c.hero ? Math.min(900, 400 / ar) : 0;
        return (
          <>
            <Phone screen={c.screen} x={px} y={py} width={pw} ry={ry} rz={rz} />
            {c.hero ? <Item id={c.hero} cx={hx} cy={floor - hh / 2} h={hh} /> : null}
          </>
        );
      }
      case "o5": // one big tilted phone, cropped clean by the bottom edge
        return <Phone screen={c.screen} x={W / 2} y={1880} width={1120} ry={ry * 0.7} rz={rz * 0.7} />;
      case "o6": { // no phone: the app's own pieces, straight cards down the page
        const cards = CARDS[shot] ?? CARDS[1];
        const x = 80;
        const w = W - 2 * x;
        const gap = 44;
        const total = cards.crops.reduce((t, [, , sw, sh], i) => t + sh * ((cards.bare?.includes(i) ? w * (sw / 1206) : w) / sw), 0) + gap * (cards.crops.length - 1);
        let y = 600 + Math.max(0, (2780 - 600 - total) / 2);
        return (
          <>
            {cards.crops.map(([sx, sy, sw, sh], i) => {
              const bare = cards.bare?.includes(i) ?? false;
              const cw = bare ? w * (sw / 1206) : w;
              const el = <UiCard key={i} id={cards.id} sx={sx} sy={sy} sw={sw} sh={sh} x={bare ? x + (w - cw) / 2 : x} y={y} w={cw} bare={bare} radius={bare ? 60 : 46} />;
              y += sh * (cw / sw) + gap;
              return el;
            })}
          </>
        );
      }
      default:
        return null;
    }
  })();
  return (
    <>
      <Ground />
      <Headline a={head.a} b={head.b} weight={weight} size={head.size} />
      {body}
    </>
  );
};
