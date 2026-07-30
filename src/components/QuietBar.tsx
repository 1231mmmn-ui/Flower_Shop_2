/**
 * いちばん静かな案内。
 *
 * UI は主役ではないので、面（パネル）を持たない。
 * 季節と日は文字だけ、アルバムと音は輪郭だけのしるしにする。
 */

import './QuietBar.css';
import { useGame } from '../game/GameContext';

export function QuietBar() {
  const { state, dispatch, season } = useGame();

  return (
    <header className="quiet">
      <span className="quiet__when">
        {season.name}
        <span className="quiet__dot">・</span>
        {state.day}日目
      </span>

      <span className="quiet__marks">
        <button
          type="button"
          className="quiet__mark"
          onClick={() => dispatch({ type: 'open-library' })}
          title="店のアルバム"
        >
          アルバム
        </button>
        <button
          type="button"
          className="quiet__mark"
          onClick={() => dispatch({ type: 'toggle-sound' })}
          aria-pressed={state.soundOn}
          title={state.soundOn ? '店の音を止める' : '店の音を流す'}
        >
          {state.soundOn ? '♪' : '♪'}
          {!state.soundOn && <span className="quiet__off" aria-hidden />}
        </button>
      </span>
    </header>
  );
}
