"""水彩タッチの描画プリミティブ。

Flower Shop ～花咲く時間～ のプレースホルダ画像を生成するための共通の筆。
すべての素材はここにある筆だけで描く。光源は常に左上で統一する。
"""

from __future__ import annotations

import math
import random
from typing import Iterable, Sequence

from PIL import Image, ImageChops, ImageDraw, ImageFilter

# 光源方向（左上）。開発バイブルの指定で全素材共通。
LIGHT_ANGLE = -38.0  # 12時方向から時計回りの度数

RGB = tuple[int, int, int]


# --------------------------------------------------------------------------
# 色
# --------------------------------------------------------------------------

def hex_rgb(value: str) -> RGB:
    value = value.lstrip("#")
    return (int(value[0:2], 16), int(value[2:4], 16), int(value[4:6], 16))


def mix(a: RGB, b: RGB, t: float) -> RGB:
    t = max(0.0, min(1.0, t))
    return (
        round(a[0] + (b[0] - a[0]) * t),
        round(a[1] + (b[1] - a[1]) * t),
        round(a[2] + (b[2] - a[2]) * t),
    )


def shade(color: RGB, amount: float) -> RGB:
    """amount > 0 で明るく、< 0 で暗く。影はわずかに青紫へ転ぶ。"""
    if amount >= 0:
        return mix(color, (255, 251, 238), amount)
    return mix(color, (60, 48, 64), -amount)


