import { useThree } from "@react-three/fiber";
import { Video } from "@remotion/media";
import { ThreeCanvas } from "@remotion/three";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDelayRender, useRemotionEnvironment, useVideoConfig } from "remotion";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { HDRLoader } from "three/examples/jsm/loaders/HDRLoader.js";
import { asset, src } from "./assets";
import { device, type ScreenSource } from "./devices";

// Device3D: Curate's generic phone (device.curate.phone-generic.*, a GLB from tools/device/phone_generic.py)
// rendered with three.js inside <ThreeCanvas>: PBR metal and glass lit by a studio HDRI (reflections that
// travel across the glass as it turns), a soft floor shadow, and the app's real screen as a texture
// (footage frame-exact through @remotion/media's headless <Video>, or a screenshot).
// Frame-pure: no useFrame, no clocks. Every pose comes from props; animate them from useCurrentFrame().
// Use it through <Device variant="3d" …> (motion/Device.tsx). Render with --gl=angle (WebGL on the GPU).

export type Device3DOwnProps = {
  /** "phone-generic" (the only 3D model; there is no 3D iPhone: Apple forbids it). */
  model?: string;
  /** A colourway of the model: graphite, silver. */
  color?: string;
  /** What the screen shows (footage plays, a screenshot stays). */
  screen: ScreenSource;
  /** Width of the phone, px, when it faces the camera (sets the camera distance). */
  width?: number;
  /** Centre of the phone on the canvas, px. */
  x?: number;
  y?: number;
  scale?: number;
  opacity?: number;
  /** Degrees. y turns it left/right (orbit), x tips it back/forward (tilt), z rolls it. */
  rotation?: { x?: number; y?: number; z?: number };
  /** Vertical field of view, degrees: low = long-lens product look (default 18). */
  camera?: { fov?: number };
  /** Opacity of the soft floor shadow, 0 = none (default 0.5). */
  shadow?: number;
  /** Gap between the phone's bottom and the floor, as a fraction of its height (default 0.09). */
  floorGap?: number;
  /** The HDRI (asset id), its turn in degrees and its strength. */
  environment?: { id?: string; rotation?: number; intensity?: number };
  /** Canvas size (default: the composition's). */
  canvas?: { width: number; height: number };
  /** Supersampling (device pixel ratio), default 2. */
  quality?: number;
};

const D2R = Math.PI / 180;
type Way = { frame: string; back: string; roughness: number };

const makeMaterials = (way: Way) => ({
  Frame: new THREE.MeshPhysicalMaterial({ color: new THREE.Color(way.frame), metalness: 1, roughness: way.roughness, clearcoat: 0.25, clearcoatRoughness: 0.12 }),
  Back: new THREE.MeshPhysicalMaterial({ color: new THREE.Color(way.back), metalness: 0, roughness: 0.42, clearcoat: 0.6, clearcoatRoughness: 0.4 }),
  Border: new THREE.MeshPhysicalMaterial({ color: new THREE.Color("#030304"), metalness: 0, roughness: 0.1, clearcoat: 1, clearcoatRoughness: 0.03 }),
  // the cover glass: reflection only, ADDED over the lit screen (black base = no diffuse; the env gives the sheen)
  Cover: new THREE.MeshPhysicalMaterial({ color: new THREE.Color("#000000"), metalness: 0, roughness: 0.04, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, envMapIntensity: 0.6 }),
});

