"""花瓶・カゴ・ラッピング資材・お客さま・温室。

サイズと置き場所は IMAGE_ASSETS.md の通り。
  assets/props/vase.png          512 x 512  透過
  assets/props/basket.png        512 x 512  透過
  assets/props/basket-full.png   512 x 512  透過
  assets/props/counter.jpg       512 x 512  タイル可（透過なし）
  assets/props/card-blank.png    512 x 384  透過
  assets/wrap/paper-<id>.png     512 x 512  透過（紙のロール）
  assets/wrap/ribbon-<id>.png    512 x 512  透過（リボンの巻き）
  assets/customers/<id>-<mood>.png 800 x 800 透過（バストアップ）
  assets/greenhouse/stage-<n>.png  512 x 512 透過
"""

from __future__ import annotations

import math
import random

from PIL import Image, ImageDraw, ImageFilter

from .paint import (RGB, draw_blob, draw_leaf, draw_petal, hex_rgb, jitter,
                    linear_gradient, mix, paper_texture, rotate_points, shade)

PROP_SIZE = (512, 512)
CARD_SIZE = (512, 384)
CUSTOMER_SIZE = (800, 800)

# ラッピング資材。id は IMAGE_ASSETS.md §6 の一覧。
PAPERS: dict[str, dict] = {
    "paper-kraft": dict(color="#C4A578", edge="#9A7B52", fiber=0.60),
    "paper-cream": dict(color="#F0E4CE", edge="#CFBD9E", fiber=0.35),
    "paper-pink": dict(color="#E0B3B8", edge="#BC8B92", fiber=0.30),
    "paper-sage": dict(color="#B3C0A6", edge="#8B9A7D", fiber=0.35),
    "paper-navy": dict(color="#4E5A70", edge="#333D4F", fiber=0.22),
    "paper-lilac": dict(color="#CBB9D6", edge="#A692B4", fiber=0.40),
}

RIBBONS: dict[str, dict] = {
    "ribbon-ivory": dict(color="#F2E7D2", edge="#D2C3A8", sheen=0.55),
    "ribbon-rose": dict(color="#DDA0A8", edge="#B87A83", sheen=0.55),
    "ribbon-gold": dict(color="#D6B26A", edge="#AE8B45", sheen=0.75),
    "ribbon-moss": dict(color="#9AA87E", edge="#77855E", sheen=0.20),
    "ribbon-blue": dict(color="#9AAEBE", edge="#75899A", sheen=0.40),
}

# id と人物像は IMAGE_ASSETS.md §4 の一覧。
CUSTOMER_SPECS = [
    dict(id="customer-01", hair="#5A4436", cloth="#E8C06A", skin="#F3DCC6",
         hair_len=170, note="よく笑う同僚。ビタミンカラーの服"),
    dict(id="customer-02", hair="#3B3029", cloth="#7E8C9A", skin="#EFD6BE",
         hair_len=54, note="落ち着いた雰囲気の男性"),
    dict(id="customer-03", hair="#54443A", cloth="#C9B79C", skin="#F2DAC4",
         hair_len=120, note="家族の世話を焼くのが好きな母"),
    dict(id="customer-04", hair="#9E9A93", cloth="#A8B4A2", skin="#F0DAC6",
         hair_len=70, note="和の趣味がある年配の女性"),
    dict(id="customer-05", hair="#4B3A30", cloth="#8FA0B8", skin="#F5DFCB",
         hair_len=210, note="春から進学する高校生"),
    dict(id="customer-06", hair="#6A5240", cloth="#B7AEC4", skin="#F2DAC4",
         hair_len=140, note="ひとり暮らしの人"),
    dict(id="customer-07", hair="#4A3B33", cloth="#AFBBA8", skin="#F1DAC5",
         hair_len=110, note="家族で新居に引っ越した夫婦の一方"),
    dict(id="customer-08", hair="#42352C", cloth="#93A88E", skin="#EDD4BB",
         hair_len=58, note="入院中の親友のお見舞いに"),
]


