import { useThree } from "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import React, { useEffect, useMemo, useState } from "react";
import { useDelayRender, useVideoConfig } from "remotion";
import * as THREE from "three";
import { src } from "./assets";

// DepthPhoto: a still photo that comes alive in 2.5D, free (decisions/0013). Each layer is a mesh displaced by
// its depth map (tools/photo3d: Depth Anything V2 Small → depth, BiRefNet → her cut-out, LaMa → the plate
// behind her), seen by a real perspective camera, so the room moves behind her with true parallax.
//
//   const rig = depthRig({ photo: { w: 1792, h: 2400 }, near: 1, far: 5 });
//   const cam = { dolly: 0.12 * u, x: 0.02 * u };                    // from t, in the ad
//   <DepthPhoto rig={rig} camera={cam} layers={[{ key: "plate", image: { id: PLATE }, depth: { id: PLATE, role: "depth" } }]} />
//   <div style={{ transform: rigCss(rig, cam, W, H).plane(2.2) }}>title BEHIND her</div>        // an HTML layer at depth 2.2
//   <DepthPhoto rig={rig} camera={cam} layers={[{ key: "her", image: { id: CUT, role: "cutout" }, depth: { id: CUT, role: "depth" } }]} />
//
// The rest pose (camera at the origin, fov0) shows the photo exactly as shot, cover-fitted with `overscan`
// spare; every vertex sits on its pixel's view ray at its depth, so only a camera MOVE reveals 3D.
// Frame-pure: no clocks; every value comes from props. One <ThreeCanvas> per DepthPhoto, so the ad can stack
// HTML between layers (titles behind her, Zee in the room) and filter each canvas (defocus, grade) in CSS.
// Depth files are "rg16": 16-bit disparity packed in an RGB PNG (R = high byte, G = low byte; 65535 = nearest),
// decoded and bilinearly filtered in the vertex shader. Render with --gl=angle (WebGL on the GPU).

export type DepthRig = {
  /** The photo's pixel size (its aspect sets the mesh). */
  photo: { w: number; h: number };
  /** Disparity → distance: the nearest pixel is `near` scene units from the camera, the farthest `far`. */
  near: number;
  far: number;
  /** Spare picture around the frame at rest (1.08 = 8% more than cover), so the camera can move. */
  overscan?: number;
  /** The rest pose's vertical field of view, degrees. */
  fov0?: number;
  /** Which part of the photo the rest framing shows: 0 = its left/top edge, 0.5 = centre, 1 = right/bottom. */
  align?: { x?: number; y?: number };
};

/** The virtual camera: truck (x), pedestal (y), dolly (forward, toward the scene), lens (fov), all in scene units / degrees. */
export type DepthCam = { x?: number; y?: number; dolly?: number; fov?: number };

export type DepthLayer = {
  key: string;
  image: { id: string; role?: string };
  depth: { id: string; role?: string };
  /** How much of the measured relief to keep: 1 = all, 0 = a flat card at `flatAt`. */
  relief?: number;
  /** The disparity (0..1) a flattened layer sits at (default 0.5). */
  flatAt?: number;
  /** Scene units added to every vertex's distance (negative = nearer). */
  push?: number;
  opacity?: number;
  /** Mesh columns (rows follow the aspect). */
  grid?: number;
  /** Move the layer as one object (a garment peeling off her), about a pivot at photo pixel `pivot`:
   *  x right, y up, z TOWARD the camera (scene units); rx, ry, rz degrees; scale. */
  move?: { pivot: [number, number]; x?: number; y?: number; z?: number; rx?: number; ry?: number; rz?: number; scale?: number };
  /** Colour: exposure (stops), saturation (1 = as shot), a multiply tint [r, g, b] 0..1. */
  exposure?: number;
  saturation?: number;
  tint?: [number, number, number];
  /** The grade: contrast (S-curve 0..1), warmth (−1..1), rolloff (highlight shoulder 0..1), fade (black lift 0..0.1). */
  grade?: Grade;
};

export type Grade = { contrast?: number; warmth?: number; rolloff?: number; fade?: number };
/** Curate's editorial warm-neutral grade for Emma's photos (decisions/0013). */
export const EDITORIAL: Grade = { contrast: 0.22, warmth: 0.3, rolloff: 0.55, fade: 0.018 };

const D2R = Math.PI / 180;

