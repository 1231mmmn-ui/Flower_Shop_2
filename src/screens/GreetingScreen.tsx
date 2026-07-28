/** お客様が来店し、想いを聞かせてくれる。 */

import './GreetingScreen.css';
import { CustomerFigure } from '../components/CustomerFigure';
import { TopBar } from '../components/TopBar';
import { flowerById, IMPRESSION_LABEL } from '../data/flowers';
import { useGame } from '../game/GameContext';

export function GreetingScreen() {
  const { customer, dispatch, season } = useGame();

  return (
    <div className="greeting">
      <TopBar />

      <p className="greeting__entrance whisper fade">{customer.entrance}</p>

      <CustomerFigure customer={customer} mood="normal" lines={customer.lines} />

      <section className="greeting__request panel appear">
        <p className="label">聞かせてもらったこと</p>

        <dl className="greeting__rows">
          <Row label="花の目的" value={customer.purpose} />
          <Row
            label="予算のめやす"
            value={`${customer.budget.toLocaleString('ja-JP')}円くらい`}
          />
          <Row label="花の要望" value={customer.wish.toneLabel} />
          <Row
            label="雰囲気の要望"
            value={customer.wish.impressions
              .map((key) => IMPRESSION_LABEL[key])
              .join('・')}
          />
          {customer.wish.loved && (
            <Row
              label="そっと聞いたこと"
              value={`${customer.wish.loved.map((id) => flowerById(id).name).join('・')}${
                customer.wish.lovedHint ? `（${customer.wish.lovedHint}）` : ''
              }`}
            />
          )}
        </dl>

        <p className="greeting__life">{customer.life}</p>
      </section>

      <footer className="greeting__foot">
        <p className="whisper">{season.window}</p>
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="greeting__row">
      <dt className="label">{label}</dt>
      <dd className="body">{value}</dd>
    </div>
  );
}
