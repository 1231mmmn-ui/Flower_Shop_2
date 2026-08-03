#!/usr/bin/env python3
"""ゲーム全体を、**一枚のHTML**にまとめて書き出す。

    npm run build
    python3 tools/build_single_file.py

なぜ要るか
  このリポジトリは非公開なので、GitHub Pages が使えません（有料プランが要る）。
  でも「実際に指で触ったときの感触」は、いま確かめたい。
  絵もJSもCSSも全部その中に入った 1ファイルなら、置き場所を選びません。
  ファイルを一つ開くだけで、端末で遊べます。

これは**画づくりを見るためのものではありません。**
  絵は WebP に詰め直してあります（PNG のままだと 16MB を超えるため）。
  花の絵は 1024 → 800 に縮めています。色と輪郭がわずかに変わります。
  **絵の良し悪しは、必ず本物のビルドで見てください。**
  ここで見てほしいのは、指の触り心地 ── 花はつかめるか、
  思ったところに動くか、待たされないか、だけです。

しくみ
  src/assets/paths.ts が `window.__FS_ASSETS` を先に見るようにしてあります。
  ここではその表（パス → data URI）を作って、本体の前に差し込むだけです。
  ふだんのビルドには何の影響もありません（表が無ければ素通り）。
"""

from __future__ import annotations

import base64
import io
import json
import re
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"
ASSETS = ROOT / "public" / "assets"
OUT = ROOT / "dist" / "flower-shop.html"
# 置き場所によっては <html>/<head> を向こうが用意します。その形のぶん。
OUT_BODY = ROOT / "dist" / "flower-shop.body.html"

# 画面から一度も呼ばれていない絵。入れても誰も見ないので、詰めない。
#   温室 …… ⑦ はまだ画面が無い
#   窓だけの差し替え …… 店内の絵に窓ごと描いてある
#   カウンターの木目・カード・空のカゴ …… いまはどの画面も読んでいない
UNUSED = ("greenhouse/", "scenes/window-", "props/counter.jpg",
          "props/card-blank.png", "props/basket.png")

# 花の絵だけ、少し縮める。一輪の画面で 894px 使うので 800 は残す。
FLOWER_MAX = 800
# 80 → 76。**画質のためではなく、上限に収めるためです。**
# 絵が増えて 4.85MB になり、公開できる大きさを超えました。
#   q80  3.27MB  → HTML 4.67MB
#   q76  3.12MB  → HTML 4.47MB
# 落ち方は下で測っています（普通のビルドと撮り比べ）。
QUALITY = 76


def encode(path: Path) -> str:
    im = Image.open(path)
    rel = path.relative_to(ASSETS).as_posix()
    if rel.startswith("flowers/") and not rel.startswith("flowers/small/"):
        if im.width > FLOWER_MAX:
            im = im.resize((FLOWER_MAX, FLOWER_MAX), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, "WEBP", quality=QUALITY, method=4)
    data = base64.b64encode(buf.getvalue()).decode("ascii")
    return f"data:image/webp;base64,{data}"


def build_asset_map() -> dict[str, str]:
    table: dict[str, str] = {}
    skipped = 0
    for path in sorted(ASSETS.rglob("*")):
        if not path.is_file():
            continue
        rel = path.relative_to(ASSETS).as_posix()
        if any(rel.startswith(u) for u in UNUSED):
            skipped += 1
            continue
        table[rel] = encode(path)
    print(f"絵 {len(table)} 枚（使っていない {skipped} 枚は入れない）")
    return table


