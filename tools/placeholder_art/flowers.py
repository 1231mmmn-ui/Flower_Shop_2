"""21種の切り花を水彩タッチで描く。

構図は IMAGE_ASSETS.md §1 の規定に従う。
  assets/flowers/<id>.png : 1024 x 1024・透過PNG
  茎付きの1本の花。画像の下端近くまで茎が伸びていて、下端中央が切り口。
  ブーケはこの切り口を軸に、扇状へ回して重ねる。
"""

from __future__ import annotations

import math
import random
from dataclasses import dataclass, field

from PIL import Image, ImageDraw

from .paint import (RGB, bezier, draw_blob, draw_leaf, draw_petal, draw_stem,
                    hex_rgb, jitter, mix, paper_texture, rotate_points, shade,
                    stamp)

FLOWER_SIZE = (1024, 1024)
HEAD_CENTER = (512.0, 320.0)   # 花の中心。ここを軸に花の頭を描く
SS = 2                          # スーパーサンプリング


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
                calyx: RGB | None = None, rings: int = 4, tip: float = 0.40,
                waist: float = 1.45, sway: float = 12.0) -> None:
    """カーネーション・ダリア。細かい花びらが幾重にも寄った塊。

    tip を大きくすると先のとがった花びら（ダリア）になる。
    """
    for k in range(rings):
        scale = 1.0 - (0.76 / rings) * k
        n = max(6, int(petals * scale / 2.4))
        for i in range(n):
            a = 360 * i / n + rng.uniform(-sway, sway) + k * 19
            draw_petal(layer, c, a,
                       r * scale * 0.74 * rng.uniform(0.86, 1.12),
                       r * scale * 0.40 * rng.uniform(0.80, 1.25),
                       shade(petal, -0.06 + 0.14 * k), shade(petal_tip, 0.06 * k), rng,
                       tip=tip, waist=waist, offset=r * scale * 0.16, veins=False,
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


def head_tulip(layer, c, r, petal: RGB, petal_tip: RGB, rng) -> None:
    """チューリップ。閉じたままの、卵形のカップ。"""
    # 奥の花びら → 手前の花びら の順に重ねる
    for i, (ang, w, h, tone) in enumerate((
        (-26, 0.62, 1.02, -0.14),
        (26, 0.62, 1.02, -0.10),
        (0, 0.74, 1.10, 0.04),
        (-13, 0.44, 0.94, 0.10),
        (13, 0.44, 0.92, -0.04),
    )):
        draw_petal(layer, (c[0], c[1] + r * 0.42), ang + rng.uniform(-3, 3),
                   r * h * rng.uniform(0.96, 1.04), r * w * rng.uniform(0.94, 1.06),
                   shade(petal, tone - 0.06), shade(petal_tip, tone + 0.08), rng,
                   tip=0.50, waist=1.32, veins=False, curl=rng.uniform(-0.2, 0.2))
    # 花のつけ根。花びらの陰になるので、控えめに置く
    draw_blob(layer, (c[0], c[1] + r * 0.52), r * 0.20, r * 0.14,
              shade(petal, -0.24), rng, softness=2.6)


def head_bells(layer, c, r, petal: RGB, petal_tip: RGB, rng, count: int = 4,
               stalk: RGB | None = None) -> None:
    """リンドウ。上を向いた細長い釣鐘が、寄り集まって咲く。"""
    root = (c[0], c[1] + r * 0.78)
    for i in range(count):
        t = i / max(1, count - 1)
        lean = (t * 2 - 1) * 26 + rng.uniform(-6, 6)
        x = c[0] + (t * 2 - 1) * r * 0.44
        y = c[1] + abs(t * 2 - 1) * r * 0.34 + rng.uniform(-r * 0.06, r * 0.06)
        length = r * rng.uniform(0.86, 1.06)
        tone = 0.10 - 0.16 * abs(t * 2 - 1)
        if stalk:
            draw_stem(layer, bezier(root, ((root[0] + x) / 2, y + length * 0.7),
                                    (x, y + length * 0.60), 16),
                      r * 0.05, r * 0.07, stalk, rng)
        # 筒の部分
        draw_petal(layer, (x, y + length * 0.42), lean, length,
                   r * 0.34, shade(petal, tone - 0.10), shade(petal_tip, tone), rng,
                   tip=0.62, waist=1.20, veins=True)
        # 先の開き
        for k in (-1, 0, 1):
            draw_petal(layer, (x + math.sin(math.radians(lean)) * length * 0.5,
                               y - math.cos(math.radians(lean)) * length * 0.42),
                       lean + k * 26, r * 0.34, r * 0.20,
                       shade(petal, tone - 0.04), shade(petal_tip, tone + 0.10), rng,
                       tip=0.68, waist=1.0, veins=False)


def head_star(layer, c, r, petal: RGB, petal_tip: RGB, center: RGB, rng,
              points: int = 7, inner: RGB | None = None) -> None:
    """ポインセチア。星の形に開いた苞（ほう）と、内側の小さな粒。"""
    for ring, (scale, n, tone) in enumerate((
        (1.00, points, -0.10), (0.66, max(4, points - 2), 0.06))):
        rot = rng.uniform(0, 360 / n) + ring * (180 / n)
        col = inner if (ring and inner) else petal
        for i in range(n):
            a = 360 * i / n + rot + rng.uniform(-5, 5)
            tip_col = shade(col, 0.18) if (ring and inner) else petal_tip
            draw_petal(layer, c, a, r * scale * rng.uniform(0.90, 1.08),
                       r * scale * 0.40 * rng.uniform(0.88, 1.12),
                       shade(col, tone - 0.06), shade(tip_col, tone + 0.06), rng,
                       tip=1.05, waist=0.86, offset=r * 0.10, veins=True)
    for i in range(7):
        a = math.radians(360 * i / 7 + rng.uniform(-10, 10))
        rad = r * 0.13
        draw_blob(layer, (c[0] + math.cos(a) * rad, c[1] + math.sin(a) * rad),
                  r * 0.06, r * 0.055, center, rng, softness=1.0, highlight=0.3)


def head_narcissus(layer, c, r, petal: RGB, petal_tip: RGB, cup: RGB, rng) -> None:
    """スイセン。6枚の白い花びらの中心に、短い筒がひとつ。"""
    rot = rng.uniform(0, 60)
    for i in range(6):
        a = 360 * i / 6 + rot + rng.uniform(-5, 5)
        draw_petal(layer, c, a, r * rng.uniform(0.92, 1.06), r * 0.52,
                   shade(petal, -0.06), petal_tip, rng,
                   tip=0.66, waist=1.16, offset=r * 0.16, curl=rng.uniform(-0.2, 0.2))
    draw_blob(layer, c, r * 0.32, r * 0.30, cup, rng, softness=2.0, highlight=0.34)
    draw_blob(layer, c, r * 0.22, r * 0.20, shade(cup, -0.22), rng, softness=2.4)


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
    """かすみ草。細い枝先に小さな白い花がふわりと散る。

    棚では、穂もの（デルフィニウム）と「小花の集まり」として似て見えてしまう。
    見分けの手がかりは外周だけなので、**横に広く、縦に低い雲**に寄せてある。
    """
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
        # 横に広く、縦に低く。穂ものと逆の輪郭にして、棚でも取り違えないようにする。
        x = c[0] + math.cos(a) * rad * r * spread[0] * 1.18
        y = c[1] + math.sin(a) * rad * r * spread[1] * 0.66
        d = r * dot * rng.uniform(0.7, 1.3)
        col = shade(color, 0.10 - 0.20 * rad)
        for k in range(5):
            draw_petal(layer, (x, y), 72 * k + rng.uniform(0, 40), d, d * 0.9,
                       col, shade(col, 0.16), rng, tip=0.42, waist=1.6, veins=False)


def head_spike(layer, c, r, palette: list[RGB], rng, height: float, count: int = 42,
               floret: float = 0.16, petals: int = 5) -> None:
    """デルフィニウム・スターチス。穂状に上へ伸びる花。

    棚の大きさ（画面幅の26%ほど）では、細部は一切見えない。
    そこで見分けられるかは、**外周のかたち**だけで決まる。
    かすみ草と混同されないよう、幅を絞って「細く高い柱」に寄せてある。
    """
    for i in range(count):
        t = i / max(1, count - 1)
        y = c[1] + height * 0.5 - height * t
        # 左右への散らばりを抑える（前は r いっぱいまで広がって、雲に見えていた）
        spread = r * 0.62 * (1.0 - 0.55 * t) * rng.uniform(-1.0, 1.0)
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
                # ユーカリは、葉そのものが主役の一本。
                # ここは draw_petal を直に呼んでいるので、葉の直しが
                # 届いていなかった（緑の輝度が 21種のうちここだけ ±0.0 だった）。
                # 枝の左右で片側が一枚も光を通していなかったのも同じ理由。
                draw_petal(layer, path[i], ang, lr * 2.0, lr * 1.65,
                           shade(leaf, -0.10), shade(leaf, 0.12), rng,
                           tip=0.36, waist=1.55, veins=True,
                           curl=rng.uniform(-0.2, 0.2),
                           translucency=0.70, through_floor=0.34,
                           through_lift=0.90, vein_leaf=True)


# --------------------------------------------------------------------------
# レシピ
# --------------------------------------------------------------------------

@dataclass
class Recipe:
    """1種類の花の描き方。id は IMAGE_ASSETS.md §1 の一覧と一致させる。"""

    id: str
    head: str
    palette: list[str]
    accent: str = "#F3E7C8"
    center: str = "#5A431E"
    stem: str = "#7E9463"
    leaf: str = "#6F8C58"
    head_r: float = 150.0            # 花の半径（1024角の基準）
    stem_w: tuple[float, float] = (16.0, 22.0)
    leaves: int = 3
    leaf_len: float = 190.0
    leaf_style: str = "oval"         # oval / blade / feather / none
    side_blooms: int = 0             # 主花のまわりに添える花
    bud: bool = True
    lean: float = 10.0               # 茎の傾き
    opts: dict = field(default_factory=dict)


RECIPES: dict[str, Recipe] = {
    "sunflower": Recipe(
        id="sunflower", head="daisy", palette=["#F2B825", "#E8A417"], accent="#FBE28C",
        center="#4A3416", stem="#7C9455", leaf="#5F7F41", head_r=232,
        stem_w=(20, 27), leaves=3, leaf_len=200, bud=False, lean=6,
        opts=dict(petals=26, rings=2, center_ratio=0.36, waist=1.0, tip=0.60)),
    "lisianthus": Recipe(
        id="lisianthus", head="cup", palette=["#8C79C6", "#7A66B8"], accent="#E5DEF4",
        center="#EDE7A9", stem="#8AA06C", leaf="#7B9463", head_r=170,
        stem_w=(13, 18), leaves=2, leaf_len=145, side_blooms=2, lean=12),
    "lily": Recipe(
        id="lily", head="trumpet", palette=["#FBF6EA", "#F3EAD6"], accent="#FFFDF6",
        center="#D9922F", stem="#7E9A5E", leaf="#5F8149", head_r=216,
        stem_w=(17, 23), leaves=4, leaf_len=195, side_blooms=1, lean=8,
        opts=dict(stamen="#D9922F")),
    "carnation": Recipe(
        id="carnation", head="ruffle", palette=["#EE8AAA", "#E5729A"], accent="#F8C3D4",
        center="#E5729A", stem="#93A87A", leaf="#8CA378", head_r=176,
        stem_w=(14, 19), leaves=2, leaf_len=150, side_blooms=2, lean=11,
        opts=dict(calyx="#93A87A")),
    "delphinium": Recipe(
        id="delphinium", head="spike", palette=["#6E90D4", "#8AAAE4", "#5C7FC6"],
        accent="#DCE6F7", center="#F2F0E2", stem="#88A06A", leaf="#75904F",
        head_r=120, stem_w=(13, 18), leaves=2, leaf_len=140, bud=False, lean=7,
        opts=dict(height=560, count=58, floret=0.20)),
    "gypsophila": Recipe(
        id="gypsophila", head="spray", palette=["#FFFDF7", "#F6F1E6"], accent="#FFFFFF",
        center="#F0EAD8", stem="#9FB183", leaf="#93A878", head_r=252,
        stem_w=(9, 13), leaves=1, leaf_len=100, bud=False, lean=6,
        opts=dict(count=170, dot=0.050)),
    "rose": Recipe(
        id="rose", head="rose", palette=["#EE93AB", "#E67C99"], accent="#FADCE3",
        center="#D96A8C", stem="#82986A", leaf="#5E7C4A", head_r=188,
        stem_w=(16, 21), leaves=3, leaf_len=165, lean=9),
    "hydrangea": Recipe(
        id="hydrangea", head="dome", palette=["#F3F5E9", "#E9EFDD", "#EAF0F4"],
        accent="#FFFFFF", center="#DDE3C4", stem="#7F9A63", leaf="#5E7F48",
        head_r=232, stem_w=(19, 25), leaves=3, leaf_len=200, bud=False, lean=8,
        opts=dict(florets=40, center="#E4DFB6")),
    "gerbera": Recipe(
        id="gerbera", head="daisy", palette=["#F0879C", "#EE9A88"], accent="#F9CFD3",
        center="#C9678A", stem="#8CA36E", leaf="#7C9560", head_r=208,
        stem_w=(15, 20), leaves=1, leaf_len=130, bud=False, lean=10,
        opts=dict(petals=30, rings=2, center_ratio=0.26, waist=1.15, tip=0.70)),
    "alstroemeria": Recipe(
        id="alstroemeria", head="trumpet", palette=["#F4DC93", "#EFD07D"], accent="#FBF1C9",
        center="#C98A3C", stem="#8AA36C", leaf="#7A9459", head_r=150,
        stem_w=(12, 17), leaves=3, leaf_len=140, side_blooms=3, lean=13,
        opts=dict(speckle="#B5713A", stamen="#C98A3C")),
    "statice": Recipe(
        id="statice", head="spike", palette=["#8E7BC8", "#A28FD4", "#7C6ABA"],
        accent="#E2DAF2", center="#FBF7E8", stem="#93A87A", leaf="#8AA070",
        head_r=156, stem_w=(12, 17), leaves=1, leaf_len=110, bud=False, lean=9,
        opts=dict(height=400, count=56, floret=0.15, petals=5)),
    "eucalyptus": Recipe(
        id="eucalyptus", head="eucalyptus", palette=["#A8BCA2", "#B8C9AF"],
        accent="#CBD8C2", center="#8FA588", stem="#7E9276", leaf="#A8BCA2",
        head_r=190, stem_w=(11, 16), leaves=0, leaf_len=0, leaf_style="none",
        bud=False, lean=10, opts=dict(height=560)),

    # ---- ここから、季節をひろげる9種 ----
    "tulip": Recipe(
        id="tulip", head="tulip", palette=["#EE9BB4", "#E4859F"], accent="#F8D2DC",
        center="#D9789A", stem="#7E9A5E", leaf="#6E8C52", head_r=208,
        stem_w=(17, 22), leaves=2, leaf_len=250, leaf_style="blade",
        bud=False, lean=9),
    "sweetpea": Recipe(
        id="sweetpea", head="cup", palette=["#F4C6D4", "#EEB0C4"], accent="#FDECF1",
        center="#E7A8BE", stem="#93A87A", leaf="#87A06C", head_r=126,
        stem_w=(10, 14), leaves=2, leaf_len=120, side_blooms=3, lean=14),
    "ranunculus": Recipe(
        id="ranunculus", head="rose", palette=["#EE9A55", "#E8873E"], accent="#F8CE9C",
        center="#D2762F", stem="#88A06A", leaf="#6F8C58", head_r=180,
        stem_w=(15, 20), leaves=2, leaf_len=150, side_blooms=1, lean=11),
    "cosmos": Recipe(
        id="cosmos", head="daisy", palette=["#E894B4", "#E07FA6"], accent="#F8D4E2",
        center="#E9C55E", stem="#8CA36E", leaf="#7E9861", head_r=168,
        stem_w=(10, 14), leaves=3, leaf_len=150, leaf_style="feather",
        side_blooms=1, lean=15,
        opts=dict(petals=8, rings=1, center_ratio=0.24, waist=1.55, tip=0.44)),
    "dahlia": Recipe(
        id="dahlia", head="ruffle", palette=["#A2313F", "#8E2938"], accent="#C86274",
        center="#7A2333", stem="#7C9455", leaf="#5F7F41", head_r=204,
        stem_w=(17, 23), leaves=2, leaf_len=160, bud=True, lean=8,
        opts=dict(petals=58, rings=5, tip=1.15, waist=0.92, sway=6)),
    "gentian": Recipe(
        id="gentian", head="bells", palette=["#5B62A8", "#4E5596"], accent="#9AA0D2",
        center="#EFEAD6", stem="#7E9463", leaf="#6B8A52", head_r=156,
        stem_w=(12, 17), leaves=3, leaf_len=130, bud=False, lean=7,
        opts=dict(count=4)),
    "anemone": Recipe(
        id="anemone", head="daisy", palette=["#8A63B0", "#7C56A2"], accent="#C7AEDA",
        center="#3A3038", stem="#7E9463", leaf="#6B8A52", head_r=170,
        stem_w=(13, 18), leaves=2, leaf_len=130, leaf_style="feather",
        bud=False, lean=11,
        opts=dict(petals=8, rings=1, center_ratio=0.30, waist=1.62, tip=0.42)),
    "poinsettia": Recipe(
        id="poinsettia", head="star", palette=["#C0453F", "#AE3A36"], accent="#E08A76",
        center="#E4C154", stem="#7C9455", leaf="#5F7F41", head_r=206,
        stem_w=(16, 22), leaves=2, leaf_len=170, bud=False, lean=8,
        opts=dict(points=7, inner="#8FA05A")),
    "narcissus": Recipe(
        id="narcissus", head="narcissus", palette=["#FBF6E6", "#F3EDD8"], accent="#FFFDF4",
        center="#E8A63C", stem="#7E9A5E", leaf="#6E8C52", head_r=150,
        stem_w=(13, 18), leaves=2, leaf_len=250, leaf_style="blade",
        side_blooms=1, bud=False, lean=8),
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
                    petals=o.get("petals", 46), rings=o.get("rings", 4),
                    tip=o.get("tip", 0.40), waist=o.get("waist", 1.45),
                    sway=o.get("sway", 12.0),
                    calyx=hex_rgb(o["calyx"]) if "calyx" in o else None)
    elif recipe.head == "trumpet":
        head_trumpet(layer, c, r, main, accent, rng,
                     stamen=hex_rgb(o["stamen"]) if "stamen" in o else None,
                     speckle=hex_rgb(o["speckle"]) if "speckle" in o else None)
    elif recipe.head == "cup":
        head_cup(layer, c, r, main, accent, rng, center=hex_rgb(recipe.center))
    elif recipe.head == "tulip":
        head_tulip(layer, c, r, main, accent, rng)
    elif recipe.head == "bells":
        head_bells(layer, c, r, main, accent, rng, count=o.get("count", 4),
                   stalk=hex_rgb(recipe.stem))
    elif recipe.head == "star":
        head_star(layer, c, r, main, accent, hex_rgb(recipe.center), rng,
                  points=o.get("points", 7),
                  inner=hex_rgb(o["inner"]) if "inner" in o else None)
    elif recipe.head == "narcissus":
        head_narcissus(layer, c, r, main, accent, hex_rgb(recipe.center), rng)
    elif recipe.head == "dome":
        head_dome(layer, c, r, pal, rng, florets=o.get("florets", 34),
                  center=hex_rgb(o["center"]) if "center" in o else None)
    elif recipe.head == "spray":
        head_spray(layer, c, r, main, rng, count=o.get("count", 120),
                   dot=o.get("dot", 0.055), stem_color=hex_rgb(recipe.stem))
    elif recipe.head == "spike":
        head_spike(layer, c, r, pal, rng, height=o.get("height", 460) * scale,
                   count=o.get("count", 42), floret=o.get("floret", 0.16),
                   petals=o.get("petals", 5))
    elif recipe.head == "eucalyptus":
        head_eucalyptus(layer, c, r, main, rng, height=o.get("height", 560) * scale)


def _draw_leaves(layer, recipe: Recipe, path, rng: random.Random, scale: float) -> None:
    """
    茎に沿って葉をつける。葉のかたちは花ごとに変える。

    **左右対称にしないこと。**

    もとは `side = -1 if i % 2 == 0 else 1` と、高さもほぼ等間隔でした。
    葉が2枚の花（21種のうち7種）では、ほぼ同じ高さに左右1枚ずつ ──
    つまり**きれいな一対**になり、押し花のように見えていました。
    実際の切り花で葉がそう並ぶことは、ほとんどありません。

    崩すのは3つだけです。高さ・角度・長さ。かたちは変えません。
    """
    leaf_col = hex_rgb(recipe.leaf)
    # 一枚めがどちら側から出るかは、花ごとに変わる。
    side = -1 if rng.random() < 0.5 else 1
    for i in range(recipe.leaves):
        # 高さは等間隔にしない。詰まるところと空くところを作る。
        t = 0.28 + 0.21 * i + rng.uniform(-0.09, 0.11)
        idx = min(len(path) - 2, int(len(path) * min(0.94, t)))
        px, py = path[idx]
        # 互生。ただし三枚に一枚くらいは、続けて同じ側から出る。
        if i > 0:
            side = side if rng.random() < 0.30 else -side
        length = recipe.leaf_len * SS * scale * rng.uniform(0.74, 1.22)

        if recipe.leaf_style == "blade":
            # チューリップ・スイセンの、茎に沿って立ち上がる細長い葉
            anchor = path[min(len(path) - 1, int(len(path) * (0.10 + 0.16 * i)))]
            draw_leaf(layer, anchor, side * rng.uniform(9, 20),
                      length * 1.55, length * 0.17 * rng.uniform(0.9, 1.2),
                      jitter(leaf_col, rng, 7), rng, tip=0.95,
                      curl=side * rng.uniform(0.4, 0.9))
        elif recipe.leaf_style == "feather":
            # コスモス・アネモネの、糸のように細かい葉
            for k in range(7):
                ang = side * rng.uniform(40, 96) + 180
                draw_leaf(layer, (px + rng.uniform(-6, 6), py + k * length * 0.10),
                          ang, length * rng.uniform(0.24, 0.42), length * 0.028,
                          jitter(leaf_col, rng, 8), rng, tip=1.4)
        else:
            # 角度の幅を広げる。52〜78°では、どの葉もほぼ同じ開きだった。
            # ただし 80°を超えると水平になる。切り花の葉が真横へまっすぐ
            # 伸びることは、ほとんどない。
            #
            # かたちも変える。これまでは付け根が真四角に切れた鈍いだるまで、
            # 茎のところに**縦の直線**が出ていた（葉柄がないので）。
            # 付け根を細く、いちばん広いところを中ほどに、先を尖らせる。
            # 帯状の葉（チューリップ）と糸状の葉（コスモス）は、
            # 付け根が広いのが正しいので、`waist` は既定のままにしてある。
            draw_leaf(layer, (px, py), side * rng.uniform(34, 80) + 180,
                      length, length * 0.34 * rng.uniform(0.78, 1.28),
                      jitter(leaf_col, rng, 7), rng,
                      tip=0.95, waist=0.88, curl=rng.uniform(-0.5, 0.5))


def render_flower(recipe: Recipe, seed: int = 0, scale: float = 1.0,
                  size: tuple[int, int] = FLOWER_SIZE,
                  head_center: tuple[float, float] = HEAD_CENTER,
                  base_x: float | None = None) -> Image.Image:
    """規定サイズの切り花1本。下端中央が切り口。"""
    rng = random.Random(seed)
    w, h = int(size[0] * SS), int(size[1] * SS)
    layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))

    # 花の中心と切り口はキャンバス座標そのまま。scale は花や茎の「太さ」だけに効く。
    cx, cy = head_center[0] * SS, head_center[1] * SS
    bx = (base_x if base_x is not None else size[0] / 2) * SS
    r = recipe.head_r * SS * scale
    stem_col = jitter(hex_rgb(recipe.stem), rng, 5)
    lean = recipe.lean * rng.uniform(0.6, 1.6) * rng.choice((-1, 1)) * SS

    # 茎。まっすぐには立てない。
    # 切り花はどれも少し反っていて、その反りが「どう立っているか」を作る。
    # 下半分でひと方向へ、上半分でわずかに戻す（ゆるいS）。
    mid_y = (h + cy) / 2
    lower = bezier((bx, h), (bx + lean * 2.4, mid_y + (h - mid_y) * 0.35),
                   (bx + lean * 1.6, mid_y), 24)
    upper = bezier((bx + lean * 1.6, mid_y), (bx + lean * 0.7, (mid_y + cy) / 2),
                   (cx, cy + r * 0.42), 26)
    path = lower + upper[1:]
    draw_stem(layer, path, recipe.stem_w[0] * SS * scale, recipe.stem_w[1] * SS * scale,
              stem_col, rng)

    # ここに切り口は描かない。
    # 仕様では茎は画像の下端で切れる構図（IMAGE_ASSETS.md §1）なので、
    # 切り口を置いても半分が画面外になり、店では花瓶の水に隠れてしまう。
    # 「切られた花」を見せるなら、カウンターに残った切り落とし（仕事の痕跡）のほう。

    if recipe.leaves and recipe.leaf_style != "none":
        _draw_leaves(layer, recipe, path, rng, scale)

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
        bud_c = mix(hex_rgb(recipe.palette[0]), hex_rgb(recipe.leaf), 0.45)
        draw_blob(layer, (bxx, byy), r * 0.17, r * 0.24, bud_c, rng, highlight=0.25)
        for k in range(3):
            draw_petal(layer, (bxx, byy + r * 0.16), 180 + (k - 1) * 34,
                       r * 0.30, r * 0.16, shade(hex_rgb(recipe.leaf), -0.1),
                       hex_rgb(recipe.leaf), rng, tip=0.6, waist=0.9, veins=False)

    # 主花
    _draw_head(layer, recipe, (cx, cy), r, rng, scale)

    layer = layer.resize(size, Image.LANCZOS)
    return paper_texture(layer, seed=seed, strength=0.07)
