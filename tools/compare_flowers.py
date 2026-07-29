"""
花の絵を、同じ構図・同じ倍率で並べて残すための道具。

描画ルールを変えるたびに、これで撮って `--out` に残す。
「どの変更が、どれだけ効いたのか」をあとから並べて確かめるための資料になる。

  python3 tools/compare_flowers.py --out /tmp/before
  （paint.py を直す）
  python3 tools/compare_flowers.py --out /tmp/after

一輪画面（画面高の55%）で見たときの大きさに合わせて出す。
"""
from __future__ import annotations

import argparse
import os

from PIL import Image

from placeholder_art.flowers import RECIPES, render_flower

# 形のちがう代表。まるい／重なり／カップ／フリル／線／こまかい／葉。
SAMPLES = [
    'sunflower',      # まるい・平ら
    'rose',           # 重なりが深い
    'tulip',          # カップ
    'lisianthus',     # フリル
    'delphinium',     # 線・穂
    'gypsophila',     # こまかい
    'eucalyptus',     # 葉
]

# 一輪画面での見え方に近い高さ（430x932 の 55% を 2倍解像度で）
DETAIL_H = 1024
# 棚での見え方（画面幅の26%程度）
SHELF_H = 260


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', required=True)
    ap.add_argument('--ids', nargs='*', default=SAMPLES)
    args = ap.parse_args()
    os.makedirs(args.out, exist_ok=True)

    for fid in args.ids:
        recipe = RECIPES[fid]
        img = render_flower(recipe, seed=7)

        # 一輪画面ぶん
        detail = img.resize(
            (round(img.width * DETAIL_H / img.height), DETAIL_H), Image.LANCZOS)
        on_paper = Image.new('RGB', detail.size, (243, 236, 222))
        on_paper.paste(detail, (0, 0), detail)
        on_paper.save(os.path.join(args.out, f'{fid}-detail.png'))

        # 棚ぶん（シルエットで見分けられるかを見る）
        shelf = img.resize(
            (round(img.width * SHELF_H / img.height), SHELF_H), Image.LANCZOS)
        card = Image.new('RGB', shelf.size, (243, 236, 222))
        card.paste(shelf, (0, 0), shelf)
        card.save(os.path.join(args.out, f'{fid}-shelf.png'))

    print(f'{len(args.ids)} 種を {args.out} に出しました')


if __name__ == '__main__':
    main()
