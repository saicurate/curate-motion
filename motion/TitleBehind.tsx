import React from "react";
import { TypeOn, Words } from "./KineticType";

// TitleBehind: big words typed or risen BEHIND the subject (a piece, Zee, a cut-out person),
// the reference-reel look. The subject must be a cutout (transparent PNG / Zee frame) so the
// words read around it. Layering is the whole trick: title first, subject on top.

export const TitleBehind: React.FC<{
  text: string;
  at: number;
  size: number;
  mode?: "type" | "rise";
  /** Where the title block sits (absolute CSS). */
  titleStyle?: React.CSSProperties;
  color?: string;
  until?: number;
  /** The subject, drawn over the title. */
  children: React.ReactNode;
}> = ({ text, at, size, mode = "type", titleStyle, color, until, children }) => (
  <>
    {mode === "type" ? (
      <TypeOn text={text} at={at} size={size} color={color} until={until} style={titleStyle} />
    ) : (
      <Words text={text} at={at} size={size} color={color} exitAt={until} style={titleStyle} />
    )}
    {children}
  </>
);