def jitter(color: RGB, rng: random.Random, amount: int = 8) -> RGB:
    """明度だけを揺らす。色相がぶれると水彩ではなく色ムラに見えてしまう。"""
    d = rng.randint(-amount, amount)
    h = rng.randint(-amount // 3, amount // 3)
    return (max(0, min(255, color[0] + d + h)),
            max(0, min(255, color[1] + d)),
            max(0, min(255, color[2] + d - h)))


def lit_amount(angle: float) -> float:
    """左上光源に対して、その向きがどれだけ光を受けるか（-1〜1）。"""
    return math.cos(math.radians(angle - LIGHT_ANGLE))


# --------------------------------------------------------------------------
# 紙・にじみ
# --------------------------------------------------------------------------

_grain_cache: dict[tuple[int, int, int, int], Image.Image] = {}


def grain(size: tuple[int, int], seed: int = 0, scale: int = 4) -> Image.Image:
    """水彩紙のムラ。L モード、128 が中心。"""
    key = (size[0], size[1], seed, scale)
    cached = _grain_cache.get(key)
    if cached is not None:
        return cached
    rng = random.Random(seed)
    small = Image.new("L", (max(2, size[0] // scale), max(2, size[1] // scale)))
    small.putdata([rng.randint(100, 156) for _ in range(small.width * small.height)])
    tex = small.resize(size, Image.BICUBIC).filter(ImageFilter.GaussianBlur(1.1))
    if len(_grain_cache) < 64:
        _grain_cache[key] = tex
    return tex


def watercolor_mask(mask: Image.Image, seed: int, softness: float = 1.5,
                    bleed: float = 0.32) -> Image.Image:
    """輪郭をにじませ、顔料のムラを乗せたマスクを返す。"""
    soft = mask.filter(ImageFilter.GaussianBlur(softness))
    if bleed > 0:
        tex = grain(mask.size, seed=seed).point(
            lambda v: 255 if v >= 128 else int(255 - (128 - v) * bleed * 2.2))
        soft = ImageChops.multiply(soft, tex)
    return soft


def linear_gradient(size: tuple[int, int], start: RGB, end: RGB,
                    horizontal: bool = False) -> Image.Image:
    """start（上／左）から end（下／右）への線形グラデーション。"""
    w, h = size
    n = max(2, w if horizontal else h)
    strip = Image.new("RGB", (n, 1))
    strip.putdata([mix(start, end, i / (n - 1)) for i in range(n)])
    if horizontal:
        return strip.resize((w, h), Image.BILINEAR)
    return strip.transpose(Image.ROTATE_270).resize((w, h), Image.BILINEAR)


def radial_gradient(size: tuple[int, int], inner: RGB, outer: RGB,
                    steps: int = 48) -> Image.Image:
    """中心が inner、外周が outer。小さめに作って引き伸ばす。"""
    w, h = size
    n = min(steps, max(w, h))
    img = Image.new("RGB", (n, n), outer)
    d = ImageDraw.Draw(img)
    for i in range(n // 2, 0, -1):
        t = 1 - (i / (n / 2))
        d.ellipse([n / 2 - i, n / 2 - i, n / 2 + i, n / 2 + i], fill=mix(inner, outer, 1 - t))
    return img.resize(size, Image.BILINEAR)


# --------------------------------------------------------------------------
# 合成
# --------------------------------------------------------------------------

def stamp(layer: Image.Image, local: Image.Image, x: int, y: int) -> None:
    """local(RGBA) を layer の (x, y) にはみ出しを切り詰めて合成する。"""
    lw, lh = layer.size
    sw, sh = local.size
    sx0, sy0 = max(0, -x), max(0, -y)
    dx0, dy0 = max(0, x), max(0, y)
    dx1, dy1 = min(lw, x + sw), min(lh, y + sh)
    if dx1 <= dx0 or dy1 <= dy0:
        return
    crop = local.crop((sx0, sy0, sx0 + (dx1 - dx0), sy0 + (dy1 - dy0)))
    layer.alpha_composite(crop, dest=(dx0, dy0))


def _fill_local(size: tuple[int, int], mask: Image.Image, fill: Image.Image | RGB,
                seed: int, softness: float, bleed: float) -> Image.Image:
    local = Image.new("RGBA", size, (0, 0, 0, 0))
    m = watercolor_mask(mask, seed=seed, softness=softness, bleed=bleed)
    fill_img = Image.new("RGB", size, fill) if isinstance(fill, tuple) else fill
    local.paste(fill_img, (0, 0), m)
    return local


# --------------------------------------------------------------------------
# 形
# --------------------------------------------------------------------------

def petal_outline(length: float, width: float, tip: float = 0.55,
                  waist: float = 0.62, steps: int = 26) -> list[tuple[float, float]]:
    """付け根 (0,0) から先端 (0,-length) へ伸びる花びらの輪郭。"""
    right: list[tuple[float, float]] = []
    left: list[tuple[float, float]] = []
    for i in range(steps + 1):
        t = i / steps
        w = width * 0.5 * (math.sin(math.pi * (t ** waist)) ** tip)
        y = -length * t
        right.append((w, y))
        left.append((-w, y))
    return right + list(reversed(left))


def rotate_points(points: Iterable[tuple[float, float]], angle_deg: float,
                  origin: tuple[float, float] = (0.0, 0.0)) -> list[tuple[float, float]]:
    """12時方向から時計回りに angle_deg 回す。"""
    a = math.radians(angle_deg)
    ca, sa = math.cos(a), math.sin(a)
    ox, oy = origin
    return [(ox + x * ca - y * sa, oy + x * sa + y * ca) for x, y in points]


def bezier(p0: tuple[float, float], p1: tuple[float, float],
           p2: tuple[float, float], steps: int = 40) -> list[tuple[float, float]]:
    pts = []
    for i in range(steps + 1):
        t = i / steps
        u = 1 - t
        pts.append((u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
                    u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]))
    return pts


def tapered_band(path: Sequence[tuple[float, float]], w_start: float,
                 w_end: float) -> list[tuple[float, float]]:
    """パスに沿って太さの変わる帯（茎など）の輪郭。"""
    left: list[tuple[float, float]] = []
    right: list[tuple[float, float]] = []
    n = len(path)
    for i, (x, y) in enumerate(path):
        t = i / max(1, n - 1)
        w = (w_start + (w_end - w_start) * t) * 0.5
        if i == 0:
            dx, dy = path[1][0] - x, path[1][1] - y
        elif i == n - 1:
            dx, dy = x - path[-2][0], y - path[-2][1]
        else:
            dx, dy = path[i + 1][0] - path[i - 1][0], path[i + 1][1] - path[i - 1][1]
        ln = math.hypot(dx, dy) or 1.0
        nx, ny = -dy / ln, dx / ln
        left.append((x + nx * w, y + ny * w))
        right.append((x - nx * w, y - ny * w))
    return left + list(reversed(right))


# --------------------------------------------------------------------------
# 部品を描く
# --------------------------------------------------------------------------

def draw_petal(layer: Image.Image, center: tuple[float, float], angle: float,
               length: float, width: float, base: RGB, tip_color: RGB,
               rng: random.Random, tip: float = 0.55, waist: float = 0.62,
               veins: bool = True, offset: float = 0.0, curl: float = 0.0) -> None:
    """花びら1枚。angle は12時方向から時計回りの度数。"""
    ox = center[0] + math.sin(math.radians(angle)) * offset
    oy = center[1] - math.cos(math.radians(angle)) * offset

    r = int(length + width * 0.6) + 6
    size = (2 * r, 2 * r)
    outline = petal_outline(length, width, tip, waist)
    if curl:
        outline = [(x + curl * (-y / max(1.0, length)) ** 2 * width, y) for x, y in outline]
    shape = rotate_points(outline, angle, (r, r))

    mask = Image.new("L", size, 0)
    ImageDraw.Draw(mask).polygon(shape, fill=255)

    lit = lit_amount(angle)
    base_c = shade(jitter(base, rng, 5), -0.05 + 0.09 * lit)
    tip_c = shade(jitter(tip_color, rng, 7), 0.04 + 0.13 * lit)
    grad = linear_gradient(size, tip_c, base_c).rotate(-angle, Image.BILINEAR)

    local = _fill_local(size, mask, grad, rng.randint(0, 99999), 2.0, 0.24)

    if veins and length > 24:
        vein = Image.new("L", size, 0)
        vd = ImageDraw.Draw(vein)
        mid = rotate_points([(0, -length * 0.06), (0, -length * 0.88)], angle, (r, r))
        vd.line(mid, fill=34, width=max(1, int(width * 0.05)))
        for side in (-1, 1):
            for k in (0.36, 0.60, 0.80):
                seg = rotate_points(
                    [(0, -length * (k - 0.18)),
                     (side * width * 0.30 * (1 - k * 0.35), -length * (k + 0.08))],
                    angle, (r, r))
                vd.line(seg, fill=22, width=1)
        vein = ImageChops.multiply(vein.filter(ImageFilter.GaussianBlur(0.8)),
                                   mask.point(lambda v: 255 if v > 110 else 0))
        local.paste(Image.new("RGB", size, shade(base, -0.34)), (0, 0), vein)

    stamp(layer, local, int(ox - r), int(oy - r))


def draw_leaf(layer: Image.Image, center: tuple[float, float], angle: float,
              length: float, width: float, color: RGB, rng: random.Random,
              tip: float = 0.42, curl: float = 0.0) -> None:
    lit = lit_amount(angle)
    draw_petal(layer, center, angle, length, width,
               shade(color, -0.15 + 0.10 * lit), shade(color, 0.09 + 0.12 * lit),
               rng, tip=tip, waist=0.55, veins=True, curl=curl)


def draw_blob(layer: Image.Image, center: tuple[float, float], rx: float, ry: float,
              color: RGB, rng: random.Random, softness: float = 1.6,
              bleed: float = 0.3, highlight: float = 0.0) -> None:
    """丸いにじみ（小花・実・玉ボケなど）。"""
    # ぼかしが縁で切れて四角く見えないよう、softness に応じて余白を取る
    r = int(max(rx, ry) + softness * 3) + 6
    size = (2 * r, 2 * r)
    mask = Image.new("L", size, 0)
    ImageDraw.Draw(mask).ellipse([r - rx, r - ry, r + rx, r + ry], fill=255)
    grad = linear_gradient(size, shade(color, 0.16), shade(color, -0.14))
    local = _fill_local(size, mask, grad, rng.randint(0, 99999), softness, bleed)
    if highlight > 0:
        hi = Image.new("L", size, 0)
        ImageDraw.Draw(hi).ellipse(
            [r - rx * 0.55, r - ry * 0.62, r + rx * 0.05, r - ry * 0.10], fill=int(150 * highlight))
        hi = ImageChops.multiply(hi.filter(ImageFilter.GaussianBlur(rx * 0.35 + 1)), mask)
        local.paste(Image.new("RGB", size, shade(color, 0.55)), (0, 0), hi)
    stamp(layer, local, int(center[0] - r), int(center[1] - r))


def draw_stem(layer: Image.Image, path: Sequence[tuple[float, float]],
              w_top: float, w_bottom: float, color: RGB, rng: random.Random) -> None:
    xs = [p[0] for p in path]
    ys = [p[1] for p in path]
    pad = int(max(w_top, w_bottom)) + 8
    x0, y0 = int(min(xs)) - pad, int(min(ys)) - pad
    size = (int(max(xs) - min(xs)) + pad * 2, int(max(ys) - min(ys)) + pad * 2)
    local_path = [(x - x0, y - y0) for x, y in path]

    mask = Image.new("L", size, 0)
    ImageDraw.Draw(mask).polygon(tapered_band(local_path, w_top, w_bottom), fill=255)
    grad = linear_gradient(size, shade(color, 0.16), shade(color, -0.2), horizontal=True)
    local = _fill_local(size, mask, grad, rng.randint(0, 99999), 1.0, 0.2)

    hi = Image.new("L", size, 0)
    ImageDraw.Draw(hi).line([(x - w_top * 0.24, y) for x, y in local_path],
                            fill=64, width=max(1, int(w_top * 0.24)))
    hi = ImageChops.multiply(hi.filter(ImageFilter.GaussianBlur(1.4)), mask)
    local.paste(Image.new("RGB", size, shade(color, 0.45)), (0, 0), hi)
    stamp(layer, local, x0, y0)


def drop_shadow(layer: Image.Image, blur: float = 13, offset: tuple[int, int] = (9, 13),
                opacity: int = 58) -> Image.Image:
    """右下へ落ちる柔らかい影を敷いた新しいレイヤーを返す。"""
    alpha = layer.split()[3]
    sh = Image.new("RGBA", layer.size, (0, 0, 0, 0))
    sh.paste(Image.new("RGB", layer.size, (94, 76, 64)), offset,
             alpha.point(lambda v: int(v * opacity / 255)).filter(ImageFilter.GaussianBlur(blur)))
    return Image.alpha_composite(sh, layer)


def paper_texture(layer: Image.Image, seed: int, strength: float = 0.08) -> Image.Image:
    """仕上げに紙の粒子をうっすら乗せる。"""
    tex = grain(layer.size, seed=seed, scale=3).point(
        lambda v: int(255 - (128 - v) * strength * 2) if v < 128 else
        int(255 - (v - 128) * strength))
    rgb = Image.merge("RGB", [ImageChops.multiply(c, tex) for c in layer.split()[:3]])
    return Image.merge("RGBA", [*rgb.split(), layer.split()[3]])
