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

import type { CSSProperties } from 'react';

import './Bouquet.css';
import { flowerVariant } from '../assets/paths';
import { RibbonBow, WrapCone } from './BouquetWrap';
import { flowerById } from '../data/flowers';
import { ribbonById, wrappingById } from '../data/wrapping';
import { bunch } from '../game/bunch';
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
  /*
   * **取った本数と、描く本数は違います。**
   * 3〜5本を扇状に開いただけでは「紙の前に花を三つ置いた絵」になります。
   * 花屋の束は20〜40本あって、だから重なり、前後ができ、
   * 輪郭がかたまりになります（→ src/game/bunch.ts）。
   * 値段も記録も、取った本数のまま変わりません。
   */
  const drawn = bunch(bouquet.stems, bouquet.styleId);
  /*
   * 折り返しが描き込まれた紙（hasBuiltInRibbon）だけ、三層構造にする。
   *
   * 二層（奥／手前）だけだと、どの花も「等しく紙の後ろ」か
   * 「等しく紙より高い」かのどちらかにしかならず、外側の花だけ
   * 紙の折り返しの後ろへ回り込む、という入り組みが作れなかった。
   * 中の紙（mid）を挟み、side（輪の外側かどうか）で花の z-index を
   * 中の紙の上下に振り分けると、外側の花は折り返しの後ろに隠れ、
   * 中心の花は折り返しの手前に出る。これで初めて「紙が花を包む」
   * 前後関係になる（→ BouquetWrap.tsx）。
   *
   * 折り返しの絵が無い紙（procedural な旧素材）では、この振り分けを
   * する意味が無いので、これまでどおりの2層・depth だけの z-index
   * のままにする。
   */
  const useMidWrap = wrapping.hasBuiltInRibbon === true;

  return (
    <div
      className={`bouquet ${className}`}
      style={{ '--bouquet-scale': scale } as CSSProperties}
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
        中の紙。外側の花より前、中心の花より後ろに置く一枚
        （→ 上の useMidWrap の説明）。折り返しの絵が無い紙では描かない。
      */}
      {useMidWrap && (
        <WrapCone
          wrapping={wrapping}
          stems={drawn.length}
          paper={style.paper}
          layer="mid"
        />
      )}

      {drawn.map((stem) => {
        const flower = flowerById(stem.flowerId);
        const isOuter = useMidWrap && Math.abs(stem.side) > 0.5;
        const zIndex = useMidWrap
          ? isOuter
            ? 10 + Math.round(stem.depth * 20) // 外側：中の紙(35)より低く、後ろへ回り込む
            : 40 + Math.round(stem.depth * 20) // 中心：中の紙(35)より高く、手前に出る
          : 10 + Math.round(stem.depth * 40); // 従来どおり
        return (
          <div
            key={stem.key}
            className="bouquet__stem"
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
      {/*
        リボンが紙の絵の中に描き込まれている紙（hasBuiltInRibbon）は、
        ここで重ねません。重ねると、結び目にリボンが二重に乗って見えます。
      */}
      {!wrapping.hasBuiltInRibbon && <RibbonBow ribbon={ribbonById(bouquet.ribbonId)} />}
    </div>
  );
}
