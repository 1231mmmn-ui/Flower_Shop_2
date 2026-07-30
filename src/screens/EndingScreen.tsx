/**
 * 季節がひと巡りした日。
 *
 * このゲームの最後の問いを、一度だけ出します。
 *
 *   ×  「面白かったですか？」
 *   ○  「好きな花は、できましたか？」
 *
 * **こちらから答えは出しません。**
 * 「あなたのいちばんの花は◯◯でした」と言った瞬間に、
 * その一年はこちらのものになります。答えるのはプレイヤーです。
 *
 * ♡を付けた花があれば、それを並べます ── 集めた数ではなく、**選んだ花**として。
 * ♡が0個なら、何も並べません。代わりの花も置きません
 * （→ design/14-flowers.md 3-2章。ここを埋めると、♡の意味が消えます）。
 *
 * **終わりきらないこと。** きれいに終わると、そこで満足してしまいます。
 * だから「おわり」とは書きません。また春の朝が来るだけです。
 */

import { useEffect, useState } from 'react';

import './EndingScreen.css';
import { flower as flowerImage } from '../assets/paths';
import { FLOWERS } from '../data/flowers';
import { useGame } from '../game/GameContext';

export function EndingScreen() {
  const { state, dispatch } = useGame();

  // 問いだけの時間。読み終わる前に花が出てくると、問いが飾りになる。
  const [asked, setAsked] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setAsked(true), 2600);
    return () => window.clearTimeout(timer);
  }, []);

  // 押した順のまま。並べ替えない。
  const loved = state.favorites
    .map((id) => FLOWERS.find((f) => f.id === id))
    .filter((f): f is (typeof FLOWERS)[number] => Boolean(f));

  // 何年めか。数えるためではなく、季節が巡ったことを言うためだけ。
  const years = Math.floor(state.day / 20);

  return (
    <div className={`ending ${asked ? 'is-asked' : ''}`}>
      <div className="ending__body">
        <p className="ending__season">
          {years > 1 ? `${years}度めの春が、来ます` : '春が、もう一度来ます'}
        </p>

        <h2 className="ending__ask">好きな花は、できましたか。</h2>

        {/*
          プレイヤー自身の答え。
          点数も、順位も、「あと◯種」も置かない。花の絵と名前だけ。
        */}
        {loved.length > 0 && (
          <div className="ending__loved">
            {loved.map((item) => (
              <span key={item.id} className="ending__flower">
                <img src={flowerImage(item.id)} alt="" aria-hidden />
                <span>{item.name}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/*
        「おわり」ではない。次の朝へ続くだけ。
        日はもう進んでいる（`next-day` が21日目にしてから、この画面を出した）。
        ここで進めるのは日ではなく、**画面だけ** ── `enter-morning`。
      */}
      <div className="ending__foot">
        <button
          type="button"
          className="button button--quiet"
          onClick={() => dispatch({ type: 'enter-morning' })}
        >
          店を開ける
        </button>
      </div>
    </div>
  );
}