const Scene: React.FC<Device3DOwnProps & { cw: number; ch: number }> = (p) => {
  const { gl, scene, advance, invalidate } = useThree();
  const { isRendering } = useRemotionEnvironment();
  const { fps } = useVideoConfig();
  const { delayRender, continueRender, cancelRender } = useDelayRender();
  const rec = useMemo(() => device(p.model ?? "phone-generic", undefined, "3d"), [p.model]);
  const way = rec.colourways?.[p.color ?? rec.colour] ?? Object.values(rec.colourways ?? {})[0];
  if (!way) throw new Error(`Device3D: ${rec.id} has no colourway "${p.color}"`);
  const envId = p.environment?.id ?? rec.environment!;
  const [hold] = useState(() => delayRender(`Device3D: model, HDRI and screen for ${rec.id}`));
  const [model, setModel] = useState<THREE.Object3D | null>(null);
  const [env, setEnv] = useState<THREE.Texture | null>(null);
  const [screenTex, setScreenTex] = useState<THREE.Texture | null>(null);
  const isFootage = asset(p.screen.id).kind === "footage";

  // the model
  useEffect(() => {
    new GLTFLoader().load(src(rec.id), (g) => setModel(g.scene), undefined, (e) => cancelRender(e));
  }, [rec.id, cancelRender]);

  // the HDRI → a prefiltered environment for reflections
  useEffect(() => {
    new HDRLoader().load(
      src(envId),
      (tex) => {
        tex.mapping = THREE.EquirectangularReflectionMapping;
        const pm = new THREE.PMREMGenerator(gl);
        const t = pm.fromEquirectangular(tex).texture;
        tex.dispose();
        pm.dispose();
        setEnv(t);
      },
      undefined,
      (e) => cancelRender(e),
    );
  }, [envId, gl, cancelRender]);

  // the screen: a canvas the video draws into each frame, or a still image
  const [canvas] = useState(() => {
    const c = new OffscreenCanvas(rec.screen.w, rec.screen.h);
    const t = new THREE.CanvasTexture(c);
    return { c, ctx: c.getContext("2d")!, t };
  });
  useEffect(() => {
    const prep = (t: THREE.Texture) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.flipY = false; // glTF UVs: v = 0 is the top of the screen
      t.anisotropy = gl.capabilities.getMaxAnisotropy();
      t.generateMipmaps = true;
      t.minFilter = THREE.LinearMipmapLinearFilter;
      return t;
    };
    if (isFootage) {
      prep(canvas.t);
      return;
    }
    new THREE.TextureLoader().load(src(p.screen.id), (t) => setScreenTex(prep(t)), undefined, (e) => cancelRender(e));
  }, [isFootage, p.screen.id, canvas, gl, cancelRender]);
  const [firstVideoFrame, setFirstVideoFrame] = useState(false);
  const onVideoFrame = useCallback(
    (frame: CanvasImageSource) => {
      canvas.ctx.drawImage(frame, 0, 0, rec.screen.w, rec.screen.h);
      canvas.t.needsUpdate = true;
      setFirstVideoFrame(true);
      // the frame arrives after ThreeCanvas has drawn this frame: draw again, now (Remotion docs › video as three.js texture).
      // performance.now() only feeds R3F's own clock, which nothing here reads: every pose comes from props.
      if (isRendering) advance(performance.now());
      else invalidate();
    },
    [canvas, rec.screen.w, rec.screen.h, isRendering, advance, invalidate],
  );

  const mats = useMemo(() => makeMaterials(way), [way]);
  const blob = useMemo(() => {
    const c = new OffscreenCanvas(256, 256);
    const g = c.getContext("2d")!;
    const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    for (let i = 0; i <= 10; i++) grad.addColorStop(i / 10, `rgba(255,255,255,${Math.pow(1 - i / 10, 2.2).toFixed(4)})`);
    g.fillStyle = grad;
    g.fillRect(0, 0, 256, 256);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.NoColorSpace;
    return t;
  }, []);
  const screenMat = useMemo(() => new THREE.MeshBasicMaterial({ toneMapped: false }), []);
  screenMat.map = isFootage ? canvas.t : screenTex;
  screenMat.needsUpdate = true;

  // paint the model's parts by material name (Body: Frame/Back/Border; Keys: Frame; Screen; Cover)
  useEffect(() => {
    if (!model) return;
    model.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      const name = (m.material as THREE.Material).name || m.name;
      if (m.name === "Screen" || name === "Screen") {
        m.material = screenMat;
        m.renderOrder = 1;
      } else if (m.name === "Cover" || name === "Cover") {
        m.material = mats.Cover;
        m.renderOrder = 2;
      } else {
        m.material = mats[name as keyof typeof mats] ?? mats.Frame;
      }
    });
  }, [model, mats, screenMat]);

  useEffect(() => {
    scene.environment = env;
    scene.environmentRotation.set(0, (p.environment?.rotation ?? 0) * D2R, 0);
    scene.environmentIntensity = p.environment?.intensity ?? 1;
  }, [scene, env, p.environment?.rotation, p.environment?.intensity]);

  const ready = !!model && !!env && (isFootage ? firstVideoFrame : !!screenTex);
  useEffect(() => {
    if (!ready) return;
    advance(performance.now());
    continueRender(hold);
  }, [ready, advance, continueRender, hold]);

  // camera distance from the wanted on-screen width; px → world units at the phone's depth
  const size = rec.sizeMm!;
  const fov = p.camera?.fov ?? 18;
  const width = p.width ?? 560;
  const dist = ((size.w / 1000) * p.ch) / (width * 2 * Math.tan((fov * D2R) / 2));
  const pxPerM = p.ch / (2 * dist * Math.tan((fov * D2R) / 2));
  const wx = ((p.x ?? p.cw / 2) - p.cw / 2) / pxPerM;
  const wy = -((p.y ?? p.ch / 2) - p.ch / 2) / pxPerM;
  const s = p.scale ?? 1;
  const halfH = (size.h / 2000) * s;
  const floorY = wy - halfH - (p.floorGap ?? 0.09) * (size.h / 1000) * s;
  const cam = useThree((st) => st.camera) as THREE.PerspectiveCamera;
  useEffect(() => {
    cam.fov = fov;
    cam.near = dist / 20;
    cam.far = dist * 20;
    cam.position.set(0, 0, dist);
    cam.lookAt(0, 0, 0);
    cam.updateProjectionMatrix();
  }, [cam, fov, dist]);

  const r = p.rotation ?? {};
  const shadow = p.shadow ?? 0.5;
  // the footprint the shadow follows: wider as the phone turns edge-on, deeper as it tips
  const ry = (r.y ?? 0) * D2R;
  const rx = (r.x ?? 0) * D2R;
  const footW = ((size.w / 1000) * Math.abs(Math.cos(ry)) + (size.d / 1000) * Math.abs(Math.sin(ry))) * s;
  const footD = (0.9 * (size.w / 1000) + (size.h / 1000) * Math.abs(Math.sin(rx)) * 0.6) * s; // seen almost edge-on, so deep
  return (
    <>
      {isFootage ? (
        <Video src={src(p.screen.id)} headless muted onVideoFrame={onVideoFrame} trimBefore={Math.round((p.screen.from ?? 0) * fps)} playbackRate={p.screen.rate ?? 1} />
      ) : null}
      <group position={[wx, wy, 0]} rotation={[(r.x ?? 0) * D2R, (r.y ?? 0) * D2R, (r.z ?? 0) * D2R, "YXZ"]} scale={s}>
        {/* the GLB is Y-up lying flat, screen up: stand it so the screen faces the camera */}
        <group rotation={[Math.PI / 2, 0, 0]}>{model ? <primitive object={model} /> : null}</group>
      </group>
      {shadow > 0 ? (
        // a soft contact shadow on an invisible floor: a blurred ellipse the size of the phone's footprint,
        // seen in perspective (frame-pure and soft, like a big overhead softbox; no shadow-map flicker)
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[wx, floorY, 0]} scale={[footW * 1.35, footD, 1]} renderOrder={-1}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial map={blob} transparent opacity={shadow} depthWrite={false} toneMapped={false} color="#000000" />
        </mesh>
      ) : null}
    </>
  );
};

export const Device3D: React.FC<Device3DOwnProps> = (p) => {
  const vc = useVideoConfig();
  const cw = p.canvas?.width ?? vc.width;
  const ch = p.canvas?.height ?? vc.height;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: cw, height: ch, opacity: p.opacity ?? 1, pointerEvents: "none" }}>
      <ThreeCanvas
        width={cw}
        height={ch}
        dpr={p.quality ?? 2}
        gl={{ antialias: true, alpha: true }}
        camera={{ fov: p.camera?.fov ?? 18, position: [0, 0, 1] }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.NeutralToneMapping;
          gl.toneMappingExposure = 1;
          gl.setClearColor(0x000000, 0);
        }}
      >
        <Scene {...p} cw={cw} ch={ch} />
      </ThreeCanvas>
    </div>
  );
};
