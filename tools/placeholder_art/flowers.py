"""12種の切り花を水彩タッチで描く。

構図は IMAGE_ASSETS.md の規定に従う。
  flower_<id>_stem.png  : 900 x 1400 / 茎の切り口 = 下端 / 花の中心 = (450, 340)
  flower_<id>_vase.png  : 900 x 1100 / 花瓶の底 = 下端から 20px
  flower_<id>_thumb.png : 300 x 300
"""

from __future__ import annotations

import math
import random
from dataclasses import dataclass, field

from PIL import Image, ImageDraw, ImageFilter

from .paint import (RGB, bezier, draw_blob, draw_leaf, draw_petal, draw_stem,
                    hex_rgb, jitter, linear_gradient, mix, paper_texture,
                    rotate_points, shade, stamp)

STEM_SIZE = (900, 1400)
HEAD_CENTER = (450.0, 340.0)
VASE_SIZE = (900, 1100)
THUMB_SIZE = (300, 300)
SS = 2  # スーパーサンプリング


# --------------------------------------------------------------------------
# 花の頭
# --------------------------------------------------------------------------

def head_daisy(layer, c, r, petal: RGB, petal_tip: RGB, center: RGB, rng,
               petals: int = 24, rings: int = 2, center_ratio: float = 0.30,
               waist: float = 1.05, tip: float = 0.62, seeds: bool = True) -> None:
    """ヒマワリ・ガーベラ。細長い花びらの輪と、種の詰まった中心。"""
    for ring in range(rings):
        n = max(5, int(petals * (1 - 0.18 * ring)))
        rot = rng.uniform(0, 360 / n) + ring * (180 / n)
        length = r * (1.0 - 0.17 * ring)
        width = r * 0.30 * (1 - 0.06 * ring)
        for i in range(n):
            a = 360 * i / n + rot + rng.uniform(-3.5, 3.5)
            draw_petal(layer, c, a,
                       length * rng.uniform(0.90, 1.08),
                       width * rng.uniform(0.86, 1.14),
                       shade(petal, -0.10 * ring), petal_tip, rng,
                       tip=tip, waist=waist, offset=r * center_ratio * 0.62,
                       curl=rng.uniform(-0.10, 0.10))
    cr = r * center_ratio
    draw_blob(layer, c, cr, cr * 0.96, center, rng, softness=2.0, highlight=0.22)
    if seeds:
        for i in range(int(cr * 2.2)):
            t = i / max(1, int(cr * 2.2))
            ang = i * 137.5
            rad = cr * 0.92 * math.sqrt(t)
            x = c[0] + math.cos(math.radians(ang)) * rad
            y = c[1] + math.sin(math.radians(ang)) * rad
            tone = shade(center, 0.22 if (i % 3 == 0) else -0.18)
            draw_blob(layer, (x, y), cr * 0.075, cr * 0.075, tone, rng,
                      softness=0.9, bleed=0.12)


def head_rose(layer, c, r, petal: RGB, petal_tip: RGB, rng, rings=None) -> None:
    """バラ。外へ開いた花びらから、渦を巻く中心へ。"""
    rings = rings or [(1.00, 7), (0.82, 7), (0.64, 6), (0.48, 5), (0.34, 5), (0.22, 4)]
    for k, (scale, n) in enumerate(rings):
        depth = k / max(1, len(rings) - 1)
        base = shade(petal, -0.10 + 0.18 * depth)
        tipc = shade(petal_tip, 0.02 + 0.14 * depth)
        for i in range(n):
            a = 360 * i / n + k * 27 + rng.uniform(-5, 5)
            draw_petal(layer, c, a,
                       r * scale * 0.66 * rng.uniform(0.93, 1.07),
                       r * scale * 0.92 * rng.uniform(0.92, 1.08),
                       base, tipc, rng, tip=0.44, waist=1.62,
                       offset=r * scale * 0.26, veins=False,
                       curl=rng.choice((-0.5, 0.5)) * rng.uniform(0.2, 0.6))
    draw_blob(layer, c, r * 0.10, r * 0.10, shade(petal, -0.22), rng, softness=2.2)


