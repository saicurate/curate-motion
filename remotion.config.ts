/**
 * Remotion CLI config (Studio, `npx remotion render`, `npx remotion compositions`).
 * The Node APIs ignore this file; tools/render.ts passes the same options itself.
 * All options: https://remotion.dev/docs/config
 */
import { existsSync } from "node:fs";
import { Config } from "@remotion/cli/config";

// Ads live in ads/, registered by ads/index.ts.
Config.setEntryPoint("./ads/index.ts");
// The library IS the public dir: staticFile("zee/excited/loop.v1/0001.webp") -> library/zee/...
// Code never calls staticFile with a raw path; it goes through motion/assets.ts by asset id.
// tools/render.ts stages only an ad's own assets into .stage/<ad>/ and passes --public-dir,
// so a render never copies the whole library into the bundle.
Config.setPublicDir("./library");
Config.setRspack(true);
// The bundled headless shell never fires requestAnimationFrame on the founder's Mac, so render with the installed Chrome.
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
if (existsSync(CHROME)) Config.setBrowserExecutable(CHROME); // CI uses the bundled headless shell
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setDefaultPremountInSeconds(2);
