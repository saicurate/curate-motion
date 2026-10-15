// A marketing persona's REAL Curate account, in two files:
//   library/people/<persona>/account.json        who the account is (email, uid, where the password lives)
//   library/people/<persona>/account-state.json  what is in it right now, mapped to library ids
// The password is NEVER in either file. It lives in AWS SSM Parameter Store as a SecureString at
// /curate/marketing/<persona>-password (us-east-1) and is read only by tools that sign in as her.
import { z } from "zod";
import { AssetId, SEGMENT } from "./asset.ts";

const Iso = z.string().regex(/^\d{4}-\d{2}-\d{2}(T[\d:.]+Z)?$/, "ISO date or UTC timestamp");

export const PersonaAccount = z
  .object({
    $schema: z.string().optional(),
    persona: z.string().regex(SEGMENT),
    displayName: z.string(),
    app: z.literal("curate-ios"),
    env: z.enum(["prod", "staging"]),
    /** The sign-in email. Required once the account exists. */
    email: z.email().optional(),
    signIn: z.enum(["email-password", "email-otp", "apple"]),
    /** Firebase uid, once created. */
    uid: z.string().optional(),
    username: z.string().optional(),
    /** Where the password lives: a NAME, never the value. */
    secret: z
      .object({
        store: z.enum(["aws-ssm", "gcp-secret-manager"]),
        name: z.string().regex(/^\/curate\/marketing\/[a-z0-9-]+-password$/, "SSM names look like /curate/marketing/<persona>-password"),
        region: z.string().default("us-east-1"),
      })
      .optional(),
    flags: z.object({ testAccount: z.boolean(), excludeFromAnalytics: z.boolean(), origin: z.enum(["ORGANIC", "SEED"]).default("ORGANIC") }),
    /** The test devices her footage is shot on (simulator UDIDs or device names). */
    devices: z.array(z.object({ id: z.string(), kind: z.enum(["simulator", "iphone"]), name: z.string() })).default([]),
    createdAt: Iso.optional(),
    status: z.enum(["planned", "active", "retired"]),
    notes: z.string().optional(),
  })
  .refine((a) => a.status !== "active" || (!!a.email && !!a.uid), { message: "an active account needs its email and uid", path: ["email"] })
  .refine((a) => a.signIn !== "email-password" || !!a.secret, { message: "email-password accounts need secret.name (the password lives in SSM)", path: ["secret"] });
export type PersonaAccount = z.infer<typeof PersonaAccount>;

/**
 * account-state.json: the mapping between library ids and what the app holds for her.
 * Written by tools/persona (and by any agent that changes her account by hand, which must
 * then record it here). The library manifests are the DESIRED state; this file is the ACTUAL.
 */
export const WardrobeLink = z.object({
  /** The library asset this came from: a garment (Add item / add-photo) or a camera-roll photo (gallery scan). Null when unknown. */
  libraryId: AssetId.nullable(),
  /** sha256 of the exact file that was sent, so a replaced asset is detectable. */
  sha256: z.string().regex(/^[a-f0-9]{64}$/).optional(),
  /** photoId sent with POST /api/v1/wardrobe/add-photo (tools/persona uses "cm:<libraryId>"); items come back with sourcePhotoId = this. */
  photoId: z.string().optional(),
  /** Wardrobe item ids in the app (one photo can yield several pieces). */
  appItemIds: z.array(z.string()),
  /** The app's name for the piece(s), for humans. */
  appNames: z.array(z.string()).default([]),
  via: z.enum(["api-add-photo", "app-add-item", "gallery-scan", "manual"]),
  /** pending = sent, items not back yet; synced = items exist; removed = deleted in the app; failed = see note. */
  status: z.enum(["pending", "synced", "removed", "failed"]),
  at: Iso,
  note: z.string().optional(),
});

export const AccountState = z.object({
  $schema: z.string().optional(),
  persona: z.string().regex(SEGMENT),
  uid: z.string(),
  env: z.enum(["prod", "staging"]),
  updatedAt: Iso,
  updatedBy: z.string(),
  wardrobe: z.array(WardrobeLink).default([]),
  /** Items in her account that no library asset accounts for (made in the app by hand, or by the scan). Never auto-deleted. */
  unmanaged: z.array(z.object({ appItemId: z.string(), appName: z.string().optional(), note: z.string().optional() })).default([]),
  /** What is loaded in each test device's Photos, by library id, in the order added. */
  cameraRoll: z
    .array(
      z.object({
        device: z.string(), // simulator UDID or device name
        libraryIds: z.array(AssetId),
        loadedAt: Iso,
        method: z.enum(["simctl-addmedia", "airdrop", "manual"]),
      }),
    )
    .default([]),
  /** Server-side spend caused by syncing (AI drawing per added piece), for the cost ledger. */
  spendUsd: z.number().nonnegative().default(0),
});
export type AccountState = z.infer<typeof AccountState>;
