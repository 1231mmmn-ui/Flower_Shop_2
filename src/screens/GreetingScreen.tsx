/**
 * お客様が来店し、想いを聞かせてくれる。
 *
 * ここは書類を読む画面ではない。
 * 見えているのはお客様と、その人の言葉だけ。
 * 覚えておきたいことだけを、小さな紙にひとこと書き留める。
 */

import './GreetingScreen.css';
import { customer as customerImage } from '../assets/paths';
import { QuietBar } from '../components/QuietBar';
import { flowerById } from '../data/flowers';
import { useGame } from '../game/GameContext';

export function GreetingScreen() {
  const { customer, dispatch, season } = useGame();
  const loved = customer.wish.loved?.map((id) => flowerById(id).name).join('と');

  return (
    <div className="greet">
      <QuietBar />

      <p className="greet__entrance">{customer.entrance}</p>

      <div className="greet__figure">
        <img
          className="greet__person"
          src={customerImage(customer.id, 'normal')}
          alt={customer.name} draggable={false} />
        <div className="greet__words">
          {customer.lines.map((line, index) => (
            <p key={line} style={{ animationDelay: `${0.5 + index * 0.55}s` }}>
              {line}
            </p>
          ))}
        </div>
      </div>

      {/*
        覚えておくこと。紙きれ一枚ぶんだけ。

        **4行を2行にしました。** 意味は減らしていません。
        もとは 用途 ／ 色みと印象の並び ／ 予算 ／ 好きな花 の4行で、
        お客さまがすでに言ったことを、ラベルにして並べ直していました。
        読む量が二重になるうえ、印象語を「・」でつないだ行が
        いちばん**条件表**に見えていました（→ ⑫お客さま「3行まで。
        4行めが要るなら、それは条件表になりかけている」）。

        いま残しているのは、**あとで思い出せない事実だけ**です。
        用向きと予算は数字なので忘れます。色みと好みは、
        すぐ上のセリフに書いてあります。
      */}
      <div className="greet__note">
        <p className="greet__note-line">{customer.purpose}</p>
        <p className="greet__note-line greet__note-line--sub">
          {customer.wish.toneLabel}　·　{customer.budget.toLocaleString('ja-JP')}円ほど
        </p>
        {loved && <p className="greet__note-aside">{loved}がお好きだそうです</p>}
      </div>

      <footer className="greet__foot">
        <p className="greet__season">{season.window}</p>
        <button
          type="button"
          className="button"
          onClick={() => dispatch({ type: 'accept-request' })}
        >
          わかりました
        </button>
      </footer>
    </div>
  );
}