# --------------------------------------------------------------------------
# ガラスの花瓶
# --------------------------------------------------------------------------

def render_vase(seed: int = 0) -> Image.Image:
    """花なしの、水が少し入ったガラスの花瓶。店頭では花をこの上に重ねる。"""
    w, h = PROP_SIZE
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    top, bottom = int(h * 0.30), int(h * 0.95)
    half = int(w * 0.21)
    x0, x1 = w // 2 - half, w // 2 + half

    # 水（下へいくほど濃く）
    water_top = top + int((bottom - top) * 0.34)
    for i in range(12):
        d.rounded_rectangle([x0 + 4, water_top + (bottom - water_top) * i / 12,
                             x1 - 4, bottom - 5],
                            radius=18, fill=(204, 220, 210, 20))
    d.line([x0 + 8, water_top, x1 - 8, water_top], fill=(255, 255, 255, 170), width=3)

    # ガラス本体
    d.rounded_rectangle([x0, top, x1, bottom], radius=22,
                        fill=(236, 244, 240, 64), outline=(255, 255, 255, 225), width=5)
    d.rounded_rectangle([x0 + 6, top + 6, x1 - 6, bottom - 6], radius=17,
                        outline=(255, 255, 255, 84), width=2)
    # 口元
    d.ellipse([x0 - 4, top - 12, x1 + 4, top + 14], outline=(255, 255, 255, 225), width=5)
    d.ellipse([x0 + 7, top - 5, x1 - 7, top + 9], outline=(210, 226, 218, 140), width=2)
    # 左上光源の映り込み
    d.line([x0 + 15, top + 26, x0 + 15, bottom - 34], fill=(255, 255, 255, 205), width=10)
    d.line([x0 + 29, top + 40, x0 + 29, bottom - 58], fill=(255, 255, 255, 90), width=4)
    d.line([x1 - 17, top + 54, x1 - 17, bottom - 46], fill=(255, 255, 255, 100), width=5)
    # 底の厚み
    d.line([x0 + 18, bottom - 15, x1 - 18, bottom - 15], fill=(255, 255, 255, 150), width=7)
    d.arc([x0 + 5, bottom - 34, x1 - 5, bottom + 6], start=0, end=180,
          fill=(236, 244, 240, 175), width=4)

    img = img.filter(ImageFilter.GaussianBlur(1.1))

    # 台に落ちる影
    shadow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).ellipse([x0 - 26, bottom - 18, x1 + 40, bottom + 16],
                                   fill=(96, 76, 60, 70))
    return paper_texture(Image.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(14)), img),
                         seed=seed, strength=0.05)


# --------------------------------------------------------------------------
# カゴ
# --------------------------------------------------------------------------

