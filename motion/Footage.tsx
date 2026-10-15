import React from "react";
import { OffthreadVideo, useVideoConfig } from "remotion";
import { src } from "./assets";

// Footage: a real app recording (footage.<persona>.<moment>.vN, 1320 x 2868 at 60 fps) by asset id,
// filling its parent (put it inside <PhoneFrame island={false}>, whose screen is the same 1320:2868).
// OffthreadVideo pulls the exact source frame for every output frame, so the 60 fps master stays
// crisp at 30 fps. Put it inside a <Sequence> that starts where the clip should start.

export const Footage: React.FC<{
  id: string;
  /** Seconds into the clip at the Sequence's first frame. */
  from?: number;
  /** Playback speed (1 = real speed). Speed ramps: split into two Sequences. */
  rate?: number;
  /** Zoom into the screen: scale about (ox, oy), fractions of the screen (a push-in on part of the UI). */
  zoom?: number;
  ox?: number;
  oy?: number;
  style?: React.CSSProperties;
}> = ({ id, from = 0, rate = 1, zoom = 1, ox = 0.5, oy = 0.5, style }) => {
  const { fps } = useVideoConfig();
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", ...style }}>
      <OffthreadVideo
        src={src(id)}
        muted
        trimBefore={Math.round(from * fps)}
        playbackRate={rate}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transformOrigin: `${ox * 100}% ${oy * 100}%`,
          transform: zoom !== 1 ? `scale(${zoom})` : undefined,
        }}
      />
    </div>
  );
};