/** The rest framing in "tan units" (a view ray's x and y at distance 1). */
export const depthRig = (r: DepthRig) => r;
const frame = (r: DepthRig, W: number, H: number) => {
  const fov0 = r.fov0 ?? 30;
  const ty = Math.tan((fov0 * D2R) / 2);
  const tx = ty * (W / H);
  const ap = r.photo.w / r.photo.h;
  const k = ty * (r.overscan ?? 1.08) * Math.max(1, W / H / ap);
  const Px = k * ap;
  const Py = k;
  const cx = (0.5 - (r.align?.x ?? 0.5)) * 2 * (Px - tx);
  const cy = -(0.5 - (r.align?.y ?? 0.5)) * 2 * (Py - ty);
  return { fov0, ty, tx, Px, Py, cx, cy };
};

/** Disparity (0..1, 1 = nearest) → distance, the same curve the shader uses. */
export const depthOf = (r: DepthRig, disparity: number) => 1 / (1 / r.far + disparity * (1 / r.near - 1 / r.far));

/**
 * Where things land on the canvas for a camera: `plane(Z)` is the CSS transform (origin 0 0) that puts a
 * canvas-sized HTML layer, laid out at the rest pose, at distance Z; `photoPx(px, py)` is where a photo pixel
 * sits on the canvas at rest; `point(X, Y, Z)` moves a rest-pose canvas point at distance Z with the camera.
 */
export const rigCss = (r: DepthRig, cam: DepthCam, W: number, H: number) => {
  const F = frame(r, W, H);
  const f0 = H / 2 / F.ty;
  const fov = cam.fov ?? F.fov0;
  const f = H / 2 / Math.tan((fov * D2R) / 2);
  const d = cam.dolly ?? 0;
  const at = (Z: number) => {
    const s = (f / f0) * (Z / (Z - d));
    const tx = (-f * (cam.x ?? 0)) / (Z - d);
    const ty = (f * (cam.y ?? 0)) / (Z - d);
    return { s, tx, ty };
  };
  return {
    plane: (Z: number) => {
      const { s, tx, ty } = at(Z);
      return `matrix(${s}, 0, 0, ${s}, ${(W / 2) * (1 - s) + tx}, ${(H / 2) * (1 - s) + ty})`;
    },
    scaleAt: (Z: number) => at(Z).s,
    point: (X: number, Y: number, Z: number) => {
      const { s, tx, ty } = at(Z);
      return { x: W / 2 + s * (X - W / 2) + tx, y: H / 2 + s * (Y - H / 2) + ty, s };
    },
    photoPx: (px: number, py: number) => {
      const u = px / r.photo.w;
      const v = py / r.photo.h;
      const rx = F.cx + (u - 0.5) * 2 * F.Px;
      const ry = F.cy + (0.5 - v) * 2 * F.Py;
      return { x: W / 2 + rx * f0, y: H / 2 - ry * f0 };
    },
  };
};

const VERT = /* glsl */ `
uniform sampler2D uDepth;
uniform vec2 uDepthSize;
uniform float uInvNear, uInvFar, uRelief, uFlat, uPush;
uniform vec4 uFrame; // Px, Py, cx, cy
varying vec2 vUv;
float dec(vec2 uv) { vec4 c = texture2D(uDepth, uv); return (floor(c.r * 255.0 + 0.5) * 256.0 + floor(c.g * 255.0 + 0.5)) / 65535.0; }
float disparity(vec2 uv) {
  vec2 p = uv * uDepthSize - 0.5;
  vec2 i = floor(p);
  vec2 f = p - i;
  vec2 t = 1.0 / uDepthSize;
  float a = dec((i + vec2(0.5, 0.5)) * t), b = dec((i + vec2(1.5, 0.5)) * t);
  float c = dec((i + vec2(0.5, 1.5)) * t), d = dec((i + vec2(1.5, 1.5)) * t);
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
float distanceOf(float disp) { return 1.0 / (uInvFar + disp * (uInvNear - uInvFar)); }
void main() {
  vUv = uv;
  float z = mix(distanceOf(uFlat), distanceOf(disparity(uv)), uRelief) + uPush;
  vec3 ray = vec3(uFrame.z + (uv.x - 0.5) * 2.0 * uFrame.x, uFrame.w + (uv.y - 0.5) * 2.0 * uFrame.y, -1.0);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(ray * z, 1.0);
}`;

