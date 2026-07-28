/**
 * お渡しする。
 * お客様は必ず笑顔になり、助言は必ず前向きな言葉で返ってくる。
 */

import './DeliverScreen.css';
import { Bouquet } from '../components/Bouquet';
import { CustomerFigure } from '../components/CustomerFigure';
import { TopBar } from '../components/TopBar';
import { useGame } from '../game/GameContext';

export function DeliverScreen() {
  const { state, dispatch, customer, result } = useGame();
  if (!result) return null;

  return (
    <div className="deliver scroll">
      <TopBar />

      <div className="deliver__scene">
        <div className="deliver__bouquet appear appear--slow">
          <Bouquet bouquet={state.bouquet} scale={0.92} />
        </div>
      </div>

      <CustomerFigure
        customer={customer}
        mood="smile"
        lines={result.words}
        showName={false}
      />

      <div className="deliver__smile fade">
        <span className="label">受け取ったときの笑顔</span>
        <span className="deliver__flowers" aria-label={`${result.smile} / 5`}>
          {Array.from({ length: 5 }, (_, index) => (
            <span
              key={index}
              className={`deliver__mark ${index < result.smile ? 'is-on' : ''}`}
              style={{ animationDelay: `${index * 0.12}s` }}
              aria-hidden
            >
              ✿
            </span>
          ))}
        </span>
      </div>

      <section className="deliver__card panel appear">
        <p className="deliver__praise">{result.praise}</p>
        {result.meaningNote && <p className="deliver__meaning">{result.meaningNote}</p>}
      </section>

      <section className="deliver__advice panel panel--soft appear">
        <p className="label">こんな感じだと、もっと嬉しいかも</p>
        <p className="body">{result.advice}</p>
        {result.overBudget && (
          <p className="whisper deliver__budget">
            予算より少しだけ上がりましたが、{customer.name}は嬉しそうに受け取ってくれました。
          </p>
        )}
      </section>

      <p className="deliver__farewell whisper fade">{customer.farewell}</p>

      <footer className="deliver__foot">
        <button
          type="button"
          className="button"
          onClick={() => dispatch({ type: 'next-customer' })}
        >
          次のお客さまへ
        </button>
      </footer>
    </div>
  );
}
