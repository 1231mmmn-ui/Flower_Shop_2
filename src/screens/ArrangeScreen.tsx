/**
 * 束ねて、包む。
 * 花はドラッグでゆっくり動く。急かす表示は置かない。
 */

import { useState } from 'react';

import './ArrangeScreen.css';
import { Bouquet } from '../components/Bouquet';
import { TopBar } from '../components/TopBar';
import { flowerById } from '../data/flowers';
import { RIBBONS, WRAPPINGS } from '../data/wrapping';
import { bouquetPrice } from '../game/evaluation';
import { useGame } from '../game/GameContext';

type Tab = 'flowers' | 'wrapping' | 'ribbon';

export function ArrangeScreen() {
  const { state, dispatch } = useGame();
  const [selected, setSelected] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('flowers');

  const total = bouquetPrice(state.bouquet);
  const selectedStem = state.bouquet.stems.find((stem) => stem.uid === selected);

  return (
    <div className="arrange">
      <TopBar />

      <div className="arrange__stage">
        <Bouquet
          bouquet={state.bouquet}
          interactive
          selectedUid={selected}
          onSelect={setSelected}
          onMove={(uid, angle, reach) => dispatch({ type: 'move-stem', uid, angle, reach })}
          className={state.bouquet.stems.length === 0 ? 'bouquet--empty' : ''}
        />
      </div>

      <p className="arrange__hint whisper">
        {selectedStem
          ? `${flowerById(selectedStem.flowerId).name}を選んでいます。指でゆっくり動かせます。`
          : '花にふれると、位置を変えられます。'}
      </p>

      <div className="arrange__tools">
        <button
          type="button"
          className="button button--quiet button--small"
          onClick={() => dispatch({ type: 'rearrange' })}
        >
          整える
        </button>
        <button
          type="button"
          className="button button--quiet button--small"
          disabled={!selectedStem}
          onClick={() => selectedStem && dispatch({ type: 'bring-forward', uid: selectedStem.uid })}
        >
          手前へ
        </button>
        <button
          type="button"
          className="button button--quiet button--small"
          disabled={state.history.length === 0}
          onClick={() => dispatch({ type: 'undo' })}
        >
          ひとつ前へ
        </button>
        <button
          type="button"
          className="button button--quiet button--small"
          disabled={!selectedStem}
          onClick={() => {
            if (!selectedStem) return;
            dispatch({ type: 'remove-stem', uid: selectedStem.uid });
            setSelected(null);
          }}
        >
          この花を戻す
        </button>
      </div>

      <section className="arrange__panel panel panel--soft">
        <nav className="arrange__tabs">
          {(
            [
              ['flowers', '花'],
              ['wrapping', '包み紙'],
              ['ribbon', 'リボン'],
            ] as [Tab, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`arrange__tab ${tab === key ? 'is-active' : ''}`}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="arrange__tab-body scroll">
          {tab === 'flowers' && (
            <div className="arrange__list">
              {state.bouquet.stems.length === 0 && (
                <p className="whisper">花瓶から花を取ってくると、ここに並びます。</p>
              )}
              {state.bouquet.stems.map((stem) => {
                const flower = flowerById(stem.flowerId);
                return (
                  <button
                    key={stem.uid}
                    type="button"
                    className={`arrange__stem-chip ${stem.uid === selected ? 'is-active' : ''}`}
                    onClick={() => setSelected(stem.uid)}
                  >
                    <span
                      className="arrange__swatch"
                      style={{ background: flower.swatch }}
                      aria-hidden
                    />
                    {flower.name}
                  </button>
                );
              })}
            </div>
          )}

          {tab === 'wrapping' && (
            <div className="arrange__list">
              {WRAPPINGS.map((wrap) => (
                <button
                  key={wrap.id}
                  type="button"
                  className={`arrange__material ${
                    state.bouquet.wrappingId === wrap.id ? 'is-active' : ''
                  }`}
                  onClick={() => dispatch({ type: 'set-wrapping', id: wrap.id })}
                >
                  <span
                    className="arrange__paper"
                    style={{ background: wrap.swatch }}
                    aria-hidden
                  />
                  <span className="arrange__material-body">
                    <span className="arrange__material-name">{wrap.name}</span>
                    <span className="whisper">{wrap.texture}</span>
                  </span>
                </button>
              ))}
            </div>
          )}

          {tab === 'ribbon' && (
            <div className="arrange__list">
              {RIBBONS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`arrange__material ${
                    state.bouquet.ribbonId === item.id ? 'is-active' : ''
                  }`}
                  onClick={() => dispatch({ type: 'set-ribbon', id: item.id })}
                >
                  <span
                    className="arrange__paper"
                    style={{ background: item.swatch }}
                    aria-hidden
                  />
                  <span className="arrange__material-body">
                    <span className="arrange__material-name">{item.name}</span>
                    <span className="whisper">{item.texture}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <footer className="arrange__foot">
        <button
          type="button"
          className="button button--quiet button--small"
          onClick={() => dispatch({ type: 'back-to-shop' })}
        >
          花を選ぶ
        </button>

        <span className="tag">
          この束
          <span className="tag__value">¥{total.toLocaleString('ja-JP')}</span>
        </span>

        <button
          type="button"
          className="button"
          disabled={state.bouquet.stems.length === 0}
          onClick={() => dispatch({ type: 'deliver' })}
        >
          お渡しする
        </button>
      </footer>
    </div>
  );
}
