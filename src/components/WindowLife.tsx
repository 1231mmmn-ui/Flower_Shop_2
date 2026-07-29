/**
 * 窓の外。
 *
 * **動かすことが目的ではありません。季節を感じてもらうためのものです。**
 *
 *   春   花びらが、一枚だけ流れる
 *   夏   木々が、風にゆっくり揺れる
 *   秋   葉が、一枚だけ舞う
 *   冬   何も動かない。静かな朝の空気だけ
 *
 * どれも控えめでいい。「今日は少し違う朝だな」と感じられれば足ります。
 * 目で追える数にしないこと ── 数が増えると、景色ではなく演出になります。
 */

import { useRef, type CSSProperties } from 'react';

import './WindowLife.css';
import type { Morning } from '../data/mornings';
import type { SeasonId } from '../data/seasons';
import { useWindowRect } from './useSceneBox';

interface WindowLifeProps {
  season: SeasonId;
  morning: Morning;
  /** 店内をぼかしているあいだは、窓の中も止める */
  paused?: boolean;
}

export function WindowLife({ season, morning, paused }: WindowLifeProps) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const rect = useWindowRect(anchorRef);

  return (
    <>
      {/* 窓の位置を測るためだけの、画面いっぱいの目印 */}
      <div ref={anchorRef} className="window-anchor" aria-hidden />

      {rect && !paused && (
        <div
          className={`window-life window-life--${season}`}
          style={
            {
              left: `${rect.left}px`,
              top: `${rect.top}px`,
              width: `${rect.width}px`,
              height: `${rect.height}px`,
              '--light': morning.light,
            } as CSSProperties
          }
          aria-hidden
        >
          {/* 夏。木々が、風にゆっくり揺れる。 */}
          {season === 'summer' && (
            <>
              <span className="window-life__branch window-life__branch--near" />
              <span className="window-life__branch window-life__branch--far" />
            </>
          )}

          {/* 春は花びら、秋は落ち葉。**一枚だけ。** */}
          {(season === 'spring' || season === 'autumn') && (
            <span className={`window-life__fall window-life__fall--${season}`} />
          )}

          {/* 冬。動くものはない。ガラスがうっすら曇って、また澄む。 */}
          {season === 'winter' && <span className="window-life__frost" />}
        </div>
      )}
    </>
  );
}
