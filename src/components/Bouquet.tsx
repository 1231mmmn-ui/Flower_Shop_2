/**
 * ブーケ。ゲームでいちばん美しい画面になる場所。
 *
 * IMAGE_ASSETS.md §2 の通り、「1本の花」の画像を扇状に重ねて束にする。
 * 花の画像は下端中央が切り口なので、そこを軸に回す。
 * 包み紙とリボンは資材の色を借りて BouquetWrap で描く。
 *
 * ── つかんで動かす仕組みは、外しました ──────────────────
 *
 * 当たり判定を花の頭だけにして、掴んだときのずれも覚えて、
 * 「思ったとおりに動く」ところまでは持っていけました。
 * それでも、あれは**画像を配置する操作**でした。
 * いまは三つの形から選びます（→ src/game/styles.ts）。
 *
 * この部品は、もう**眺めるためだけ**のものです。
 * 押せるところは一つもありません。
 */

import { useRef, type CSSProperties } from 'react';

import './Bouquet.css';
import { flowerVariant } from '../assets/paths';
import { RibbonBow, WrapCone } from './BouquetWrap';
import { flowerById } from '../data/flowers';
import { ribbonById, wrappingById } from '../data/wrapping';
import { bunch } from '../game/bunch';
import { useAutoFitScale } from '../game/useAutoFitScale';
import { styleById } from '../game/styles';
import type { Bouquet as BouquetModel } from '../game/types';

interface BouquetProps {
  bouquet: BouquetModel;
  /** 束の大きさ（親の幅に対する割合） */
  scale?: number;
  className?: string;
}

export function Bouquet({ bouquet, scale = 1, className = '' }: BouquetProps) {
  const style = styleById(bouquet.styleId);
  const wrapping = wrappingById(bouquet.wrappingId);
  const containerRef = useRef<HTMLDivElement>(null);
  /*
   * **取った本数と、描く本数は違います。**
   * 3〜5本を扇状に開いただけでは「紙の前に花を三つ置いた絵」になります。
   * 花屋の束は20〜40本あって、だから重なり、前後ができ、
   * 輪郭がかたまりになります（→ src/game/bunch.ts）。
   * 値段も記録も、取った本数のまま変わりません。
   */
  const drawn = bunch(bouquet.stems, bouquet.styleId);

  /*
   * ── ③ 背の高い花が表示エリアから切れないよう、自動でフィットさせる ──
   *
   * → src/game/useAutoFitScale.ts
   *
   * 花ごとの決め打ちの倍率では対応しきれない（crown の高いスタイル、
   * 花によって正方形キャンバスの中の絵柄の届き方が違う、など要因が
   * 複数絡む）。実際に描いた花・紙の外接矩形を測り、表示エリアに
   * 収まらなければ縮める。縦横とも見る。
   */
  const signature = `${bouquet.styleId}|${bouquet.wrappingId}|${scale}|${bouquet.stems
    .map((s) => s.flowerId)
    .join(',')}`;
  const fit = useAutoFitScale(containerRef, signature);

  return (
    <div
      ref={containerRef}
      className={`bouquet ${className}`}
      style={{ '--bouquet-scale': scale * fit } as CSSProperties}
    >
      {/*
        奥の紙。花の後ろに立つ、紙の背骨（→ BouquetWrap.css）。
        これが無いと、花のあいだから店の背景がのぞいてしまい、
        「紙に包まれている」実感が出ません。
      */}
      <WrapCone
        wrapping={wrapping}
        stems={drawn.length}
        paper={style.paper}
        layer="back"
      />

      {/*
        結束点の、共有の影（→ Bouquet.css）。一輪ずつの影を薄くした
        ぶん、「すべての茎がここに集まっている」実感をこちらで作る。
      */}
      <span className="bouquet__base" aria-hidden />

      {/*
        中の紙。外側の花より前、中心の花より後ろに置く一枚
        （→ components/BouquetWrap.css）。6色とも同じ構造なので、
        常に描く。
      */}
      <WrapCone
        wrapping={wrapping}
        stems={drawn.length}
        paper={style.paper}
        layer="mid"
      />

      {drawn.map((stem) => {
        const flower = flowerById(stem.flowerId);
        const isOuter = Math.abs(stem.side) > 0.5;
        const zIndex = isOuter
          ? 10 + Math.round(stem.depth * 20) // 外側：中の紙(35)より低く、後ろへ回り込む
          : 40 + Math.round(stem.depth * 20); // 中心：中の紙(35)より高く、手前に出る
        return (
          <div
            key={stem.key}
            className={`bouquet__stem ${stem.fragment ? 'bouquet__stem--fragment' : ''}`}
            style={
              {
                '--angle': `${stem.angle}deg`,
                '--reach': stem.reach,
                '--depth': stem.depth,
                '--scale': stem.scale,
                '--face-x': stem.faceX,
                '--face-rot': `${stem.faceRot}deg`,
                zIndex,
              } as CSSProperties
            }
          >
            <img src={flowerVariant(flower.id, stem.variant)} alt={flower.name} draggable={false} />
          </div>
        );
      })}

      {/*
        手前の紙。根もとだけを覆います（→ BouquetWrap.css）。
        丸ごと手前に置くと「紙の前に花を並べた」に戻るので、
        下のほうだけを切り出します。
      */}
      <WrapCone
        wrapping={wrapping}
        stems={drawn.length}
        paper={style.paper}
        layer="front"
      />
      {/* リボン。紙とは別の資材なので、紙の色と関係なく選べる。 */}
      <RibbonBow ribbon={ribbonById(bouquet.ribbonId)} />
    </div>
  );
}
