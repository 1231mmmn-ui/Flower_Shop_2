"""木造のお花屋さんの店内と、窓の外の季節。

サイズと置き場所は IMAGE_ASSETS.md §3 の通り。
  assets/scenes/window-<season>.png  800 x 600   透過（窓の内側だけ）
  assets/scenes/shop-<season>.jpg    1600 x 1200  完成画
  assets/scenes/shop-title.jpg       1600 x 1200  タイトル用（下中央を空ける）

店内は共通の1枚を描き、そこへ窓の景色を貼り込んで季節ごとの完成画を作る
（仕様書が薦めている「窓だけ差し替える」やり方を、書き出しの段階でやっている）。
"""

from __future__ import annotations

import math
import random

from PIL import Image, ImageDraw, ImageFilter

from .paint import (RGB, hex_rgb, jitter, linear_gradient, mix, paper_texture,
                    shade)

SCENE_SIZE = (1600, 1200)
WINDOW_SIZE = (800, 600)

# 店内のどこに窓があるか。窓の景色はこの枠の内側に貼る。
WINDOW_BOX = (0.368, 0.055, 0.632, 0.40)   # (x0, y0, x1, y1) 画面比

# たて長の画面では、この横幅の内側だけが見える（背景は cover で中央を切る）。
# 店の見どころは必ずこの中に収める。外側は、広い画面のときに続く風景。
SAFE_X = (0.32, 0.68)

SEASONS: dict[str, dict] = {
    "spring": dict(sky=("#BFDCF2", "#EAF3F7"), foliage=["#C8DCB4", "#DCE9C6"],
                   accent=["#F6D3DC", "#FBE4EA", "#F2C4D2"], accent_n=150,
                   light="#FDF2E2"),
    "summer": dict(sky=("#8FC2E8", "#DCEEF7"), foliage=["#8FB574", "#A9C78C"],
                   accent=["#FFFFFF", "#F4FAFF"], accent_n=45, light="#FEF6E2"),
    "autumn": dict(sky=("#E3D6BE", "#F3E9D6"), foliage=["#D9A468", "#C98A50"],
                   accent=["#E0A05E", "#CE8146", "#EBC183"], accent_n=120,
                   light="#FBEAD2"),
    "winter": dict(sky=("#D6E2EC", "#F2F6F9"), foliage=["#BFCCC8", "#DCE4E0"],
                   accent=["#FFFFFF", "#F4F8FA"], accent_n=190, light="#F6F2EC"),
}

WOOD_DARK = "#7C5F44"
WOOD = "#A6825E"
WOOD_LIGHT = "#C7A57C"
WALL = "#EDE2CE"


def _planks(draw: ImageDraw.ImageDraw, box, rng: random.Random, color: RGB,
            rows: int = 6) -> None:
    x0, y0, x1, y1 = box
    for i in range(rows):
        a = y0 + (y1 - y0) * i / rows
        b = y0 + (y1 - y0) * (i + 1) / rows
        draw.rectangle([x0, a, x1, b], fill=jitter(color, rng, 8))
        draw.line([x0, b, x1, b], fill=shade(color, -0.18), width=2)


def _flower_cluster(draw: ImageDraw.ImageDraw, cx: float, cy: float, r: float,
                    colors: list[str], rng: random.Random, n: int = 26) -> None:
    """棚に並ぶ花の塊。背景なので、にじみの集まりで十分。"""
    for _ in range(n):
        a = rng.uniform(0, 2 * math.pi)
        rad = r * math.sqrt(rng.uniform(0, 1))
        x, y = cx + math.cos(a) * rad, cy + math.sin(a) * rad * 0.8
        d = r * rng.uniform(0.16, 0.30)
        draw.ellipse([x - d, y - d, x + d, y + d],
                     fill=jitter(hex_rgb(rng.choice(colors)), rng, 10))


# --------------------------------------------------------------------------
# 窓の外
# --------------------------------------------------------------------------

