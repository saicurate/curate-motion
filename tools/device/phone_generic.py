# Build Curate's GENERIC 3D phone in Blender (headless), export it as a GLB, and optionally render a
# Cycles hero still with an app screen on it.
#
#   Blender -b -P tools/device/phone_generic.py -- --glb out/phone-generic.v1.glb
#   Blender -b -P tools/device/phone_generic.py -- --glb out/x.glb --hero screen.png --hdri studio.hdr \
#       --out hero.png [--color graphite|silver] [--samples 128] [--res 1080x1920] [--ry -24 --rx 8]
#
# Why generic, not an iPhone: Apple's marketing guidelines forbid "rendering in 3D or creating any
# simulation of an Apple product" and generic devices may not carry Apple-only details (the Home button,
# sensor housing, Ring/Silent switch, volume controls). So this phone has no Dynamic Island, no camera
# plateau, no Action button and no left-side volume pair: a flat-edged slab, thin even border, power key
# and volume rocker on the RIGHT (the common non-Apple layout). See decisions/0012-device-frames.md.
#
# The model is real-world size in metres. Its screen is 72.0 x 156.4 mm = exactly 1320:2868, the
# 6.9-inch footage we capture, so a frame maps 1:1 onto it (UV 0..1 over the screen's bounding box).
# Nodes (three.js finds them by name): Body (materials Frame, Back, Border), Screen, Cover, Keys.
import argparse
import math
import os
import sys

import bmesh
import bpy

argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
ap = argparse.ArgumentParser()
ap.add_argument("--glb", required=True)
ap.add_argument("--hero", help="screen image (1320x2868) for a Cycles still")
ap.add_argument("--hdri")
ap.add_argument("--out")
ap.add_argument("--color", default="graphite")
ap.add_argument("--samples", type=int, default=128)
ap.add_argument("--res", default="1080x1920")
ap.add_argument("--rx", type=float, default=6.0)
ap.add_argument("--ry", type=float, default=-24.0)
ap.add_argument("--rz", type=float, default=0.0)
ap.add_argument("--hdri-rot", type=float, default=120.0)
ap.add_argument("--hdri-gain", type=float, default=1.0)
ap.add_argument("--screen-gain", type=float, default=1.0)
ap.add_argument("--glass-reflect", type=float, default=0.12)
ap.add_argument("--tilt", type=float, default=0.0, help="camera pitch, degrees (negative looks down)")
args = ap.parse_args(argv)
for k in ("glb", "hero", "hdri", "out"):
    if getattr(args, k):
        setattr(args, k, os.path.abspath(getattr(args, k)))  # Blender resolves relative paths against the .blend

MM = 0.001
SCREEN_W, SCREEN_H = 72.0 * MM, 72.0 * MM * 2868 / 1320  # 1320:2868, the footage
SCREEN_R = 10.5 * MM  # screen corner radius (circular), ~0.146 of its width
BORDER = 1.7 * MM  # black border between the lit screen and the glass edge
EDGE = 1.4 * MM  # rounded edge round the front and back faces
DEPTH = 8.25 * MM
FRONT_W, FRONT_H, FRONT_R = SCREEN_W + 2 * BORDER, SCREEN_H + 2 * BORDER, SCREEN_R + BORDER
BODY_W, BODY_H, BODY_R = FRONT_W + 2 * EDGE, FRONT_H + 2 * EDGE, FRONT_R + EDGE

COLORS = {  # linear RGB base colours of the metal frame and the frosted back
    "graphite": {"frame": (0.105, 0.108, 0.115), "back": (0.040, 0.041, 0.044), "rough": 0.30},
    "silver": {"frame": (0.62, 0.63, 0.65), "back": (0.55, 0.56, 0.58), "rough": 0.24},
}


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"
    prefs = bpy.context.preferences.addons["cycles"].preferences
    prefs.compute_device_type = "METAL"
    prefs.get_devices()
    for d in prefs.devices:
        d.use = d.type == "METAL"
    sc.cycles.device = "GPU"
    return sc


def principled(name, base, metallic=0.0, rough=0.5, coat=0.0, transmission=0.0, emission=None):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*base, 1.0)
    b.inputs["Metallic"].default_value = metallic
    b.inputs["Roughness"].default_value = rough
    b.inputs["Coat Weight"].default_value = coat
    b.inputs["Coat Roughness"].default_value = 0.03
    b.inputs["Transmission Weight"].default_value = transmission
    b.inputs["IOR"].default_value = 1.5
    if emission:
        b.inputs["Emission Color"].default_value = (*emission, 1.0)
        b.inputs["Emission Strength"].default_value = 1.0
    return m


def rounded_rect(w, h, r, seg=24):
    """Outline (counter-clockwise) of a w x h rounded rectangle centred on the origin."""
    pts = []
    for cx, cy, a0 in ((w / 2 - r, h / 2 - r, 0), (-w / 2 + r, h / 2 - r, 90), (-w / 2 + r, -h / 2 + r, 180), (w / 2 - r, -h / 2 + r, 270)):
        for i in range(seg + 1):
            a = math.radians(a0 + 90 * i / seg)
            pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts


