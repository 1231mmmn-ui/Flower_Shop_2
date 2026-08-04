"""お客さま。**半写実の水彩人物画**として描く。

    assets/customers/<id>-normal.png   800 x 800  透過（迎えたところ）
    assets/customers/<id>-happy.png    800 x 800  透過（受け取ったところ）
    assets/customers/<id>-arms.png     800 x 800  透過（前腕と手だけ）

── なぜ描き直したか ──────────────────────────────────────

水彩の質感はなじんできたのに、**造形がキャラクターのまま**でした。

    丸い顔  ＋  「⌒」の目  ＋  大きな服

これは記号です。にじみをいくら足しても、記号は記号のままです。
足りなかったのは水彩ではなく、**人体**でした。

── 順番を、変えました ────────────────────────────────────

    前   単純な人物を描く → 水彩加工を掛ける
    いま 人体と顔を描く → 光と陰影を入れる → 水彩へ落とす

水彩は最後の一手であって、作り方ではありません。

── 直したもの ────────────────────────────────────────────

    顔    真円をやめた。額 → こめかみ → 頬骨 → 顎 とすぼまる輪郭
    目    まぶた・虹彩・瞳・ハイライト・下まぶた・まつげ
    鼻    輪郭線は描かない。鼻筋の右に影、小鼻、鼻先の下の影
    口    一本線をやめた。上唇（濃い）と下唇（明るい）の二枚
    髪    一枚の面をやめた。毛束を何本も重ね、流れと分け目を作る
    首肩  顎の下の影・鎖骨・なで肩の傾き。腕までひと続き
    個体差 首の傾き・視線・肩の傾き・髪型を、人ごとに変える

**避けるもの**（参考画のNG例より）
    ・顔や目が大きすぎる（キャラクター感が強くなる）
    ・輪郭がくっきりしすぎる、影が濃すぎる
    ・ポーズが硬い、体のラインが不自然
    ・3D・写真風。ここは水彩の絵で、写実画ではない

**主張しすぎない色味で、花が主役になるように。**
人物を目立たせたいのではなく、違和感だけを消します。
"""

from __future__ import annotations

import math
import random

from PIL import Image, ImageChops, ImageDraw, ImageFilter

from .paint import (RGB, bezier, hex_rgb, mix, paint_mask, paper_texture, shade,
                    shade_side, tapered_band, watercolor_mask, wc_layer)

CUSTOMER_SIZE = (800, 800)

# ── 枠の中の、頭の位置と大きさ ──────────────────────────────
#
# **頭を、一回り大きく取り直しました。**
#
# 前は顔の高さが枠の 35%（280px）しかなく、目は 20px ほどでした。
# その大きさでは、まぶたも虹彩も鼻の影も、描いても潰れます。
# 造形を半写実まで上げるには、まず**描く場所**が要ります。
#
#   前   顔の中心 0.42／あご 0.58／頭 280px（枠の35%）
#   いま 顔の中心 0.34／あご 0.555／頭 375px（枠の47%）
#
# DeliverScreen.css は、この「あご」から花束の大きさを逆算しています。
# **ここを動かしたら、あちらも測り直すこと。**
FACE_CY = 0.34
CHIN_Y = 0.555
HEAD_TOP = 0.088

# 顔の輪郭。中心からの高さ（px）と、そのときの半幅（px）。
#
# **真円ではありません。** こめかみでいちばん広く、
# 頬骨から下はゆるやかにすぼまり、顎で丸くとじます。
FACE_PROFILE = (
    (-150, 58), (-128, 87), (-104, 103), (-72, 112), (-36, 115),
    (0, 114), (36, 106), (68, 92), (96, 70), (116, 45), (128, 0),
)


def _mask(size, fn) -> Image.Image:
    m = Image.new("L", size, 0)
    fn(ImageDraw.Draw(m))
    return m


def _soft(mask: Image.Image, blur: float) -> Image.Image:
    return mask.filter(ImageFilter.GaussianBlur(blur))


def _over(base: Image.Image, mask: Image.Image, color: RGB, strength: float = 1.0):
    """うすい面を一枚、上に置く。影も、光も、頬の色も、これで。"""
    if strength != 1.0:
        mask = mask.point(lambda v: int(v * strength))
    base.alpha_composite(paint_mask(base.size, mask, color))


def face_outline(cx: float, cy: float, w: float, h: float) -> list[tuple[float, float]]:
    """顔の輪郭を、左半分 → 右半分の順に閉じた形で返す。"""
    left = [(cx - hw * w, cy + dy * h) for dy, hw in FACE_PROFILE]
    right = [(cx + hw * w, cy + dy * h) for dy, hw in reversed(FACE_PROFILE)]
    return left + right


