/**
 * お渡しする。
 *
 * いちばん見せたいのは、できあがったブーケと、受け取った人の顔。
 * 言葉は少なく、責める言葉はひとつも置かない。
 */

import './DeliverScreen.css';
import { customer as customerImage } from '../assets/paths';
import { Bouquet } from '../components/Bouquet';
import { QuietBar } from '../components/QuietBar';
import { useGame } from '../game/GameContext';
import { lingerModeForDay, useLingerTrial } from '../game/useLingerTrial';

export function DeliverScreen() {
  const { state, dispatch, customer, result } = useGame();
  // 眺める間。いまは二案を日ごとに入れ替えて比べている（→ useLingerTrial）。
  const mode = lingerModeForDay(state.day);
  const linger = useLingerTrial(mode);
  if (!result) return null;

  return (
    <div className={`deliver ${linger.hidden ? 'is-lingering' : ''}`}>
      <QuietBar />

      {/*
        束と笑顔だけになる時間。
        自動版は3秒後にひとりでに、手動版はふれたときに、まわりが消える。
      */}
      <button
        type="button"
        className="deliver__moment"
        onClick={mode === 'manual' ? linger.toggle : undefined}
        aria-label={
          mode === 'manual'
            ? linger.hidden
              ? '言葉を見る'
              : '束だけを眺める'
            : undefined
        }
      >
        <img
          className="deliver__person"
          src={customerImage(customer.id, 'happy')}
          alt={customer.name}
        />
        <div className="deliver__bouquet">
          <Bouquet bouquet={state.bouquet} scale={0.9} />
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

      <div className="deliver__note">
        <p className="deliver__praise">{result.praise}</p>
        <p className="deliver__advice">{result.advice}</p>
        {result.meaningNote && <p className="deliver__meaning">{result.meaningNote}</p>}
      </div>

      <footer className="deliver__foot">
        <p className="deliver__farewell">{customer.farewell}</p>
        <button
          type="button"
          className="button"
          onClick={() => {
            linger.finish();
            dispatch({ type: 'next-customer' });
          }}
        >
          次のお客さまへ
        </button>
      </footer>
    </div>
  );
}