def render_window(season: str, seed: int = 0) -> Image.Image:
    """窓の内側に貼る、季節の景色だけの絵。"""
    cfg = SEASONS[season]
    rng = random.Random(seed + 400 + sum(map(ord, season)))
    w, h = WINDOW_SIZE
    img = linear_gradient((w, h), hex_rgb(cfg["sky"][0]), hex_rgb(cfg["sky"][1])).convert("RGBA")
    d = ImageDraw.Draw(img)

    # 遠くの木立
    for _ in range(70):
        x = rng.uniform(-40, w + 40)
        y = rng.uniform(h * 0.54, h * 1.06)
        r = rng.uniform(w * 0.05, w * 0.16)
        d.ellipse([x - r, y - r * 0.78, x + r, y + r * 0.78],
                  fill=jitter(hex_rgb(rng.choice(cfg["foliage"])), rng, 12))
    # 季節の色（桜・雲・紅葉・雪）
    for _ in range(cfg["accent_n"]):
        x = rng.uniform(0, w)
        y = rng.uniform(0, h)
        r = rng.uniform(w * 0.008, w * 0.032)
        d.ellipse([x - r, y - r * 0.9, x + r, y + r * 0.9],
                  fill=jitter(hex_rgb(rng.choice(cfg["accent"])), rng, 8))
    # 地面
    d.rectangle([0, h * 0.90, w, h], fill=jitter(hex_rgb(cfg["foliage"][0]), rng, 6))

    img = img.filter(ImageFilter.GaussianBlur(4.0))

    # 窓の外は明るい。手前より一段、光を強くする。
    glow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ImageDraw.Draw(glow).rectangle([0, 0, w, h], fill=(*hex_rgb(cfg["light"]), 26))
    img = Image.alpha_composite(img, glow)
    return paper_texture(img, seed=seed, strength=0.06)


# --------------------------------------------------------------------------
# 店内
# --------------------------------------------------------------------------