# --------------------------------------------------------------------------
# 顔のつくり
# --------------------------------------------------------------------------

def _eye(img: Image.Image, cx: float, cy: float, side: int, spec: dict,
         gaze: tuple[float, float], narrow: float, skin: RGB, k: float = 1.0) -> None:
    """
    片目。

    ── 「⌒」をやめる、ということ ──────────────────────────

    弧を一本引くと、それは目ではなく**目のしるし**です。
    人の目に見えるために要るのは、次の順番です。

        一．まぶたの厚み   上まぶたは、いちばん濃い線
        二．虹彩          上をまぶたに切られていること（丸見えだと驚き顔）
        三．瞳            虹彩の中に、もう一段濃い点
        四．光            瞳の左上に、小さな白
        五．下まぶた       ごく淡い線。ここを濃くすると隈になる
        六．まつげ        目尻だけ、わずかに伸ばす

    **大きくしないこと。** 参考画のNG例の筆頭が「目が大きすぎる」です。
    """
    ink = hex_rgb(spec.get("eye", "#4A3A31"))
    # **顔の大きさに連れて変わること。**
    # 一度、頭だけ 1.34 倍にして目を絶対値のままにしたら、
    # 目が顔の中で小さくなり、まぶたも虹彩も潰れて黒い豆になりました。
    w = 25.0 * k
    h = 12.5 * k * (1 - narrow * 0.45)

    # 上まぶた。目頭は細く、目尻に向かって太く。
    lid = bezier((cx - w, cy + 2.5), (cx + side * 2, cy - h * 1.35), (cx + w, cy + 1.0), 26)
    band = tapered_band(lid, 2.4 * k, 5.0 * k)
    _over(img, _soft(_mask(img.size, lambda d: d.polygon(band, fill=255)), 1.0 * k), ink, 0.92)

    # 白目。**ここが見えないと、目は黒い豆になります。**
    # 真っ白にはしません（浮きます）が、肌よりはっきり明るく。
    white = _mask(img.size, lambda d: d.ellipse(
        [cx - w * 0.88, cy - h * 0.80, cx + w * 0.88, cy + h * 0.95], fill=255))
    _over(img, _soft(white, 1.6 * k), mix(skin, (255, 255, 255), 0.90), 0.92)
    # 上まぶたが白目に落とす影。これで眼球が球に見える。
    _over(img, _soft(_mask(img.size, lambda d: d.ellipse(
        [cx - w * 0.86, cy - h * 1.05, cx + w * 0.86, cy - h * 0.10], fill=255)), 2.4 * k),
        shade(skin, -0.34), 0.34)

    # 虹彩。上をまぶたで切る。
    ir = 9.4 * k * (1 - narrow * 0.2)
    ix, iy = cx + gaze[0], cy + gaze[1] + 1.6
    iris = _mask(img.size, lambda d: d.ellipse([ix - ir, iy - ir, ix + ir, iy + ir], fill=255))
    cut = _mask(img.size, lambda d: d.rectangle([0, 0, img.size[0], cy - h * 0.42], fill=255))
    iris = ImageChops.subtract(iris, cut)
    _over(img, _soft(iris, 0.9), mix(ink, (120, 96, 74), 0.42), 0.9)
    # 瞳
    pr = ir * 0.46
    pup = _mask(img.size, lambda d: d.ellipse([ix - pr, iy - pr, ix + pr, iy + pr], fill=255))
    _over(img, _soft(ImageChops.subtract(pup, cut), 0.7), shade(ink, -0.35), 0.95)
    # 光。瞳の左上（光は左上ひとつ）
    hr = ir * 0.34
    hx, hy = ix - ir * 0.42, iy - ir * 0.44
    _over(img, _soft(_mask(img.size, lambda d: d.ellipse(
        [hx - hr, hy - hr, hx + hr, hy + hr], fill=255)), 0.6), (255, 253, 248), 0.85)

    # 下まぶた。**ごく淡く。** 濃くすると隈になる。
    low = bezier((cx - w * 0.8, cy + h * 0.5), (cx, cy + h * 1.25), (cx + w * 0.86, cy + h * 0.3), 18)
    _over(img, _soft(_mask(img.size, lambda d: d.line(low, fill=255, width=int(2 * k) or 1)), 1.4 * k),
          mix(ink, skin, 0.55), 0.4)

    # まつげ。目尻だけ、わずかに。
    tip = [(cx + side * w * 0.86, cy + 1.0), (cx + side * (w + 7 * k), cy - 3.5 * k)]
    _over(img, _soft(_mask(img.size, lambda d: d.line(tip, fill=255, width=int(3 * k) or 1)), 1.0 * k),
          ink, 0.7)

    # 眉。髪より淡く、目のうえ。
    brow_y = cy - 32 * k
    brow = bezier((cx - w * 1.05, brow_y + 6 * k), (cx + side * 3, brow_y - 9 * k),
                  (cx + w * 1.0, brow_y + 3 * k), 22)
    bb = tapered_band(brow, 5.6 * k, 2.4 * k)
    _over(img, _soft(_mask(img.size, lambda d: d.polygon(bb, fill=255)), 2.2),
          mix(hex_rgb(spec["hair"]), skin, 0.30), 0.55)


