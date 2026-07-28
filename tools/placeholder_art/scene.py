"""木造のお花屋さんの店内を描く。

窓の外に季節が見える。光は左上の窓から差し込む。
IMAGE_ASSETS.md の規定サイズ：背景 2048x1152 / 作業台 2048x640。
"""

from __future__ import annotations

import math
import random

from PIL import Image, ImageDraw, ImageFilter

from .paint import (RGB, hex_rgb, jitter, linear_gradient, mix, paper_texture,
                    shade)

SCENE_SIZE = (2048, 1152)
COUNTER_SIZE = (2048, 640)

SEASONS: dict[str, dict] = {
    "spring": dict(sky=("#CFE3F2", "#EAF3F7"), foliage=["#C8DCB4", "#DCE9C6"],
                   accent=["#F6D3DC", "#FBE4EA", "#F2C4D2"], accent_n=140,
                   light="#FDF2E2"),
    "summer": dict(sky=("#8FC2E8", "#DCEEF7"), foliage=["#9DBE84", "#B7D19A"],
                   accent=["#FFFFFF", "#F4FAFF"], accent_n=40, light="#FEF6E2"),
    "autumn": dict(sky=("#E3D6BE", "#F3E9D6"), foliage=["#D9A468", "#C98A50"],
                   accent=["#E0A05E", "#CE8146", "#EBC183"], accent_n=110,
                   light="#FBEAD2"),
    "winter": dict(sky=("#DCE6EE", "#F2F6F9"), foliage=["#C3CFCC", "#DCE4E0"],
                   accent=["#FFFFFF", "#F4F8FA"], accent_n=170, light="#F6F2EC"),
}

WOOD_DARK = "#7C5F44"
WOOD = "#A6825E"
WOOD_LIGHT = "#C7A57C"
WALL = "#EDE2CE"


def _planks(draw: ImageDraw.ImageDraw, box, rng: random.Random, color: RGB,
            rows: int = 6, horizontal: bool = True) -> None:
    x0, y0, x1, y1 = box
    n = rows
    for i in range(n):
        if horizontal:
            a = y0 + (y1 - y0) * i / n
            b = y0 + (y1 - y0) * (i + 1) / n
            draw.rectangle([x0, a, x1, b], fill=jitter(color, rng, 9))
            draw.line([x0, b, x1, b], fill=shade(color, -0.18), width=2)
        else:
            a = x0 + (x1 - x0) * i / n
            b = x0 + (x1 - x0) * (i + 1) / n
            draw.rectangle([a, y0, b, y1], fill=jitter(color, rng, 9))
            draw.line([b, y0, b, y1], fill=shade(color, -0.18), width=2)


def _bouquet_blob(draw: ImageDraw.ImageDraw, cx: float, cy: float, r: float,
                  colors: list[str], rng: random.Random, n: int = 26) -> None:
    """棚に並ぶ花の塊（背景なのでにじみの集合で十分）。"""
    for _ in range(n):
        a = rng.uniform(0, 2 * math.pi)
        rad = r * math.sqrt(rng.uniform(0, 1))
        x, y = cx + math.cos(a) * rad, cy + math.sin(a) * rad * 0.8
        d = r * rng.uniform(0.16, 0.30)
        draw.ellipse([x - d, y - d, x + d, y + d],
                     fill=jitter(hex_rgb(rng.choice(colors)), rng, 12))