def head_ruffle(layer, c, r, petal: RGB, petal_tip: RGB, rng, petals: int = 46,
                calyx: RGB | None = None) -> None:
    """カーネーション。細かくフリルの寄った花びらの塊。"""
    for k in range(4):
        scale = 1.0 - 0.19 * k
        n = max(6, int(petals * scale / 2.4))
        for i in range(n):
            a = 360 * i / n + rng.uniform(-12, 12) + k * 19
            draw_petal(layer, c, a,
                       r * scale * 0.74 * rng.uniform(0.86, 1.12),
                       r * scale * 0.40 * rng.uniform(0.80, 1.25),
                       shade(petal, -0.06 + 0.14 * k), shade(petal_tip, 0.06 * k), rng,
                       tip=0.40, waist=1.45, offset=r * scale * 0.16, veins=False,
                       curl=rng.uniform(-0.7, 0.7))
    if calyx:
        draw_blob(layer, (c[0], c[1] + r * 0.86), r * 0.20, r * 0.30, calyx, rng)


def head_trumpet(layer, c, r, petal: RGB, petal_tip: RGB, rng, petals: int = 6,
                 stamen: RGB | None = None, speckle: RGB | None = None) -> None:
    """ユリ・アルストロメリア。反り返った6枚の花びらと雄しべ。"""
    rot = rng.uniform(0, 60)
    for ring in range(2):
        for i in range(petals // (ring + 1) if ring else petals):
            a = 360 * i / (petals // (ring + 1) if ring else petals) + rot + ring * 30
            draw_petal(layer, c, a,
                       r * (1.0 - 0.13 * ring) * rng.uniform(0.93, 1.06),
                       r * 0.46 * rng.uniform(0.90, 1.10),
                       shade(petal, -0.05 - 0.06 * ring), petal_tip, rng,
                       tip=0.72, waist=1.02, offset=r * 0.10,
                       curl=rng.uniform(-0.35, 0.35))
    if speckle:
        for _ in range(26):
            a = math.radians(rng.uniform(0, 360))
            rad = r * rng.uniform(0.12, 0.55)
            draw_blob(layer, (c[0] + math.cos(a) * rad, c[1] + math.sin(a) * rad),
                      r * 0.035, r * 0.028, speckle, rng, softness=0.8, bleed=0.1)
    if stamen:
        for i in range(6):
            a = 360 * i / 6 + rot + 18
            tipx = c[0] + math.sin(math.radians(a)) * r * 0.52
            tipy = c[1] - math.cos(math.radians(a)) * r * 0.52 + r * 0.06
            draw_stem(layer, [(c[0], c[1]), (tipx, tipy)], r * 0.035, r * 0.03,
                      shade(stamen, 0.30), rng)
            draw_blob(layer, (tipx, tipy), r * 0.075, r * 0.052, stamen, rng,
                      softness=1.0, highlight=0.3)
        draw_blob(layer, c, r * 0.09, r * 0.09, shade(stamen, 0.35), rng)


def head_cup(layer, c, r, petal: RGB, petal_tip: RGB, rng, center: RGB | None = None) -> None:
    """トルコキキョウ。丸くやわらかい花びらが重なる。"""
    for ring in range(2):
        n = 6 if ring == 0 else 5
        rot = rng.uniform(0, 60) + ring * 32
        for i in range(n):
            a = 360 * i / n + rot + rng.uniform(-6, 6)
            draw_petal(layer, c, a,
                       r * (1.0 - 0.22 * ring) * rng.uniform(0.92, 1.08),
                       r * (0.82 - 0.14 * ring) * rng.uniform(0.92, 1.08),
                       shade(petal, -0.04 + 0.10 * ring), petal_tip, rng,
                       tip=0.42, waist=1.70, offset=r * 0.16,
                       curl=rng.uniform(-0.5, 0.5))
    if center:
        draw_blob(layer, c, r * 0.13, r * 0.12, center, rng, softness=1.8, highlight=0.3)


def head_dome(layer, c, r, palette: list[RGB], rng, florets: int = 34,
              floret_petals: int = 4, center: RGB | None = None) -> None:
    """アジサイ。小さな花が集まってドームになる。"""
    placed: list[tuple[float, float]] = []
    for i in range(florets):
        for _ in range(24):
            a = rng.uniform(0, 2 * math.pi)
            rad = r * 0.86 * math.sqrt(rng.uniform(0, 1))
            x, y = c[0] + math.cos(a) * rad, c[1] + math.sin(a) * rad * 0.86
            if all((x - px) ** 2 + (y - py) ** 2 > (r * 0.24) ** 2 for px, py in placed):
                placed.append((x, y))
                break
        else:
            continue
        depth = min(1.0, math.hypot(x - c[0], (y - c[1]) / 0.86) / (r * 0.86))
        col = shade(rng.choice(palette), 0.10 - 0.24 * depth)
        fr = r * 0.20 * rng.uniform(0.82, 1.16)
        rot = rng.uniform(0, 90)
        for k in range(floret_petals):
            draw_petal(layer, (x, y), 360 * k / floret_petals + rot,
                       fr, fr * 0.95, col, shade(col, 0.14), rng,
                       tip=0.42, waist=1.62, offset=fr * 0.14, veins=False)
        if center:
            draw_blob(layer, (x, y), fr * 0.16, fr * 0.16, center, rng, softness=1.0)


def head_spray(layer, c, r, color: RGB, rng, count: int = 120, dot: float = 0.055,
               spread: tuple[float, float] = (1.0, 1.0), stem_color: RGB | None = None) -> None:
    """かすみ草。細い枝先に小さな白い花がふわりと散る。"""
    if stem_color:
        for _ in range(16):
            a = rng.uniform(-1.2, 1.2)
            end = (c[0] + math.sin(a) * r * spread[0] * rng.uniform(0.4, 0.95),
                   c[1] - math.cos(a) * r * spread[1] * rng.uniform(0.3, 0.9))
            draw_stem(layer, bezier((c[0], c[1] + r * 0.5),
                                    ((c[0] + end[0]) / 2, (c[1] + end[1]) / 2 + r * 0.1),
                                    end, 14),
                      r * 0.016, r * 0.012, stem_color, rng)
    for _ in range(count):
        a = rng.uniform(0, 2 * math.pi)
        rad = math.sqrt(rng.uniform(0, 1))
        x = c[0] + math.cos(a) * rad * r * spread[0]
        y = c[1] + math.sin(a) * rad * r * spread[1] * 0.9
        d = r * dot * rng.uniform(0.7, 1.3)
        col = shade(color, 0.10 - 0.20 * rad)
        for k in range(5):
            draw_petal(layer, (x, y), 72 * k + rng.uniform(0, 40), d, d * 0.9,
                       col, shade(col, 0.16), rng, tip=0.42, waist=1.6, veins=False)


def head_spike(layer, c, r, palette: list[RGB], rng, height: float, count: int = 42,
               floret: float = 0.16, petals: int = 5) -> None:
    """デルフィニウム・スターチス。穂状に上へ伸びる花。"""
    for i in range(count):
        t = i / max(1, count - 1)
        y = c[1] + height * 0.5 - height * t
        spread = r * (1.0 - 0.72 * t) * rng.uniform(-1.0, 1.0)
        x = c[0] + spread
        fr = r * floret * (1.15 - 0.5 * t) * rng.uniform(0.8, 1.2)
        col = shade(rng.choice(palette), 0.06 - 0.18 * abs(spread) / max(1.0, r))
        rot = rng.uniform(0, 72)
        for k in range(petals):
            draw_petal(layer, (x, y), 360 * k / petals + rot, fr, fr * 0.86,
                       col, shade(col, 0.18), rng, tip=0.46, waist=1.5,
                       offset=fr * 0.16, veins=False)
        draw_blob(layer, (x, y), fr * 0.16, fr * 0.16, shade(col, 0.45), rng, softness=0.9)


def head_eucalyptus(layer, c, r, color: RGB, rng, height: float) -> None:
    """ユーカリ。丸い葉が枝に沿って対になって連なる。"""
    base = (c[0], c[1] + height * 0.50)
    for branch in range(3):
        lean = (branch - 1) * 26 + rng.uniform(-8, 8)
        length = height * (0.96 if branch == 1 else rng.uniform(0.68, 0.82))
        tip = rotate_points([(0, -length)], lean, base)[0]
        path = bezier(base, (base[0] + lean * 2.0, base[1] - length * 0.55), tip, 34)
        draw_stem(layer, path, r * 0.035, r * 0.062, shade(color, -0.26), rng)
        for i in range(3, len(path) - 2, 4):
            t = i / len(path)
            lr = r * (0.22 - 0.09 * t) * rng.uniform(0.86, 1.12)
            for side in (-1, 1):
                ang = lean + side * rng.uniform(74, 106)
                leaf = shade(jitter(color, rng, 7), 0.14 if side < 0 else -0.06)
                draw_petal(layer, path[i], ang, lr * 2.0, lr * 1.65,
                           shade(leaf, -0.10), shade(leaf, 0.12), rng,
                           tip=0.36, waist=1.55, veins=True,
                           curl=rng.uniform(-0.2, 0.2))


# --------------------------------------------------------------------------
# レシピ
# --------------------------------------------------------------------------

@dataclass
class Recipe:
    id: str
    head: str
    palette: list[str]
    accent: str = "#F3E7C8"
    center: str = "#5A431E"
    stem: str = "#7E9463"
    leaf: str = "#6F8C58"
    head_r: float = 150.0            # 花の半径（900x1400 基準）
    stem_w: tuple[float, float] = (16.0, 22.0)
    leaves: int = 3
    leaf_len: float = 190.0
    side_blooms: int = 0             # 主花のまわりに添える花
    bud: bool = True
    lean: float = 10.0               # 茎の傾き
    opts: dict = field(default_factory=dict)


RECIPES: dict[str, Recipe] = {
    "sunflower": Recipe(
        id="sunflower", head="daisy", palette=["#F2B825", "#E8A417"], accent="#FBE28C",
        center="#4A3416", stem="#7C9455", leaf="#5F7F41", head_r=250,
        stem_w=(20, 27), leaves=3, leaf_len=215, bud=False, lean=6,
        opts=dict(petals=26, rings=2, center_ratio=0.36, waist=1.0, tip=0.60)),
    "lisianthus": Recipe(
        id="lisianthus", head="cup", palette=["#8C79C6", "#7A66B8"], accent="#E5DEF4",
        center="#EDE7A9", stem="#8AA06C", leaf="#7B9463", head_r=180,
        stem_w=(13, 18), leaves=2, leaf_len=150, side_blooms=2, lean=12),
    "lily": Recipe(
        id="lily", head="trumpet", palette=["#FBF6EA", "#F3EAD6"], accent="#FFFDF6",
        center="#D9922F", stem="#7E9A5E", leaf="#5F8149", head_r=232,
        stem_w=(17, 23), leaves=4, leaf_len=210, side_blooms=1, lean=8,
        opts=dict(stamen="#D9922F")),
    "carnation": Recipe(
        id="carnation", head="ruffle", palette=["#EE8AAA", "#E5729A"], accent="#F8C3D4",
        center="#E5729A", stem="#93A87A", leaf="#8CA378", head_r=186,
        stem_w=(14, 19), leaves=2, leaf_len=160, side_blooms=2, lean=11,
        opts=dict(calyx="#93A87A")),
    "delphinium": Recipe(
        id="delphinium", head="spike", palette=["#6E90D4", "#8AAAE4", "#5C7FC6"],
        accent="#DCE6F7", center="#F2F0E2", stem="#88A06A", leaf="#75904F",
        head_r=150, stem_w=(13, 18), leaves=2, leaf_len=150, bud=False, lean=7,
        opts=dict(height=620, count=54, floret=0.18)),
    "babysbreath": Recipe(
        id="babysbreath", head="spray", palette=["#FFFDF7", "#F6F1E6"], accent="#FFFFFF",
        center="#F0EAD8", stem="#9FB183", leaf="#93A878", head_r=258,
        stem_w=(9, 13), leaves=1, leaf_len=110, bud=False, lean=6,
        opts=dict(count=150, dot=0.052)),
    "rose": Recipe(
        id="rose", head="rose", palette=["#EE93AB", "#E67C99"], accent="#FADCE3",
        center="#D96A8C", stem="#82986A", leaf="#5E7C4A", head_r=198,
        stem_w=(16, 21), leaves=3, leaf_len=175, side_blooms=0, lean=9),
    "hydrangea": Recipe(
        id="hydrangea", head="dome", palette=["#F3F5E9", "#E9EFDD", "#F7F4E4"],
        accent="#FFFFFF", center="#DDE3C4", stem="#7F9A63", leaf="#5E7F48",
        head_r=248, stem_w=(19, 25), leaves=3, leaf_len=225, bud=False, lean=8,
        opts=dict(florets=40, center="#E4DFB6")),
    "gerbera": Recipe(
        id="gerbera", head="daisy", palette=["#F0879C", "#EE9A88"], accent="#F9CFD3",
        center="#C9678A", stem="#8CA36E", leaf="#7C9560", head_r=224,
        stem_w=(15, 20), leaves=1, leaf_len=140, bud=False, lean=10,
        opts=dict(petals=30, rings=2, center_ratio=0.26, waist=1.15, tip=0.70)),
    "alstroemeria": Recipe(
        id="alstroemeria", head="trumpet", palette=["#F4DC93", "#EFD07D"], accent="#FBF1C9",
        center="#C98A3C", stem="#8AA36C", leaf="#7A9459", head_r=158,
        stem_w=(12, 17), leaves=3, leaf_len=150, side_blooms=3, lean=13,
        opts=dict(speckle="#B5713A", stamen="#C98A3C")),
    "statice": Recipe(
        id="statice", head="spike", palette=["#8E7BC8", "#A28FD4", "#7C6ABA"],
        accent="#E2DAF2", center="#FBF7E8", stem="#93A87A", leaf="#8AA070",
        head_r=168, stem_w=(12, 17), leaves=1, leaf_len=120, bud=False, lean=9,
        opts=dict(height=520, count=58, floret=0.15, petals=5)),
    "eucalyptus": Recipe(
        id="eucalyptus", head="eucalyptus", palette=["#A8BCA2", "#B8C9AF"],
        accent="#CBD8C2", center="#8FA588", stem="#7E9276", leaf="#A8BCA2",
        head_r=205, stem_w=(11, 16), leaves=0, leaf_len=0, bud=False, lean=10,
        opts=dict(height=760)),
}


# --------------------------------------------------------------------------
# 1本の切り花
# --------------------------------------------------------------------------

def _draw_head(layer, recipe: Recipe, c, r: float, rng: random.Random,
               scale: float = 1.0) -> None:
    pal = [hex_rgb(p) for p in recipe.palette]
    main = jitter(pal[0], rng, 6)
    accent = hex_rgb(recipe.accent)
    o = recipe.opts

    if recipe.head == "daisy":
        head_daisy(layer, c, r, main, accent, hex_rgb(recipe.center), rng,
                   petals=o.get("petals", 24), rings=o.get("rings", 2),
                   center_ratio=o.get("center_ratio", 0.30),
                   waist=o.get("waist", 1.05), tip=o.get("tip", 0.62))
    elif recipe.head == "rose":
        head_rose(layer, c, r, main, accent, rng)
    elif recipe.head == "ruffle":
        head_ruffle(layer, c, r, main, accent, rng,
                    calyx=hex_rgb(o["calyx"]) if "calyx" in o else None)
    elif recipe.head == "trumpet":
        head_trumpet(layer, c, r, main, accent, rng,
                     stamen=hex_rgb(o["stamen"]) if "stamen" in o else None,
                     speckle=hex_rgb(o["speckle"]) if "speckle" in o else None)
    elif recipe.head == "cup":
        head_cup(layer, c, r, main, accent, rng, center=hex_rgb(recipe.center))
    elif recipe.head == "dome":
        head_dome(layer, c, r, pal, rng, florets=o.get("florets", 34),
                  center=hex_rgb(o["center"]) if "center" in o else None)
    elif recipe.head == "spray":
        head_spray(layer, c, r, main, rng, count=o.get("count", 120),
                   dot=o.get("dot", 0.055), stem_color=hex_rgb(recipe.stem))
    elif recipe.head == "spike":
        head_spike(layer, c, r, pal, rng, height=o.get("height", 480) * scale,
                   count=o.get("count", 42), floret=o.get("floret", 0.16),
                   petals=o.get("petals", 5))
    elif recipe.head == "eucalyptus":
        head_eucalyptus(layer, c, r, main, rng, height=o.get("height", 600) * scale)


def render_stem(recipe: Recipe, seed: int = 0, scale: float = 1.0,
                size: tuple[int, int] = STEM_SIZE,
                head_center: tuple[float, float] = HEAD_CENTER,
                base_x: float | None = None) -> Image.Image:
    """規定サイズの切り花1本。中心 (450,340)、切り口は下端中央。"""
    rng = random.Random(seed)
    w, h = int(size[0] * SS), int(size[1] * SS)
    layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))

    # 花の中心と切り口はキャンバス座標そのまま。scale は花や茎の「太さ」だけに効く。
    cx, cy = head_center[0] * SS, head_center[1] * SS
    bx = (base_x if base_x is not None else size[0] / 2) * SS
    r = recipe.head_r * SS * scale
    stem_col = jitter(hex_rgb(recipe.stem), rng, 5)
    leaf_col = hex_rgb(recipe.leaf)
    lean = recipe.lean * rng.uniform(0.4, 1.4) * rng.choice((-1, 1)) * SS

    # 茎（下端から花の中心へ、ゆるやかに反る）
    path = bezier((bx, h), (bx + lean * 2.2, (h + cy) / 2), (cx, cy + r * 0.42), 46)
    draw_stem(layer, path, recipe.stem_w[0] * SS * scale, recipe.stem_w[1] * SS * scale,
              stem_col, rng)

    # 葉
    for i in range(recipe.leaves):
        t = 0.30 + 0.24 * i + rng.uniform(-0.05, 0.05)
        idx = min(len(path) - 2, int(len(path) * t))
        px, py = path[idx]
        side = -1 if i % 2 == 0 else 1
        ang = side * rng.uniform(52, 78) + 180
        draw_leaf(layer, (px, py), ang,
                  recipe.leaf_len * SS * scale * rng.uniform(0.82, 1.12),
                  recipe.leaf_len * SS * scale * 0.34 * rng.uniform(0.85, 1.2),
                  jitter(leaf_col, rng, 7), rng, curl=rng.uniform(-0.4, 0.4))

    # つぼみ・添え花
    for i in range(recipe.side_blooms):
        side = -1 if i % 2 == 0 else 1
        sx = cx + side * r * rng.uniform(0.72, 1.05)
        sy = cy + r * rng.uniform(0.35, 0.78)
        draw_stem(layer, bezier((cx, cy + r * 0.5), ((cx + sx) / 2, sy + r * 0.4),
                                (sx, sy), 20),
                  recipe.stem_w[0] * SS * scale * 0.6,
                  recipe.stem_w[0] * SS * scale * 0.8, stem_col, rng)
        _draw_head(layer, recipe, (sx, sy), r * rng.uniform(0.52, 0.68), rng, scale)

    if recipe.bud:
        side = rng.choice((-1, 1))
        bxx = cx + side * r * rng.uniform(0.85, 1.15)
        byy = cy + r * rng.uniform(0.95, 1.35)
        draw_stem(layer, bezier((cx, cy + r * 0.6), ((cx + bxx) / 2, byy + r * 0.3),
                                (bxx, byy), 18),
                  recipe.stem_w[0] * SS * scale * 0.55,
                  recipe.stem_w[0] * SS * scale * 0.75, stem_col, rng)
        bud_c = mix(hex_rgb(recipe.palette[0]), leaf_col, 0.45)
        draw_blob(layer, (bxx, byy), r * 0.17, r * 0.24, bud_c, rng, highlight=0.25)
        for k in range(3):
            draw_petal(layer, (bxx, byy + r * 0.16), 180 + (k - 1) * 34,
                       r * 0.30, r * 0.16, shade(leaf_col, -0.1), leaf_col, rng,
                       tip=0.6, waist=0.9, veins=False)

    # 主花
    _draw_head(layer, recipe, (cx, cy), r, rng, scale)

    layer = layer.resize(size, Image.LANCZOS)
    return paper_texture(layer, seed=seed, strength=0.07)