def render_interior(seed: int = 0, title: bool = False) -> Image.Image:
    """季節を含まない、共通の店内。窓の内側は空けておく。

    たて長の画面では中央 SAFE_X の帯だけが見えるので、
    窓・棚・作業台という店の骨格は、その帯の中で完結させる。
    """
    rng = random.Random(seed + 1000)
    w, h = SCENE_SIZE
    img = linear_gradient((w, h), hex_rgb(WALL), hex_rgb("#D8C7AB")).convert("RGBA")
    d = ImageDraw.Draw(img)

    # ---- 壁（板張り）
    _planks(d, (0, 0, w, int(h * 0.62)), rng, hex_rgb("#E7DBC4"), rows=5)

    # ---- 奥の棚（左右いっぱい。窓の高さに合わせて2段）
    for shelf_t in (0.255, 0.455):
        y = int(h * shelf_t)
        d.rectangle([0, y, w, y + 16], fill=hex_rgb(WOOD))
        d.rectangle([0, y + 16, w, y + 26], fill=shade(hex_rgb(WOOD), -0.26))
        palettes = [["#F2B825", "#FBE28C"], ["#EE93AB", "#FADCE3"], ["#8C79C6", "#E5DEF4"],
                    ["#FBF6EA", "#EFE7D2"], ["#6E90D4", "#DCE6F7"], ["#EE8AAA", "#F8C3D4"],
                    ["#A8BCA2", "#CBD8C2"]]
        for i in range(11):
            cx = w * 0.03 + i * (w * 0.94) / 10
            # 窓の前には置かない
            if WINDOW_BOX[0] * w - 40 < cx < WINDOW_BOX[2] * w + 40 and shelf_t < 0.42:
                continue
            d.rounded_rectangle([cx - w * 0.022, y - h * 0.045, cx + w * 0.022, y + 2],
                                radius=9, fill=hex_rgb("#9EA8A2"))
            _flower_cluster(d, cx, y - h * 0.072, w * 0.030,
                            palettes[(i + int(shelf_t * 10)) % len(palettes)], rng, 24)

    # ---- 柱（見える帯のすぐ外に立てて、奥行きの手がかりにする）
    for px in (SAFE_X[0] - 0.055, SAFE_X[1] + 0.012):
        x = int(w * px)
        d.rectangle([x, 0, x + int(w * 0.042), int(h * 0.66)], fill=hex_rgb(WOOD))
        d.rectangle([x, 0, x + 9, int(h * 0.66)], fill=shade(hex_rgb(WOOD), 0.22))
        d.rectangle([x + int(w * 0.034), 0, x + int(w * 0.042), int(h * 0.66)],
                    fill=shade(hex_rgb(WOOD), -0.24))

    # ---- 左：黒板（見える帯のふち）
    bx0, by0 = int(w * 0.205), int(h * 0.08)
    d.rounded_rectangle([bx0, by0, bx0 + int(w * 0.115), by0 + int(h * 0.16)], radius=6,
                        fill=hex_rgb("#4E5551"), outline=hex_rgb(WOOD), width=11)

    # ---- 右：ラッピングのロールとリボン
    rx = int(w * 0.672)
    roll_colors = ["#C4A578", "#F0E4CE", "#E0B3B8", "#B3C0A6", "#4E5A70", "#CBB9D6"]
    for i, c in enumerate(roll_colors):
        y = int(h * 0.04) + i * int(h * 0.031)
        d.rounded_rectangle([rx, y, w - int(w * 0.06), y + int(h * 0.026)], radius=13,
                            fill=jitter(hex_rgb(c), rng, 7),
                            outline=shade(hex_rgb(c), -0.22), width=2)
    for i in range(8):
        x = rx + int(w * 0.006) + i * int(w * 0.028)
        d.rectangle([x, int(h * 0.245), x + int(w * 0.013), int(h * 0.315)],
                    fill=jitter(hex_rgb(roll_colors[i % len(roll_colors)]), rng, 9))

    # ---- 吊るしたドライフラワーと、垂れ下がる緑
    for x in (w * 0.335, w * 0.668):
        d.line([x, 0, x, h * 0.075], fill=shade(hex_rgb(WOOD), -0.2), width=4)
        _flower_cluster(d, x, h * 0.115, w * 0.024,
                        ["#C7B39A", "#B9A488", "#D2C0A6"], rng, 22)
    for x in (w * 0.30, w * 0.71):
        for k in range(14):
            t = k / 14
            _flower_cluster(d, x + math.sin(k * 1.1) * w * 0.012, h * (0.02 + t * 0.30),
                            w * 0.018, ["#9FB88C", "#B7C9A6", "#8CA378"], rng, 7)

    # ---- 天井から下がる灯り（あたたかい玉）
    lamp_x, lamp_y = w * 0.5, h * 0.055
    d.line([lamp_x, 0, lamp_x, lamp_y], fill=shade(hex_rgb(WOOD), -0.3), width=3)
    for k in range(8):
        r = w * (0.010 + k * 0.007)
        d.ellipse([lamp_x - r, lamp_y - r * 0.7, lamp_x + r, lamp_y + r * 1.2],
                  fill=(*mix(hex_rgb("#F6D79A"), hex_rgb("#FFF6E2"), k / 8), 255)
                  if k < 3 else None,
                  outline=None)
    glow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    for k in range(22):
        r = w * (0.02 + k * 0.006)
        gd.ellipse([lamp_x - r, lamp_y - r, lamp_x + r, lamp_y + r],
                   fill=(255, 236, 196, 10))
    img = Image.alpha_composite(img, glow.filter(ImageFilter.GaussianBlur(24)))
    d = ImageDraw.Draw(img)

    # ---- 手前の作業台（奥へ向かって少しすぼまる）
    table_y = int(h * 0.60)
    d.polygon([(0, h), (0, table_y + 26), (w, table_y + 26), (w, h)],
              fill=hex_rgb(WOOD_LIGHT))
    _planks(d, (0, table_y + 26, w, h), rng, hex_rgb(WOOD_LIGHT), rows=3)
    # 天板の手前のふち（ここに花が立つ）
    d.rectangle([0, table_y, w, table_y + 12], fill=shade(hex_rgb(WOOD_LIGHT), 0.26))
    d.rectangle([0, table_y + 12, w, table_y + 30], fill=shade(hex_rgb(WOOD), -0.10))
    for _ in range(90):
        y = rng.uniform(table_y + 34, h)
        x = rng.uniform(0, w)
        d.line([x, y, x + rng.uniform(120, 420), y + rng.uniform(-3, 3)],
               fill=shade(hex_rgb(WOOD_LIGHT), -0.10 - rng.random() * 0.12), width=2)

    # ---- 作業台の奥に置かれた道具（はさみ・麻ひも・じょうろ）
    tools_y = table_y + 4
    # 麻ひもの玉
    tx = int(w * 0.395)
    d.ellipse([tx - 26, tools_y - 46, tx + 26, tools_y + 4], fill=hex_rgb("#C6B08A"))
    for k in range(7):
        d.arc([tx - 26 + k * 2, tools_y - 46 + k * 3, tx + 26 - k * 2, tools_y + 4 - k * 2],
              start=200, end=340, fill=shade(hex_rgb("#C6B08A"), -0.18), width=2)
    # はさみ
    sx = int(w * 0.60)
    d.line([sx, tools_y - 6, sx + 46, tools_y - 40], fill=hex_rgb("#8C8F92"), width=6)
    d.line([sx + 6, tools_y - 6, sx + 52, tools_y - 40], fill=hex_rgb("#8C8F92"), width=6)
    d.ellipse([sx - 16, tools_y - 12, sx + 4, tools_y + 6], outline=hex_rgb("#4E5551"), width=5)
    d.ellipse([sx - 4, tools_y - 14, sx + 16, tools_y + 4], outline=hex_rgb("#4E5551"), width=5)
    # じょうろ（見える帯のふち）
    wx = int(w * 0.295)
    d.rounded_rectangle([wx - 40, tools_y - 62, wx + 30, tools_y + 2], radius=12,
                        fill=hex_rgb("#A9B2AE"))
    d.line([wx + 26, tools_y - 52, wx + 84, tools_y - 70], fill=hex_rgb("#A9B2AE"), width=9)
    d.arc([wx - 34, tools_y - 96, wx + 22, tools_y - 46], start=200, end=340,
          fill=hex_rgb("#98A19D"), width=6)

    _work_traces(img, table_y, rng)

    return img.filter(ImageFilter.GaussianBlur(3.4))


