/**
 * 花瓶に生けた花。店頭の一台（FlowerStand）にも、開店前の一輪挿し
 * （OpeningScreen）にも、この同じ仕組みで生ける。
 *
 * ── ②「花瓶ごとに前後関係が違う」の元 ──────────────────────
 *
 * バラの花瓶は自然に見える、と言われた。理由は、バラだけが
 * `FLOWERS_WITH_VASE_ART` の1枚完成画（花・茎・水・花瓶の重なりが
 * 絵の中ですでに正しい）で店頭に立っていたから。ほかの花は同じ
 * 店頭でも重ね合わせ方式（茎を連続させ、水中だけ色を沈める）で、
 * これ自体は正しい作りだった。
 *
 * ただし**開店前の一輪挿し（OpeningScreen）は、この重ね合わせ方式
 * にすら入っていなかった。** 花の絵と花瓶を、ただ重ねるだけの
 * もっと古い書き方が残っていて、水面での色の沈み込みも、
 * `FLOWERS_WITH_VASE_ART` の分岐も持たない。同じバラでも、
 * 店頭の一台では自然、開店前の一輪挿しでは花瓶にただ重ねただけ、
 * という**画面ごとの差**が生まれていた。
 *
 * 「花瓶に生ける」を一箇所にまとめ、店頭にも一輪挿しにも同じ
 * 仕組みを渡す。見た目の大きさ・配置は呼び出し側の CSS
 * （`--vased-*` カスタムプロパティ）が決める。
 */

import type { CSSProperties } from 'react';

import './VasedFlower.css';
import { flowerSmall as flowerImage, flowerVase, vase } from '../assets/paths';
import { FLOWERS_WITH_VASE_ART, type Flower } from '../data/flowers';

export interface VaseStem {
  angle: number;
  scale: number;
}

interface VasedFlowerProps {
  flower: Flower;
  /** 生ける本数と、その傾き。一輪挿しなら要素ひとつでよい。 */
  stems: VaseStem[];
  className?: string;
}

export function VasedFlower({ flower, stems, className = '' }: VasedFlowerProps) {
  const hasVaseArt = FLOWERS_WITH_VASE_ART.has(flower.id);

  return (
    <span className={`vased ${className}`}>
      {hasVaseArt ? (
        // 花瓶ごと1枚の完成画。奥の縁・茎・水・手前の縁の重なりは絵の中で正しい。
        <img className="vased__art" src={flowerVase(flower.id)} alt="" aria-hidden draggable={false} />
      ) : (
        <>
          {/* 茎は一本のまま描き、水の中に見えるぶんだけ同じ絵をもう一枚
              重ねて色と鮮明さを変える（→ 旧 FlowerStand.tsx と同じ手法）。 */}
          <span className="vased__flowers">
            {stems.map((stem, index) => (
              <img
                key={index}
                className="vased__stem"
                src={flowerImage(flower.id)}
                alt=""
                aria-hidden
                style={
                  {
                    '--angle': `${stem.angle}deg`,
                    '--stem-scale': stem.scale,
                    zIndex: index,
                  } as CSSProperties
                }
                draggable={false}
              />
            ))}
            <span className="vased__water-tint" aria-hidden>
              {stems.map((stem, index) => (
                <img
                  key={index}
                  className="vased__stem"
                  src={flowerImage(flower.id)}
                  alt=""
                  aria-hidden
                  style={
                    {
                      '--angle': `${stem.angle}deg`,
                      '--stem-scale': stem.scale,
                      zIndex: index,
                    } as CSSProperties
                  }
                  draggable={false}
                />
              ))}
            </span>
          </span>

          <img className="vased__vase" src={vase()} alt="" aria-hidden draggable={false} />
        </>
      )}
    </span>
  );
}