def flat_panel(name, w, h, r, z, mat, uv=False):
    bm = bmesh.new()
    vs = [bm.verts.new((x, y, z)) for x, y in rounded_rect(w, h, r, 32)]
    f = bm.faces.new(vs)
    if uv:
        lay = bm.loops.layers.uv.new("UVMap")
        for loop in f.loops:
            x, y = loop.vert.co.x, loop.vert.co.y
            loop[lay].uv = (x / w + 0.5, y / h + 0.5)
    bmesh.ops.triangulate(bm, faces=bm.faces[:], quad_method="BEAUTY", ngon_method="BEAUTY")
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    me.materials.append(mat)
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    return ob


def body(mats):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co.x *= BODY_W
        v.co.y *= BODY_H
        v.co.z *= DEPTH
    vertical = [e for e in bm.edges if abs(e.verts[0].co.z - e.verts[1].co.z) > 1e-9]
    bmesh.ops.bevel(bm, geom=vertical, offset=BODY_R, offset_type="OFFSET", segments=28, profile=0.5, affect="EDGES", clamp_overlap=False)
    rims = [e for e in bm.edges if all(abs(abs(v.co.z) - DEPTH / 2) < 1e-9 for v in e.verts)]
    bmesh.ops.bevel(bm, geom=rims, offset=EDGE, offset_type="OFFSET", segments=10, profile=0.5, affect="EDGES", clamp_overlap=False)
    me = bpy.data.meshes.new("Body")
    for m in (mats["Frame"], mats["Back"], mats["Border"]):
        me.materials.append(m)
    bm.normal_update()
    for f in bm.faces:
        nz = f.normal.z
        f.material_index = 2 if nz > 0.999 and f.calc_center_median().z > DEPTH / 2 - 1e-7 else 1 if nz < -0.999 and f.calc_center_median().z < -DEPTH / 2 + 1e-7 else 0
        f.smooth = True
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new("Body", me)
    bpy.context.scene.collection.objects.link(ob)
    bpy.context.view_layer.objects.active = ob
    ob.select_set(True)
    bpy.ops.object.shade_smooth_by_angle(angle=math.radians(35))
    ob.select_set(False)
    return ob


def keys(mat):
    """Power key and volume rocker on the right edge (the common non-Apple layout)."""
    bm = bmesh.new()
    for y0, length in ((10.0 * MM, 13.0 * MM), (30.0 * MM, 24.0 * MM)):
        g = bmesh.ops.create_cube(bm, size=1.0)
        for v in g["verts"]:
            v.co.x = v.co.x * 1.0 * MM + BODY_W / 2 - 0.2 * MM
            v.co.y = v.co.y * length + y0 + length / 2
            v.co.z = v.co.z * 2.3 * MM
    bmesh.ops.bevel(bm, geom=bm.edges[:], offset=0.35 * MM, offset_type="OFFSET", segments=4, profile=0.5, affect="EDGES", clamp_overlap=True)
    me = bpy.data.meshes.new("Keys")
    bm.to_mesh(me)
    bm.free()
    me.materials.append(mat)
    for p in me.polygons:
        p.use_smooth = True
    ob = bpy.data.objects.new("Keys", me)
    bpy.context.scene.collection.objects.link(ob)
    return ob


sc = reset()
c = COLORS[args.color]
mats = {
    "Frame": principled("Frame", c["frame"], metallic=1.0, rough=c["rough"]),
    "Back": principled("Back", c["back"], rough=0.42),
    "Border": principled("Border", (0.004, 0.004, 0.005), rough=0.06, coat=1.0),
    "Screen": principled("Screen", (0.0, 0.0, 0.0), rough=1.0, emission=(0.02, 0.02, 0.02)),
    "Cover": principled("Cover", (1.0, 1.0, 1.0), rough=0.02, transmission=1.0),
}
root = bpy.data.objects.new("Phone", None)
sc.collection.objects.link(root)
parts = [
    body(mats),
    flat_panel("Screen", SCREEN_W, SCREEN_H, SCREEN_R, DEPTH / 2 + 0.02 * MM, mats["Screen"], uv=True),
    flat_panel("Cover", FRONT_W, FRONT_H, FRONT_R, DEPTH / 2 + 0.05 * MM, mats["Cover"]),
    keys(mats["Frame"]),
]
for p in parts:
    p.parent = root

bpy.ops.export_scene.gltf(filepath=args.glb, export_format="GLB", export_yup=True, export_apply=True, export_materials="EXPORT", export_extras=False)
print(f"wrote {args.glb}  body {BODY_W / MM:.1f} x {BODY_H / MM:.1f} x {DEPTH / MM:.2f} mm, screen {SCREEN_W / MM:.1f} x {SCREEN_H / MM:.1f} mm r{SCREEN_R / MM:.1f}")

