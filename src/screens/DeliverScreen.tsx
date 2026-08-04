/**
 * お渡しする。
 *
 * いちばん見せたいのは、できあがったブーケと、受け取った人の顔。
 * 言葉は少なく、責める言葉はひとつも置かない。
 */

import { useState } from 'react';

import './DeliverScreen.css';
import { customerArms, customer as customerImage } from '../assets/paths';
import { Bouquet } from '../components/Bouquet';
import { QuietBar } from '../components/QuietBar';
import { TodayFlower } from '../components/TodayFlower';
import { useGame } from '../game/GameContext';

export function DeliverScreen() {
  const { state, dispatch, customer, result, visit } = useGame();
  /**
   * 束だけを眺める時間。
   *
   * ── 自動で消える案は、やめました ──────────────────────
   *
   * 3秒たつと画面のまわりがひとりでに消える案と、ふれたときだけ
   * 消える案を、4日ずつ入れ替えて比べていました。
   * **一日に3〜5組いらっしゃるようにしたことで、決まりました。**
   * 自動で消える案は、一日に3〜5回ひとりでに起きます。
   * 一度なら「間」ですが、繰り返すと**癖**になります。
   * 立ち止まるかどうかは、こちらが決めることではありません。
   *
   * 比べるための仕組み（useLingerTrial）は、決まったので外しました。
   */
  const [alone, setAlone] = useState(false);
  if (!result) return null;

  return (
    <div className={`deliver ${alone ? 'is-lingering' : ''}`}>
      <QuietBar />

      {/* 束にふれると、まわりが下がる。もう一度ふれると戻る。 */}
      <button
        type="button"
        className="deliver__moment"
        onClick={() => setAlone((was) => !was)}
        aria-label={alone ? '言葉を見る' : '束だけを眺める'}
      >
        {/*
          ── 抱えている姿にする ────────────────────────────

          束を人物の**横に並べて**いました。同じ画面にいるだけで、
          同じ空間にはいません。抱えている姿にするには、束が
          **体より手前、腕より奥**になければいけません。

              人物 → 束 → 腕

          腕を別の紙にしたのは、この順番を作るためだけです
          （→ tools/placeholder_art/props.py の render_customer_arms）。
          手を描き足すだけでは、手が束の後ろに隠れて何も変わりません。

          三枚は同じ枠（.deliver__figure）に置きます。人物と腕は
          同じ 800×800 の絵なので、位置合わせは要りません。
        */}
        <div className="deliver__figure">
          <img
            className="deliver__person"
            src={customerImage(customer.id, 'happy')}
            alt={customer.name}
            draggable={false}
          />
          <div className="deliver__bouquet">
            <Bouquet bouquet={state.bouquet} />
          </div>
          <img
            className="deliver__arms"
            src={customerArms(customer.id)}
            alt=""
            aria-hidden
            draggable={false}
          />
        </div>
      </button>

      <span className="deliver__smile" aria-label={`${result.smile} / 5`}>
        {Array.from({ length: 5 }, (_, index) => (
          <span
            key={index}
            className={`deliver__mark ${index < result.smile ? 'is-on' : ''}`}
            style={{ animationDelay: `${0.6 + index * 0.14}s` }}
            aria-hidden
          >
            ✿
          </span>
        ))}
      </span>

      <div className="deliver__words">
        {result.words.map((line, index) => (
          <p key={line} style={{ animationDelay: `${0.4 + index * 0.6}s` }}>
            {line}
          </p>
        ))}
      </div>

      {/*
        二行だけ。**助言はやめました**（→ evaluation.ts）。
        一日に3〜5組いらっしゃるので、一年で80回読むことになります。
        「直したほうがいい点」を80回読む一年は、
        花を好きになる一年とは、別のものです。
      */}
      <div className="deliver__note">
        <p className="deliver__praise">{result.praise}</p>
        {result.meaningNote && <p className="deliver__meaning">{result.meaningNote}</p>}
      </div>

      <footer className="deliver__foot">
        {/*
          帰りぎわの一言は、ここから余韻の画面へ移した。
          お客さまがまだ目の前にいるうちに読ませると、
          「帰りぎわ」ではなく「受け取ったときの言葉」になってしまう。

          **文言を変えました。** ただの「お見送りする」だと、
          誰を見送るのか、押したら何が終わるのかが曖昧でした。
          いまは一日に何組もいらっしゃるので、なおさらです。

          残り人数は出しません（「あと2人」と書いた瞬間、
          残りを数える一日になります）。最後の方のときだけ、
          文言が静かに変わります。
        */}
        <div className="deliver__see-off">
          <TodayFlower />
          <button type="button" className="button" onClick={() => dispatch({ type: 'see-off' })}>
            {visit.last ? 'お客様をお見送りして、店を片づける' : 'お客様をお見送りする'}
          </button>
        </div>
      </footer>
    </div>
  );
}
