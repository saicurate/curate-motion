#!/usr/bin/env node
// Skit "you're chopped": the designed sound, synthesised in code on the picture's clock (motion/sound). No stock or paid
// SFX; the same calls in the same order write the same bytes (seeded noise).
//
//   node ads/skit-chopped/sound.ts [out.wav]        (default: .cache/skit-chopped-sound.wav)
//   tools/catalog add <out.wav> --kind sfx --scope curate --name skit-chopped-sound --licence curate --tags ad=skit-chopped
//
// Message whoosh on every send, a soft pop when one of hers lands, a "seen" ding, key taps while he types, a clock tick
// under each "later" card, crickets under "nothing", the RECORD SCRATCH on "you're chopped" (a vinyl drag: a pitch dive
// of filtered noise and a dragged tone), a tap on the Curate result, the glide into the phone, an impact on the reveal.
import { createSound } from "../../motion/sound/index.ts";
import { T, TOTAL_SEC } from "./timeline.ts";

const s = createSound({ durationSec: TOTAL_SEC, seed: 0xc40bb3d });
const { voice, tone, noiseSweep, click, biquad, rnd, SR } = s;

/** The send whoosh: a short rising air move, then a soft click as the bubble lands. */
const send = (t: number, g = 1) => {
  noiseSweep(t - 0.12, 0.22, 900, 5200, 1.4, 0.34 * g, -0.2, 0.3, "bell");
  click(t + 0.08, 0.16 * g, 2600, 0.2);
};
/** One of hers arriving: a two-note soft pop. */
const receive = (t: number, g = 1) => {
  tone(t, 0.16, 660, 700, 0.003, 0.05, 0.22 * g, -0.1);
  tone(t + 0.07, 0.2, 990, 1040, 0.003, 0.06, 0.18 * g, -0.1);
};
/** "Seen": a small bright ding (two clean partials). */
const seen = (t: number, g = 1) => {
  tone(t, 0.5, 1568, 1568, 0.002, 0.16, 0.2 * g, 0.15);
  tone(t, 0.4, 2349, 2349, 0.002, 0.1, 0.09 * g, 0.15);
};
/** Thumbs on glass: n key taps from t0 to t1, the gaps uneven (seeded). */
const typing = (t0: number, t1: number, g = 1) => {
  let t = t0;
  let i = 0;
  while (t < t1) {
    click(t, 0.1 * g * (0.75 + 0.5 * Math.abs(rnd())), 3400 + 900 * rnd(), 0.05 * rnd());
    t += 0.075 + 0.05 * Math.abs(rnd());
    i++;
  }
  return i;
};
/** A clock tick-tock under a "later" card. */
const ticks = (t0: number, n: number, g = 1) => {
  for (let i = 0; i < n; i++) click(t0 + i * 0.33, 0.22 * g, i % 2 ? 1800 : 2400, i % 2 ? 0.25 : -0.25);
};
/** Crickets: pulsed chirps at ~4.6 kHz, in groups of three. */
const crickets = (t0: number, dur: number, g = 1) => {
  let ph = 0;
  voice(t0, dur, 0.35, 0.05 * g, (t) => {
    const group = (t * 2.4) % 1; // 2.4 groups a second
    const chirp = group < 0.36 ? Math.max(0, Math.sin(Math.PI * ((group * 3) % 1) * 1)) : 0;
    ph += (2 * Math.PI * 4600) / SR;
    const fade = Math.min(1, t / 0.12, (dur - t) / 0.2);
    return Math.sin(ph) * chirp * fade;
  });
};
/** The record scratch: a vinyl dragged back then forward (filtered noise + a dragged tone). */
const scratch = (t: number, g = 1) => {
  const bp = biquad("bp");
  let ph = 0;
  voice(t - 0.02, 0.42, 0, 0.9 * g, (u) => {
    // two strokes: back (pitch dives) and a short forward flick
    const a = u < 0.26 ? u / 0.26 : (u - 0.26) / 0.16;
    const back = u < 0.26;
    const f = back ? 1400 * Math.pow(0.18, a) + 140 : 260 + 900 * a;
    ph += (2 * Math.PI * f * 0.5) / SR;
    const e = back ? Math.sin(Math.PI * Math.min(1, a)) : Math.sin(Math.PI * Math.min(1, a)) * 0.7;
    const n = bp(rnd(), f * 2.2, 3.2) * 3.2;
    return Math.tanh(1.8 * (n * 0.8 + Math.sin(ph) * 0.35)) * e;
  });
};

// HEY
ticks(T.twoHours, 3);
typing(T.heyTypeFrom, T.heySent - 0.12);
send(T.heySent);
seen(T.heySeen);
ticks(T.oneDay, 2, 0.8);
ticks(T.twoDays, 2, 0.8);
crickets(T.facepalm, 1.0);
// HOW ARE YOU
ticks(T.twoMoreHours, 3);
typing(T.hayTypeFrom, T.haySent - 0.12);
send(T.haySent);
crickets(T.nothing2 - 0.1, 0.65, 0.9);
// HANDSOME
typing(T.handsomeTypeFrom, T.handsomeSent - 0.12, 1.1);
send(T.handsomeSent, 1.1);
seen(T.handsomeSeen);
// CHOPPED
ticks(T.twoDaysLater, 3);
scratch(T.chopped, 1);
receive(T.chopped + 0.02, 0.9);
s.hit("impact", T.jawDrop + 0.02, 0.5);
// CURATE
typing(T.searchTypeFrom, T.searchTypeTo, 0.9);
s.hit("tick", T.curateTap, 0.9);
s.hit("glide", T.app, 0.7);
s.hit("settle", T.app + 0.42, 0.6);
s.hit("swish", T.wardrobe, 0.35);
s.hit("swish", T.chat, 0.35);
// GLOW-UP
s.hit("impact", T.reveal, 0.8);
send(T.photoSent);
receive(T.herReply, 1);
seen(T.herReply + 0.12, 0.7);
s.hit("land", T.end + 0.2, 0.6);
s.hit("chime", T.end + 0.6, 0.7);

const out = process.argv[2] ?? ".cache/skit-chopped-sound.wav";
const norm = s.writeWav(out, { peakDb: -3 });
console.log(`wrote ${out}: ${TOTAL_SEC.toFixed(2)} s, peak normalised ×${norm.toFixed(3)}`);
