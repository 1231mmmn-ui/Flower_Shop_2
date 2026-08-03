/**
 * 余韻。最後のお客さまが帰ったあとの、静かな店。
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
 *   ・今日いらしたのが誰だったか
 *
 * ── 名前を並べることについて ──────────────────────────
 *
 * 一日に3〜5組いらっしゃるようにしたとき、いちばん大事なのは
 * 組数ではなく、一日の終わりに
 *
 *   「今日は、こんなお客さまたちに花を渡したな」
 *
 * と思えることでした。だから名前だけ並べます。
 * **数字は書きません。** 「3人接客しました」と書いた瞬間、
 * それは今日のまとめになり、明日は4人にしたくなります。
 * 何人だったかは、並んだ名前を見れば分かります。
 * ── 分かるのと、数えさせるのは、違うことです。
 */

import { useEffect, useState } from 'react';

import './AfterScreen.css';
import { petalOnCounter, petalPlacement } from '../data/afterglow';
import { useGame } from '../game/GameContext';

export function AfterScreen() {
  const { state, dispatch, customer, todayGuests } = useGame();

  // 店が静かになる1.5秒。ここが過ぎてから、店を閉められるようになる。
  // 急かさないための待ちではなく、**人がいなくなったことに気づくため**の待ち。
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setSettled(true), 1500);
    return () => window.clearTimeout(timer);
  }, []);

  // 閉めてから、日が変わるまでの間。
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
        最後の方の、帰りぎわの一言。引き止める言葉はひとつも置かない。
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
        今日、花をお渡しした方たち。名前だけ。
        点数も、束の写真も、どれが良かったかも出さない。
      */}
      {todayGuests.length > 0 && (
        <div className="after__guests">
          <p className="after__guests-lead">今日、花をお渡しした方</p>
          <p className="after__guests-names">
            {todayGuests.map((guest, index) => (
              <span key={`${guest.id}-${index}`} className="after__guest">
                {guest.name}
              </span>
            ))}
          </p>
        </div>
      )}

      {/*
        一日を閉じる。
        自動では進まない。押すまで、ずっとこの静けさのまま。

        **札を裏返す仕組みはやめました。** 何が起きるのか、
        押してみるまで分からない操作でした。案内を書き足すより、
        案内が要らない形にするほうが静かです。
      */}
      <div className="after__foot">
        <button
          type="button"
          className="button"
          onClick={close}
          disabled={!settled || closing}
        >
          今日のお店を閉める
        </button>
      </div>
    </div>
  );
}
