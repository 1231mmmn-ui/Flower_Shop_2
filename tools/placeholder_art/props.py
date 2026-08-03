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

from PIL import ImageChops

from .paint import (LIGHT_ANGLE, RGB, bezier, draw_blob, draw_leaf, draw_petal,
                    hex_rgb, jitter, linear_gradient, mix, paper_texture,
                    rotate_points, shade, tapered_band, watercolor_mask)

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
                            radius=18, fill=(198, 216, 204, 27))
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
    td.polygon([(cx + rx * 0.4, cy + ry * 0.5), (cx + rx * 0.86, cy + ry * 0.34),
                (cx + rx * 1.18, cy + ry * 1.30), (cx + rx * 0.94, cy + ry * 1.34),
                (cx + rx * 0.98, cy + ry * 1.12)],
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

def _wc(size, shape_fn, color: RGB, seed: int, softness: float = 3.0,
        bleed: float = 0.22) -> Image.Image:
    """
    水彩の一筆。

    花とまったく同じ描き方です。かたちを塗ってから、
    輪郭をにじませ、顔料のムラを乗せます。

    人物だけが浮いて見えていた原因は、ここでした。
    人物は `ellipse` を塗って `GaussianBlur` を掛けていただけで、
    **`watercolor_mask` を一度も通していませんでした。**
    ぼかしと、にじみは、別のものです。
    ぼかした縁はなめらかで均一 ── つまり「印刷」に見えます。

    ただし **にじみの量は、かたちの大きさで変えること。**
    花びらと同じ 0.22 を顔に掛けたら、頬いちめんが粒立って
    **汚れて**見えました。花びらでは顔料に見えるムラが、
    広い面では砂に見えます。広い面ほど、うんと弱く。
    """
    mask = Image.new("L", size, 0)
    shape_fn(ImageDraw.Draw(mask))
    return _paint(size, watercolor_mask(mask, seed=seed, softness=softness,
                                        bleed=bleed), color)


def _paint(size, mask: Image.Image, color: RGB) -> Image.Image:
    layer = Image.new("RGBA", size, (0, 0, 0, 0))
    layer.paste(Image.new("RGB", size, color), (0, 0), mask)
    return layer


def _shade_side(size, mask_fn, color: RGB, seed: int, amount: float = 0.22):
    """
    左上の光に対する、影の側。

    店内も花も光源は左上ひとつ。人物だけ全体が均一に明るいと、
    **同じ部屋にいるように見えません。**
    かたちの右下側だけを、うすく落とします。
    """
    mask = Image.new("L", size, 0)
    mask_fn(ImageDraw.Draw(mask))
    soft = watercolor_mask(mask, seed=seed + 7, softness=6.0, bleed=0.1)
    # 光と反対（右下）へずらしたものだけを残す＝陰になる側
    dx = int(round(math.sin(math.radians(LIGHT_ANGLE + 180)) * max(size) * 0.06))
    dy = int(round(-math.cos(math.radians(LIGHT_ANGLE + 180)) * max(size) * 0.06))
    moved = Image.new("L", size, 0)
    moved.paste(soft, (dx, dy))
    from PIL import ImageChops
    only = ImageChops.subtract(soft, moved)
    return _paint(size, only.point(lambda v: int(v * amount)), shade(color, -0.55))


def render_customer(spec: dict, mood: str, seed: int = 0) -> Image.Image:
    """
    やわらかな水彩のバストアップ。どの表情も穏やかであること。

    **人物も、花と同じ筆で描きます。**

    直したのは4つです。
      にじみ  すべての面を `watercolor_mask` に通す（ぼかしではなく、にじみ）
      光      左上ひとつ。かたちの右下に影の側を作る
      重なり  髪→顔、顔→首、頭→体に、接する影を落とす
      顔      目を小さく、白目のハイライトをやわらげ、頬を薄く

    目指すのは「人物が主役になる」ことではなく、
    **「花屋の空気の中に自然に存在している人物」**です。
    だから、描き込むのではなく、**なじませます。**
    """
    rng = random.Random(seed + hash(spec["id"] + mood) % 9000)
    w, h = CUSTOMER_SIZE
    size = (w, h)
    img = Image.new("RGBA", size, (0, 0, 0, 0))
    fx, fy = w * 0.5, h * 0.42          # 顔の中心
    skin = hex_rgb(spec.get("skin", "#F2D9C4"))
    hair = hex_rgb(spec["hair"])
    cloth = hex_rgb(spec["cloth"])
    face_r = 118
    hair_len = spec.get("hair_len", 140)

    def body_shape(d):
        d.ellipse([fx - 42, fy + 84, fx + 42, fy + 180], fill=255)
        d.polygon([(fx - 290, h), (fx - 270, fy + 300), (fx - 200, fy + 196),
                   (fx - 90, fy + 146), (fx + 90, fy + 146), (fx + 200, fy + 196),
                   (fx + 270, fy + 300), (fx + 290, h)], fill=255)
        d.ellipse([fx - 290, fy + 258, fx - 168, h], fill=255)
        d.ellipse([fx + 168, fy + 258, fx + 290, h], fill=255)
        d.ellipse([fx - 112, fy + 138, fx + 112, fy + 240], fill=255)

    def back_shape(d):
        d.ellipse([fx - face_r - 22, fy - face_r - 36,
                   fx + face_r + 22, fy + face_r * 0.30 + hair_len], fill=255)

    def face_shape(d):
        d.ellipse([fx - face_r * 0.88, fy - face_r,
                   fx + face_r * 0.88, fy + face_r * 1.12], fill=255)

    def fringe_shape(d):
        d.ellipse([fx - face_r - 12, fy - face_r - 30,
                   fx + face_r + 12, fy + face_r * 0.26], fill=255)
        d.ellipse([fx - face_r * 0.52, fy - face_r * 0.50,
                   fx + face_r * 0.62, fy + face_r * 0.42], fill=0)

    # ---- 体
    # 服はいちばん広い面。にじみはほとんど掛けない。
    img.alpha_composite(_wc(size, body_shape, cloth, rng.randint(0, 9999), 3.4, 0.09))
    img.alpha_composite(_shade_side(size, body_shape, cloth, rng.randint(0, 9999), 0.20))

    # ---- 後ろ髪。顔より先に置いて、あとで顔が上に乗る
    img.alpha_composite(_wc(size, back_shape, shade(hair, -0.10),
                            rng.randint(0, 9999), 3.6, 0.12))

    # ---- 首もとの影。頭が体に接しているところ
    neck = Image.new("L", size, 0)
    ImageDraw.Draw(neck).ellipse([fx - 88, fy + face_r * 0.86, fx + 88, fy + 202], fill=84)
    img.alpha_composite(_paint(size, neck.filter(ImageFilter.GaussianBlur(26)),
                               shade(cloth, -0.42)))

    # ---- 顔
    # 顔はいちばん見られる面。ムラは、ほぼ入れない。
    img.alpha_composite(_wc(size, face_shape, skin, rng.randint(0, 9999), 3.0, 0.05))
    img.alpha_composite(_shade_side(size, face_shape, skin, rng.randint(0, 9999), 0.14))
    # 左上からの光
    lit = Image.new("L", size, 0)
    ImageDraw.Draw(lit).ellipse([fx - face_r * 0.86, fy - face_r * 0.96,
                                 fx + face_r * 0.06, fy + face_r * 0.06], fill=110)
    img.alpha_composite(_paint(size, lit.filter(ImageFilter.GaussianBlur(30)),
                               shade(skin, 0.34)))

    # ---- 前髪
    img.alpha_composite(_wc(size, fringe_shape, hair, rng.randint(0, 9999), 3.2, 0.13))
    # 前髪が顔に落とす影。重なりの厚みはここで出る（花と同じ考え方）
    brow_shadow = Image.new("L", size, 0)
    ImageDraw.Draw(brow_shadow).ellipse(
        [fx - face_r * 0.76, fy - face_r * 0.70, fx + face_r * 0.76, fy - face_r * 0.24],
        fill=54)
    img.alpha_composite(_paint(size, brow_shadow.filter(ImageFilter.GaussianBlur(20)),
                               shade(skin, -0.40)))
    # 髪のつや。左上だけ、うすく
    gloss = Image.new("L", size, 0)
    ImageDraw.Draw(gloss).ellipse([fx - face_r * 0.84, fy - face_r * 0.94,
                                   fx - face_r * 0.12, fy - face_r * 0.60], fill=104)
    img.alpha_composite(_paint(size, gloss.filter(ImageFilter.GaussianBlur(18)),
                               shade(hair, 0.40)))

    # ---- 表情
    #
    # 目を小さくしました。もとは 28px の黒い楕円に白い点で、
    # 水彩の顔に**判子**が押してあるように見えていました。
    # 線を細く、色を髪より薄い墨にして、白目の光はにじませます。
    feat = Image.new("RGBA", size, (0, 0, 0, 0))
    fd = ImageDraw.Draw(feat)
    ink = shade(hair, -0.18)
    ex, ey = 46, 26
    lip = shade(hex_rgb("#C0817E"), -0.05)
    if mood == "happy":
        for side in (-1, 1):
            er = 24
            fd.arc([fx + side * ex - er, fy + ey - er, fx + side * ex + er, fy + ey + er],
                   start=200, end=340, fill=(*ink, 220), width=5)
        fd.arc([fx - 26, fy + 64, fx + 26, fy + 102], start=12, end=168,
               fill=(*lip, 200), width=5)
    else:
        for side in (-1, 1):
            fd.ellipse([fx + side * ex - 10, fy + ey - 13, fx + side * ex + 10, fy + ey + 13],
                       fill=(*ink, 210))
            fd.arc([fx + side * ex - 18, fy + ey - 34, fx + side * ex + 18, fy + ey - 6],
                   start=196, end=344, fill=(*ink, 165), width=4)
        fd.arc([fx - 20, fy + 68, fx + 20, fy + 94], start=16, end=164,
               fill=(*lip, 180), width=4)
    # 顔立ちも、ほんの少しにじませる。線だけ硬いと、そこだけ別の絵に見える。
    img.alpha_composite(feat.filter(ImageFilter.GaussianBlur(0.9)))

    if mood != "happy":
        # 白目の光。硬い点ではなく、にじんだ明かり
        spark = Image.new("L", size, 0)
        sd = ImageDraw.Draw(spark)
        for side in (-1, 1):
            sd.ellipse([fx + side * ex - 7, fy + ey - 11, fx + side * ex - 1, fy + ey - 5],
                       fill=170)
        img.alpha_composite(_paint(size, spark.filter(ImageFilter.GaussianBlur(1.6)),
                                   (255, 253, 246)))

    # 頬。もとは直径56pxの桃色の玉が二つ乗っていた。うんと薄く、広く。
    cheek = Image.new("L", size, 0)
    cd = ImageDraw.Draw(cheek)
    for side in (-1, 1):
        cd.ellipse([fx + side * 80 - 34, fy + 44, fx + side * 80 + 34, fy + 76], fill=52)
    img.alpha_composite(_paint(size, cheek.filter(ImageFilter.GaussianBlur(20)),
                               hex_rgb("#E6A9A4")))

    return paper_texture(img, seed=seed, strength=0.045)


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


# --------------------------------------------------------------------------
# 包んだ姿（ブーケの包み紙とリボン）
# --------------------------------------------------------------------------

WRAP_SIZE = (768, 640)
BOW_SIZE = (512, 512)


def render_wrap_cone(paper_id: str, seed: int = 0) -> Image.Image:
    """
    ブーケを包んだ紙。

    ── かたちのほうが、まだ「絵」でした ────────────────────────
    水彩の質感は入りましたが、**まっすぐな辺の三角形**のままでした。
    紙の手ざわりはあるのに、「きれいに描かれた紙」に見える理由がこれです。

    本物のラッピングで起きていることを、かたちに入れます。

      口が開く      いちばん上が外へ反り返る。切りっぱなしの縁が立つ
      花に押される  中ほどがふくらむ。辺は直線ではなく、外へ張る
      リボンで締まる 結び目の上で急に細くなり、しわが寄る
      手で巻く      左右がそろわない。片側だけ多く重なる
      紙に厚みがある 折り返しは「濃い色の帯」ではなく、
                    **上の面（明るい）＋下の影**の二本で出す
    """
    spec = PAPERS[paper_id]
    rng = random.Random(seed + 700 + sum(map(ord, paper_id)))
    w, h = WRAP_SIZE
    color = hex_rgb(spec["color"])
    edge = hex_rgb(spec["edge"])

    # 手で巻いた紙は、左右がそろわない。
    lean = rng.uniform(-0.035, 0.035)
    swell_l = rng.uniform(0.085, 0.125)      # 左の張り出し
    swell_r = rng.uniform(0.085, 0.125)
    tie_l, tie_r = 0.415 + lean, 0.585 + lean
    top_l, top_r = 0.015 + lean * 0.4, 0.985 + lean * 0.4

    def side(x_top: float, x_tie: float, swell: float, out: int) -> list:
        """
        口もとから結び目までの、片側の輪郭。

        2本に分ける。上半分は**外へ張り出し**（花に押されている）、
        下半分は**内へ締まる**（リボンで絞られている）。
        1本の弧では、この二つは同時に出せない。
        """
        mid = (x_top + (x_tie - x_top) * 0.42 + out * swell, h * 0.46)
        upper = bezier((x_top * w, 0),
                       ((x_top + out * swell * 1.15) * w, h * 0.17),
                       (mid[0] * w, mid[1]), 22)
        lower = bezier((mid[0] * w, mid[1]),
                       ((x_tie + out * swell * 0.30) * w, h * 0.80),
                       (x_tie * w, h), 22)
        return upper + lower[1:]

    left = side(top_l, tie_l, swell_l, -1)
    right = list(reversed(side(top_r, tie_r, swell_r, +1)))

    # 口もと。まっすぐ切らない。波は大きく。
    mouth = [(x, 22 * math.sin(x / w * 5.1 + 1.4)
                 + 10 * math.sin(x / w * 12.0 + 0.3) - 8)
             for x in [top_l * w + (top_r - top_l) * w * i / 26 for i in range(27)]]
    shape = left + right + list(reversed(mouth))

    def cone(d):
        d.polygon(shape, fill=255)

    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    # 紙は広い面なので、にじみは弱く（人物で学んだこと）
    img.alpha_composite(_wc((w, h), cone, color, rng.randint(0, 9999), 3.2, 0.07))

    mask = Image.new("L", (w, h), 0)
    cone(ImageDraw.Draw(mask))
    solid = watercolor_mask(mask, seed=seed, softness=3.2, bleed=0.07)

    # ---- 光。左上から右下へ落ちる。
    # 下に黒を敷かないこと（縁から透けて、黒い輪郭になる）。
    grad = linear_gradient((w, h), shade(color, 0.22), shade(edge, -0.06), horizontal=True)
    lit = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    lit.paste(grad, (0, 0), solid)
    img.alpha_composite(lit)

    # ---- ふくらみ。花に押されて張っているところに、光が乗る。
    swell_mask = Image.new("L", (w, h), 0)
    ImageDraw.Draw(swell_mask).ellipse(
        [w * 0.20, h * 0.16, w * 0.68, h * 0.74], fill=88)
    img.alpha_composite(_paint((w, h),
                               ImageChops.multiply(
                                   swell_mask.filter(ImageFilter.GaussianBlur(64)), solid),
                               shade(color, 0.30)))
    # 張りの外側（右下）は、逆に落ちる
    fall = Image.new("L", (w, h), 0)
    ImageDraw.Draw(fall).ellipse([w * 0.62, h * 0.34, w * 1.10, h * 1.02], fill=54)
    img.alpha_composite(_paint((w, h),
                               ImageChops.multiply(
                                   fall.filter(ImageFilter.GaussianBlur(58)), solid),
                               shade(edge, -0.26)))

    # ---- 折り目。等間隔にしない。結び目へ向かって、下ほど密に寄る。
    folds = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    fd = ImageDraw.Draw(folds)
    apex = ((tie_l + tie_r) * 0.5 * w, h * 1.02)
    t = 0.05
    while t < 0.95:
        x = (top_l + (top_r - top_l) * t) * w
        # 谷（影）
        fd.line([(x, 0), apex], fill=(*shade(edge, -0.36), int(255 * rng.uniform(0.10, 0.19))),
                width=max(2, int(rng.uniform(2, 5))))
        # 山（光）。谷のすぐ左に来る ── 光は左上から
        fd.line([(x - rng.uniform(7, 15), 0), apex],
                fill=(*shade(color, 0.36), int(255 * rng.uniform(0.10, 0.17))),
                width=max(2, int(rng.uniform(3, 7))))
        t += rng.uniform(0.050, 0.110)
    folds = folds.filter(ImageFilter.GaussianBlur(2.4))
    img.alpha_composite(Image.composite(folds, Image.new("RGBA", (w, h), (0, 0, 0, 0)), solid))

    # ---- 結び目のところの、寄り。
    # リボンで締まると、紙はここに集まる。**下ほど濃く、短く。**
    gather = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    gd = ImageDraw.Draw(gather)
    for _ in range(16):
        gx = rng.uniform(tie_l - 0.05, tie_r + 0.05) * w
        top_y = h * rng.uniform(0.66, 0.84)
        gd.line([(gx + rng.uniform(-18, 18), top_y), (apex[0], h)],
                fill=(*shade(edge, -0.42), int(255 * rng.uniform(0.10, 0.22))),
                width=max(2, int(rng.uniform(2, 4))))
    gather = gather.filter(ImageFilter.GaussianBlur(3.0))
    img.alpha_composite(Image.composite(gather, Image.new("RGBA", (w, h), (0, 0, 0, 0)), solid))

    # ---- 口もとの折り返し。**紙の厚み**はここで出す。
    #
    # 濃い帯を一本引くのでは、厚みではなく「縁取り」になる。
    # 上を向いた面（明るい）と、その下に落ちる影（暗い）の二本にする。
    #
    # **帯の下辺も、波に沿わせること。**
    # 上だけ波で下がまっすぐだと、厚みではなく**黒い横棒**が渡って見える。
    # 実際そうなった。紙の折り返しは、どこも同じ厚みで続いている。
    def band(offset: float, thick: float) -> list:
        upper = [(x, y + offset) for x, y in mouth]
        lower = [(x, y + offset + thick) for x, y in reversed(mouth)]
        return upper + lower

    thickness = h * 0.028
    face = Image.new("L", (w, h), 0)
    ImageDraw.Draw(face).polygon(band(0, thickness), fill=132)
    img.alpha_composite(_paint((w, h),
                               ImageChops.multiply(face.filter(ImageFilter.GaussianBlur(2.4)),
                                                   solid),
                               shade(color, 0.50)))
    under = Image.new("L", (w, h), 0)
    ImageDraw.Draw(under).polygon(band(thickness, thickness * 1.5), fill=72)
    img.alpha_composite(_paint((w, h),
                               ImageChops.multiply(under.filter(ImageFilter.GaussianBlur(5.0)),
                                                   solid),
                               shade(edge, -0.30)))

    return paper_texture(img, seed=seed, strength=0.09)


def render_ribbon_bow(ribbon_id: str, seed: int = 0) -> Image.Image:
    """
    リボンの蝶結び。

    もとは角丸の四角を5枚並べたもので、**折り紙**に見えていました。
    輪は平らではなく、ねじれて、光を片側だけ返します。
    """
    spec = RIBBONS[ribbon_id]
    rng = random.Random(seed + 800 + sum(map(ord, ribbon_id)))
    w, h = BOW_SIZE
    color = hex_rgb(spec["color"])
    edge = hex_rgb(spec["edge"])
    sheen = spec["sheen"]
    cx, cy = w * 0.5, h * 0.44
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))

    def band(pts, width_a, width_b):
        return tapered_band(pts, width_a, width_b)

    # ---- 垂れ。左右で長さも角度も変える
    for side, ln in ((-1, rng.uniform(0.30, 0.38)), (1, rng.uniform(0.34, 0.44))):
        tipx = cx + side * w * rng.uniform(0.10, 0.20)
        path = bezier((cx, cy), (cx + side * w * 0.06, cy + h * ln * 0.55),
                      (tipx, cy + h * ln), 26)
        pts = band(path, w * 0.075, w * 0.105)
        img.alpha_composite(_wc((w, h), lambda d, p=pts: d.polygon(p, fill=255),
                                shade(color, -0.06), rng.randint(0, 9999), 2.4, 0.10))

    # ---- 輪。ねじれを出すため、二本の帯を重ねる
    for side in (-1, 1):
        far = (cx + side * w * rng.uniform(0.20, 0.26), cy - h * rng.uniform(0.03, 0.07))
        up = bezier((cx, cy), (cx + side * w * 0.16, cy - h * 0.17), far, 24)
        down = bezier(far, (cx + side * w * 0.17, cy + h * 0.12), (cx, cy), 24)
        for k, path in enumerate((up, down)):
            pts = band(path, w * 0.085, w * 0.055)
            tone = shade(color, 0.10 if k == 0 else -0.16)
            img.alpha_composite(_wc((w, h), lambda d, p=pts: d.polygon(p, fill=255),
                                    tone, rng.randint(0, 9999), 2.2, 0.09))
        # 輪の内側の影。ここが無いと、輪が輪に見えない。
        inner = Image.new("L", (w, h), 0)
        x0, x1 = sorted((cx + side * w * 0.04, cx + side * w * 0.21))
        ImageDraw.Draw(inner).ellipse(
            [x0, cy - h * 0.058, x1, cy + h * 0.058], fill=58)
        # 輪の内側だけを暗くする。リボンの外へはみ出させない。
        ring = ImageChops.multiply(inner.filter(ImageFilter.GaussianBlur(11)),
                                   img.getchannel("A"))
        img.alpha_composite(_paint((w, h), ring, shade(edge, -0.20)))

    # ---- 光。左上からの筋を、上の面にだけ
    gloss = Image.new("L", (w, h), 0)
    gd = ImageDraw.Draw(gloss)
    for side in (-1, 1):
        gd.line([(cx + side * w * 0.05, cy - h * 0.05),
                 (cx + side * w * 0.21, cy - h * 0.05)],
                fill=int(150 * sheen), width=int(h * 0.035))
    img.alpha_composite(_paint((w, h), gloss.filter(ImageFilter.GaussianBlur(6)),
                               shade(color, 0.45)))

    # ---- 結び目
    knot = Image.new("L", (w, h), 0)
    ImageDraw.Draw(knot).ellipse([cx - w * 0.055, cy - h * 0.048,
                                  cx + w * 0.055, cy + h * 0.048], fill=255)
    img.alpha_composite(_paint((w, h),
                               watercolor_mask(knot, seed=seed + 3, softness=2.6, bleed=0.08),
                               shade(color, -0.10)))
    kl = Image.new("L", (w, h), 0)
    ImageDraw.Draw(kl).ellipse([cx - w * 0.045, cy - h * 0.042,
                                cx - w * 0.004, cy - h * 0.004],
                               fill=int(130 * min(1.0, 0.4 + sheen)))
    img.alpha_composite(_paint((w, h), kl.filter(ImageFilter.GaussianBlur(5)),
                               shade(color, 0.46)))

    return paper_texture(img, seed=seed, strength=0.07)