def render_shop(season: str, seed: int = 0) -> Image.Image:
    rng = random.Random(seed + 1000 + hash(season) % 997)
    w, h = SCENE_SIZE
    cfg = SEASONS[season]

    img = linear_gradient((w, h), hex_rgb(WALL), hex_rgb("#DCCDB4")).convert("RGBA")
    d = ImageDraw.Draw(img)

    # ---- 壁の板張り
    _planks(d, (0, 0, w, int(h * 0.62)), rng, hex_rgb("#E7DBC4"), rows=4)
    # 柱（左右）で店内に奥行きを出す
    for px in (int(w * 0.012), int(w * 0.94)):
        d.rectangle([px, 0, px + int(w * 0.045), int(h * 0.78)], fill=hex_rgb(WOOD))
        d.rectangle([px, 0, px + 10, int(h * 0.78)], fill=shade(hex_rgb(WOOD), 0.20))

    # ---- 窓（中央やや左、大きく取る）
    wx0, wy0, wx1, wy1 = int(w * 0.30), int(h * 0.06), int(w * 0.66), int(h * 0.58)
    sky = linear_gradient((wx1 - wx0, wy1 - wy0), hex_rgb(cfg["sky"][0]), hex_rgb(cfg["sky"][1]))
    img.paste(sky, (wx0, wy0))
    sd = ImageDraw.Draw(img)
    # 外の木立
    for _ in range(90):
        x = rng.uniform(wx0, wx1)
        y = rng.uniform(wy0 + (wy1 - wy0) * 0.34, wy1)
        r = rng.uniform(24, 96)
        sd.ellipse([x - r, y - r * 0.8, x + r, y + r * 0.8],
                   fill=jitter(hex_rgb(rng.choice(cfg["foliage"])), rng, 14))
    # 季節の色（桜・雲・紅葉・雪）
    for _ in range(cfg["accent_n"]):
        x = rng.uniform(wx0, wx1)
        y = rng.uniform(wy0, wy1)
        r = rng.uniform(6, 26)
        sd.ellipse([x - r, y - r * 0.9, x + r, y + r * 0.9],
                   fill=jitter(hex_rgb(rng.choice(cfg["accent"])), rng, 8))
    # 窓枠
    frame = hex_rgb(WOOD_DARK)
    sd.rectangle([wx0, wy0, wx1, wy1], outline=frame, width=22)
    sd.line([(wx0 + wx1) // 2, wy0, (wx0 + wx1) // 2, wy1], fill=frame, width=16)
    sd.line([wx0, (wy0 + wy1) // 2, wx1, (wy0 + wy1) // 2], fill=frame, width=12)
    sd.rectangle([wx0 - 26, wy1 - 4, wx1 + 26, wy1 + 30], fill=hex_rgb(WOOD_LIGHT))

    # ---- 左：黒板と観葉植物
    bx0, by0 = int(w * 0.03), int(h * 0.10)
    d.rectangle([bx0, by0, bx0 + 300, by0 + 220], fill=hex_rgb("#4E5551"),
                outline=hex_rgb(WOOD), width=16)
    d.text((bx0 + 60, by0 + 90), "Flower", fill=(236, 232, 220))
    for i in range(3):
        _bouquet_blob(d, bx0 + 90 + i * 110, int(h * 0.50), 74,
                      ["#B7C9A6", "#9FB88C", "#C6D4B4"], rng, 22)

    # ---- 右：ラッピングペーパーのロールとリボン
    rx = int(w * 0.72)
    roll_colors = ["#C7B49A", "#E3B6BC", "#B9C4CE", "#EFE3CE", "#C4CDBB", "#D9C7DA"]
    for i, c in enumerate(roll_colors):
        y = int(h * 0.06) + i * 52
        d.rounded_rectangle([rx, y, w - 120, y + 40], radius=20,
                            fill=jitter(hex_rgb(c), rng, 8),
                            outline=shade(hex_rgb(c), -0.2), width=2)
    for i in range(7):
        x = rx + 30 + i * 46
        d.rectangle([x, int(h * 0.40), x + 26, int(h * 0.40) + 120],
                    fill=jitter(hex_rgb(roll_colors[i % len(roll_colors)]), rng, 10))

    # ---- 棚と花のバケツ
    shelf_y = int(h * 0.60)
    d.rectangle([0, shelf_y, w, shelf_y + 26], fill=hex_rgb(WOOD))
    d.rectangle([0, shelf_y + 26, w, shelf_y + 40], fill=shade(hex_rgb(WOOD), -0.25))
    palettes = [["#F2B825", "#FBE28C"], ["#EE93AB", "#FADCE3"], ["#8C79C6", "#E5DEF4"],
                ["#FBF6EA", "#EFE7D2"], ["#6E90D4", "#DCE6F7"], ["#EE8AAA", "#F8C3D4"]]
    for i in range(7):
        cx = 110 + i * (w - 220) / 6
        pal = palettes[i % len(palettes)]
        d.rounded_rectangle([cx - 52, shelf_y - 86, cx + 52, shelf_y + 2], radius=14,
                            fill=hex_rgb("#9EA8A2"))
        _bouquet_blob(d, cx, shelf_y - 130, 74, pal, rng, 30)

    # ---- 手前の作業台
    table_y = int(h * 0.74)
    _planks(d, (0, table_y, w, h), rng, hex_rgb(WOOD_LIGHT), rows=5)
    d.rectangle([0, table_y, w, table_y + 16], fill=shade(hex_rgb(WOOD_LIGHT), 0.18))

    img = img.filter(ImageFilter.GaussianBlur(3.4))

    # ---- 左上からの自然光と、四隅の落ち着き
    light = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ld = ImageDraw.Draw(light)
    lc = hex_rgb(cfg["light"])
    for i in range(26):
        t = i / 26
        r = int(w * (0.30 + t * 0.75))
        ld.ellipse([-r + int(w * 0.30), -r + int(h * 0.10),
                    r + int(w * 0.30), r + int(h * 0.10)],
                   fill=(*lc, int(11 * (1 - t))))
    light = light.filter(ImageFilter.GaussianBlur(90))
    img = Image.alpha_composite(img, light)

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
    for i in range(24):
        t = i / 24
        cd.ellipse([w * (0.16 - 0.10 * t), h * (0.52 - 0.22 * t),
                    w * (0.84 + 0.10 * t), h * (1.16 + 0.10 * t)],
                   fill=(255, 250, 240, 6))
    img = Image.alpha_composite(img, calm.filter(ImageFilter.GaussianBlur(70)))

    return paper_texture(img, seed=seed + 5, strength=0.10)


def render_counter(seed: int = 0) -> Image.Image:
    """手前に重ねる作業台。上端は透明。"""
    rng = random.Random(seed + 2000)
    w, h = COUNTER_SIZE
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    top = int(h * 0.22)
    _planks(d, (0, top, w, h), rng, hex_rgb(WOOD_LIGHT), rows=4)
    # 天板の手前側の面取り
    d.rectangle([0, top, w, top + 18], fill=shade(hex_rgb(WOOD_LIGHT), 0.24))
    d.rectangle([0, top + 18, w, top + 30], fill=shade(hex_rgb(WOOD), -0.12))
    # 木目
    for _ in range(70):
        y = rng.uniform(top + 34, h)
        x = rng.uniform(0, w)
        ln = rng.uniform(120, 460)
        d.line([x, y, x + ln, y + rng.uniform(-3, 3)],
               fill=shade(hex_rgb(WOOD), -0.10 - rng.random() * 0.12), width=2)
    img = img.filter(ImageFilter.GaussianBlur(2.0))
    # 花が置かれる位置に落ちる柔らかい影
    sh = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ImageDraw.Draw(sh).ellipse([w * 0.30, top + 6, w * 0.72, top + 96],
                               fill=(92, 72, 56, 62))
    img = Image.alpha_composite(img, sh.filter(ImageFilter.GaussianBlur(38)))
    return paper_texture(img, seed=seed + 9, strength=0.08)
