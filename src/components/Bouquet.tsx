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
import { flower as flowerImage } from '../assets/paths';
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
  /*
   * **取った本数と、描く本数は違います。**
   * 3〜5本を扇状に開いただけでは「紙の前に花を三つ置いた絵」になります。
   * 花屋の束は20〜40本あって、だから重なり、前後ができ、
   * 輪郭がかたまりになります（→ src/game/bunch.ts）。
   * 値段も記録も、取った本数のまま変わりません。
   */
  const drawn = bunch(bouquet.stems, bouquet.styleId);

  return (
    <div
      className={`bouquet ${className}`}
      style={{ '--bouquet-scale': scale } as CSSProperties}
    >
      {drawn.map((stem) => {
        const flower = flowerById(stem.flowerId);
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
                zIndex: 10 + Math.round(stem.depth * 40),
              } as CSSProperties
            }
          >
            <img src={flowerImage(flower.id)} alt={flower.name} draggable={false} />
          </div>
        );
      })}

      {/*
        紙は、束ね方に合わせて形が変わります。
        高さを出した束には細くて高い紙、広がった束には広い紙。
        絵は色ごとに一枚のままで、伸ばし方だけを変えています ──
        水彩の描き込みを守りながら、束に応えるいちばん静かな方法です。
      */}
      <WrapCone
        wrapping={wrappingById(bouquet.wrappingId)}
        stems={drawn.length}
        paper={style.paper}
      />
      <RibbonBow ribbon={ribbonById(bouquet.ribbonId)} />
    </div>
  );
}