def _nose(img: Image.Image, cx: float, cy: float, skin: RGB, nose_h: float,
          k: float = 1.0) -> None:
    """
    鼻。**輪郭線は描きません。**

    描くのは影だけです。線で描いた鼻は、どんなに細くても記号になります。
    光は左上ひとつなので、鼻筋の**右側**に影が落ちます。
    """
    dark = shade(skin, -0.40)
    # 鼻筋の右の影。眉間から鼻先へ、細く。
    ridge = bezier((cx + 5 * k, cy - nose_h * 0.95), (cx + 9 * k, cy - nose_h * 0.3),
                   (cx + 7 * k, cy), 20)
    band = tapered_band(ridge, 3.4 * k, 11.0 * k)
    _over(img, _soft(_mask(img.size, lambda d: d.polygon(band, fill=255)), 5.0 * k), dark, 0.46)
    # 鼻先の下の影。**ここが鼻の位置を決めます。**
    _over(img, _soft(_mask(img.size, lambda d: d.ellipse(
        [cx - 13 * k, cy - 2 * k, cx + 14 * k, cy + 8 * k], fill=255)), 4.0 * k), dark, 0.42)
    # 小鼻。ごく小さく、ふたつ。
    for s in (-1, 1):
        _over(img, _soft(_mask(img.size, lambda d: d.ellipse(
            [cx + s * 14 * k - 5 * k, cy - 6 * k, cx + s * 14 * k + 5 * k, cy + 2 * k],
            fill=255)), 2.4 * k), dark, 0.36)
    # 鼻筋の左に、うすい光
    lit = bezier((cx - 4 * k, cy - nose_h * 0.9), (cx - 6 * k, cy - nose_h * 0.3),
                 (cx - 4 * k, cy - 3 * k), 16)
    _over(img, _soft(_mask(img.size, lambda d: d.line(lit, fill=255, width=int(6 * k) or 1)),
                     4.0 * k), mix(skin, (255, 250, 240), 0.6), 0.38)


def _mouth(img: Image.Image, cx: float, cy: float, skin: RGB, smile: float,
           width: float = 21.0, k: float = 1.0) -> None:
    """
    口。**一本線の笑顔をやめました。**

    上唇は光を受けにくいので少し濃く、下唇は明るくてつやがあります。
    その二枚の合わせ目が、線に見えるだけです。
    """
    # **濃くしすぎないこと。** 唇は肌の延長で、貼り付けた色ではありません。
    lip = mix(skin, hex_rgb("#C88F86"), 0.46)
    rise = (3.0 + smile * 4.0) * k

    # 上唇。中央がへこむ（丘がふたつ）
    top = (bezier((cx - width, cy - rise * 0.4), (cx - width * 0.5, cy - 6.5 * k), (cx - 1, cy - 1.5 * k), 14)
           + bezier((cx + 1, cy - 1.5 * k), (cx + width * 0.5, cy - 6.5 * k), (cx + width, cy - rise * 0.4), 14))
    upper = top + [(cx + width, cy + 0.5 * k), (cx, cy + 2.4 * k), (cx - width, cy + 0.5 * k)]
    _over(img, _soft(_mask(img.size, lambda d: d.polygon(upper, fill=255)), 1.8),
          shade(lip, -0.16), 0.58)

    # 下唇。上唇より広く、明るい。
    low = bezier((cx - width * 0.92, cy + 1.5 * k), (cx, cy + (10.5 + smile * 1.5) * k),
                 (cx + width * 0.92, cy + 1.5 * k), 22)
    lower = low + [(cx + width * 0.92, cy + 0.5 * k), (cx, cy + 3.0 * k), (cx - width * 0.92, cy + 0.5 * k)]
    _over(img, _soft(_mask(img.size, lambda d: d.polygon(lower, fill=255)), 2.2),
          mix(lip, (255, 236, 226), 0.30), 0.62)
    # 下唇のつや
    _over(img, _soft(_mask(img.size, lambda d: d.ellipse(
        [cx - 8 * k, cy + 4 * k, cx + 8 * k, cy + 9 * k], fill=255)), 2.6 * k),
          (255, 246, 238), 0.40)

    # 合わせ目。**唇より外へ出さない。** 出すと口が裂けて見える。
    seam = bezier((cx - width * 0.94, cy - rise * 0.5), (cx, cy + (3.2 + smile * 0.8) * k),
                  (cx + width * 0.94, cy - rise * 0.5), 24)
    _over(img, _soft(_mask(img.size, lambda d: d.line(seam, fill=255, width=int(2 * k) or 1)),
                     1.4 * k), shade(lip, -0.40), 0.54)
    # 口角。ここだけ、わずかに上げる。
    for s in (-1, 1):
        _over(img, _soft(_mask(img.size, lambda d: d.ellipse(
            [cx + s * width * 0.96 - 3 * k, cy - rise * 0.6 - 3 * k,
             cx + s * width * 0.96 + 3 * k, cy - rise * 0.6 + 3 * k], fill=255)), 1.6 * k),
              shade(lip, -0.42), 0.55 * (0.5 + smile))


