"""ラッピングペーパー・リボン・お客様・UIテクスチャ。

サイズと命名は IMAGE_ASSETS.md に従う。
  wrap_<id>.png            1200 x 1200
  ribbon_<id>.png          800 x 500（結び目の中心 = 400,250）
  customer_<id>_<mood>.png 900 x 1200（顔の中心 = 450,430）
"""

from __future__ import annotations

import math
import random

from PIL import Image, ImageDraw, ImageFilter

from .paint import (RGB, draw_blob, draw_petal, hex_rgb, jitter,
                    linear_gradient, mix, paper_texture, rotate_points, shade)

WRAP_SIZE = (1200, 1200)
RIBBON_SIZE = (800, 500)
CUSTOMER_SIZE = (900, 1200)

# ラッピング（実物の花屋を参考にした質感）
WRAPS: dict[str, dict] = {
    "kraft":     dict(color="#C4A578", edge="#A98A5D", alpha=255, fiber=0.55, name="クラフト紙"),
    "dustypink": dict(color="#E0B3B8", edge="#C89298", alpha=255, fiber=0.30, name="くすみピンク"),
    "navy":      dict(color="#4E5A70", edge="#3C465A", alpha=255, fiber=0.25, name="ネイビー"),
    "cream":     dict(color="#F0E4CE", edge="#D8C7AA", alpha=255, fiber=0.35, name="クリーム"),
    "washi":     dict(color="#EDE6D6", edge="#CFC4AE", alpha=248, fiber=0.75, name="和紙"),
    "organdy":   dict(color="#EFEFE6", edge="#DCDCD0", alpha=150, fiber=0.12, name="オーガンジー"),
}

RIBBONS: dict[str, dict] = {
    "satin_ivory":      dict(color="#F2E7D2", sheen=0.55, width=1.0),
    "satin_dustypink":  dict(color="#E4B6BE", sheen=0.55, width=1.0),
    "organdy_sage":     dict(color="#C3CFB8", sheen=0.22, width=1.15, alpha=170),
    "linen_brown":      dict(color="#B49476", sheen=0.16, width=0.9),
    "velvet_bordeaux":  dict(color="#8E5561", sheen=0.30, width=0.95),
}


# --------------------------------------------------------------------------
# ラッピングペーパー
# --------------------------------------------------------------------------

def render_wrap(wrap_id: str, seed: int = 0) -> Image.Image:
    """ブーケの下に敷く、円錐状に巻いた包み紙。"""
    cfg = WRAPS[wrap_id]
    rng = random.Random(seed + hash(wrap_id) % 5000)
    w, h = WRAP_SIZE
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    base = hex_rgb(cfg["color"])
    edge = hex_rgb(cfg["edge"])

    top_y, knot_y = int(h * 0.20), int(h * 0.90)
    half_top, half_knot = int(w * 0.42), int(w * 0.055)

    # 円錐を数枚の面に分けて、折り目ごとに明暗を付ける
    faces = 7
    for i in range(faces):
        t0, t1 = i / faces, (i + 1) / faces
        x0 = w / 2 + (t0 * 2 - 1) * half_top
        x1 = w / 2 + (t1 * 2 - 1) * half_top
        k0 = w / 2 + (t0 * 2 - 1) * half_knot
        k1 = w / 2 + (t1 * 2 - 1) * half_knot
        lift = math.sin(t0 * math.pi) * h * 0.045
        # 左上光源：左の面が明るく、右へ向かって落ちる
        tone = 0.20 - 0.34 * ((t0 + t1) / 2)
        face = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        ImageDraw.Draw(face).polygon(
            [(x0, top_y - lift), (x1, top_y - lift * 0.9), (k1, knot_y), (k0, knot_y)],
            fill=(*shade(jitter(base, rng, 5), tone), cfg["alpha"]))
        img = Image.alpha_composite(img, face.filter(ImageFilter.GaussianBlur(1.4)))

    d = ImageDraw.Draw(img)
    # 開口部の内側（少し暗い）と縁のうねり
    d.polygon([(w / 2 - half_top, top_y), (w / 2 + half_top, top_y),
               (w / 2 + half_top * 0.86, top_y + 46), (w / 2 - half_top * 0.86, top_y + 46)],
              fill=(*shade(edge, -0.22), cfg["alpha"]))
    for i in range(faces + 1):
        t = i / faces
        x = w / 2 + (t * 2 - 1) * half_top
        k = w / 2 + (t * 2 - 1) * half_knot
        d.line([(x, top_y - math.sin(t * math.pi) * h * 0.045), (k, knot_y)],
               fill=(*shade(edge, -0.12), int(cfg["alpha"] * 0.75)), width=3)

    # 紙の繊維
    if cfg["fiber"] > 0:
        fib = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        fd = ImageDraw.Draw(fib)
        for _ in range(int(340 * cfg["fiber"])):
            x = rng.uniform(w * 0.08, w * 0.92)
            y = rng.uniform(top_y, knot_y)
            ln = rng.uniform(20, 130)
            a = rng.uniform(-70, 70)
            p = rotate_points([(0, 0), (ln, 0)], a, (x, y))
            fd.line(p, fill=(*shade(edge, -0.16), 40), width=1)
        img = Image.alpha_composite(img, fib.filter(ImageFilter.GaussianBlur(0.8)))

    # 結び目のくびれの影
    sh = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ImageDraw.Draw(sh).ellipse([w / 2 - half_knot * 3.4, knot_y - 90,
                                w / 2 + half_knot * 3.4, knot_y + 20],
                               fill=(80, 64, 52, 70))
    img = Image.alpha_composite(img, sh.filter(ImageFilter.GaussianBlur(26)))
    return paper_texture(img, seed=seed + 3, strength=0.09)


