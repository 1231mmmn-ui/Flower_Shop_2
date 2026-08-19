/**
 * お店を開ける前の、静かな一枚。
 *
 * 店の外観を正面に見せる。文字は壁の静かなところに、
 * 「扉を押す」は実際の扉の下に置く。
 */

import './TitleScreen.css';
import { useGame } from '../game/GameContext';

export function TitleScreen() {
  const { state, dispatch, season } = useGame();
  const returning = state.day > 1 || Object.keys(state.library).length > 0;

  return (
    <div className="title-screen">
      <div className="title-screen__top">
        <div className="title-screen__center">
          <p className="title-screen__eyebrow">Flower Shop</p>
          <h1 className="title-screen__name">花咲く時間</h1>
          <p className="title-screen__lead">
            誰かを想いながら、花を選ぶ時間を。
          </p>
        </div>
      </div>

      <div className="title-screen__foot">
        <p className="title-screen__season">{season.greeting}</p>

        <button
          type="button"
          className="button title-screen__open"
          onClick={() => dispatch({ type: 'enter-morning' })}
        >
          扉を押す
        </button>

        <div className="title-screen__links">
          <button
            type="button"
            className="title-screen__link"
            onClick={() => dispatch({ type: 'open-library' })}
          >
            店のアルバム
          </button>
          <button
            type="button"
            className="title-screen__link"
            onClick={() => dispatch({ type: 'toggle-sound' })}
            aria-pressed={state.soundOn}
          >
            店の音：{state.soundOn ? '入' : '切'}
          </button>
        </div>

        {returning && (
          <p className="title-screen__memo">
            {state.day}日目のお店です。これまでに{Object.keys(state.library).length}
            種類の花と出会いました。
          </p>
        )}
      </div>
    </div>
  );
}