def _basket_body(img: Image.Image, rng: random.Random) -> tuple[int, int, int, int]:
    w, h = img.size
    d = ImageDraw.Draw(img)
    top, bottom = int(h * 0.42), int(h * 0.86)
    half_top, half_bottom = int(w * 0.33), int(w * 0.24)
    cane = hex_rgb("#B08B5E")

    body = [(w // 2 - half_top, top), (w // 2 + half_top, top),
            (w // 2 + half_bottom, bottom), (w // 2 - half_bottom, bottom)]
    d.polygon(body, fill=cane)

    # 横に走る編み目
    rows = 7
    for i in range(rows):
        t = i / rows
        y = top + (bottom - top) * t
        half = half_top + (half_bottom - half_top) * t
        tone = -0.16 if i % 2 else 0.06
        d.line([w // 2 - half, y, w // 2 + half, y], fill=shade(cane, tone - 0.12), width=3)
        for k in range(11):
            u = k / 10
            x = w // 2 - half + half * 2 * u
            d.ellipse([x - half * 0.09, y + 2, x + half * 0.09, y + (bottom - top) / rows - 2],
                      fill=jitter(shade(cane, tone), rng, 8))
    # 縦の骨
    for k in range(9):
        u = k / 8
        d.line([w // 2 - half_top + half_top * 2 * u, top,
                w // 2 - half_bottom + half_bottom * 2 * u, bottom],
               fill=shade(cane, -0.22), width=2)
    # ふち
    d.rounded_rectangle([w // 2 - half_top - 6, top - 14, w // 2 + half_top + 6, top + 10],
                        radius=12, fill=shade(cane, 0.10), outline=shade(cane, -0.24), width=3)
    # 取っ手
    d.arc([w // 2 - half_top + 10, int(h * 0.10), w // 2 + half_top - 10, top + 20],
          start=180, end=360, fill=shade(cane, -0.06), width=13)
    d.arc([w // 2 - half_top + 10, int(h * 0.10), w // 2 + half_top - 10, top + 20],
          start=180, end=360, fill=shade(cane, 0.22), width=4)
    return top, bottom, half_top, half_bottom


def render_basket(seed: int = 0, full: bool = False) -> Image.Image:
    """素朴な籐のカゴ。full=True なら切り花を挿した状態。"""
    rng = random.Random(seed + (91 if full else 7))
    w, h = PROP_SIZE
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))

    if full:
        # カゴの奥に花をのぞかせる
        palette = ["#F2B825", "#EE93AB", "#8C79C6", "#FBF6EA", "#6E90D4", "#A8BCA2"]
        for i in range(14):
            x = w / 2 + rng.uniform(-w * 0.30, w * 0.30)
            y = h * 0.40 + rng.uniform(-h * 0.10, h * 0.04)
            col = hex_rgb(rng.choice(palette))
            draw_blob(img, (x, y + 40), 5, 46, hex_rgb("#7E9463"), rng, softness=1.2)
            fr = rng.uniform(20, 34)
            for k in range(6):
                draw_petal(img, (x, y), 60 * k + rng.uniform(0, 40), fr, fr * 0.8,
                           shade(col, -0.06), shade(col, 0.16), rng,
                           tip=0.5, waist=1.4, veins=False)

    _basket_body(img, rng)
    img = img.filter(ImageFilter.GaussianBlur(0.8))

    shadow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).ellipse([w * 0.20, h * 0.82, w * 0.86, h * 0.92],
                                   fill=(96, 76, 60, 78))
    return paper_texture(Image.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(15)), img),
                         seed=seed, strength=0.09)


# --------------------------------------------------------------------------
# カウンターの木目（タイル可）
# --------------------------------------------------------------------------

def render_counter(seed: int = 0) -> Image.Image:
    """継ぎ目なく並べられる、あたたかい木目。"""
    rng = random.Random(seed + 55)
    w, h = PROP_SIZE
    base = hex_rgb("#BC9668")
    img = linear_gradient((w, h), shade(base, 0.10), shade(base, -0.08)).convert("RGBA")
    d = ImageDraw.Draw(img)

    # 板の継ぎ目（上下に回り込ませてタイルできるように）
    for y in (int(h * 0.34), int(h * 0.72)):
        d.line([0, y, w, y], fill=shade(base, -0.30), width=3)
        d.line([0, y + 3, w, y + 3], fill=shade(base, 0.16), width=2)

    # 木目。左右の端をまたぐ線は、反対側にも同じ高さで描く
    for _ in range(150):
        y = rng.uniform(0, h)
        x = rng.uniform(-w * 0.2, w)
        length = rng.uniform(90, 300)
        tone = -0.08 - rng.random() * 0.14
        for offset in (0, -w, w):
            d.line([x + offset, y, x + offset + length, y + rng.uniform(-2, 2)],
                   fill=shade(base, tone), width=rng.choice((1, 1, 2)))
    # 節
    for _ in range(3):
        cx, cy = rng.uniform(0, w), rng.uniform(0, h)
        for k in range(5):
            r = 6 + k * 5
            d.ellipse([cx - r * 1.6, cy - r, cx + r * 1.6, cy + r],
                      outline=shade(base, -0.20 + k * 0.03), width=2)

    img = img.filter(ImageFilter.GaussianBlur(1.0))
    return paper_texture(img, seed=seed, strength=0.12).convert("RGB")


# --------------------------------------------------------------------------
# ラッピング資材
# --------------------------------------------------------------------------

def render_paper_roll(paper_id: str, seed: int = 0) -> Image.Image:
    """立てて置いた紙のロール。"""
    cfg = PAPERS[paper_id]
    rng = random.Random(seed + hash(paper_id) % 4000)
    w, h = PROP_SIZE
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    base, edge = hex_rgb(cfg["color"]), hex_rgb(cfg["edge"])

    top, bottom = int(h * 0.10), int(h * 0.93)
    half = int(w * 0.25)
    x0, x1 = w // 2 - half, w // 2 + half

    # 筒。左が受光側、右へ落ちる。
    for i in range(2 * half):
        t = i / (2 * half)
        tone = 0.24 - 0.44 * t
        d.line([x0 + i, top, x0 + i, bottom], fill=shade(base, tone))
    # 巻き終わりの縁
    d.line([x0 + int(half * 1.35), top, x0 + int(half * 1.35), bottom],
           fill=shade(edge, -0.14), width=3)
    # 上面（巻きの断面）
    d.ellipse([x0, top - 22, x1, top + 22], fill=shade(base, 0.16),
              outline=shade(edge, -0.10), width=2)
    d.ellipse([x0 + 14, top - 12, x1 - 14, top + 12], fill=shade(base, -0.14),
              outline=shade(edge, -0.16), width=2)
    d.ellipse([x0 + 26, top - 5, x1 - 26, top + 6], fill=shade(edge, -0.26))
    # 下端
    d.ellipse([x0, bottom - 18, x1, bottom + 18], fill=shade(base, -0.20))

    # 紙の繊維
    if cfg["fiber"] > 0:
        fib = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        fd = ImageDraw.Draw(fib)
        for _ in range(int(300 * cfg["fiber"])):
            x = rng.uniform(x0, x1)
            y = rng.uniform(top, bottom)
            fd.line([x, y, x + rng.uniform(-8, 8), y + rng.uniform(20, 70)],
                    fill=(*shade(edge, -0.10), 34), width=1)
        img = Image.alpha_composite(img, fib.filter(ImageFilter.GaussianBlur(0.7)))

    img = img.filter(ImageFilter.GaussianBlur(0.9))
    shadow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).ellipse([x0 - 30, bottom - 6, x1 + 46, bottom + 26],
                                   fill=(96, 76, 60, 76))
    return paper_texture(Image.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(13)), img),
                         seed=seed, strength=0.08)


def render_ribbon_spool(ribbon_id: str, seed: int = 0) -> Image.Image:
    """リボンの巻きと、ほどけた端。"""
    cfg = RIBBONS[ribbon_id]
    rng = random.Random(seed + hash(ribbon_id) % 4000)
    w, h = PROP_SIZE
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    base, edge = hex_rgb(cfg["color"]), hex_rgb(cfg["edge"])
    cx, cy = w * 0.5, h * 0.46
    rx, ry = w * 0.35, h * 0.35

    # ほどけて垂れた端（巻きの後ろから出す）
    tail = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    td = ImageDraw.Draw(tail)
    td.polygon([(cx + rx * 0.5, cy + ry * 0.4), (cx + rx * 0.95, cy + ry * 0.2),
                (cx + rx * 1.5, h * 0.90), (cx + rx * 1.15, h * 0.94),
                (cx + rx * 1.25, h * 0.82)],
               fill=(*shade(base, -0.06), 255))
    img.alpha_composite(tail.filter(ImageFilter.GaussianBlur(1.2)))

    # 巻き（同心の輪）
    for i in range(16):
        t = i / 16
        d.ellipse([cx - rx * (1 - t * 0.62), cy - ry * (1 - t * 0.62),
                   cx + rx * (1 - t * 0.62), cy + ry * (1 - t * 0.62)],
                  fill=shade(base, 0.12 - 0.30 * t),
                  outline=shade(edge, -0.10), width=1)
    # 芯
    d.ellipse([cx - rx * 0.26, cy - ry * 0.26, cx + rx * 0.26, cy + ry * 0.26],
              fill=hex_rgb("#C6A87E"), outline=shade(edge, -0.24), width=2)
    d.ellipse([cx - rx * 0.14, cy - ry * 0.14, cx + rx * 0.14, cy + ry * 0.14],
              fill=shade(hex_rgb("#C6A87E"), -0.26))

    # 艶（左上）
    if cfg["sheen"] > 0:
        gl = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        ImageDraw.Draw(gl).ellipse([cx - rx * 0.86, cy - ry * 0.86, cx - rx * 0.05, cy - ry * 0.10],
                                   fill=(255, 253, 246, int(150 * cfg["sheen"])))
        img.alpha_composite(gl.filter(ImageFilter.GaussianBlur(20)))

    img = img.filter(ImageFilter.GaussianBlur(0.9))
    shadow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).ellipse([cx - rx, cy + ry * 0.72, cx + rx * 1.4, cy + ry * 1.06],
                                   fill=(96, 76, 60, 70))
    return paper_texture(Image.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(16)), img),
                         seed=seed, strength=0.07)