# --------------------------------------------------------------------------
# リボン
# --------------------------------------------------------------------------

def render_ribbon(ribbon_id: str, seed: int = 0) -> Image.Image:
    """結び目の中心が (400, 250) のリボン。"""
    cfg = RIBBONS[ribbon_id]
    rng = random.Random(seed + hash(ribbon_id) % 5000)
    w, h = RIBBON_SIZE
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    base = hex_rgb(cfg["color"])
    alpha = cfg.get("alpha", 255)
    cx, cy = w / 2, h / 2
    sw = cfg["width"]

    def loop(side: int) -> None:
        lw, lh = 150 * sw, 96 * sw
        lx = cx + side * 108 * sw
        layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        ld = ImageDraw.Draw(layer)
        tone = 0.16 if side < 0 else -0.10   # 左が受光側
        ld.polygon([(cx, cy), (lx - lw * 0.5, cy - lh), (lx + lw * 0.55, cy - lh * 0.35),
                    (lx + lw * 0.35, cy + lh * 0.55), (cx, cy + 8)],
                   fill=(*shade(base, tone), alpha))
        layer = layer.filter(ImageFilter.GaussianBlur(1.6))
        img.alpha_composite(layer)
        # サテンの艶
        if cfg["sheen"] > 0:
            gl = Image.new("RGBA", (w, h), (0, 0, 0, 0))
            ImageDraw.Draw(gl).ellipse([lx - lw * 0.30, cy - lh * 0.72,
                                        lx + lw * 0.10, cy - lh * 0.18],
                                       fill=(255, 253, 246, int(150 * cfg["sheen"])))
            img.alpha_composite(gl.filter(ImageFilter.GaussianBlur(14)))

    def tail(side: int) -> None:
        layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        ld = ImageDraw.Draw(layer)
        tip_x = cx + side * (78 + rng.uniform(0, 30)) * sw
        tip_y = cy + 190 * sw
        ld.polygon([(cx - 12, cy + 4), (cx + 12, cy + 4),
                    (tip_x + 30 * sw, tip_y), (tip_x + 6 * sw, tip_y - 26 * sw),
                    (tip_x - 22 * sw, tip_y)],
                   fill=(*shade(base, 0.06 if side < 0 else -0.14), alpha))
        img.alpha_composite(layer.filter(ImageFilter.GaussianBlur(1.5)))

    tail(-1)
    tail(1)
    loop(-1)
    loop(1)

    knot = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ImageDraw.Draw(knot).ellipse([cx - 34 * sw, cy - 26 * sw, cx + 34 * sw, cy + 26 * sw],
                                 fill=(*shade(base, -0.06), alpha))
    ImageDraw.Draw(knot).ellipse([cx - 22 * sw, cy - 20 * sw, cx + 4 * sw, cy - 2 * sw],
                                 fill=(255, 253, 246, int(120 * cfg["sheen"])))
    img.alpha_composite(knot.filter(ImageFilter.GaussianBlur(2.2)))
    return paper_texture(img, seed=seed + 4, strength=0.07)


