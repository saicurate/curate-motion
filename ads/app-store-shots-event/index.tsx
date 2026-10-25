// app-store-shots-event: the Event Draw custom product page's four App Store screenshots (iPhone 6.9",
// 1320 × 2868). The booth's QR → the event's web page → this store page. The submitted O2 set's look exactly
// (ads/app-store-shots-v3, layout o2, blue, SemiBold): the blue linen, the two-tone headline, Curate's tilted
// 3D phone with a real screen, upright garments in one tidy row, never thrown or turned.
//
// Screens: the event draw probe on the 1.7.0 patch-1 code (closet words), the draw faked with the Dyson test
// event's prize photo (captures/b285-draw.json), and the main set's Studio try-on. The captions keep the prize
// generic ("Win the prize", no brand name); the prize shows only inside the real screen. Screenshot 4 carries
// the sweepstakes line (guideline 5.3).
import React from "react";
import { AbsoluteFill } from "remotion";
import { z } from "zod";
import { FormatId } from "../../schemas/ad";
import { GEIST, Grain, useBrandFonts } from "../../motion";
import { Ground, H, Headline, PALETTES, Pal, Phone, Row, W } from "../app-store-shots-v3";

export const SHOTS = [1, 2, 3, 4] as const;
export const schema = z.object({ format: FormatId, length: z.number(), shot: z.number().int().min(1).max(4), weight: z.union([z.literal(500), z.literal(600)]) });
export const defaults = { shot: 1, weight: 600 as const };

/** Each shot: its headline, its screen, the garments in its row (none: the phone alone, larger) and its tilt. */
const SET: Record<number, { a: string; b: string; size?: number; screen: string; row: string[]; tilt: number }> = {
  1: { a: "At a Curate event?", b: "Win the prize.", size: 132, screen: "screenshot.emma.b285-draw-waiting.v2", row: [], tilt: -1 },
  2: { a: "Add your clothes", b: "to your closet.", size: 140, screen: "screenshot.emma.b285-draw-wardrobe.v2", row: ["garment.emma.blazer-black.v2", "garment.emma.sweater-crewneck-navy.v2", "garment.emma.jeans-straight-light-wash.v2", "garment.emma.sneakers-leather-white.v1"], tilt: 1 },
  3: { a: "Do one try-on,", b: "see it on you.", screen: "screenshot.emma.b284-studio-offduty-tryon.v2", row: ["garment.emma.tee-black.v1", "garment.emma.bag-tote-leather-black.v1", "garment.emma.loafers-black.v1"], tilt: -1 },
  4: { a: "That’s it.", b: "You’re in the draw.", size: 126, screen: "screenshot.emma.b285-draw-youre-in.v2", row: [], tilt: 1 },
};

/** The sweepstakes line, small, under the last phone. */
const Rules: React.FC = () => {
  const p = React.useContext(Pal);
  return (
    <div style={{ position: "absolute", left: 80, right: 80, bottom: 96, textAlign: "center", fontFamily: GEIST, fontWeight: 500, fontSize: 40, lineHeight: 1.3, letterSpacing: "-0.01em", color: p.deep }}>
      Official rules in the app. Apple is not a sponsor.
    </div>
  );
};

export const AppStoreShotsEvent: React.FC<z.infer<typeof schema>> = ({ shot, weight }) => {
  useBrandFonts();
  const c = SET[shot] ?? SET[1];
  const p = PALETTES.blue;
  const ry = 14 * c.tilt;
  const rz = 4 * c.tilt;
  return (
    <Pal.Provider value={p}>
      <AbsoluteFill style={{ background: p.fill, overflow: "hidden", width: W, height: H }}>
        <Ground />
        <Headline a={c.a} b={c.b} weight={weight} size={c.size} />
        {c.row.length ? (
          // O2: the smaller tilted phone, and the garments in one tidy row under it.
          <>
            <Phone screen={c.screen} x={W / 2} y={1400} width={740} ry={ry} rz={rz} />
            <Row ids={c.row} baseline={2740} boxW={c.row.length > 3 ? 250 : 320} boxH={440} />
          </>
        ) : (
          // No row: the same phone, larger, a little lower (O1's), the screen's own words big enough to read.
          <Phone screen={c.screen} x={W / 2} y={shot === 4 ? 1640 : 1690} width={shot === 4 ? 900 : 960} ry={ry} rz={rz} />
        )}
        {shot === 4 ? <Rules /> : null}
        <Grain amount={0.016} />
      </AbsoluteFill>
    </Pal.Provider>
  );
};