# --------------------------------------------------------------------------
# 髪
# --------------------------------------------------------------------------

def _hair_back(img: Image.Image, spec: dict, cx: float, cy: float, fw: float,
               fh: float, rng: random.Random) -> None:
    """
    後ろ髪。**顔より先に描きます。**

    一度、髪を全部あとから描いたら、**顔が隠れました。**
    髪は顔の後ろにあるもの（後ろ髪・横の毛）と、
    前にあるもの（前髪・顔にかかる後れ毛）に分かれます。
    順番を間違えると、どれだけ毛束を重ねても頭巾になります。
    """
    hair = hex_rgb(spec["hair"])
    style = spec.get("hair_style", "long")
    length = spec.get("hair_len", 140)
    size = img.size
    dark = shade(hair, -0.24)
    light = mix(hair, (255, 240, 214), 0.30)
    top = cy - fh * 158

    def base(d):
        # 頭の丸み。**顔よりひとまわり大きいだけ。**
        # 大きくすると頭巾になります（一度そうなりました）。
        d.ellipse([cx - fw * 124, top - fh * 8, cx + fw * 124, cy + fh * 52], fill=255)
        if style in ("long", "wave"):
            # 長い髪も、**四角い面では落としません。**
            # 左右それぞれ、下ほど細くなる帯にします。
            # 面のまま落とすと、首まで覆ってフードに見えます。
            for s2 in (-1, 1):
                # **頭から続いていること。** 一度、頬の横に帯を置いただけに
                # したら、髪ではなく**板が二枚**立っているように見えました。
                # てっぺん近く（こめかみの上）から始めて、頭の丸みに沿わせ、
                # 肩のあたりで外へ流します。
                fall = bezier(
                    (cx + s2 * fw * 70, cy - fh * 140),
                    (cx + s2 * fw * (128 + length * 0.04), cy - fh * 10),
                    (cx + s2 * fw * (100 + length * 0.05), cy + fh * (56 + length * 0.80)),
                    32)
                d.polygon(tapered_band(fall, 52, 74), fill=255)
        elif style == "pony":
            tail = bezier((cx + fw * 78, cy - fh * 100), (cx + fw * 150, cy + fh * 30),
                          (cx + fw * 116, cy + fh * (40 + length * 0.7)), 26)
            d.polygon(tapered_band(tail, 48, 64), fill=255)
        elif style == "bun":
            d.ellipse([cx - fw * 52, top - fh * 58, cx + fw * 52, top + fh * 22], fill=255)
        else:  # short
            d.ellipse([cx - fw * 124, cy - fh * 56, cx + fw * 124, cy + fh * 40], fill=255)

    img.alpha_composite(wc_layer(size, base, dark, rng.randint(0, 9999), 3.6, 0.12))

    # 毛束。地より明るい帯を、流れにそって。**顔の外側だけ。**
    for i in range(8):
        t = i / 7
        side = -1 if t < 0.5 else 1
        spread = 0.35 + abs(t - 0.5) * 1.3
        drop = (length * 0.8) if style in ("long", "wave") else 22
        path = bezier(
            (cx + side * fw * (10 + spread * 40), top + fh * (4 + rng.uniform(-6, 8))),
            (cx + side * fw * (86 + spread * 34), cy + fh * (10 + spread * 30)),
            (cx + side * fw * (92 + spread * 26) + rng.uniform(-10, 10),
             cy + fh * (52 + drop * (0.4 + spread * 0.5))),
            30)
        band = tapered_band(path, 15 + rng.uniform(0, 8), 5 + rng.uniform(0, 5))
        tone = mix(hair, light, 0.16 + 0.5 * rng.random())
        img.alpha_composite(wc_layer(size, lambda d, b=band: d.polygon(b, fill=255),
                                     tone, rng.randint(0, 9999), 2.6, 0.10))

    # つや。左上に、ゆるい弧が一本。**光は左上ひとつ。**
    gl = bezier((cx - fw * 88, cy - fh * 92), (cx - fw * 24, cy - fh * 132),
                (cx + fw * 44, cy - fh * 96), 22)
    _over(img, _soft(_mask(size, lambda d: d.line(gl, fill=255, width=15)), 9.0),
          mix(hair, (255, 246, 226), 0.55), 0.32)


