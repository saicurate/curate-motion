// motion/: Curate's reusable Remotion components. Ads import from here, never from each other.
// Each component is listed with what it does in motion/README.md.
export { asset, dims, frameCount, frameSrc, has, src } from "./assets";
export { beatClock, clockFor, type BeatClock } from "./BeatClock";
export { FORMATS, LENGTHS, useFrameBox, type FormatId } from "./formats";
export { planScenes, type Planned, type Scene } from "./lengths";
export { C, clamp, display, GEIST, inOut, out, shadow, snap, useBrandFonts } from "./theme";

export { PhoneFrame, PHONE_RATIO, projectOnPhone, type PhonePose } from "./PhoneFrame";
export { EMOTIONS, ZeeActor, zeeFrame, zeeId, type Emotion, type ZeeCue } from "./ZeeActor";
export { Slam, TypeOn, Words } from "./KineticType";
export { PopOut, popCurve } from "./PopOut";
export { TitleBehind } from "./TitleBehind";
export { Flash, FlashPrint, printLand } from "./FlashPrint";
export { ScanDots, traceAt, traceFilter } from "./ScanTrace";
export { Ellipse } from "./Ellipse";
export { StrokeFrame } from "./StrokeFrame";
export { WhipPan } from "./WhipPan";
export { ClosetReveal } from "./ClosetReveal";
export { Look, Piece, pieceAspect, pieceName, place, type LookPiece, type Role } from "./Piece";
export { EndCard, Ground, Logo, Star, Track } from "./Stage";