// The grade (the same on every layer of a photo, so they match): white balance, an S-curve, a soft highlight
// shoulder, a little black lift ("fade"), then saturation. Editorial warm-neutral = { contrast .25, warmth .35, rolloff .5, fade .02 }.
const FRAG = /* glsl */ `
uniform sampler2D uColor;
uniform float uOpacity, uExposure, uSaturation;
uniform vec3 uTint;
uniform vec4 uGrade; // contrast, warmth, rolloff, fade
varying vec2 vUv;
vec3 shoulder(vec3 x, float k) { vec3 e = exp(-2.0 * (x - k) / (1.0 - k)); vec3 th = (1.0 - e) / (1.0 + e); return mix(x, k + (1.0 - k) * th, step(k, x)); }
void main() {
  vec4 c = texture2D(uColor, vUv);
  vec3 rgb = c.rgb * exp2(uExposure) * uTint;
  rgb *= vec3(1.0 + 0.055 * uGrade.y, 1.0 + 0.012 * uGrade.y, 1.0 - 0.07 * uGrade.y);
  vec3 sc = clamp(rgb, 0.0, 1.0);
  rgb = mix(rgb, sc * sc * (3.0 - 2.0 * sc), uGrade.x);
  rgb = mix(rgb, shoulder(rgb, 0.72), uGrade.z);
  rgb = uGrade.w + rgb * (1.0 - uGrade.w);
  float l = dot(rgb, vec3(0.2126, 0.7152, 0.0722));
  rgb = mix(vec3(l), rgb, uSaturation);
  gl_FragColor = vec4(clamp(rgb, 0.0, 1.0), c.a * uOpacity);
}`;

type Loaded = { color: THREE.Texture; depth: THREE.Texture };

const useTextures = (layers: DepthLayer[]) => {
  const { delayRender, continueRender, cancelRender } = useDelayRender();
  const keys = layers.map((l) => `${l.image.id}#${l.image.role ?? "original"}|${l.depth.id}#${l.depth.role ?? "original"}`).join(";");
  const [hold] = useState(() => delayRender(`DepthPhoto textures ${keys.slice(0, 80)}`));
  const [tex, setTex] = useState<Record<string, Loaded> | null>(null);
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    const load = (url: string) => new Promise<THREE.Texture>((res, rej) => loader.load(url, res, undefined, rej));
    Promise.all(
      layers.map(async (l) => {
        const [color, depth] = await Promise.all([load(src(l.image.id, l.image.role ?? "original")), load(src(l.depth.id, l.depth.role ?? "original"))]);
        color.colorSpace = THREE.NoColorSpace; // pass the photo's sRGB values straight through (no tone mapping, no conversion)
        color.generateMipmaps = true;
        color.minFilter = THREE.LinearMipmapLinearFilter;
        color.magFilter = THREE.LinearFilter;
        color.anisotropy = 8;
        depth.colorSpace = THREE.NoColorSpace;
        depth.generateMipmaps = false;
        depth.minFilter = THREE.NearestFilter; // packed bytes: filtered by hand in the shader
        depth.magFilter = THREE.NearestFilter;
        return [l.key, { color, depth }] as const;
      }),
    )
      .then((pairs) => {
        setTex(Object.fromEntries(pairs));
        continueRender(hold);
      })
      .catch((e) => cancelRender(e));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keys]);
  return tex;
};

