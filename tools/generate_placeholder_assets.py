#!/usr/bin/env python3
"""IMAGE_ASSETS.md に従って、プレースホルダ画像一式を書き出す。

    python3 tools/generate_placeholder_assets.py [--only flowers,scene,...]

ここで生成されるのは「仕様を満たす仮の絵」です。
完成画（半写実・水彩）に差し替える際も、サイズ・透過・ファイル名は
IMAGE_ASSETS.md の規定のままにしてください。
"""

from __future__ import annotations

import argparse
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from tools.placeholder_art import flowers as F
from tools.placeholder_art import props as P
from tools.placeholder_art import scene as S

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "public" / "assets"

# src/data/customers.ts の id と一致させること（IMAGE_ASSETS.md §7）
CUSTOMER_SPECS = [
    dict(id="haruka", hair="#5A4436", cloth="#D9C7A8", skin="#F3DCC6", hair_len=250),
    dict(id="yoshiko", hair="#9E9A93", cloth="#B9C0B2", skin="#F0DAC6", hair_len=120),
    dict(id="taichi", hair="#42352C", cloth="#8E9AA6", skin="#EFD6BE", hair_len=90),
    dict(id="mei", hair="#4B3A30", cloth="#E4C3C6", skin="#F5DFCB", hair_len=300),
    dict(id="souta", hair="#3B3029", cloth="#7E8C7A", skin="#EDD4BB", hair_len=95),
    dict(id="rin", hair="#6A5240", cloth="#C9B79C", skin="#F2DAC4", hair_len=190),
    dict(id="kaoru", hair="#54443A", cloth="#C2B6C6", skin="#F1DAC5", hair_len=160),
    dict(id="nao", hair="#4A3B33", cloth="#AFBBA8", skin="#F4DEC9", hair_len=210),
]


def out(*parts: str) -> Path:
    path = ASSETS.joinpath(*parts)
    path.parent.mkdir(parents=True, exist_ok=True)
    return path


def save(img, *parts: str) -> None:
    path = out(*parts)
    img.save(path, "PNG", optimize=True)
    print(f"  {path.relative_to(ROOT)}  {img.size[0]}x{img.size[1]}")


def build_flowers() -> None:
    print("花（切り花・花瓶・サムネイル）")
    for i, (fid, recipe) in enumerate(F.RECIPES.items()):
        stem = F.render_stem(recipe, seed=i * 101 + 7)
        save(stem, "flowers", f"flower_{fid}_stem.png")
        save(F.render_thumb(stem, recipe), "flowers", f"flower_{fid}_thumb.png")
        save(F.render_vase(recipe, seed=i * 101 + 7), "flowers", f"flower_{fid}_vase.png")


def build_scene() -> None:
    print("店内")
    for season in S.SEASONS:
        save(S.render_shop(season, seed=11), "scene", f"scene_shop_{season}.png")
    save(S.render_counter(seed=11), "scene", "scene_counter.png")


def build_wrapping() -> None:
    print("ラッピング・リボン")
    for wid in P.WRAPS:
        save(P.render_wrap(wid, seed=23), "wrapping", f"wrap_{wid}.png")
    for rid in P.RIBBONS:
        save(P.render_ribbon(rid, seed=29), "ribbon", f"ribbon_{rid}.png")


def build_customers() -> None:
    print("お客様")
    for i, spec in enumerate(CUSTOMER_SPECS):
        for mood in ("normal", "smile"):
            save(P.render_customer(spec, mood, seed=i * 37 + 3),
                 "customers", f"customer_{spec['id']}_{mood}.png")


def build_ui() -> None:
    print("UI テクスチャ")
    save(P.render_ui_paper(seed=41), "ui", "ui_paper.png")
    save(P.render_wood_sign(seed=41), "ui", "ui_wood_sign.png")
    save(P.render_chalk_board(seed=41), "ui", "ui_chalk_board.png")


BUILDERS = {
    "flowers": build_flowers,
    "scene": build_scene,
    "wrapping": build_wrapping,
    "customers": build_customers,
    "ui": build_ui,
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
