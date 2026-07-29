/** 店内。窓の外に季節が見え、左上から自然光が入る。 */

import type { CSSProperties } from 'react';

import { counterTexture, shopScene, titleScene } from '../assets/paths';
import type { SeasonId } from '../data/seasons';

interface SceneProps {
  season: SeasonId;
  /** タイトル用の、下中央を空けた構図を使う */
  title?: boolean;
  /** 花を見せたいときは背景をぼかす */
  blurred?: boolean;
  /** 花をタップしたときは、少しだけ暗くする */
  dimmed?: boolean;
  /** 手前の作業台を出すか */
  counterVisible?: boolean;
}

export function Scene({
  season,
  title,
  blurred,
  dimmed,
  counterVisible = true,
}: SceneProps) {
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
      <div className="daylight" aria-hidden />
      {counterVisible && (
        <div
          className="counter"
          style={{ backgroundImage: `url(${counterTexture()})` }}
          aria-hidden
        />
      )}
    </>
  );
}