def _work_traces(img: Image.Image, table_y: int, rng: random.Random) -> None:
    """
    仕事の痕跡。

    「誰かが今朝ここで、丁寧に仕事をしていた」と伝わるためのもの。

    置くのは **やり終えた仕事の跡だけ**。
      ○  切り落とした茎、水を替えたあとの濡れた跡、落ちた葉
      ×  まだ切っていない花束、空の花瓶、積まれた注文票

    後者を置くと「これからやることがある」になり、
    開店前を「何もしなくていい時間」にした意味が消えてしまう。

    **見えすぎないこと。** 一度、輪郭のはっきりした跡を置いてみたが、
    それは痕跡ではなく「置かれたもの」に見えた。
    気づかせようとした時点で、景色ではなく演出になる。
    だから、どれも薄く、道具の並ぶ帯の中に置いて、花の立つ手前は空けておく。
    """
    w, h = img.size
    d = ImageDraw.Draw(img, "RGBA")
    # 道具（はさみ・麻ひも）と同じ帯。花が立つ手前は空けたまま。
    band = (table_y + 34, table_y + 124)

    # ---- 水を替えたあとの、乾きかけた跡。輪郭は描かない。
    for cx, cy, rx, ry in ((w * 0.368, band[0] + 46, 116, 26),
                           (w * 0.628, band[0] + 74, 82, 19)):
        wet = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        ImageDraw.Draw(wet).ellipse([cx - rx, cy - ry, cx + rx, cy + ry],
                                    fill=(74, 56, 40, 20))
        img.alpha_composite(wet.filter(ImageFilter.GaussianBlur(22)))

    # ---- 切り落とした茎の切れ端。3本だけ。天板の色に近づけて沈める。
    stem_c = mix(hex_rgb("#7E9463"), hex_rgb(WOOD_LIGHT), 0.34)
    for _ in range(3):
        x = rng.uniform(w * 0.355, w * 0.645)
        y = rng.uniform(*band)
        length = rng.uniform(26, 54)
        ang = math.radians(rng.uniform(-26, 26) + rng.choice((0, 180)))
        x2 = x + math.cos(ang) * length
        y2 = y + math.sin(ang) * length * 0.26
        d.line([x + 3, y + 4, x2 + 3, y2 + 4], fill=(74, 63, 53, 26), width=6)
        d.line([x, y, x2, y2], fill=(*stem_c, 150), width=5)

    # ---- 水滴。3つだけ。光は左上、影は右下。
    for _ in range(3):
        x = rng.uniform(w * 0.36, w * 0.64)
        y = rng.uniform(*band)
        r = rng.uniform(3.0, 4.6)
        d.ellipse([x - r, y - r * 0.7, x + r, y + r * 0.7], fill=(150, 164, 166, 34))
        d.ellipse([x - r * 0.45, y - r * 0.45, x - r * 0.05, y - r * 0.08],
                  fill=(255, 253, 245, 62))

    # ---- 落ちた葉。一枚だけ。ほとんど木目に沈む。
    lx = rng.uniform(w * 0.40, w * 0.60)
    ly = rng.uniform(band[0] + 30, band[1])
    leaf_c = mix(hex_rgb("#6F8C58"), hex_rgb(WOOD_LIGHT), 0.30)
    d.ellipse([lx - 22, ly - 6, lx + 22, ly + 6], fill=(74, 63, 53, 22))
    d.ellipse([lx - 23, ly - 8, lx + 21, ly + 4], fill=(*leaf_c, 138))