# --------------------------------------------------------------------------
# メッセージカード
# --------------------------------------------------------------------------

def render_card(seed: int = 0) -> Image.Image:
    rng = random.Random(seed + 71)
    w, h = CARD_SIZE
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    base = hex_rgb("#D9BE95")
    d.rounded_rectangle([18, 14, w - 18, h - 22], radius=10,
                        fill=base, outline=shade(base, -0.18), width=2)
    for _ in range(260):
        x, y = rng.uniform(22, w - 22), rng.uniform(18, h - 26)
        r = rng.uniform(1, 3)
        d.ellipse([x - r, y - r, x + r, y + r],
                  fill=(*jitter(shade(base, -0.10), rng, 10), rng.randint(18, 46)))
    # 紐を通す穴
    d.ellipse([w * 0.5 - 9, 30, w * 0.5 + 9, 48], fill=(0, 0, 0, 0),
              outline=shade(base, -0.26), width=3)
    hi = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ImageDraw.Draw(hi).rounded_rectangle([22, 18, w - 90, h * 0.5], radius=10,
                                         fill=(255, 250, 236, 40))
    img = Image.alpha_composite(img.filter(ImageFilter.GaussianBlur(0.7)),
                                hi.filter(ImageFilter.GaussianBlur(18)))
    shadow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle([26, 24, w - 12, h - 12], radius=10,
                                             fill=(96, 76, 60, 66))
    return paper_texture(Image.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(12)), img),
                         seed=seed, strength=0.10)