if args.hero:
    # ---------------------------------------------------------------- Cycles hero still
    w, h = (int(x) for x in args.res.split("x"))
    sc.render.resolution_x, sc.render.resolution_y = w, h
    sc.cycles.samples = args.samples
    sc.cycles.use_denoising = True
    # Standard (not AgX/Filmic): the screen's emission of 1.0 then lands on exactly the app's sRGB pixels
    sc.view_settings.view_transform = "Standard"
    sc.view_settings.look = "None"
    # transparent film + a shadow-catcher floor: the background is laid in later (the ad's ground colour)
    sc.render.film_transparent = True
    sc.render.image_settings.color_mode = "RGBA"
    # the lit screen: the app image as PURE emission (strength 1 = its own pixels; no BSDF, so nothing
    # in the room greys it; the cover glass above does the reflecting)
    img = bpy.data.images.load(args.hero)
    nt = mats["Screen"].node_tree
    nt.nodes.clear()
    tex = nt.nodes.new("ShaderNodeTexImage")
    tex.image = img
    em = nt.nodes.new("ShaderNodeEmission")
    em.inputs["Strength"].default_value = args.screen_gain
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    nt.links.new(tex.outputs["Color"], em.inputs["Color"])
    nt.links.new(em.outputs["Emission"], out.inputs["Surface"])
    # the cover: see-through, with a Fresnel reflection turned down (a real phone in a white studio wears a
    # grey veil of the room; product shoots flag it off; args.glass_reflect is that flag, 1 = physical)
    cn = mats["Cover"].node_tree
    cn.nodes.clear()
    clear = cn.nodes.new("ShaderNodeBsdfTransparent")
    gloss = cn.nodes.new("ShaderNodeBsdfGlossy")
    gloss.inputs["Roughness"].default_value = 0.0
    fres = cn.nodes.new("ShaderNodeFresnel")
    fres.inputs["IOR"].default_value = 1.5
    k = cn.nodes.new("ShaderNodeMath")
    k.operation = "MULTIPLY"
    k.inputs[1].default_value = args.glass_reflect
    mix = cn.nodes.new("ShaderNodeMixShader")
    cout = cn.nodes.new("ShaderNodeOutputMaterial")
    cn.links.new(fres.outputs["Fac"], k.inputs[0])
    cn.links.new(k.outputs["Value"], mix.inputs["Fac"])
    cn.links.new(clear.outputs["BSDF"], mix.inputs[1])
    cn.links.new(gloss.outputs["BSDF"], mix.inputs[2])
    cn.links.new(mix.outputs["Shader"], cout.inputs["Surface"])
    # studio HDRI for reflections, hidden from the camera; a soft grey seamless behind
    world = bpy.data.worlds.new("World")
    sc.world = world
    world.use_nodes = True
    wn = world.node_tree
    bg = wn.nodes["Background"]
    if args.hdri:
        env = wn.nodes.new("ShaderNodeTexEnvironment")
        env.image = bpy.data.images.load(args.hdri)
        mapping = wn.nodes.new("ShaderNodeMapping")
        coord = wn.nodes.new("ShaderNodeTexCoord")
        mapping.inputs["Rotation"].default_value[2] = math.radians(args.hdri_rot)
        wn.links.new(coord.outputs["Generated"], mapping.inputs["Vector"])
        wn.links.new(mapping.outputs["Vector"], env.inputs["Vector"])
        wn.links.new(env.outputs["Color"], bg.inputs["Color"])
        bg.inputs["Strength"].default_value = args.hdri_gain
    # the HDRI lights only reflections; one big soft light overhead makes the shadow (straight under,
    # not the long side shadows the studio's low softboxes would throw)
    world.cycles_visibility.diffuse = False
    key = bpy.data.lights.new("Key", "AREA")
    key.shape, key.size, key.energy = "DISK", 0.9, 200.0
    key_ob = bpy.data.objects.new("Key", key)
    key_ob.visible_glossy = False  # never a white disc in the glass
    key_ob.visible_transmission = False
    sc.collection.objects.link(key_ob)
    key_ob.location = (0.0, -0.1, BODY_H / 2 + 1.5)
    # floor for a soft shadow: the phone floats 2.5 cm above it
    bpy.ops.mesh.primitive_plane_add(size=3.0, location=(0, 0, 0))
    floor = bpy.context.active_object
    floor.is_shadow_catcher = True
    # light linking: the key lights the floor only (it makes the shadow; the phone keeps the studio's light)
    recv = bpy.data.collections.new("KeyReceivers")
    recv.objects.link(floor)
    key_ob.light_linking.receiver_collection = recv
    root.rotation_euler = (math.radians(90 + args.rx), math.radians(args.rz), math.radians(args.ry))
    cam_data = bpy.data.cameras.new("Cam")
    cam_data.lens = 85
    cam = bpy.data.objects.new("Cam", cam_data)
    sc.collection.objects.link(cam)
    sc.camera = cam
    t = math.radians(args.tilt)
    cam.location = (0, -0.62 * math.cos(t), -0.62 * math.sin(t))
    cam.rotation_euler = (math.radians(90) + t, 0, 0)
    floor.location = (0, 0, -BODY_H / 2 - 0.025)
    sc.render.filepath = args.out
    bpy.ops.render.render(write_still=True)
    print(f"wrote {args.out}")