# --------------------------------------------------------------------------
# お客様
# --------------------------------------------------------------------------

def render_customer(spec: dict, mood: str, seed: int = 0) -> Image.Image:
    """やわらかな水彩のバストアップ。どの表情も穏やかであること。"""
    rng = random.Random(seed + hash(spec["id"] + mood) % 9000)
    w, h = CUSTOMER_SIZE
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    fx, fy = 450, 430                       # 顔の中心（仕様）
    skin = hex_rgb(spec.get("skin", "#F2D9C4"))
    hair = hex_rgb(spec["hair"])
    cloth = hex_rgb(spec["cloth"])
    face_r = 128

    # 体
    body = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    bd = ImageDraw.Draw(body)
    # 首 → 肩 → 腕。なで肩でやわらかい輪郭にする。
    bd.ellipse([fx - 46, fy + 92, fx + 46, fy + 196], fill=(*shade(skin, -0.05), 255))
    bd.polygon([(fx - 300, h), (fx - 286, fy + 340), (fx - 214, fy + 214),
                (fx - 96, fy + 158), (fx + 96, fy + 158), (fx + 214, fy + 214),
                (fx + 286, fy + 340), (fx + 300, h)],
               fill=(*cloth, 255))
    bd.ellipse([fx - 300, fy + 300, fx - 176, h], fill=(*cloth, 255))
    bd.ellipse([fx + 176, fy + 300, fx + 300, h], fill=(*cloth, 255))
    bd.ellipse([fx - 118, fy + 150, fx + 118, fy + 260], fill=(*cloth, 255))
    body = body.filter(ImageFilter.GaussianBlur(2.4))
    img.alpha_composite(body)
    # 服の陰（右下）
    sh = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ImageDraw.Draw(sh).polygon([(fx + 40, h), (fx + 120, fy + 170), (fx + 250, h)],
                               fill=(*shade(cloth, -0.22), 150))
    img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(26)))

    # 後ろ髪
    back = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ImageDraw.Draw(back).ellipse(
        [fx - face_r - 24, fy - face_r - 40, fx + face_r + 24, fy + face_r * 0.30 + spec.get("hair_len", 210)],
        fill=(*shade(hair, -0.10), 255))
    img.alpha_composite(back.filter(ImageFilter.GaussianBlur(3.0)))

    # 顔
    face = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ImageDraw.Draw(face).ellipse([fx - face_r * 0.88, fy - face_r,
                                  fx + face_r * 0.88, fy + face_r * 1.12],
                                 fill=(*skin, 255))
    img.alpha_composite(face.filter(ImageFilter.GaussianBlur(2.6)))
    # 左上からの光
    hi = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ImageDraw.Draw(hi).ellipse([fx - face_r * 0.8, fy - face_r * 0.9,
                                fx + face_r * 0.1, fy + face_r * 0.1],
                               fill=(*shade(skin, 0.30), 120))
    img.alpha_composite(hi.filter(ImageFilter.GaussianBlur(30)))

    # 前髪
    fringe = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    fd = ImageDraw.Draw(fringe)
    fd.ellipse([fx - face_r - 14, fy - face_r - 34, fx + face_r + 14, fy + face_r * 0.28],
               fill=(*hair, 255))
    fd.ellipse([fx - face_r * 0.52, fy - face_r * 0.52, fx + face_r * 0.62, fy + face_r * 0.42],
               fill=(0, 0, 0, 0))
    fringe = fringe.filter(ImageFilter.GaussianBlur(3.2))
    img.alpha_composite(fringe)
    # 髪の艶
    gl = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ImageDraw.Draw(gl).ellipse([fx - face_r * 0.85, fy - face_r * 0.92,
                                fx - face_r * 0.10, fy - face_r * 0.62],
                               fill=(*shade(hair, 0.42), 130))
    img.alpha_composite(gl.filter(ImageFilter.GaussianBlur(16)))

    # 表情（穏やかな線だけで描く）
    fd = ImageDraw.Draw(img)
    ink = shade(hair, -0.30)
    ex, ey, er = 52, 26, 30
    if mood == "smile":
        for side in (-1, 1):
            fd.arc([fx + side * ex - er, fy + ey - er, fx + side * ex + er, fy + ey + er],
                   start=196, end=344, fill=(*ink, 235), width=7)
        fd.arc([fx - 34, fy + 68, fx + 34, fy + 116], start=8, end=172,
               fill=(*shade(hex_rgb("#C97F80"), -0.1), 220), width=6)
    else:
        for side in (-1, 1):
            fd.ellipse([fx + side * ex - 15, fy + ey - 19, fx + side * ex + 15, fy + ey + 19],
                       fill=(*ink, 225))
            fd.ellipse([fx + side * ex - 9, fy + ey - 15, fx + side * ex + 1, fy + ey - 5],
                       fill=(255, 253, 246, 200))
            fd.arc([fx + side * ex - 22, fy + ey - 40, fx + side * ex + 22, fy + ey - 4],
                   start=190, end=350, fill=(*ink, 200), width=5)
        fd.arc([fx - 26, fy + 72, fx + 26, fy + 104], start=14, end=166,
               fill=(*shade(hex_rgb("#C97F80"), -0.1), 200), width=5)
    # 頬
    for side in (-1, 1):
        draw_blob(img, (fx + side * 92, fy + 52), 30, 20, hex_rgb("#EEB3AE"), rng,
                  softness=13, bleed=0.0)

    return paper_texture(img, seed=seed + 6, strength=0.06)


