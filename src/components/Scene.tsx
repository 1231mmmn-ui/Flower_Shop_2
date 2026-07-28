/** 店内。窓の外に季節が見え、左上から自然光が入る。 */

import { counter, shopScene } from '../assets/paths';
import type { SeasonId } from '../data/seasons';

interface SceneProps {
  season: SeasonId;
  /** 花を見せたいときは背景をぼかす */
  blurred?: boolean;
  /** 花をタップしたときは、少しだけ暗くする */
  dimmed?: boolean;
  /** 作業台を手前に出すか */
  counterVisible?: boolean;
}

export function Scene({ season, blurred, dimmed, counterVisible = true }: SceneProps) {
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
        style={{ backgroundImage: `url(${shopScene(season)})` }}
        aria-hidden
      />
      <div className="daylight" aria-hidden />
      {counterVisible && <img className="counter" src={counter()} alt="" aria-hidden />}
    </>
  );
}
