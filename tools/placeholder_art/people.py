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

── そして、全員が「同じ顔の着せ替え」でした ──────────────────

髪型と服の色だけを変えていたので、8人が並ぶと**同じ顔が8つ**でした。
実機で「人物同士がまだ同じ顔」と指摘されたのは、そのとおりです。

顔型・目の形と間隔・眉・鼻・口・頬・顎・年齢・体格・首の太さ・
肩幅・姿勢まで、**すべて `spec` の数値から作る**ようにしました。
写実にはしません。目標は「同じ絵柄で描かれた、本当に別の人たち」です。

    顔型   forehead_w / cheek_w / jaw_w / chin_taper で輪郭そのものを変える
    目     eye_gap（間隔）・eye_h（開き）・eye_tilt（目尻の向き）
    眉     brow_arch（弧の強さ）・brow_thick・brow_gap（目からの距離）
    鼻     nose_w（幅）・nose_len（長さ）
    口     mouth_w（幅）・lip_full（ふくらみ）
    頬     cheek_full（ふっくら〜こけて見える、を陰影だけで作る）
    年齢   age="elder" で、額の二本・ほうれい線・目の下の影を淡く足す
    体格   build（全身の太さ）・shoulder_width（肩幅）・neck_width（首）
    姿勢   tilt（首の傾き）・shoulder（左右差）・stoop（前かがみ）

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
# 各点がどの部位に属するかは REGION_OF_POINT で、
# `face_outline()` が spec の倍率（forehead_w / cheek_w / jaw_w）を
# 部位ごとに掛けて、**人ごとに違う輪郭**を作ります。
FACE_PROFILE = (
    (-150, 58), (-128, 87), (-104, 103), (-72, 112), (-36, 115),
    (0, 114), (36, 106), (68, 92), (96, 70), (116, 45), (128, 0),
)
REGION_OF_POINT = (
    "forehead", "forehead", "forehead", "cheek", "cheek",
    "cheek", "jaw", "jaw", "jaw", "chin", "chin",
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


def face_outline(cx: float, cy: float, w: float, h: float, spec: dict) -> list[tuple[float, float]]:
    """
    顔の輪郭を、左半分 → 右半分の順に閉じた形で返す。

    **部位ごとに幅を変えられること。** `face_w` を一つだけ持っていたころは、
    額と顎がいつも同じ比率で拡大縮小され、丸顔と面長は作れても
    「額は広いのに顎が細い」「額は狭いのに顎はしっかりしている」は
    作れませんでした。人の顔の個性は、たいてい**部位ごとの違い**です。
    """
    fh_w = spec.get("forehead_w", 1.0)
    ck_w = spec.get("cheek_w", 1.0)
    jw_w = spec.get("jaw_w", 1.0)
    chin_taper = spec.get("chin_taper", 0.0)  # 0=尖った顎 / 1=丸く、少し広く残る顎
    region_mult = {"forehead": fh_w, "cheek": ck_w, "jaw": jw_w, "chin": jw_w}

    pts = []
    for i, (dy, hw) in enumerate(FACE_PROFILE):
        mult = region_mult[REGION_OF_POINT[i]]
        if i == len(FACE_PROFILE) - 1:
            # 顎の先端。chin_taper が高いほど、点で閉じず少し幅を残す
            # （四角い・丸い顎）。低いほどまっすぐ尖る（面長・シャープ）。
            hw = chin_taper * 16
            dy = dy * (1 - chin_taper * 0.10)
        else:
            hw = hw * mult
        pts.append((dy, hw))

    left = [(cx - hw * w, cy + dy * h) for dy, hw in pts]
    right = [(cx + hw * w, cy + dy * h) for dy, hw in reversed(pts)]
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

    `eye_h`（開き）・`eye_tilt`（目尻が上がる／下がる）は spec から。
    同じ寸法の目を8人ぶん描いていたのを、ここで崩します。
    """
    ink = hex_rgb(spec.get("eye", "#4A3A31"))
    eye_h_mult = spec.get("eye_h", 1.0)
    tilt = spec.get("eye_tilt", 0.0)  # 正で目尻が上がる（つり目寄り）
    # **顔の大きさに連れて変わること。**
    # 実機だと、目が大きく離れて見えて人形的でした。7%ほど縮めます
    # （25→23.3px, 12.5→11.6px）。離れて見える主因は間隔（eye_gap、
    # render_customer 側）のほうなので、大きさはここで少しだけ。
    w = 23.3 * k
    h = 11.6 * k * eye_h_mult * (1 - narrow * 0.45)
    outer_y = cy + 1.0 - tilt * h * 0.5

    # 上まぶた。目頭は細く、目尻に向かって太く。目尻の高さは tilt で動く。
    lid = bezier((cx - w, cy + 2.5), (cx + side * 2, cy - h * 1.35), (cx + side * w, outer_y), 26)
    band = tapered_band(lid, 2.4 * k, 5.0 * k)
    _over(img, _soft(_mask(img.size, lambda d: d.polygon(band, fill=255)), 1.0 * k), ink, 0.92)

    # 白目。**ここが見えないと、目は黒い豆になります。**
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
    low = bezier((cx - w * 0.8, cy + h * 0.5), (cx, cy + h * 1.25),
                 (cx + side * w * 0.86, outer_y + h * 0.3), 18)
    _over(img, _soft(_mask(img.size, lambda d: d.line(low, fill=255, width=int(2 * k) or 1)), 1.4 * k),
          mix(ink, skin, 0.55), 0.4)

    # まつげ。目尻だけ、わずかに。tilt に沿って伸びる向きも変える。
    tip = [(cx + side * w * 0.86, outer_y), (cx + side * (w + 7 * k), outer_y - (3.5 + tilt * 6) * k)]
    _over(img, _soft(_mask(img.size, lambda d: d.line(tip, fill=255, width=int(3 * k) or 1)), 1.0 * k),
          ink, 0.7)


def _brow(img: Image.Image, cx: float, cy: float, side: int, spec: dict, k: float) -> None:
    """
    眉。**目からの距離と、弧の強さで、表情も年齢も変わります。**

    brow_gap が狭いと近づいた眉（きつめ・力強い）、広いと離れた眉（やわらかい）。
    brow_arch が高いとアーチの効いた眉（女性的・驚いた印象）、
    低いとまっすぐな眉（男性的・落ち着いた印象）。
    """
    hair_mix = spec.get("brow_color_mix", 0.30)
    arch = spec.get("brow_arch", 8.0)
    thick = spec.get("brow_thick", 1.0)
    gap = spec.get("brow_gap", 30.0)
    w = 25.0 * k

    brow_y = cy - gap * k
    brow = bezier((cx - w * 1.05, brow_y + 6 * k), (cx + side * 3, brow_y - arch * k),
                  (cx + side * w * 1.0, brow_y + 3 * k), 22)
    bb = tapered_band(brow, 5.6 * k * thick, 2.4 * k * thick)
    _over(img, _soft(_mask(img.size, lambda d: d.polygon(bb, fill=255)), 2.2),
          mix(hex_rgb(spec["hair"]), spec["_skin_rgb"], hair_mix), 0.55)


def _nose(img: Image.Image, cx: float, cy: float, skin: RGB, nose_h: float,
          k: float = 1.0, spec: dict | None = None) -> None:
    """
    鼻。**輪郭線は描きません。**

    描くのは影だけです。線で描いた鼻は、どんなに細くても記号になります。
    光は左上ひとつなので、鼻筋の**右側**に影が落ちます。
    `nose_w`（幅）・`nose_len`（長さ）で、人ごとに違う鼻にします。
    """
    spec = spec or {}
    nw = spec.get("nose_w", 1.0)
    nose_h = nose_h * spec.get("nose_len", 1.0)
    dark = shade(skin, -0.40)
    # 鼻筋の右の影。眉間から鼻先へ、細く。
    ridge = bezier((cx + 5 * k, cy - nose_h * 0.95), (cx + 9 * k, cy - nose_h * 0.3),
                   (cx + 7 * k, cy), 20)
    band = tapered_band(ridge, 3.4 * k, 11.0 * k * nw)
    _over(img, _soft(_mask(img.size, lambda d: d.polygon(band, fill=255)), 5.0 * k), dark, 0.46)
    # 鼻先の下の影。**ここが鼻の位置を決めます。**
    _over(img, _soft(_mask(img.size, lambda d: d.ellipse(
        [cx - 13 * k * nw, cy - 2 * k, cx + 14 * k * nw, cy + 8 * k], fill=255)), 4.0 * k), dark, 0.42)
    # 小鼻。ごく小さく、ふたつ。
    for s in (-1, 1):
        _over(img, _soft(_mask(img.size, lambda d: d.ellipse(
            [cx + s * 14 * k * nw - 5 * k, cy - 6 * k, cx + s * 14 * k * nw + 5 * k, cy + 2 * k],
            fill=255)), 2.4 * k), dark, 0.36)
    # 鼻筋の左に、うすい光
    lit = bezier((cx - 4 * k, cy - nose_h * 0.9), (cx - 6 * k, cy - nose_h * 0.3),
                 (cx - 4 * k, cy - 3 * k), 16)
    _over(img, _soft(_mask(img.size, lambda d: d.line(lit, fill=255, width=int(6 * k) or 1)),
                     4.0 * k), mix(skin, (255, 250, 240), 0.6), 0.38)


def _mouth(img: Image.Image, cx: float, cy: float, skin: RGB, smile: float,
           width: float = 21.0, k: float = 1.0, lip_full: float = 1.0) -> None:
    """
    口。**一本線の笑顔をやめました。**

    上唇は光を受けにくいので少し濃く、下唇は明るくてつやがあります。
    その二枚の合わせ目が、線に見えるだけです。
    `lip_full` で下唇のふくらみを人ごとに変えます。
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
    low = bezier((cx - width * 0.92, cy + 1.5 * k), (cx, cy + (10.5 + smile * 1.5) * k * lip_full),
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


def _cheek_and_jaw(head: Image.Image, cx: float, cy: float, fw: float, fh: float,
                   chin: float, skin: RGB, spec: dict) -> None:
    """
    頬とあご先の、量感。

    輪郭線だけでは「丸顔」「面長」は作れても「ふっくら」「こけている」は
    作れません。それは**陰影の量**の話だからです。

    `cheek_full` が高いほど、頬からあごにかけて丸みのある明るい面を足し
    （ふっくら）、低い（負）ほど頬骨の下に影を足します（こけて見える）。
    """
    # ── 顎の輪郭に、線ではなく影で厚みを作る ──────────────────
    #
    # 輪郭線（face_outline）だけでは、顔が平らな紙に見えます。
    # 頬骨からあごへかけて、内側にごく淡い影を一本沿わせると、
    # そこで面が折れている（頬の面 → 顎の面）ことが伝わります。
    # 濃くしすぎると輪郭線の二重描きになるので、輪郭より内側・
    # 下方向にだけ、うすく落とします。
    jaw_w = spec.get("jaw_w", 1.0)
    for s in (-1, 1):
        jawline = bezier(
            (cx + s * 100 * fw * jaw_w, cy + 24 * fh),
            (cx + s * 88 * fw * jaw_w, chin - 44),
            (cx + s * 40 * fw, chin - 4), 20)
        _over(head, _soft(_mask(head.size, lambda d, p=jawline: d.line(p, fill=255, width=10)), 9),
              shade(skin, -0.30), 0.16)

    full = spec.get("cheek_full", 0.0)
    if full > 0:
        for s in (-1, 1):
            _over(head, _soft(_mask(head.size, lambda d: d.ellipse(
                [cx + s * 52 * fw - 34, cy + 30 * fh, cx + s * 52 * fw + 34,
                 chin - 6], fill=255)), 18),
                mix(skin, (255, 250, 240), 0.5), 0.18 * full)
    elif full < 0:
        for s in (-1, 1):
            _over(head, _soft(_mask(head.size, lambda d: d.ellipse(
                [cx + s * 66 * fw - 24, cy + 18 * fh, cx + s * 66 * fw + 24,
                 cy + 62 * fh], fill=255)), 14),
                shade(skin, -0.30), -0.22 * full)


def _age_marks(head: Image.Image, cx: float, cy: float, fw: float, fh: float,
               chin: float, skin: RGB, spec: dict) -> None:
    """
    年齢のしるし。**淡く。** 描き込みではなく、あることに気づく程度で。

    `age="elder"` のときだけ、額の二本・ほうれい線・目の下のふくらみを足す。
    若い人には何も足さない ── 皺を「無くす」努力より、要らない人に
    足さないほうが確実です。
    """
    if spec.get("age") != "elder":
        return
    dark = shade(skin, -0.30)
    # 額の横線、二本。ごく淡く。
    for t in (0.5, 0.72):
        y = cy - 118 * fh + 118 * fh * t * 0.5
        line = bezier((cx - 60 * fw, y + 4), (cx, y - 4), (cx + 60 * fw, y + 4), 16)
        _over(head, _soft(_mask(head.size, lambda d, p=line: d.line(p, fill=255, width=2)), 2.6),
              dark, 0.16)
    # ほうれい線。鼻の脇から口の外へ、ごく淡く弧を描く。
    for s in (-1, 1):
        fold = bezier((cx + s * 16 * fw, cy + 52 * fh), (cx + s * 30 * fw, cy + 68 * fh),
                      (cx + s * 26 * fw, cy + 84 * fh), 16)
        _over(head, _soft(_mask(head.size, lambda d, p=fold: d.line(p, fill=255, width=2)), 2.2),
              dark, 0.20)
    # 目の下の、ごくわずかなふくらみ。
    for s in (-1, 1):
        _over(head, _soft(_mask(head.size, lambda d: d.ellipse(
            [cx + s * 46 * fw - 20, cy - 4 * fh, cx + s * 46 * fw + 20, cy + 12 * fh], fill=255)),
            4.0), dark, 0.14)


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

    # ── 毛束 ─────────────────────────────────────────
    #
    # **太さをそろえないこと。** 同じ太さの帯を等間隔に並べると、
    # それは髪ではなく**簾（すだれ）**です。
    # 太い束のあいだに細い束が混じるから、髪に見えます。
    #
    # **内外に流れを作ること。** 全部が外へ流れると板になります。
    # 顔の横では、内へ入る束と外へ逃げる束を混ぜます。
    for i in range(13):
        t = i / 12
        side = -1 if t < 0.5 else 1
        spread = 0.30 + abs(t - 0.5) * 1.4
        drop = (length * 0.8) if style in ("long", "wave") else 22
        # 三本に一本は細い。太さの差が、束の数に見える。
        thin = (i % 3 == 0)
        w0 = (7 if thin else 17) + rng.uniform(0, 9)
        w1 = (3 if thin else 6) + rng.uniform(0, 5)
        # 内へ入るか、外へ逃げるか。半分ずつ。
        inward = -1 if (i % 2 == 0) else 1
        path = bezier(
            (cx + side * fw * (8 + spread * 44), top + fh * (2 + rng.uniform(-8, 10))),
            (cx + side * fw * (86 + spread * 34 + inward * 14), cy + fh * (6 + spread * 34)),
            (cx + side * fw * (92 + spread * 26 + inward * 22) + rng.uniform(-12, 12),
             cy + fh * (52 + drop * (0.35 + spread * 0.55))),
            30)
        band = tapered_band(path, w0, w1)
        tone = mix(hair, light, 0.10 + 0.6 * rng.random())
        img.alpha_composite(wc_layer(size, lambda d, b=band: d.polygon(b, fill=255),
                                     tone, rng.randint(0, 9999), 2.6, 0.10))

    # ── つや ─────────────────────────────────────────
    #
    # **一本線ではなく、淡い面。** 線で入れると、髪に針金が
    # 一本乗っているように見えます。光は面で当たります。
    # 頭の丸みに沿った、横長の楕円をうすく置くだけ。
    halo = _mask(size, lambda d: d.ellipse(
        [cx - fw * 96, cy - fh * 136, cx + fw * 52, cy - fh * 74], fill=255))
    _over(img, _soft(halo, 26), mix(hair, (255, 246, 226), 0.55), 0.30)
    for k in range(3):
        hx = cx - fw * (72 - k * 40) + rng.uniform(-8, 8)
        hy = cy - fh * (116 - k * 8)
        _over(img, _soft(_mask(size, lambda d, hx=hx, hy=hy: d.ellipse(
            [hx - fw * 26, hy - fh * 13, hx + fw * 26, hy + fh * 13], fill=255)), 13),
            mix(hair, (255, 250, 234), 0.7), 0.22)


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
    # 前髪の下端。眉より上で止める。
    stop = cy - fh * 58

    # ── 短い髪は、前髪も短くする ──────────────────────────
    #
    # ここが style を見ていなかったので、後ろ髪をどれだけ変えても
    # 正面から見ると全員同じ前髪＝**同じ人**に見えていました。
    # 長い髪を耳の下まで払うのと、刈り上げた前髪がひたいで止まるのとは、
    # 束の伸び方も、はみ出す後れ毛の長さも違います。
    short = spec.get("hair_style", "long") == "short"

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

    # 短い髪は、束の届く先を耳の手前で止める。長い髪と同じ届き方だと
    # 「前髪が長いだけの同じ髪型」になってしまう。
    reach = 0.62 if short else 1.0
    stop_eff = stop + fh * 30 if short else stop
    for i in range(6):
        t = i / 5
        side = -1 if t < 0.5 else 1
        spread = (0.3 + abs(t - 0.5) * 1.4) * reach
        path = bezier(
            (part + side * fw * 6, top + fh * 8),
            (part + side * fw * (46 + spread * 40), top + fh * (44 + spread * 16)),
            (cx + side * fw * (72 + spread * 34) * reach, stop_eff + fh * rng.uniform(-14, 16)),
            26)
        band = tapered_band(path, (13 if short else 17) + rng.uniform(0, 7), 4 + rng.uniform(0, 4))
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

    # ── 後れ毛 ───────────────────────────────────────
    #
    # **輪郭からはみ出す毛が、髪をやわらかく見せます。**
    # 二本では足りませんでした（きれいに整いすぎて、かつらに見える）。
    # 太さも長さも散らして、五、六本。
    #
    # 短い髪は、頬や顎まで垂れる後れ毛を持ちません（そこまで髪がない）。
    # 本数を減らし、こめかみのあたりで止めます。
    strand_n = rng.randint(2, 3) if short else rng.randint(5, 6)
    for i in range(strand_n):
        sd = rng.choice((-1, 1))
        y0 = cy - fh * rng.uniform(70, 130)
        end_y = (cy - fh * rng.uniform(10, 50)) if short else (cy + fh * rng.uniform(14, 76))
        strand = bezier(
            (cx + sd * fw * rng.uniform(50, 84), y0),
            (cx + sd * fw * rng.uniform(92, 124), cy - fh * rng.uniform(-6, 44)),
            (cx + sd * fw * (rng.uniform(72, 100) if short else rng.uniform(76, 112))
             + rng.uniform(-10, 10), end_y),
            22)
        wid = rng.choice((2, 2, 3, 4))
        _over(img, _soft(_mask(size, lambda d, q=strand, ww=wid: d.line(q, fill=255, width=ww)),
                         1.5), mix(hair, light, rng.uniform(0.15, 0.45)), rng.uniform(0.30, 0.5))


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
    spec = {**spec, "_skin_rgb": skin}  # _brow が髪色と混ぜるのに使う
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

    tilt = spec.get("tilt", 0.0) + spec.get("stoop", 0.0) * 3.0 + (2.5 if mood == "happy" else 0.0)
    shoulder = spec.get("shoulder", 0.0)
    neck_y = chin + 76

    # ── 1. 体 ────────────────────────────────────────────
    #
    # **一枚の面をやめました。**
    #
    # 肩から下を大きな三角でひと塗りしていたので、
    # 服ではなく**布をかぶった山**に見えていました。
    # 人の上半身は、胴と腕という別のかたまりでできています。
    #
    #   胴    首から下へ、ゆるく広がる
    #   肩    胴の上で外へ張り出し、丸くとじる
    #   上腕  肩から下へ、胴とは別のかたまりとして落ちる
    #
    # **左右をそろえないこと。** 完全対称は、人ではなく紋章です。
    # 肩の高さ・腕の太さ・落ちる角度を、左右で少しずつ変えます。
    #
    # **体格そのものも人ごとに変えます。** `build` は全身の太さ、
    # `shoulder_width` は肩の張り出し、`neck_width` は首の太さ。
    # 同じ骨格に髪型と服の色を替えているだけでは、シルエットで
    # 別人と分かりません。
    build = spec.get("build", 1.0)
    sh_wid = spec.get("shoulder_width", 1.0)
    neck_wid = spec.get("neck_width", 1.0)
    sway = shoulder
    arm_l = (1.0 + sway * 0.10) * build
    arm_r = (1.0 - sway * 0.08) * build
    stoop = spec.get("stoop", 0.0)
    # 前かがみは、肩が持ち上がって見える（すくめた形）ぶんで表す。
    sh_y_l = h * 0.815 + sway * 14 - stoop * 16
    sh_y_r = h * 0.815 - sway * 11 - stoop * 16

    def torso(d):
        tw = 68 * neck_wid
        sw = 176 * sh_wid
        pts = (bezier((cx - tw, neck_y - 8), (cx - 132 * build, h * 0.775), (cx - sw, sh_y_l), 24)
               + bezier((cx - sw, sh_y_l), (cx - 198 * build, h * 0.92), (cx - 206 * build, h), 18)
               + [(cx + 206 * build, h)]
               + list(reversed(
                   bezier((cx + tw, neck_y - 8), (cx + 132 * build, h * 0.775), (cx + sw, sh_y_r), 24)
                   + bezier((cx + sw, sh_y_r), (cx + 198 * build, h * 0.92), (cx + 206 * build, h), 18))))
        d.polygon(pts, fill=255)

    def arms(d):
        # 肩先 → ひじ。胴とは別のかたまり。
        #
        # **胴に深く重ねること。** 一度、肩の丸みを外に置きすぎて、
        # 胴とのあいだに**穴**が空きました（肩の上に白い切れ込みが出た）。
        # 腕は胴から生えているので、付け根は胴の中にあります。
        for s2, k2, sh_y in ((-1, arm_l, sh_y_l), (1, arm_r, sh_y_r)):
            path = bezier((cx + s2 * 110 * sh_wid, sh_y - 66),
                          (cx + s2 * 222 * k2, sh_y + 24),
                          (cx + s2 * 240 * k2, h + 20), 26)
            d.polygon(tapered_band(path, 150 * k2, 106 * k2), fill=255)
            # 肩のまるみ。**付け根は胴の中へ。**
            # 実測：中心を128まで内へ寄せると、上端でも胴の輪郭に届く。
            d.ellipse([cx + s2 * 128 * k2 * sh_wid - 96 * k2, sh_y - 120,
                       cx + s2 * 128 * k2 * sh_wid + 96 * k2, sh_y + 52], fill=255)

    def body(d):
        torso(d)
        arms(d)

    def neck(d):
        # 首は**見えていること。** 髪と服のあいだが詰まっていると、
        # 頭が体に直接載っているように見えます。
        # ただし**箱にしないこと。** 上は細く、肩へ向かって広がります。
        # **裾は、服より細いこと。**（首の裾を服の襟もとより広くすると、
        # 肩の付け根に肌の三角がのぞきます。）
        nw = 40 * neck_wid
        side = (bezier((cx - nw, chin - 34), (cx - nw * 1.05, neck_y - 20),
                       (cx - nw * 1.3, neck_y + 30), 20)
                + [(cx + nw * 1.3, neck_y + 30)]
                + list(reversed(bezier((cx + nw, chin - 34), (cx + nw * 1.05, neck_y - 20),
                                       (cx + nw * 1.3, neck_y + 30), 20))))
        d.polygon(side, fill=255)

    img.alpha_composite(wc_layer(size, neck, skin, rng.randint(0, 9999), 3.0, 0.05))
    img.alpha_composite(wc_layer(size, body, cloth, rng.randint(0, 9999), 3.4, 0.09))
    img.alpha_composite(shade_side(size, body, cloth, rng.randint(0, 9999), 0.20))

    # ── 立体感 ────────────────────────────────────────
    #
    # **ごく弱く。** 服はいちばん広い面なので、少し濃くしただけで
    # 影が主張します（参考画のNG例「影が濃すぎる」）。
    for s2, k2, sh_y in ((-1, arm_l, sh_y_l), (1, arm_r, sh_y_r)):
        seam = bezier((cx + s2 * 138 * sh_wid, sh_y - 20), (cx + s2 * 162 * k2, sh_y + 60),
                      (cx + s2 * 172 * k2, h), 20)
        _over(img, _soft(_mask(size, lambda d, q=seam: d.line(q, fill=255, width=16)), 13),
              shade(cloth, -0.34), 0.24)
    _over(img, _soft(_mask(size, lambda d: d.ellipse(
        [cx + 6, neck_y + 40, cx + 168 * build, h], fill=255)), 34), shade(cloth, -0.26), 0.20)
    _over(img, _soft(_mask(size, lambda d: d.ellipse(
        [cx - 214 * sh_wid, sh_y_l - 86, cx - 44, sh_y_l - 4], fill=255)), 26),
        mix(cloth, (255, 252, 242), 0.55), 0.26)

    # あごが首に落とす影。**ここが無いと、頭が首に貼り付いて見えます。**
    _over(img, _soft(_mask(size, lambda d: d.ellipse(
        [cx - 62 * neck_wid, chin - 26, cx + 62 * neck_wid, chin + 42], fill=255)), 16),
        shade(skin, -0.46), 0.42)

    # 襟もと。丸首。**Vにすると衣装に見えます。** 線ではなく、影の帯として置きます。
    collar = _mask(size, lambda d: d.arc(
        [cx - 86 * neck_wid, neck_y - 26, cx + 86 * neck_wid, neck_y + 78],
        start=0, end=180, fill=255, width=9))
    _over(img, _soft(collar, 5.0), shade(cloth, -0.26), 0.42)

    # 鎖骨。ごく淡く二本。**濃くすると痩せて見えます。**
    for s in (-1, 1):
        bone = bezier((cx + s * 16, neck_y + 34), (cx + s * 74 * neck_wid, neck_y + 44),
                      (cx + s * 122 * neck_wid, neck_y + 30), 18)
        _over(img, _soft(_mask(size, lambda d, p=bone: d.line(p, fill=255, width=4)), 3.2),
              shade(skin, -0.30), 0.18)

    # ── 2. 頭（別の層に描いて、最後に首を軸として傾ける）──────
    #
    # **順番が命です。** 一度、髪を全部あとから描いたら顔が隠れました。
    #   後ろ髪 → 顔 → 頬とあご → 眉 → 目鼻口 → 年齢のしるし → 前髪
    head = Image.new("RGBA", size, (0, 0, 0, 0))
    _hair_back(head, spec, cx, cy, fw, fh, rng)

    outline = face_outline(cx, cy, fw, fh, spec)
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

    _cheek_and_jaw(head, cx, cy, fw, fh, chin, skin, spec)

    # ── 3. 顔のつくり ─────────────────────────────────
    eye_y = cy - 16 * fh
    narrow = 0.52 if mood == "happy" else 0.0
    eye_gap = spec.get("eye_gap", 1.0)
    # 受け取ったところでは、視線は花束へ（下）。
    gaze = spec.get("gaze", (0.0, 0.0))
    if mood == "happy":
        # **視線は花束へ。** 3.2 では下を見ているように読めませんでした。
        gaze = (gaze[0] * 0.3, 6.4)
    # 顔の大きさ。目鼻口の寸法は、すべてこれに連れて変わる。
    k = fh
    # ── 顔の向き。正面だけにしない ─────────────────────────
    #
    # tilt は首を軸にした「傾け」（左右に首をかしげる）で、
    # 向き（左右に顔を振る）とは別の動きです。ここでは輪郭は
    # そのままに、目・鼻・口という**中身の一式**だけを cx から
    # わずかにずらします。顔の向いた側は輪郭に対して中身が寄り、
    # 反対側は輪郭との余白が広がるので、「振り向きかけ」に見えます。
    # 大きく振ると崩れるので、数px の範囲にとどめます。
    yaw = spec.get("yaw", 0.0) * fw
    for s in (-1, 1):
        _brow(head, cx + yaw + s * 46 * fw * eye_gap, eye_y, s, spec, k)
        _eye(head, cx + yaw + s * 46 * fw * eye_gap, eye_y, s, spec,
             (gaze[0] * k, gaze[1] * k), narrow, skin, k)
    _nose(head, cx + yaw * 1.3, cy + 46 * fh, skin, 46 * fh, k, spec)
    _mouth(head, cx + yaw * 1.2, cy + 80 * fh, skin, 0.85 if mood == "happy" else 0.45,
          22 * fw * spec.get("mouth_w", 1.0), k, spec.get("lip_full", 1.0))

    _age_marks(head, cx, cy, fw, fh, chin, skin, spec)

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

    ── 左右非対称に持つ ──────────────────────────────────

    両手で紙を左右対称に掴む姿は、まだ「支えている」というより
    「掲げている」ように見えました。実際に抱えるときは、
    片手（利き手でないほう）が束の下から支え、もう片手が
    包み紙のあたりを軽く添えます。左右で高さも角度も変えます。
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
    # 支える手（下側・低め・束の下端を包む）と、添える手（高め・紙を軽く支える）
    low_side = -1 if spec.get("hold_hand", "left") == "left" else 1
    high_side = -low_side
    low_y = hold_y + 34
    high_y = hold_y - 24

    def sleeve(d):
        for s, y_off in ((low_side, low_y - hold_y), (high_side, high_y - hold_y)):
            root = (cx + s * 250, h - 8 + s * shoulder * 12)
            elbow = (cx + s * 210, hold_y + 100 + y_off * 0.4)
            wrist = (cx + s * 116, hold_y + 14 + y_off)
            path = bezier(root, elbow, wrist, 30)
            d.polygon(tapered_band(path, 118, 60), fill=255)

    def hand(d):
        """
        手首 → 掌 → 指、の順に細くしていく。

        ── 「五角形」に見えていた理由 ──────────────────────

        掌の帯を手首側66px→指側52pxで描いていました。**逆です。**
        本物の掌は手首でいちばん細く、指の付け根（関節の並び）で
        いちばん広がります。狭いほうから広いほうへ描いていたので、
        掌が台形の板に見え、そこから同じ太さ・同じ長さの指が
        4本まっすぐ生えて、五角形のトークンになっていました。

        直すのは二つ。掌の広がりを逆にすることと、指の長さを
        1本ずつ変えること（人差し指・薬指はやや短く、中指がいちばん
        長く、小指がいちばん短い）。
        """
        # 支える手。束の下から、包み込むように。
        hx = cx + low_side * 92
        d.polygon(tapered_band(
            bezier((hx + low_side * 30, low_y + 44), (hx + low_side * 4, low_y + 8),
                   (hx - low_side * 16, low_y - 14), 16), 40, 64), fill=255)
        # 指の長さ比。中指がいちばん長く、小指がいちばん短い。
        finger_len = (0.86, 1.0, 0.94, 0.72)
        for k in range(4):
            t = k / 3
            length = finger_len[k]
            fx0 = hx - low_side * (0 + t * 8)
            fy0 = low_y - 14 + t * 24
            fx1 = hx - low_side * (10 + t * 10 + 22 * length)
            fy1 = low_y - 20 + t * 26 - 4 * length
            d.polygon(tapered_band(
                bezier((fx0, fy0), ((fx0 + fx1) / 2, fy0 - 6 * length), (fx1, fy1), 12),
                12, 8), fill=255)
        # 親指。ほかの指より太く短く、付け根も掌の低い位置から。
        d.polygon(tapered_band(
            bezier((hx + low_side * 26, low_y + 30), (hx + low_side * 36, low_y + 6),
                   (hx + low_side * 20, low_y - 12), 14), 18, 13), fill=255)

        # 添える手。紙のあたりを、軽く。指を深く見せない（触れているだけ）。
        hx2 = cx + high_side * 78
        d.polygon(tapered_band(
            bezier((hx2 + high_side * 22, high_y + 30), (hx2 + high_side * 2, high_y + 4),
                   (hx2 - high_side * 10, high_y - 10), 14), 34, 52), fill=255)
        finger_len2 = (0.90, 1.0, 0.78)
        for k in range(3):
            t = k / 2
            length = finger_len2[k]
            fx0 = hx2 - high_side * (4 + t * 8)
            fy0 = high_y - 8 + t * 20
            fx1 = hx2 - high_side * (8 + t * 10 + 20 * length)
            fy1 = high_y - 12 + t * 22 - 3 * length
            d.polygon(tapered_band(
                bezier((fx0, fy0), ((fx0 + fx1) / 2, fy0 - 4 * length), (fx1, fy1), 10),
                10, 7), fill=255)

    # 袖。**体より少し濃く。** 同じ色だと、体と溶けて腕に見えない。
    img.alpha_composite(wc_layer(size, sleeve, shade(cloth, -0.09),
                                 rng.randint(0, 9999), 3.4, 0.09))
    img.alpha_composite(shade_side(size, sleeve, cloth, rng.randint(0, 9999), 0.24))

    img.alpha_composite(wc_layer(size, hand, skin, rng.randint(0, 9999), 3.0, 0.05))
    img.alpha_composite(shade_side(size, hand, skin, rng.randint(0, 9999), 0.16))

    # 指の間。線は引かず、影だけ。線を引くと手袋に見える。
    # 指の長さが1本ずつ違うので、影の線も隣りあう指の平均の長さに合わせる。
    gaps = Image.new("L", size, 0)
    gd = ImageDraw.Draw(gaps)
    hx = cx + low_side * 92
    finger_len = (0.86, 1.0, 0.94, 0.72)
    for k in range(3):
        t = (k + 0.5) / 3
        length = (finger_len[k] + finger_len[k + 1]) / 2
        gd.line([(hx - low_side * (2 + t * 8), low_y - 14 + t * 24),
                 (hx - low_side * (10 + t * 10 + 22 * length), low_y - 20 + t * 26 - 4 * length)],
                fill=90, width=3)
    _over(img, _soft(gaps, 2.6), shade(skin, -0.40), 1.0)

    # 袖口が手に落とす影。重なりの厚みは、ここで出る。
    cuff = Image.new("L", size, 0)
    cd = ImageDraw.Draw(cuff)
    cd.ellipse([hx - 52, low_y + 20, hx + 52, low_y + 66], fill=76)
    hx2 = cx + high_side * 78
    cd.ellipse([hx2 - 44, high_y + 16, hx2 + 44, high_y + 54], fill=70)
    _over(img, _soft(cuff, 18), shade(skin, -0.38), 1.0)

    return paper_texture(img, seed=seed, strength=0.05)