const LayerMesh: React.FC<{ l: DepthLayer; t: Loaded; rig: DepthRig; F: ReturnType<typeof frame>; order: number }> = ({ l, t, rig, F, order }) => {
  const cols = l.grid ?? 320;
  const rows = Math.round((cols * rig.photo.h) / rig.photo.w);
  const geo = useMemo(() => new THREE.PlaneGeometry(1, 1, cols, rows), [cols, rows]);
  const img = t.depth.image as { width: number; height: number };
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        uniforms: {
          uColor: { value: t.color },
          uDepth: { value: t.depth },
          uDepthSize: { value: new THREE.Vector2(img.width, img.height) },
          uInvNear: { value: 1 / rig.near },
          uInvFar: { value: 1 / rig.far },
          uRelief: { value: 1 },
          uFlat: { value: 0.5 },
          uPush: { value: 0 },
          uFrame: { value: new THREE.Vector4() },
          uOpacity: { value: 1 },
          uExposure: { value: 0 },
          uSaturation: { value: 1 },
          uTint: { value: new THREE.Vector3(1, 1, 1) },
          uGrade: { value: new THREE.Vector4(0, 0, 0, 0) },
        },
      }),
    [t, img.width, img.height, rig.near, rig.far],
  );
  const u = mat.uniforms;
  u.uRelief.value = l.relief ?? 1;
  u.uFlat.value = l.flatAt ?? 0.5;
  u.uPush.value = l.push ?? 0;
  u.uFrame.value.set(F.Px, F.Py, F.cx, F.cy);
  u.uOpacity.value = l.opacity ?? 1;
  u.uExposure.value = l.exposure ?? 0;
  u.uSaturation.value = l.saturation ?? 1;
  const tint = l.tint ?? [1, 1, 1];
  u.uTint.value.set(tint[0], tint[1], tint[2]);
  const gr = l.grade ?? {};
  u.uGrade.value.set(gr.contrast ?? 0, gr.warmth ?? 0, gr.rolloff ?? 0, gr.fade ?? 0);

  // the object move: about the pivot's 3D point (its ray at the layer's flat distance)
  const m = new THREE.Matrix4();
  if (l.move) {
    const mv = l.move;
    const z = 1 / (1 / rig.far + (l.flatAt ?? 0.5) * (1 / rig.near - 1 / rig.far)) + (l.push ?? 0);
    const pu = mv.pivot[0] / rig.photo.w;
    const pv = 1 - mv.pivot[1] / rig.photo.h;
    const P = new THREE.Vector3((F.cx + (pu - 0.5) * 2 * F.Px) * z, (F.cy + (pv - 0.5) * 2 * F.Py) * z, -z);
    const R = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler((mv.rx ?? 0) * D2R, (mv.ry ?? 0) * D2R, (mv.rz ?? 0) * D2R, "YXZ"));
    const S = new THREE.Matrix4().makeScale(mv.scale ?? 1, mv.scale ?? 1, mv.scale ?? 1);
    m.makeTranslation(P.x + (mv.x ?? 0), P.y + (mv.y ?? 0), P.z + (mv.z ?? 0))
      .multiply(R)
      .multiply(S)
      .multiply(new THREE.Matrix4().makeTranslation(-P.x, -P.y, -P.z));
  }
  const pos = new THREE.Vector3();
  const quat = new THREE.Quaternion();
  const scl = new THREE.Vector3();
  m.decompose(pos, quat, scl);
  return <mesh geometry={geo} material={mat} position={pos} quaternion={quat} scale={scl} renderOrder={order} frustumCulled={false} />;
};

const Rig: React.FC<{ rig: DepthRig; camera: DepthCam; layers: DepthLayer[]; tex: Record<string, Loaded>; W: number; H: number }> = ({ rig, camera, layers, tex, W, H }) => {
  const F = frame(rig, W, H);
  return (
    <>
      {layers.map((l, i) => (tex[l.key] ? <LayerMesh key={l.key} l={l} t={tex[l.key]} rig={rig} F={F} order={i} /> : null))}
      <CameraSync camera={camera} fov={camera.fov ?? F.fov0} W={W} H={H} />
    </>
  );
};

const CameraSync: React.FC<{ camera: DepthCam; fov: number; W: number; H: number }> = ({ camera, fov, W, H }) => {
  const cam = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  cam.fov = fov;
  cam.aspect = W / H;
  cam.near = 0.02;
  cam.far = 500;
  cam.position.set(camera.x ?? 0, camera.y ?? 0, -(camera.dolly ?? 0));
  cam.rotation.set(0, 0, 0);
  cam.updateProjectionMatrix();
  cam.updateMatrixWorld();
  return null;
};

export const DepthPhoto: React.FC<{
  rig: DepthRig;
  camera: DepthCam;
  /** Back to front, drawn in this order (painter's order, no depth test: each layer is one surface). */
  layers: DepthLayer[];
  /** CSS on the canvas wrapper: a defocus (filter: blur), a fade. */
  style?: React.CSSProperties;
  /** Supersampling (device pixel ratio), default 1.5: crisper edges on her hair. */
  quality?: number;
}> = ({ rig, camera, layers, style, quality = 1.5 }) => {
  const { width: W, height: H } = useVideoConfig();
  const tex = useTextures(layers);
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, pointerEvents: "none", ...style }}>
      <ThreeCanvas
        width={W}
        height={H}
        dpr={quality}
        gl={{ antialias: true, alpha: true, premultipliedAlpha: true, preserveDrawingBuffer: true }}
        camera={{ fov: rig.fov0 ?? 30, position: [0, 0, 0], near: 0.02, far: 500 }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.NoToneMapping;
          gl.outputColorSpace = THREE.LinearSRGBColorSpace; // no conversion: shaders write the photo's sRGB values as is
          gl.setClearColor(0x000000, 0);
        }}
      >
        {tex ? <Rig rig={rig} camera={camera} layers={layers} tex={tex} W={W} H={H} /> : null}
      </ThreeCanvas>
    </div>
  );
};