def _hair_front(img: Image.Image, spec: dict, cx: float, cy: float, fw: float,
                fh: float, rng: random.Random) -> None:
    """
    前髪。**顔のあとに描きます。**

    額の上だけ。**目まで垂らさないこと** ── 垂らすと顔が読めなくなり、
    表情の違いが分からなくなります（参考画でも、前髪は眉のあたりで終わる）。
    分け目からひと束ずつ流して、額が少しのぞくようにします。
    """
    hair = hex_rgb(spec["hair"])
    size = img.size
    light = mix(hair, (255, 240, 214), 0.30)
    dark = shade(hair, -0.22)
    top = cy - fh * 150
    part = cx + fw * rng.uniform(-26, 26)
    # 前髪の下端。眉（cy - 42*fh）より上で止める。
    stop = cy - fh * 58

    # ── 頭のてっぺんを、覆う ──────────────────────────────
    #
    # **これが無いと、地肌が見えます。** 一度そうなりました。
    # 後ろ髪は顔より外にしか出ないので、顔の絵をあとから乗せると
    # 頭のてっぺんが素肌のまま残ります。
    #
    # 生え際は、まっすぐな線にしないこと。まん中がいちばん高く、
    # こめかみへ向かって下がります。
    hairline = (bezier((cx - fw * 112, cy - fh * 44), (cx - fw * 74, cy - fh * 112),
                       (cx - fw * 8, cy - fh * 104), 20)
                + bezier((cx + fw * 8, cy - fh * 104), (cx + fw * 74, cy - fh * 112),
                         (cx + fw * 112, cy - fh * 44), 20))
    crown = (list(reversed(hairline))
             + bezier((cx + fw * 112, cy - fh * 44), (cx + fw * 122, cy - fh * 168),
                      (cx, cy - fh * 172), 24)
             + bezier((cx, cy - fh * 172), (cx - fw * 122, cy - fh * 168),
                      (cx - fw * 112, cy - fh * 44), 24))
    img.alpha_composite(wc_layer(size, lambda d: d.polygon(crown, fill=255),
                                 dark, rng.randint(0, 9999), 3.4, 0.11))

    for i in range(6):
        t = i / 5
        side = -1 if t < 0.5 else 1
        spread = 0.3 + abs(t - 0.5) * 1.4
        path = bezier(
            (part + side * fw * 6, top + fh * 8),
            (part + side * fw * (46 + spread * 40), top + fh * (44 + spread * 16)),
            (cx + side * fw * (72 + spread * 34), stop + fh * rng.uniform(-14, 16)),
            26)
        band = tapered_band(path, 17 + rng.uniform(0, 7), 4 + rng.uniform(0, 4))
        tone = mix(hair, light, 0.10 + 0.45 * rng.random())
        img.alpha_composite(wc_layer(size, lambda d, b=band: d.polygon(b, fill=255),
                                     tone, rng.randint(0, 9999), 2.4, 0.10))

    # 分け目。地の色で、細く一本。
    parting = bezier((part, top + fh * 6), (part + fw * 8, cy - fh * 112),
                     (part + fw * 3, cy - fh * 88), 16)
    _over(img, _soft(_mask(size, lambda d: d.line(parting, fill=255, width=6)), 3.2),
          shade(hair, -0.44), 0.45)

    # 前髪が額に落とす影。重なりの厚みは、ここで出る（花と同じ考え方）。
    _over(img, _soft(_mask(size, lambda d: d.ellipse(
        [cx - fw * 92, cy - fh * 116, cx + fw * 92, cy - fh * 52], fill=255)), 16),
        shade(hex_rgb(spec.get("skin", "#F2D9C4")), -0.34), 0.26)

    # 後れ毛。顔の輪郭にかかる、細いのを二本だけ。
    for _ in range(2):
        s = rng.choice((-1, 1))
        strand = bezier((cx + s * fw * rng.uniform(56, 78), cy - fh * rng.uniform(96, 118)),
                        (cx + s * fw * rng.uniform(96, 116), cy - fh * rng.uniform(10, 40)),
                        (cx + s * fw * rng.uniform(84, 104), cy + fh * rng.uniform(20, 60)), 20)
        _over(img, _soft(_mask(size, lambda d, p=strand: d.line(p, fill=255, width=3)), 1.6),
              mix(hair, light, 0.3), 0.45)


