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
import { flowerById, IMPRESSION_LABEL } from '../data/flowers';
import { useGame } from '../game/GameContext';

export function GreetingScreen() {
  const { customer, dispatch, season } = useGame();
  const mood = customer.wish.impressions.map((key) => IMPRESSION_LABEL[key]).join('・');
  const loved = customer.wish.loved?.map((id) => flowerById(id).name).join('と');

  return (
    <div className="greet">
      <QuietBar />

      <p className="greet__entrance">{customer.entrance}</p>

      <div className="greet__figure">
        <img
          className="greet__person"
          src={customerImage(customer.id, 'normal')}
          alt={customer.name}
        />
        <div className="greet__words">
          {customer.lines.map((line, index) => (
            <p key={line} style={{ animationDelay: `${0.5 + index * 0.55}s` }}>
              {line}
            </p>
          ))}
        </div>
      </div>

      {/* 覚えておくこと。紙きれ一枚ぶんだけ。 */}
      <div className="greet__note">
        <p className="greet__note-line">{customer.purpose}</p>
        <p className="greet__note-line greet__note-line--sub">
          {customer.wish.toneLabel}　·　{mood}
        </p>
        <p className="greet__note-line greet__note-line--sub">
          {customer.budget.toLocaleString('ja-JP')}円ほど
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