# --------------------------------------------------------------------------
# UI テクスチャ
# --------------------------------------------------------------------------

def render_ui_paper(seed: int = 0) -> Image.Image:
    rng = random.Random(seed + 300)
    size = (1024, 1024)
    img = linear_gradient(size, hex_rgb("#FBF5E9"), hex_rgb("#F2E9D8")).convert("RGBA")
    d = ImageDraw.Draw(img)
    for _ in range(900):
        x, y = rng.uniform(0, size[0]), rng.uniform(0, size[1])
        r = rng.uniform(1, 3.4)
        d.ellipse([x - r, y - r, x + r, y + r],
                  fill=(*jitter(hex_rgb("#E3D7C2"), rng, 10), rng.randint(20, 60)))
    return paper_texture(img.filter(ImageFilter.GaussianBlur(0.7)), seed=seed, strength=0.14)


def render_wood_sign(seed: int = 0) -> Image.Image:
    rng = random.Random(seed + 400)
    w, h = 900, 320
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([10, 10, w - 10, h - 10], radius=34, fill=hex_rgb("#C09A6E"))
    for _ in range(60):
        y = rng.uniform(20, h - 20)
        d.line([rng.uniform(0, w * 0.5), y, rng.uniform(w * 0.5, w), y + rng.uniform(-4, 4)],
               fill=shade(hex_rgb("#C09A6E"), -0.10 - rng.random() * 0.14), width=2)
    d.rounded_rectangle([10, 10, w - 10, h - 10], radius=34,
                        outline=shade(hex_rgb("#C09A6E"), -0.28), width=6)
    hi = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ImageDraw.Draw(hi).rounded_rectangle([18, 16, w - 60, h * 0.5], radius=30,
                                         fill=(255, 250, 236, 44))
    img = Image.alpha_composite(img.filter(ImageFilter.GaussianBlur(1.2)),
                                hi.filter(ImageFilter.GaussianBlur(22)))
    return paper_texture(img, seed=seed, strength=0.10)


def render_chalk_board(seed: int = 0) -> Image.Image:
    rng = random.Random(seed + 500)
    w, h = 900, 600
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([0, 0, w, h], radius=18, fill=hex_rgb("#A8845C"))
    d.rounded_rectangle([34, 34, w - 34, h - 34], radius=8, fill=hex_rgb("#4C534E"))
    for _ in range(260):
        x, y = rng.uniform(40, w - 40), rng.uniform(40, h - 40)
        r = rng.uniform(2, 9)
        d.ellipse([x - r, y - r, x + r, y + r], fill=(226, 224, 214, rng.randint(6, 22)))
    img = img.filter(ImageFilter.GaussianBlur(1.1))
    return paper_texture(img, seed=seed, strength=0.10)
