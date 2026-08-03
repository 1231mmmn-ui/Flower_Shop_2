/**
 * 余韻。お客さまが帰ったあとの、静かな店。
 *
 * ⓪感情設計書の【余韻】をそのまま画面にしたものです。
 *
 *   強さ   弱い。でも、いちばん長く残る
 *   必要   **終わりきらないこと**。きれいに終わると、そこで満足してしまう
 *
 * **置かないもの**（設計書の「殺すもの」より）
 *   ・今日のまとめ／売上／達成率／星
 *   ・「明日は◯◯さんが来ます」という予告
 *   ・「また明日も来てね！」「ログインボーナス」「連続記録」
 *   ・自動で次へ進むこと
 *
 * **置くもの**
 *   ・静かになった店（人はもういない。気配だけ）
 *   ・カウンターの花びら一枚。ただし**三日に二日**（→ src/data/afterglow.ts）
 *   ・「CLOSED」の札。裏返すのはプレイヤー
 *
 * 朝と対になっています。朝は札を裏返して始まり、夜は札を裏返して終わる。
 * 数字ではなく、**同じ手つき**で一日が閉じます。
 */

import { useEffect, useState } from 'react';

import './AfterScreen.css';
import { FirstTime } from '../components/FirstTime';
import { petalOnCounter, petalPlacement } from '../data/afterglow';
import { useGame } from '../game/GameContext';

export function AfterScreen() {
  const { state, dispatch, customer } = useGame();

  // 店が静かになる1.5秒。ここが過ぎてから、札にふれられるようになる。
  // 急かさないための待ちではなく、**人がいなくなったことに気づくため**の待ち。
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setSettled(true), 1500);
    return () => window.clearTimeout(timer);
  }, []);

  // 札を裏返してから、日が変わるまでの間。朝と同じ 0.9 秒。
  const [closing, setClosing] = useState(false);
  const close = () => {
    if (closing) return;
    setClosing(true);
    window.setTimeout(() => dispatch({ type: 'next-day' }), 900);
  };

  const petal = petalOnCounter(state.day);
  const { left, tilt } = petalPlacement(state.day);

  return (
    <div className={`after ${settled ? 'is-settled' : ''} ${closing ? 'is-closing' : ''}`}>
      {/*
        帰りぎわの一言。引き止める言葉はひとつも置かない。
        「また明日」ではなく「また来月、寄らせてもらいますね」。
      */}
      <p className="after__farewell">{customer.farewell}</p>

      <div className="after__counter">
        {/*
          カウンターに残った花びら。**三日に二日**。
          毎日必ず残っていると、二日目には「ああ、また花びらか」になる。
          残っていない日があるから、残っている日が目に入る。
        */}
        {petal && (
          <span
            className="after__petal"
            style={{ left: `${left}%`, transform: `rotate(${tilt}deg)` }}
            aria-hidden
          />
        )}
      </div>

      {/*
        朝と同じ一言。id が同じなので、朝に消していればここには出ない。
      */}
      {settled && <FirstTime id="sign" text="札を裏返すと、今日のお店を閉めます。" />}

      {/*
        札を裏返して、一日を閉じる。
        自動では進まない。押すまで、ずっとこの静けさのまま。
      */}
      <button
        type="button"
        className="after__sign"
        onClick={close}
        disabled={!settled || closing}
        aria-label="お店を閉める"
      >
        <span className="after__sign-cord" aria-hidden />
        <span className="after__sign-plate">
          <span className="after__sign-face after__sign-face--open">OPEN</span>
          <span className="after__sign-face after__sign-face--closed">CLOSED</span>
        </span>
      </button>
    </div>
  );
}
