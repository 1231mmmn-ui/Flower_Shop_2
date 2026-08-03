#!/usr/bin/env python3
"""IMAGE_ASSETS.md に従って、プレースホルダ画像一式を書き出す。

    python3 tools/generate_placeholder_assets.py [--only flowers,scenes,...]

ここで生成されるのは「仕様を満たす仮の絵」です。
完成画に差し替える際も、画像サイズ・透過・保存場所・ファイル名・命名規則は
IMAGE_ASSETS.md の規定のままにしてください。
"""

from __future__ import annotations

import argparse
import sys
import time
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from tools.placeholder_art import flowers as F
from tools.placeholder_art import props as P
from tools.placeholder_art import scene as S

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "public" / "assets"


def save(img, *parts: str, quality: int = 88) -> None:
    path = ASSETS.joinpath(*parts)
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.suffix == ".jpg":
        img.convert("RGB").save(path, "JPEG", quality=quality, optimize=True)
    else:
        img.save(path, "PNG", optimize=True)
    print(f"  {path.relative_to(ROOT)}  {img.size[0]}x{img.size[1]}")


def build_flowers() -> None:
    """
    §1 花（1024x1024・透過）と、その縮小版（512x512）

    縮小版は**別の絵ではありません。** 同じ絵を、置き場所に合った大きさで
    書き出しただけのものです。

    なぜ要るか（実測）
      棚・アルバムは 1024px の絵を読み込んで、224pt / 118pt で描いていました。
      端末の実ピクセルに直すと 448px / 236px なので、**半分も使っていません。**
      それでも扉を押した直後に 6.96MB を読み込むので、開店前の30秒 ──
      「この花屋にいたい」と思ってほしい時間 ── が待ち時間から始まります。

      1024px  6.8MB   一輪の画面に要る（894px 必要）
       512px  2.2MB   棚とアルバムはこれで足りる

    **減色や圧縮では解きません。** 256色に落とせば46%になりますが、
    色が平均3.51ずれます。花の絵を落として軽くするのは、
    このゲームでいちばんやってはいけないことです。
    大きさを置き場所に合わせるだけなら、見た目は一切変わりません。
    """
    print("花")
    for i, (fid, recipe) in enumerate(F.RECIPES.items()):
        full = F.render_flower(recipe, seed=i * 101 + 7)
        save(full, "flowers", f"{fid}.png")
        save(full.resize((512, 512), Image.LANCZOS), "flowers/small", f"{fid}.png")


def build_scenes() -> None:
    """§3 店内背景（1600x1200）と窓の景色（800x600・透過）"""
    print("店内と窓")
    for season in S.SEASONS:
        save(S.render_window(season, seed=11), "scenes", f"window-{season}.png")
        save(S.render_shop(season, seed=11), "scenes", f"shop-{season}.jpg")
    save(S.render_shop("spring", seed=11, title=True), "scenes", "shop-title.jpg")
    # ⓪-a 市場。店内ではなく外なので、別の場所として持つ。
    for season in S.SEASONS:
        save(S.render_market(season, seed=11), "scenes", f"market-{season}.jpg")


def build_customers() -> None:
    """§4 お客さま（800x800・透過・表情2種）"""
    print("お客さま")
    for i, spec in enumerate(P.CUSTOMER_SPECS):
        for mood in ("normal", "happy"):
            save(P.render_customer(spec, mood, seed=i * 37 + 3),
                 "customers", f"{spec['id']}-{mood}.png")


def build_props() -> None:
    """§5・§8 花瓶・カゴ・カウンター・メッセージカード"""
    print("小物")
    save(P.render_vase(seed=13), "props", "vase.png")
    save(P.render_basket(seed=13), "props", "basket.png")
    save(P.render_basket(seed=13, full=True), "props", "basket-full.png")
    save(P.render_counter(seed=13), "props", "counter.jpg")
    save(P.render_card(seed=13), "props", "card-blank.png")


def build_wrap() -> None:
    """§6 ラッピング資材（512x512・透過）"""
    print("ラッピング資材")
    for paper_id in P.PAPERS:
        save(P.render_paper_roll(paper_id, seed=23), "wrap", f"{paper_id}.png")
    for ribbon_id in P.RIBBONS:
        save(P.render_ribbon_spool(ribbon_id, seed=29), "wrap", f"{ribbon_id}.png")


def build_greenhouse() -> None:
    """§7 温室（512x512・透過）"""
    print("温室")
    for stage in range(4):
        save(P.render_greenhouse_stage(stage, seed=31), "greenhouse", f"stage-{stage}.png")


BUILDERS = {
    "flowers": build_flowers,
    "scenes": build_scenes,
    "customers": build_customers,
    "props": build_props,
    "wrap": build_wrap,
    "greenhouse": build_greenhouse,
}


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--only", help=f"カンマ区切り: {', '.join(BUILDERS)}")
    args = ap.parse_args()

    targets = args.only.split(",") if args.only else list(BUILDERS)
    started = time.time()
    for name in targets:
        builder = BUILDERS.get(name.strip())
        if not builder:
            raise SystemExit(f"不明な対象: {name}")
        builder()
    print(f"\n完了 ({time.time() - started:.1f} 秒)  →  {ASSETS.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