def main() -> None:
    index = DIST / "index.html"
    if not index.exists():
        raise SystemExit("dist/index.html がありません。先に npm run build を。")

    html = index.read_text(encoding="utf-8")

    # ── 部品を集める ────────────────────────────────────────
    css = "\n".join(
        (DIST / href.lstrip("./")).read_text(encoding="utf-8")
        for href in re.findall(r'<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"', html)
    )

    srcs = re.findall(r'<script[^>]+type="module"[^>]+src="([^"]+)"', html)
    if len(srcs) != 1:
        raise SystemExit(f"本体のJSが {len(srcs)} 本あります。1本を前提にしています。")
    js = (DIST / srcs[0].lstrip("./")).read_text(encoding="utf-8")

    # **type="module" は外します。**
    #   Chrome も Safari も、file:// で開いたページの module を読みません
    #   （origin が null になり、CORS で弾かれる）。保存してそのまま開く ──
    #   いちばん簡単な遊び方が、それだけができません。
    #   束ねた結果に import も export も一つも無いので、ただの <script> で構いません。
    if re.search(r'\bimport\s*[({."\']|\bexport\s*[{*]', js):
        raise SystemExit(
            "束ねた結果に import/export が残っています。\n"
            'type="module" のままにするか、ビルドを1チャンクに戻してください。')

    # **置く順番が決めごとです。**
    #   ① 絵の表  …… paths.ts が読み込まれた瞬間に見るので、本体より先
    #   ② #root   …… ただの <script> は defer が効かない（内容が空の時だけ）。
    #                 head に置くと createRoot(#root) が null を掴んで白画面になる。
    #   ③ 本体JS  …… だから **body の最後**に置く
    table = build_asset_map()
    assets_js = ("<script>window.__FS_ASSETS="
                 + json.dumps(table, ensure_ascii=False, separators=(",", ":"))
                 + ";</script>")
    body = f'{assets_js}<style>{css}</style><div id="root"></div><script>{js}</script>'

    # favicon（無くても動くが、タブに出る絵なので入れておく）
    icon = ""
    fav = DIST / "favicon.png"
    if fav.exists():
        buf = io.BytesIO()
        Image.open(fav).resize((64, 64), Image.LANCZOS).save(buf, "PNG", optimize=True)
        uri = "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode("ascii")
        icon = f'<link rel="icon" href="{uri}">'

    OUT.write_text(
        '<!doctype html>\n<html lang="ja">\n<head>\n'
        '<meta charset="UTF-8">\n'
        '<meta name="viewport" content="width=device-width,initial-scale=1,'
        'viewport-fit=cover,maximum-scale=1,user-scalable=no">\n'
        '<meta name="theme-color" content="#EDE2CE">\n'
        f'{icon}\n<title>Flower Shop ～花咲く時間～</title>\n'
        f'</head>\n<body>{body}</body>\n</html>\n',
        encoding="utf-8",
    )
    print(f"\n{OUT.relative_to(ROOT)}  {OUT.stat().st_size / 1024 / 1024:.2f} MB")

    # ── もう一つ、<body> の中身だけの形でも書き出す ──────────────
    #
    # 置き場所によっては、<html> と <head> を向こうが用意します。
    # そのとき困るのが **viewport の指定**です。あれが無いと、
    # スマホは「幅980pxのパソコン画面」だと思って全体を縮めて表示します。
    # 430px の縦画面に合わせて作った店が、豆粒になります。
    #
    # head に書けないので、開いた瞬間に自分で足します。
    fix_head = (
        "<script>(function(){var m=document.querySelector(\'meta[name=viewport]\')"
        "||document.head.appendChild(document.createElement(\'meta\'));"
        "m.name=\'viewport\';m.content=\'width=device-width,initial-scale=1,"
        "viewport-fit=cover,maximum-scale=1,user-scalable=no\';})();</script>"
    )
    # 高さの保険。global.css は html/body/#root に height:100% を敷いていますが、
    # 向こうが body の中に何か（ヘッダなど）を足していると、100% の基準が
    # 崩れて店が縦に潰れます。画面の高さそのものを直に入れておきます。
    # （同じ強さの指定なので、**あとに置かないと**負けます。）
    guard = "<style>#root{height:100dvh;height:100svh}</style>"
    OUT_BODY.write_text(fix_head + body + guard, encoding="utf-8")
    print(f"{OUT_BODY.relative_to(ROOT)}  "
          f"{OUT_BODY.stat().st_size / 1024 / 1024:.2f} MB")


if __name__ == "__main__":
    sys.exit(main())
