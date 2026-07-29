/**
 * お店を開ける前の、静かな一枚。
 *
 * 見えているのは店内と、作業台に置かれたカゴだけ。
 * 文字は光の中に置き、ボタンはひとつに絞る。
 */

import './TitleScreen.css';
import { basketFull } from '../assets/paths';
import { useGame } from '../game/GameContext';

export function TitleScreen() {
  const { state, dispatch, season } = useGame();
  const returning = state.day > 1 || Object.keys(state.library).length > 0;

  return (
    <div className="title-screen">
      <div className="title-screen__center">
        <p className="title-screen__eyebrow">Flower Shop</p>
        <h1 className="title-screen__name">花咲く時間</h1>
        <p className="title-screen__lead">
          誰かを想いながら、花を選ぶ時間を。
        </p>
      </div>

      {/* 作業台には、朝いちばんに切ってきた花のカゴ */}
      <img className="title-screen__basket" src={basketFull()} alt="" aria-hidden />

      <div className="title-screen__foot">
        <p className="title-screen__season">{season.greeting}</p>

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
            className="title-screen__link"
            onClick={() => dispatch({ type: 'open-library' })}
          >
            花の図鑑
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
