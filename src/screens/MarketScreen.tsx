/**
 * ⓪-a 市場。
 *
 * **仕入れの場所ではありません。今日いちばん美しい花に出会う場所です。**
 * 花屋の朝そのもの。
 *
 * プレイヤーが決めるのは、ひとつだけ。
 *
 *   今日、店の入口に飾る花
 *
 * 効果はありません。能力も、売上補正も、贔屓も。
 * 効果を付けた瞬間に「どれを選ぶと得か」になり、この店の軸から外れます。
 * 決めているのは損得ではなく、**「今日は、この花でお客さまを迎えよう」**です。
 *
 * 置かないもの
 *   ・値段／レア度／★／在庫数／「今日いちばん」の札
 *   ・仕入れる数を決めること
 *   ・選ばなかったことへの咎め
 *
 * 選び直しはできます。決めたあとも、開店前から戻ってこられます。
 */

import { useMemo, useRef, useState } from 'react';

import './MarketScreen.css';
import { flowerSmall as flowerImage } from '../assets/paths';
import { marketForDay, remarkFor } from '../data/market';
import { useBenchTop } from '../components/useSceneBox';
import { useGame } from '../game/GameContext';

export function MarketScreen() {
  const { state, dispatch, season } = useGame();
  const today = useMemo(
    () => marketForDay(state.day, season.id),
    [state.day, season.id],
  );
  // 手に取って見ている花。選ぶ前に、一輪ずつ眺められる。
  const [held, setHeld] = useState<string | null>(null);
  const holding = today.find((f) => f.id === held) ?? null;

  // 花は、絵の中の台の上に置く。画面の高さの比で置くと、
  // 背景が cover で切られたときに宙に浮く。
  const stage = useRef<HTMLDivElement>(null);
  const benchTop = useBenchTop(stage);

  return (
    <div className="market" ref={stage}>
      <header className="market__head">
        <p className="market__where">市場</p>
        {/*
          日付も曜日も出しません。ここは「今日は何があるだろう」の時間で、
          「今日が何日か」を確かめる時間ではないので。
        */}
        <p className="market__lead">今日は、どの花でお客さまを迎えましょう。</p>
      </header>

      <div
        className="market__row scroll"
        style={benchTop != null ? { top: `${benchTop}px` } : undefined}
      >
        {today.map((flower) => {
          const remark = remarkFor(state.day, flower.id);
          return (
            <button
              key={flower.id}
              type="button"
              className={`market__stall ${held === flower.id ? 'is-held' : ''}`}
              onClick={() => setHeld(flower.id)}
              aria-label={flower.name}
            >
              {/*
                花の高さは、そろえません。背丈差はそのまま出します。
                そろえるのは**茎の下端の位置だけ**。ここが同じ台に
                並んでいるという印は、絵の外（この影）で作ります。
                絵の中で見えている茎の太さや長さは花ごとに違うので、
                絵だけでは「同じ線に立っている」ことが伝わりません。
              */}
              <span className="market__flower">
                <img src={flowerImage(flower.id)} alt="" aria-hidden draggable={false} />
                <span className="market__contact" aria-hidden />
              </span>
              <span className="market__name">{flower.name}</span>
              {/* ひとことは、三輪に一輪くらい。全部に付くと仕様欄になる。 */}
              {remark && <span className="market__remark">{remark}</span>}
            </button>
          );
        })}
      </div>

      <footer className="market__foot">
        {holding ? (
          <>
            <p className="market__chosen">
              {holding.name}を、今日の店の花に。
            </p>
            <button
              type="button"
              className="button"
              onClick={() => dispatch({ type: 'set-front', flowerId: holding.id })}
            >
              この花を店頭に飾る
            </button>
          </>
        ) : (
          /*
            まだ選んでいないとき。
            「選んでください」とは言いません。急かす言葉も置きません。
            ここに何も無いことが、そのまま「まだ見ていていい」という意味になります。

            ただし**読めないのは、静かとは言いません。**
            `whisper`（薄い字）を外しました。木の台の上に薄い字を置くと、
            どの色でもコントラストが足りません（最大 2.9 : 1）。
          */
          <p className="market__quiet">ひととおり、見てまわれます。</p>
        )}
      </footer>
    </div>
  );
}
