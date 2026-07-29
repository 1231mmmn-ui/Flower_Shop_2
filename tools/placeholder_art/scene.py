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

from .paint import (RGB, hex_rgb, jitter, linear_gradient, paper_texture, shade)

SCENE_SIZE = (1600, 1200)
WINDOW_SIZE = (800, 600)

# 店内のどこに窓があるか。窓の景色はこの枠の内側に貼る。
WINDOW_BOX = (0.28, 0.09, 0.66, 0.55)   # (x0, y0, x1, y1) 画面比

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
    """季節を含まない、共通の店内。窓の内側は空けておく。"""
    rng = random.Random(seed + 1000)
    w, h = SCENE_SIZE
    img = linear_gradient((w, h), hex_rgb(WALL), hex_rgb("#DCCDB4")).convert("RGBA")
    d = ImageDraw.Draw(img)

    # 壁の板張り
    _planks(d, (0, 0, w, int(h * 0.62)), rng, hex_rgb("#E7DBC4"), rows=5)
    # 柱で奥行きを出す
    for px in (int(w * 0.012), int(w * 0.94)):
        d.rectangle([px, 0, px + int(w * 0.045), int(h * 0.80)], fill=hex_rgb(WOOD))
        d.rectangle([px, 0, px + 10, int(h * 0.80)], fill=shade(hex_rgb(WOOD), 0.20))

    # 左：黒板と観葉植物
    bx0, by0 = int(w * 0.04), int(h * 0.12)
    d.rectangle([bx0, by0, bx0 + int(w * 0.16), by0 + int(h * 0.20)],
                fill=hex_rgb("#4E5551"), outline=hex_rgb(WOOD), width=14)
    for i in range(3):
        _flower_cluster(d, bx0 + w * 0.03 + i * w * 0.055, int(h * 0.50), w * 0.045,
                        ["#B7C9A6", "#9FB88C", "#C6D4B4"], rng, 22)

    # 右：ラッピングコーナー（紙のロールとリボン）
    rx = int(w * 0.70)
    roll_colors = ["#C4A578", "#F0E4CE", "#E0B3B8", "#B3C0A6", "#4E5A70", "#CBB9D6"]
    for i, c in enumerate(roll_colors):
        y = int(h * 0.08) + i * int(h * 0.045)
        d.rounded_rectangle([rx, y, w - int(w * 0.07), y + int(h * 0.034)], radius=18,
                            fill=jitter(hex_rgb(c), rng, 7),
                            outline=shade(hex_rgb(c), -0.2), width=2)
    for i in range(7):
        x = rx + int(w * 0.02) + i * int(w * 0.028)
        d.rectangle([x, int(h * 0.40), x + int(w * 0.016), int(h * 0.50)],
                    fill=jitter(hex_rgb(roll_colors[i % len(roll_colors)]), rng, 9))

    # 棚と花のバケツ
    shelf_y = int(h * 0.60)
    d.rectangle([0, shelf_y, w, shelf_y + 22], fill=hex_rgb(WOOD))
    d.rectangle([0, shelf_y + 22, w, shelf_y + 34], fill=shade(hex_rgb(WOOD), -0.25))
    palettes = [["#F2B825", "#FBE28C"], ["#EE93AB", "#FADCE3"], ["#8C79C6", "#E5DEF4"],
                ["#FBF6EA", "#EFE7D2"], ["#6E90D4", "#DCE6F7"], ["#EE8AAA", "#F8C3D4"]]
    for i in range(7):
        cx = w * 0.07 + i * (w * 0.86) / 6
        d.rounded_rectangle([cx - w * 0.032, shelf_y - h * 0.07, cx + w * 0.032, shelf_y + 2],
                            radius=12, fill=hex_rgb("#9EA8A2"))
        _flower_cluster(d, cx, shelf_y - h * 0.105, w * 0.045, palettes[i % len(palettes)],
                        rng, 30)

    # 手前の作業台
    table_y = int(h * 0.76)
    _planks(d, (0, table_y, w, h), rng, hex_rgb(WOOD_LIGHT), rows=4)
    d.rectangle([0, table_y, w, table_y + 14], fill=shade(hex_rgb(WOOD_LIGHT), 0.18))

    return img.filter(ImageFilter.GaussianBlur(3.0))


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
    d.rectangle([x0, y0, x1, y1], outline=frame, width=20)
    d.line([(x0 + x1) // 2, y0, (x0 + x1) // 2, y1], fill=frame, width=14)
    d.line([x0, (y0 + y1) // 2, x1, (y0 + y1) // 2], fill=frame, width=11)
    d.rectangle([x0 - 24, y1 - 4, x1 + 24, y1 + 26], fill=hex_rgb(WOOD_LIGHT))
    img = img.filter(ImageFilter.GaussianBlur(1.2))

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
