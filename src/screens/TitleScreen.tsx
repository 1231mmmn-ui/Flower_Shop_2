/**
 * お店を開ける前の、静かな一枚。
 *
 * 見えているのは店内と、作業台に置かれたカゴだけ。
 * 文字は光の中に置き、ボタンはひとつに絞る。
 */

import { useRef } from 'react';

import './TitleScreen.css';
import { basketFull } from '../assets/paths';
import { SHOP_COUNTER_Y, useSceneY } from '../components/useSceneBox';
import { useGame } from '../game/GameContext';

export function TitleScreen() {
  const { state, dispatch, season } = useGame();
  const returning = state.day > 1 || Object.keys(state.library).length > 0;

  /**
   * ── コピーとカゴが、重なっていました ──────────────────────
   *
   * コピーは上から `margin-top: 34%`（**画面の幅**の34%）で置き、
   * カゴは下から `bottom: 30%`（**画面の高さ**の30%）で置いていました。
   * 別々の軸で置いたものは、画面の縦横比が変わると近づきます。
   *
   *   360×640   すきま −51px   重なっている
   *   375×667   すきま −44px   重なっている
   *   390×844   すきま 128px
   *   430×932   すきま 154px   ここでしか確かめていなかった
   *
   * いまは、**同じひとつの柱**に上から順に積んでいます。
   * 柱の下端は、絵の中の作業台の面（scene.py の 0.60）。
   * カゴは台の上に立ち、コピーはその上に載る ──
   * どんな縦横比でも、重なりようがありません。
   */
  const stage = useRef<HTMLDivElement>(null);
  const counterY = useSceneY(stage, SHOP_COUNTER_Y);

  return (
    <div className="title-screen" ref={stage}>
      <div
        className="title-screen__stack"
        style={counterY != null ? { bottom: `calc(100% - ${Math.round(counterY)}px)` } : undefined}
      >
        <div className="title-screen__center">
          <p className="title-screen__eyebrow">Flower Shop</p>
          <h1 className="title-screen__name">花咲く時間</h1>
          <p className="title-screen__lead">
            誰かを想いながら、花を選ぶ時間を。
          </p>
        </div>

        {/* 作業台には、朝いちばんに切ってきた花のカゴ */}
        <img
          className="title-screen__basket"
          src={basketFull()}
          alt=""
          aria-hidden
          draggable={false}
        />
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