# --------------------------------------------------------------------------
# お客さま
# --------------------------------------------------------------------------

def render_customer(spec: dict, mood: str, seed: int = 0) -> Image.Image:
    """やわらかな水彩のバストアップ。どの表情も穏やかであること。"""
    rng = random.Random(seed + hash(spec["id"] + mood) % 9000)
    w, h = CUSTOMER_SIZE
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    fx, fy = w * 0.5, h * 0.42          # 顔の中心
    skin = hex_rgb(spec.get("skin", "#F2D9C4"))
    hair = hex_rgb(spec["hair"])
    cloth = hex_rgb(spec["cloth"])
    face_r = 118
    hair_len = spec.get("hair_len", 140)

    # 体（首 → なで肩 → 腕）
    body = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    bd = ImageDraw.Draw(body)
    bd.ellipse([fx - 42, fy + 84, fx + 42, fy + 180], fill=(*shade(skin, -0.05), 255))
    bd.polygon([(fx - 290, h), (fx - 270, fy + 300), (fx - 200, fy + 196),
                (fx - 90, fy + 146), (fx + 90, fy + 146), (fx + 200, fy + 196),
                (fx + 270, fy + 300), (fx + 290, h)], fill=(*cloth, 255))
    bd.ellipse([fx - 290, fy + 258, fx - 168, h], fill=(*cloth, 255))
    bd.ellipse([fx + 168, fy + 258, fx + 290, h], fill=(*cloth, 255))
    bd.ellipse([fx - 112, fy + 138, fx + 112, fy + 240], fill=(*cloth, 255))
    img.alpha_composite(body.filter(ImageFilter.GaussianBlur(2.4)))

    shadow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).polygon([(fx + 40, h), (fx + 116, fy + 160), (fx + 260, h)],
                                   fill=(*shade(cloth, -0.22), 150))
    img.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(24)))

    # 後ろ髪
    back = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ImageDraw.Draw(back).ellipse(
        [fx - face_r - 22, fy - face_r - 36, fx + face_r + 22, fy + face_r * 0.30 + hair_len],
        fill=(*shade(hair, -0.10), 255))
    img.alpha_composite(back.filter(ImageFilter.GaussianBlur(3.0)))

    # 顔
    face = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ImageDraw.Draw(face).ellipse([fx - face_r * 0.88, fy - face_r,
                                  fx + face_r * 0.88, fy + face_r * 1.12],
                                 fill=(*skin, 255))
    img.alpha_composite(face.filter(ImageFilter.GaussianBlur(2.6)))
    lit = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ImageDraw.Draw(lit).ellipse([fx - face_r * 0.8, fy - face_r * 0.9,
                                 fx + face_r * 0.1, fy + face_r * 0.1],
                                fill=(*shade(skin, 0.30), 120))
    img.alpha_composite(lit.filter(ImageFilter.GaussianBlur(28)))

    # 前髪
    fringe = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    fd = ImageDraw.Draw(fringe)
    fd.ellipse([fx - face_r - 12, fy - face_r - 30, fx + face_r + 12, fy + face_r * 0.26],
               fill=(*hair, 255))
    fd.ellipse([fx - face_r * 0.52, fy - face_r * 0.50, fx + face_r * 0.62, fy + face_r * 0.42],
               fill=(0, 0, 0, 0))
    img.alpha_composite(fringe.filter(ImageFilter.GaussianBlur(3.0)))
    gloss = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ImageDraw.Draw(gloss).ellipse([fx - face_r * 0.85, fy - face_r * 0.92,
                                   fx - face_r * 0.10, fy - face_r * 0.62],
                                  fill=(*shade(hair, 0.42), 130))
    img.alpha_composite(gloss.filter(ImageFilter.GaussianBlur(15)))

    # 表情（穏やかな線だけで描く）
    fd = ImageDraw.Draw(img)
    ink = shade(hair, -0.30)
    ex, ey, er = 48, 24, 28
    if mood == "happy":
        for side in (-1, 1):
            fd.arc([fx + side * ex - er, fy + ey - er, fx + side * ex + er, fy + ey + er],
                   start=196, end=344, fill=(*ink, 235), width=7)
        fd.arc([fx - 32, fy + 62, fx + 32, fy + 108], start=8, end=172,
               fill=(*shade(hex_rgb("#C97F80"), -0.1), 220), width=6)
    else:
        for side in (-1, 1):
            fd.ellipse([fx + side * ex - 14, fy + ey - 18, fx + side * ex + 14, fy + ey + 18],
                       fill=(*ink, 225))
            fd.ellipse([fx + side * ex - 8, fy + ey - 14, fx + side * ex + 2, fy + ey - 4],
                       fill=(255, 253, 246, 200))
            fd.arc([fx + side * ex - 21, fy + ey - 38, fx + side * ex + 21, fy + ey - 4],
                   start=190, end=350, fill=(*ink, 200), width=5)
        fd.arc([fx - 24, fy + 66, fx + 24, fy + 96], start=14, end=166,
               fill=(*shade(hex_rgb("#C97F80"), -0.1), 200), width=5)
    for side in (-1, 1):
        draw_blob(img, (fx + side * 84, fy + 48), 28, 18, hex_rgb("#EEB3AE"), rng,
                  softness=12, bleed=0.0)

    return paper_texture(img, seed=seed, strength=0.06)