# --------------------------------------------------------------------------
# 人物
# --------------------------------------------------------------------------

def render_customer(spec: dict, mood: str, seed: int = 0) -> Image.Image:
    """
    お客さま、ひとり。

    順番は **人体 → 光と陰影 → 水彩**。
    水彩は最後の一手であって、作り方ではありません。

        mood="normal"   迎えたところ。まっすぐ、やわらかく
        mood="happy"    受け取ったところ。**視線は花束へ**（下を向く）
    """
    rng = random.Random(seed + hash(spec["id"] + mood) % 9000)
    w, h = CUSTOMER_SIZE
    size = (w, h)
    img = Image.new("RGBA", size, (0, 0, 0, 0))

    skin = hex_rgb(spec.get("skin", "#F2D9C4"))
    # 服の色は、そのままだと強すぎます。
    # **主張しすぎない色味で、花が主役になるように**（参考画のポイント）。
    # 生成りへ寄せて、彩度を落とします。
    cloth = mix(hex_rgb(spec["cloth"]), hex_rgb("#EFE7D8"), 0.42)

    cx = w * 0.5
    cy = h * FACE_CY
    chin = h * CHIN_Y
    # 顔の縦横。人ごとに少しだけ違う（全員が同じ顔にならないように）
    fw = spec.get("face_w", 1.0) * (chin - cy) / 128.0
    fh = (chin - cy) / 128.0 * spec.get("face_h", 1.0)

    tilt = spec.get("tilt", 0.0) + (2.5 if mood == "happy" else 0.0)
    shoulder = spec.get("shoulder", 0.0)
    neck_y = chin + 76

    # ── 1. 体 ────────────────────────────────────────────
    # なで肩。参考画のNG例「ポーズが硬い」を避けるため、
    # 左右の高さをわずかに変え、肩先を丸くする。
    def body(d):
        # なで肩。左右の高さをわずかに変えて、硬いポーズを避ける。
        ly = h * 0.84 + shoulder * 12
        ry = h * 0.84 - shoulder * 12
        pts = (bezier((cx - 62, neck_y + 4), (cx - 168, h * 0.78), (cx - 244, ly), 26)
               + [(cx - 272, h), (cx + 272, h)]
               + list(reversed(bezier((cx + 62, neck_y + 4), (cx + 168, h * 0.78),
                                      (cx + 244, ry), 26))))
        d.polygon(pts, fill=255)

    def neck(d):
        # 首は**見えていること。** 髪と服のあいだが詰まっていると、
        # 頭が体に直接載っているように見えます。
        # ただし**箱にしないこと。** 上は細く、肩へ向かって広がります。
        side = (bezier((cx - 40, chin - 34), (cx - 44, neck_y - 20), (cx - 72, neck_y + 34), 20)
                + [(cx + 72, neck_y + 34)]
                + list(reversed(bezier((cx + 40, chin - 34), (cx + 44, neck_y - 20),
                                       (cx + 72, neck_y + 34), 20))))
        d.polygon(side, fill=255)

    img.alpha_composite(wc_layer(size, neck, skin, rng.randint(0, 9999), 3.0, 0.05))
    img.alpha_composite(wc_layer(size, body, cloth, rng.randint(0, 9999), 3.4, 0.09))
    img.alpha_composite(shade_side(size, body, cloth, rng.randint(0, 9999), 0.20))

    # あごが首に落とす影。**ここが無いと、頭が首に貼り付いて見えます。**
    _over(img, _soft(_mask(size, lambda d: d.ellipse(
        [cx - 62, chin - 26, cx + 62, chin + 42], fill=255)), 16), shade(skin, -0.46), 0.42)

    # 襟もと。服の面をそのまま首まで上げると、着ているように見えない。
    # 丸首。**Vにすると衣装に見えます。** 線ではなく、影の帯として置きます。
    collar = _mask(size, lambda d: d.arc(
        [cx - 86, neck_y - 26, cx + 86, neck_y + 78], start=0, end=180, fill=255, width=9))
    _over(img, _soft(collar, 5.0), shade(cloth, -0.26), 0.42)

    # 鎖骨。ごく淡く二本。**濃くすると痩せて見えます。**
    for s in (-1, 1):
        bone = bezier((cx + s * 16, neck_y + 34), (cx + s * 74, neck_y + 44),
                      (cx + s * 122, neck_y + 30), 18)
        _over(img, _soft(_mask(size, lambda d, p=bone: d.line(p, fill=255, width=4)), 3.2),
              shade(skin, -0.30), 0.18)

    # ── 2. 頭（別の層に描いて、最後に首を軸として傾ける）──────
    #
    # **順番が命です。** 一度、髪を全部あとから描いたら顔が隠れました。
    #   後ろ髪 → 顔 → 目鼻口 → 前髪
    head = Image.new("RGBA", size, (0, 0, 0, 0))
    _hair_back(head, spec, cx, cy, fw, fh, rng)

    outline = face_outline(cx, cy, fw, fh)
    head.alpha_composite(wc_layer(size, lambda d: d.polygon(outline, fill=255),
                                  skin, rng.randint(0, 9999), 3.0, 0.05))
    head.alpha_composite(shade_side(size, lambda d: d.polygon(outline, fill=255),
                                    skin, rng.randint(0, 9999), 0.14))

    # 光は左上ひとつ。額と左頬に、うすく。
    _over(head, _soft(_mask(size, lambda d: d.ellipse(
        [cx - 96 * fw, cy - 118 * fh, cx + 10 * fw, cy + 6 * fh], fill=255)), 30),
        mix(skin, (255, 250, 240), 0.5), 0.42)
    # 頬。**薄く。** 濃いと塗った頬になる。
    for s in (-1, 1):
        _over(head, _soft(_mask(size, lambda d: d.ellipse(
            [cx + s * 56 * fw - 26, cy + 14 * fh, cx + s * 56 * fw + 26,
             cy + 44 * fh], fill=255)), 16), hex_rgb("#E8A79A"), 0.16)
    # 顎の下の影（首へ落ちる）。ここが無いと、顔が板に見える。
    _over(head, _soft(_mask(size, lambda d: d.ellipse(
        [cx - 60, chin - 16, cx + 60, chin + 30], fill=255)), 14), shade(skin, -0.42), 0.30)

    # ── 3. 顔のつくり ─────────────────────────────────
    eye_y = cy - 16 * fh
    narrow = 0.52 if mood == "happy" else 0.0
    # 受け取ったところでは、視線は花束へ（下）。
    gaze = spec.get("gaze", (0.0, 0.0))
    if mood == "happy":
        # **視線は花束へ。** 3.2 では下を見ているように読めませんでした。
        # 虹彩を下まぶたに寄せ、上まぶたも少し伏せます（narrow）。
        gaze = (gaze[0] * 0.3, 6.4)
    # 顔の大きさ。目鼻口の寸法は、すべてこれに連れて変わる。
    k = fh
    for s in (-1, 1):
        _eye(head, cx + s * 46 * fw, eye_y, s, spec,
             (gaze[0] * k, gaze[1] * k), narrow, skin, k)
    _nose(head, cx, cy + 46 * fh, skin, 46 * fh, k)
    _mouth(head, cx, cy + 80 * fh, skin, 0.85 if mood == "happy" else 0.45, 22 * fw, k)

    # 耳は描きません。**髪に隠れる位置**なのに、輪郭の内側に置いていたので、
    # 頬の上に灰色の楕円がふたつ乗っているだけになっていました。

    _hair_front(head, spec, cx, cy, fw, fh, rng)

    if tilt:
        head = head.rotate(-tilt, center=(cx, neck_y), resample=Image.BICUBIC)
    img.alpha_composite(head)

    return paper_texture(img, seed=seed, strength=0.05)


