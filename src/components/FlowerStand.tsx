/**
 * 作業台の上に立っている、一輪の花。
 *
 * 値札は付けない。いま見ている花にだけ、そっと名前が出る（店頭側で出す）。
 * 手前の花は大きくはっきり、奥の花は小さくかすむ。
 *
 * ── 花瓶を、やめました ────────────────────────────────────
 *
 * 「花瓶に生けてある花」ではなく、一輪だけがそっと置かれている見せ方に
 * 統一する（→ src/components/SingleFlower.tsx）。器も水も描き足さない。
 */

import type { CSSProperties } from 'react';

import './FlowerStand.css';
import { flowerSmall as flowerImage } from '../assets/paths';
import { SingleFlower } from './SingleFlower';
import type { Flower } from '../data/flowers';

interface FlowerStandProps {
  flower: Flower;
  /** いま正面にある花か */
  focused: boolean;
  /** 正面からどれだけ離れているか（0 = 正面） */
  distance: number;
  picked: number;
  onSelect: () => void;
}

export function FlowerStand({
  flower,
  focused,
  distance,
  picked,
  onSelect,
}: FlowerStandProps) {
  const far = Math.min(1, distance);

  return (
    <button
      type="button"
      className={`stand ${focused ? 'is-focus' : ''}`}
      style={
        {
          '--far': far,
          /*
           * ── 「タップした花と違う花の詳細が出る」の調査で見つけた、
           *    重なり帯の前後関係のずれ ──────────────────────────
           *
           * 隣とは -3.5% ずつ重なっている（→ ShopScreen.css）。重なりは
           * 意図どおりだが、重なった帯の中でどちらの `<button>` が
           * クリックを受け取るかは、これまで **DOM の並び順**（後の
           * 花が手前）で決まっていた。中央にフォーカスが移る途中
           * （スクロール直後の遷移アニメーション中）は、大きくなって
           * いく花の縁が隣とわずかに重なる瞬間があり、そこでは
           * 「見た目にいちばん手前の花」と「実際にクリックを受け取る
           * 要素」が一致しない可能性があった。
           *
           * inspect / flowerById 側の参照ロジックそのものに不一致は
           * 見つからなかった（花IDは選ばれた花のクロージャをそのまま
           * dispatch している）。この重なり帯のずれは唯一見つかった、
           * 見た目と実際のクリック先がずれうる箇所なので、中心に近い
           * ほど z-index を上げ、**見た目の手前さ＝実際にクリックを
           * 受け取る要素** を一致させておく。
           */
          zIndex: 100 - Math.min(distance, 99),
        } as CSSProperties
      }
      onClick={onSelect}
      aria-label={flower.name}
    >
      <SingleFlower flowerId={flower.id} src={flowerImage(flower.id)} className="stand__flower" />
      {/* 台に落ちる、ごく薄い影。花そのものから気をそらさない程度に。 */}
      <span className="stand__contact" aria-hidden />
      <span className="stand__glow" style={{ background: flower.swatch }} aria-hidden />

      {picked > 0 && (
        <span className="stand__picked" aria-label={`${picked}本 取りました`}>
          {Array.from({ length: Math.min(picked, 5) }, (_, i) => (
            <span key={i} className="stand__pick-dot" />
          ))}
        </span>
      )}
    </button>
  );
}