def render_shop(season: str, seed: int = 0, title: bool = False) -> Image.Image:
    """店内に季節の窓を貼り込んだ完成画。"""
    cfg = SEASONS[season]
    w, h = SCENE_SIZE
    img = render_interior(seed, title=title)

    # 窓の景色を、窓枠の内側にはめ込む
    x0, y0, x1, y1 = (int(WINDOW_BOX[0] * w), int(WINDOW_BOX[1] * h),
                      int(WINDOW_BOX[2] * w), int(WINDOW_BOX[3] * h))
    view = render_window(season, seed).convert("RGB").resize((x1 - x0, y1 - y0), Image.LANCZOS)
    img.paste(view, (x0, y0))

    d = ImageDraw.Draw(img)
    frame = hex_rgb(WOOD_DARK)
    d.rectangle([x0, y0, x1, y1], outline=frame, width=16)
    d.line([(x0 + x1) // 2, y0, (x0 + x1) // 2, y1], fill=frame, width=11)
    d.line([x0, (y0 + y1) // 2, x1, (y0 + y1) // 2], fill=frame, width=9)
    d.rectangle([x0 - 20, y1 - 4, x1 + 20, y1 + 22], fill=hex_rgb(WOOD_LIGHT))
    img = img.filter(ImageFilter.GaussianBlur(1.4))

    # 奥ほどぼかす（作業台の手前だけがはっきり見える）
    far = img.filter(ImageFilter.GaussianBlur(4.2))
    mask = Image.new("L", (w, h), 0)
    md = ImageDraw.Draw(mask)
    for i in range(40):
        t = i / 40
        md.rectangle([0, 0, w, int(h * (0.50 + t * 0.16))], fill=int(255 * (1 - t) ** 1.2))
    img = Image.composite(far, img, mask.filter(ImageFilter.GaussianBlur(30)))

    # 左上からの自然光
    light = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ld = ImageDraw.Draw(light)
    lc = hex_rgb(cfg["light"])
    for i in range(26):
        t = i / 26
        r = int(w * (0.30 + t * 0.75))
        ld.ellipse([-r + int(w * 0.30), -r + int(h * 0.10),
                    r + int(w * 0.30), r + int(h * 0.10)],
                   fill=(*lc, int(11 * (1 - t))))
    img = Image.alpha_composite(img, light.filter(ImageFilter.GaussianBlur(90)))

    # 四隅を落ち着かせる
    vig = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    vd = ImageDraw.Draw(vig)
    for i in range(30):
        t = i / 30
        vd.rectangle([int(w * 0.5 * t * 0.16), int(h * 0.5 * t * 0.16),
                      w - int(w * 0.5 * t * 0.16), h - int(h * 0.5 * t * 0.16)],
                     outline=(96, 76, 58, 7), width=14)
    img = Image.alpha_composite(img, vig.filter(ImageFilter.GaussianBlur(40)))

    # 中央下は花とUIが乗る場所。明度を上げて情報量を落とす。
    calm = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    cd = ImageDraw.Draw(calm)
    span = 30 if title else 22   # タイトル用は下中央をより広く空ける
    for i in range(span):
        t = i / span
        cd.ellipse([w * (0.16 - 0.10 * t), h * (0.50 - 0.20 * t),
                    w * (0.84 + 0.10 * t), h * (1.16 + 0.10 * t)],
                   fill=(255, 250, 240, 7 if title else 6))
    img = Image.alpha_composite(img, calm.filter(ImageFilter.GaussianBlur(70)))

    return paper_texture(img, seed=seed + 5, strength=0.10).convert("RGB")