# --------------------------------------------------------------------------
# 花瓶
# --------------------------------------------------------------------------

def render_vase(recipe: Recipe, seed: int = 0) -> Image.Image:
    """ガラスの花瓶に生けた状態（店頭表示用）。"""
    rng = random.Random(seed + 7000)
    w, h = VASE_SIZE
    layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))

    vase_top = int(h * 0.52)
    vase_bottom = h - 20
    vase_w = int(w * 0.34)
    vx0, vx1 = (w - vase_w) // 2, (w + vase_w) // 2

    # 花（奥から手前へ）。1本ずつ表情を変え、奥はわずかにぼかす。
    order = [(-1.00, 0.78), (1.00, 0.82), (-0.52, 0.90), (0.52, 0.94), (0.0, 1.0)]
    for i, (side, depth) in enumerate(order):
        head_x = w / 2 + side * w * 0.19
        head_y = h * 0.30 - depth * h * 0.05 + abs(side) * h * 0.05
        st = render_stem(recipe, seed=seed * 31 + i * 17 + 3,
                         scale=0.50 * depth,
                         size=(w, h),
                         head_center=(head_x, head_y),
                         base_x=w / 2)
        if depth < 0.95:
            st = st.filter(ImageFilter.GaussianBlur((1 - depth) * 2.6))
            veil = Image.new("RGBA", st.size, (255, 252, 244, 255))
            veil.putalpha(st.split()[3].point(lambda v: int(v * (1 - depth) * 0.9)))
            st = Image.alpha_composite(st, veil)
        stamp(layer, st, 0, 0)

    glass = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glass)
    body = [vx0, vase_top, vx1, vase_bottom]

    # 水（うっすら緑がかり、下へいくほど濃い）
    water_top = vase_top + int((vase_bottom - vase_top) * 0.20)
    for i in range(10):
        t = i / 10
        y0 = water_top + (vase_bottom - water_top) * t
        gd.rounded_rectangle([vx0 + 5, y0, vx1 - 5, vase_bottom - 5], radius=26,
                             fill=(206, 220, 208, 22))
    gd.line([vx0 + 10, water_top, vx1 - 10, water_top], fill=(255, 255, 255, 165), width=4)

    # ガラス本体（透明だが、縁と厚みで存在を出す）
    gd.rounded_rectangle(body, radius=30, fill=(238, 245, 242, 46),
                         outline=(255, 255, 255, 205), width=5)
    gd.rounded_rectangle([vx0 + 7, vase_top + 7, vx1 - 7, vase_bottom - 7], radius=24,
                         outline=(255, 255, 255, 90), width=2)
    # 口元の楕円（厚みのある縁）
    gd.ellipse([vx0 - 4, vase_top - 15, vx1 + 4, vase_top + 19],
               outline=(255, 255, 255, 225), width=6)
    gd.ellipse([vx0 + 8, vase_top - 6, vx1 - 8, vase_top + 12],
               outline=(212, 226, 220, 150), width=3)
    # 左上光源の映り込みと、右側の弱い反射
    gd.line([vx0 + 20, vase_top + 34, vx0 + 20, vase_bottom - 42],
            fill=(255, 255, 255, 175), width=11)
    gd.line([vx0 + 38, vase_top + 52, vx0 + 38, vase_bottom - 76],
            fill=(255, 255, 255, 90), width=4)
    gd.line([vx1 - 22, vase_top + 74, vx1 - 22, vase_bottom - 60],
            fill=(255, 255, 255, 105), width=6)
    # 底の厚み
    gd.line([vx0 + 24, vase_bottom - 20, vx1 - 24, vase_bottom - 20],
            fill=(255, 255, 255, 150), width=8)
    gd.arc([vx0 + 6, vase_bottom - 44, vx1 - 6, vase_bottom + 6], start=0, end=180,
           fill=(236, 244, 240, 170), width=5)
    glass = glass.filter(ImageFilter.GaussianBlur(1.3))

    # ガラスの向こうで、茎がわずかに屈折して見える
    water_box = (vx0 + 6, water_top, vx1 - 6, vase_bottom - 6)
    inside = layer.crop(water_box)
    layer.paste(inside.resize((int((vx1 - vx0 - 12) * 1.06), inside.height), Image.BICUBIC)
                .crop((0, 0, vx1 - vx0 - 12, inside.height)), (vx0 + 6, water_top))

    out = Image.alpha_composite(layer, glass)
    return paper_texture(out, seed=seed + 21, strength=0.06)


def render_thumb(stem_img: Image.Image, recipe: Recipe) -> Image.Image:
    """図鑑・カード用の正方形サムネイル。花の上部を切り出す。"""
    r = recipe.head_r
    cx, cy = HEAD_CENTER
    if recipe.head in ("spike", "eucalyptus"):
        half = max(r * 1.5, recipe.opts.get("height", 520) * 0.42)
        cy = HEAD_CENTER[1] + half * 0.28
    else:
        half = r * 1.42
    box = (int(cx - half), int(max(0, cy - half)), int(cx + half), int(cy + half))
    crop = stem_img.crop(box)
    inner = THUMB_SIZE[0] - 48
    crop = crop.resize((inner, inner), Image.LANCZOS)
    out = Image.new("RGBA", THUMB_SIZE, (0, 0, 0, 0))
    out.alpha_composite(crop, dest=(24, 24))
    return out
