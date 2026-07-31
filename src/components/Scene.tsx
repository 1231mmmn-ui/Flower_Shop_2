/**
 * 店内そのもの。
 *
 * このゲームでいちばん下にある層で、画面いっぱいに広がる。
 * 窓の外の季節、左上から差し込む自然光、光の中を漂う埃まで含めて、
 * 「花屋に入ったときの空気」をここで作る。UI はこの上に最小限だけ載る。
 */

import { useMemo, type CSSProperties } from 'react';

import { shopScene, titleScene } from '../assets/paths';
import type { Morning } from '../data/mornings';
import type { SeasonId } from '../data/seasons';

interface SceneProps {
  season: SeasonId;
  /** タイトル用の、下中央を空けた構図を使う */
  title?: boolean;
  /** 花を見せたいときは、店内を奥へ下げる */
  blurred?: boolean;
  /** 花をタップしたときは、少しだけ暗くする */
  dimmed?: boolean;
  /** 今日の朝の空気。指定がなければ、ふつうの朝。 */
  morning?: Morning;
}

const DEFAULT_MORNING: Pick<Morning, 'light' | 'warmth' | 'contrast' | 'motes'> = {
  light: 1,
  warmth: 0.04,
  contrast: 1,
  motes: 14,
};

export function Scene({ season, title, blurred, dimmed, morning }: SceneProps) {
  const air = morning ?? DEFAULT_MORNING;

  // 埃の粒は毎回同じ場所でいい。動きだけがゆっくり流れる。
  // 数だけが、その日の空気で変わる（曇った朝は見えにくい）。
  const motes = useMemo(
    () =>
      Array.from({ length: air.motes }, (_, index) => {
        const seed = ((index * 9301 + 49297) % 233280) / 233280;
        return {
          left: `${(seed * 92 + 4).toFixed(1)}%`,
          top: `${(((seed * 7919) % 1) * 70 + 18).toFixed(1)}%`,
          size: `${(1.4 + seed * 2.2).toFixed(1)}px`,
          duration: `${(26 + seed * 22).toFixed(0)}s`,
          delay: `${(-seed * 26).toFixed(0)}s`,
        };
      }),
    [air.motes],
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
        // カスタムプロパティ経由で url() を渡すと、相対パスが CSS ファイルの
        // 位置から解かれてしまう（本番ビルドで assets/assets/… になる）。
        // background-image を直に書けば、基準は必ずドキュメントになる。
        style={{
          backgroundImage: `url(${title ? titleScene() : shopScene(season)})`,
          // 朝日が強い日は影がくっきり、曇った日はやわらかい。
          filter: `contrast(${air.contrast.toFixed(3)}) saturate(${(
            1 + air.warmth * 0.6
          ).toFixed(3)})`,
        }}
        aria-hidden
      />

      {/* 光の強さと色みは、その日の朝で少しだけ変わる。 */}
      <div
        className="sunbeam"
        style={{ '--light': air.light, '--warmth': air.warmth } as CSSProperties}
        aria-hidden
      />
      <div
        className="daylight"
        style={{ '--light': air.light, '--warmth': air.warmth } as CSSProperties}
        aria-hidden
      />

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
