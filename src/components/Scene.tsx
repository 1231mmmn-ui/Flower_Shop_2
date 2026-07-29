/**
 * 店内そのもの。
 *
 * このゲームでいちばん下にある層で、画面いっぱいに広がる。
 * 窓の外の季節、左上から差し込む自然光、光の中を漂う埃まで含めて、
 * 「花屋に入ったときの空気」をここで作る。UI はこの上に最小限だけ載る。
 */

import { useMemo, type CSSProperties } from 'react';

import { shopScene, titleScene } from '../assets/paths';
import type { SeasonId } from '../data/seasons';

interface SceneProps {
  season: SeasonId;
  /** タイトル用の、下中央を空けた構図を使う */
  title?: boolean;
  /** 花を見せたいときは、店内を奥へ下げる */
  blurred?: boolean;
  /** 花をタップしたときは、少しだけ暗くする */
  dimmed?: boolean;
}

const MOTE_COUNT = 14;

export function Scene({ season, title, blurred, dimmed }: SceneProps) {
  // 埃の粒は毎回同じ場所でいい。動きだけがゆっくり流れる。
  const motes = useMemo(
    () =>
      Array.from({ length: MOTE_COUNT }, (_, index) => {
        const seed = ((index * 9301 + 49297) % 233280) / 233280;
        return {
          left: `${(seed * 92 + 4).toFixed(1)}%`,
          top: `${(((seed * 7919) % 1) * 70 + 18).toFixed(1)}%`,
          size: `${(1.4 + seed * 2.2).toFixed(1)}px`,
          duration: `${(26 + seed * 22).toFixed(0)}s`,
          delay: `${(-seed * 26).toFixed(0)}s`,
        };
      }),
    [],
  );

  return (
    <>
      <div
        className={[
          'scene',
          blurred ? 'scene--blurred' : '',
          dimmed ? 'scene--dim' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        style={
          {
            '--scene-image': `url(${title ? titleScene() : shopScene(season)})`,
          } as CSSProperties
        }
        aria-hidden
      />

      <div className="sunbeam" aria-hidden />
      <div className="daylight" aria-hidden />

      <div className="motes" aria-hidden>
        {motes.map((mote, index) => (
          <span
            key={index}
            style={{
              left: mote.left,
              top: mote.top,
              width: mote.size,
              height: mote.size,
              animationDuration: mote.duration,
              animationDelay: mote.delay,
            }}
          />
        ))}
      </div>
    </>
  );
}
