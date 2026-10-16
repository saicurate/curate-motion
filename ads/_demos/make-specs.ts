#!/usr/bin/env node
// Write each demo's ad.json from concepts.ts (status draft, gate "explore").   node ads/_demos/make-specs.ts
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { assetsOf, DEMOS } from "./concepts.ts";

for (const c of DEMOS) {
  const spec = {
    $schema: "../../../catalog/schemas/ad.schema.json",
    id: c.id,
    title: `Demo ${c.n}: ${c.title}`,
    brief: `Rough concept animatic (pre-G2 exploration): judge the idea, the hook, the story and the transitions, not the polish. ${c.why}`,
    hook: c.hook,
    channels: ["tiktok", "reels"],
    formats: ["9x16"],
    lengths: [15],
    fps: 30,
    track: c.track,
    assets: assetsOf(c),
    components: ["ads/_demos/kit (BeatLabels, AiShot, Hook, MiniPhone, Close)", "springs", "Track", "ZeeActor"],
    status: "draft",
    gate: "explore",
    disclosures: ["Rough demo, not for posting. Grey 'AI VIDEO SHOT LATER' boxes are placeholders. Emma is an AI persona."],
    createdBy: { type: "agent", name: "claude-code (concept demos)", at: "2026-10-16" },
    notes: `Renders at 540×960 / 30 fps, ${c.lengthSec} s (the 15 s preset; metadata sets the real length): node ads/_demos/render.ts ${c.slug}. Temp music: ${c.trackNote}`,
    gateLog: [],
  };
  writeFileSync(join(import.meta.dirname, c.slug, "ad.json"), JSON.stringify(spec, null, 2) + "\n");
  console.log(`wrote ads/_demos/${c.slug}/ad.json (${spec.assets.length} assets)`);
}