def render_customer_arms(spec: dict, seed: int = 0) -> Image.Image:
    """
    その人の、前腕と手だけ。人物とまったく同じ 800×800 の枠。

    ── なぜ別の絵にするか ────────────────────────────────

    お渡しの画面で、ブーケが人物の**横に浮いて**いました。
    抱えている姿にするには、束が**体より手前、腕より奥**に
    なければいけません。一枚の絵ではその順番が作れません。

        人物（-happy） → ブーケ → 腕（-arms）

    **手を描き足すだけでは何も変わりません**（手が束の後ろに隠れます）。
    これは絵の話ではなく、**重ねる順番**の話です。

    ── 手を、描き直しました ──────────────────────────────

    前は肌色の楕円がふたつ、束の横に浮いているだけでした。
    参考画の「自然に抱える」は、こうなっています。

        ・前腕が、体の外から内へ、斜めに上がってくる
        ・手首から先が束のほうへ折れる
        ・**指が見える。** 束の紙に、四本の指がかかっている
        ・親指だけ、他の指と逆向きに回り込む
    """
    rng = random.Random(seed + hash(spec["id"] + "arms") % 9000)
    w, h = CUSTOMER_SIZE
    size = (w, h)
    img = Image.new("RGBA", size, (0, 0, 0, 0))
    cx = w * 0.5
    chin = h * CHIN_Y
    skin = hex_rgb(spec.get("skin", "#F2D9C4"))
    cloth = hex_rgb(spec["cloth"])
    shoulder = spec.get("shoulder", 0.0)

    # 束を受ける高さ。**胸より下。** 胸の高さで抱えると、赤ちゃんを抱く形になる。
    hold_y = chin + 190

    def sleeve(d):
        for s in (-1, 1):
            root = (cx + s * 250, h - 8 + s * shoulder * 12)
            elbow = (cx + s * 214, hold_y + 104)
            wrist = (cx + s * 122, hold_y + 20)
            path = bezier(root, elbow, wrist, 30)
            d.polygon(tapered_band(path, 118, 62), fill=255)

    def hand(d):
        for s in (-1, 1):
            hx = cx + s * 96
            # 手のひら。手首から束へ、わずかに内へ折れる。
            d.polygon(tapered_band(
                bezier((hx + s * 26, hold_y + 40), (hx + s * 6, hold_y + 10),
                       (hx - s * 12, hold_y - 6), 16), 62, 50), fill=255)
            # 指。四本。**束の紙にかかっていること。**
            for k in range(4):
                t = k / 3
                fx0 = hx - s * (2 + t * 6)
                fy0 = hold_y - 10 + t * 26
                fx1 = hx - s * (30 + t * 8)
                fy1 = hold_y - 16 + t * 28
                d.polygon(tapered_band(
                    bezier((fx0, fy0), ((fx0 + fx1) / 2, fy0 - 6), (fx1, fy1), 12),
                    13, 10), fill=255)
            # 親指。他の指と逆向きに回り込む。
            d.polygon(tapered_band(
                bezier((hx + s * 20, hold_y + 22), (hx + s * 30, hold_y - 2),
                       (hx + s * 16, hold_y - 22), 14), 16, 12), fill=255)

    # 袖。**体より少し濃く。** 同じ色だと、体と溶けて腕に見えない。
    img.alpha_composite(wc_layer(size, sleeve, shade(cloth, -0.09),
                                 rng.randint(0, 9999), 3.4, 0.09))
    img.alpha_composite(shade_side(size, sleeve, cloth, rng.randint(0, 9999), 0.24))

    img.alpha_composite(wc_layer(size, hand, skin, rng.randint(0, 9999), 3.0, 0.05))
    img.alpha_composite(shade_side(size, hand, skin, rng.randint(0, 9999), 0.16))

    # 指の間。線は引かず、影だけ。線を引くと手袋に見える。
    gaps = Image.new("L", size, 0)
    gd = ImageDraw.Draw(gaps)
    for s in (-1, 1):
        hx = cx + s * 96
        for k in range(3):
            t = (k + 0.5) / 3
            gd.line([(hx - s * (4 + t * 6), hold_y - 10 + t * 26),
                     (hx - s * (30 + t * 8), hold_y - 16 + t * 28)], fill=90, width=3)
    _over(img, _soft(gaps, 2.6), shade(skin, -0.40), 1.0)

    # 袖口が手に落とす影。重なりの厚みは、ここで出る。
    cuff = Image.new("L", size, 0)
    cd = ImageDraw.Draw(cuff)
    for s in (-1, 1):
        cd.ellipse([cx + s * 96 - 52, hold_y + 26, cx + s * 96 + 52, hold_y + 72], fill=76)
    _over(img, _soft(cuff, 18), shade(skin, -0.38), 1.0)

    return paper_texture(img, seed=seed, strength=0.05)
