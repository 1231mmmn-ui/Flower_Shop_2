/** お店を開ける前の、静かな一枚。 */

import './TitleScreen.css';
import { useGame } from '../game/GameContext';

export function TitleScreen() {
  const { state, dispatch, season } = useGame();
  const returning = state.day > 1 || Object.keys(state.library).length > 0;

  return (
    <div className="title-screen">
      <div className="title-screen__center appear appear--slow">
        <p className="subtitle">Flower Shop</p>
        <h1 className="title title-screen__name">花咲く時間</h1>
        <p className="title-screen__lead">
          お客様の想いに寄り添って、
          <br />
          世界に一つだけのブーケを束ねるお店です。
        </p>
      </div>

      <div className="title-screen__foot appear">
        <p className="whisper title-screen__season">{season.greeting}</p>

        <button
          type="button"
          className="button title-screen__open"
          onClick={() => dispatch({ type: 'open-shop' })}
        >
          {returning ? 'お店を開ける' : 'はじめる'}
        </button>

        <div className="title-screen__links">
          <button
            type="button"
            className="button button--quiet button--small"
            onClick={() => dispatch({ type: 'open-library' })}
          >
            花の図鑑
          </button>
          <button
            type="button"
            className="button button--quiet button--small"
            onClick={() => dispatch({ type: 'toggle-sound' })}
            aria-pressed={state.soundOn}
          >
            {state.soundOn ? '店の音：入' : '店の音：切'}
          </button>
        </div>

        {returning && (
          <p className="whisper">
            {state.day}日目のお店です。これまでに{Object.keys(state.library).length}
            種類の花と出会いました。
          </p>
        )}
      </div>
    </div>
  );
}