# --------------------------------------------------------------------------
# 温室
# --------------------------------------------------------------------------

def render_greenhouse_stage(stage: int, seed: int = 0) -> Image.Image:
    """種をまいた鉢から、花が開くまで。"""
    rng = random.Random(seed + 200 + stage)
    w, h = PROP_SIZE
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    pot = hex_rgb("#C08262")
    soil = hex_rgb("#6B5343")
    green = hex_rgb("#7E9A5E")
    top, bottom = int(h * 0.58), int(h * 0.92)
    half_top, half_bottom = int(w * 0.25), int(w * 0.18)

    # 土
    d.ellipse([w // 2 - half_top + 8, top - 14, w // 2 + half_top - 8, top + 20],
              fill=soil)
    for _ in range(90):
        x = rng.uniform(w // 2 - half_top + 12, w // 2 + half_top - 12)
        y = rng.uniform(top - 10, top + 14)
        r = rng.uniform(2, 5)
        d.ellipse([x - r, y - r, x + r, y + r], fill=jitter(soil, rng, 14))

    # 生育
    if stage == 0:
        for _ in range(7):
            x = rng.uniform(w // 2 - half_top * 0.5, w // 2 + half_top * 0.5)
            y = rng.uniform(top - 6, top + 8)
            d.ellipse([x - 4, y - 3, x + 4, y + 3], fill=hex_rgb("#8E7A5C"))
    else:
        stem_top = {1: top - 60, 2: top - 130, 3: top - 160}[stage]
        d.line([w // 2, top, w // 2, stem_top], fill=green, width=7)
        if stage == 1:
            for side in (-1, 1):
                draw_leaf(img, (w // 2, stem_top + 6), side * 74 + 180, 62, 44,
                          green, rng, tip=0.5)
        else:
            for side in (-1, 1):
                draw_leaf(img, (w // 2, top - 40), side * 66 + 180, 96, 52,
                          green, rng, tip=0.5)
        if stage == 2:
            draw_blob(img, (w // 2, stem_top - 6), 26, 36, hex_rgb("#C58BA6"), rng,
                      highlight=0.25)
            for k in range(3):
                draw_petal(img, (w // 2, stem_top + 18), 180 + (k - 1) * 32, 52, 26,
                           shade(green, -0.1), green, rng, tip=0.6, waist=0.9, veins=False)
        if stage == 3:
            col = hex_rgb("#E894B4")
            for k in range(8):
                draw_petal(img, (w // 2, stem_top - 10), 45 * k + rng.uniform(0, 20),
                           70, 46, shade(col, -0.06), shade(col, 0.16), rng,
                           tip=0.5, waist=1.4, offset=16)
            draw_blob(img, (w // 2, stem_top - 10), 20, 19, hex_rgb("#E9C55E"), rng,
                      highlight=0.3)

    # 鉢
    d.polygon([(w // 2 - half_top, top), (w // 2 + half_top, top),
               (w // 2 + half_bottom, bottom), (w // 2 - half_bottom, bottom)],
              fill=pot)
    for i in range(int(half_top * 2)):
        t = i / (half_top * 2)
        d.line([w // 2 - half_top + i, top, w // 2 - half_bottom + i * (half_bottom / half_top),
                bottom], fill=shade(pot, 0.18 - 0.42 * t), width=1)
    d.rounded_rectangle([w // 2 - half_top - 8, top - 16, w // 2 + half_top + 8, top + 12],
                        radius=8, fill=shade(pot, 0.12), outline=shade(pot, -0.20), width=2)

    img = img.filter(ImageFilter.GaussianBlur(0.9))
    shadow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).ellipse([w // 2 - half_bottom - 22, bottom - 12,
                                    w // 2 + half_bottom + 40, bottom + 18],
                                   fill=(96, 76, 60, 74))
    return paper_texture(Image.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(14)), img),
                         seed=seed, strength=0.08)
