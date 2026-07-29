/**
 * 束ねて、包む。
 *
 * 画面のほとんどはブーケそのもの。
 * 道具は、花にふれたときだけそっと現れる。
 * 資材は名前の一覧ではなく、棚から取るように現物を並べる。
 */

import { useState } from 'react';

import './ArrangeScreen.css';
import { wrapMaterial } from '../assets/paths';
import { Bouquet } from '../components/Bouquet';
import { ApronMemo } from '../components/ApronMemo';
import { QuietBar } from '../components/QuietBar';
import { flowerById } from '../data/flowers';
import { RIBBONS, WRAPPINGS, ribbonById, wrappingById } from '../data/wrapping';
import { bouquetPrice } from '../game/evaluation';
import { useGame } from '../game/GameContext';

export function ArrangeScreen() {
  const { state, dispatch, customer } = useGame();
  const [selected, setSelected] = useState<string | null>(null);

  const total = bouquetPrice(state.bouquet);
  const stem = state.bouquet.stems.find((item) => item.uid === selected);
  const wrap = wrappingById(state.bouquet.wrappingId);
  const ribbon = ribbonById(state.bouquet.ribbonId);

  return (
    <div className="arrange">
      <QuietBar />

      {/* 束ねているあいだも、お客さまの言葉は手元にある。 */}
      <ApronMemo customer={customer} />

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

      {/* 道具は、花を選んでいるときだけ現れる */}
      <div className={`arrange__tools ${stem ? 'is-open' : ''}`}>
        {stem ? (
          <>
            <span className="arrange__holding">{flowerById(stem.flowerId).name}</span>
            <button
              type="button"
              className="arrange__tool"
              onClick={() => dispatch({ type: 'bring-forward', uid: stem.uid })}
            >
              手前へ
            </button>
            <button
              type="button"
              className="arrange__tool"
              onClick={() => {
                dispatch({ type: 'remove-stem', uid: stem.uid });
                setSelected(null);
              }}
            >
              戻す
            </button>
            <button type="button" className="arrange__tool" onClick={() => setSelected(null)}>
              手をはなす
            </button>
          </>
        ) : (
          <>
            <span className="arrange__whisper">花にふれて動かせます</span>
            <button
              type="button"
              className="arrange__tool"
              onClick={() => dispatch({ type: 'rearrange' })}
            >
              整える
            </button>
            <button
              type="button"
              className="arrange__tool"
              disabled={state.history.length === 0}
              onClick={() => dispatch({ type: 'undo' })}
            >
              ひとつ前へ
            </button>
          </>
        )}
      </div>

      {/* 棚から資材を取る。名前は選んだものだけ。 */}
      <div className="arrange__shelf">
        <p className="arrange__material-name">
          {wrap.name}
          <span className="arrange__slash">／</span>
          {ribbon.name}
        </p>

        <div className="arrange__rack">
          {WRAPPINGS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`arrange__stock ${
                state.bouquet.wrappingId === item.id ? 'is-chosen' : ''
              }`}
              onClick={() => dispatch({ type: 'set-wrapping', id: item.id })}
              title={item.name}
            >
              <img src={wrapMaterial(item.id)} alt={item.name} />
            </button>
          ))}
          <span className="arrange__divider" aria-hidden />
          {RIBBONS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`arrange__stock arrange__stock--ribbon ${
                state.bouquet.ribbonId === item.id ? 'is-chosen' : ''
              }`}
              onClick={() => dispatch({ type: 'set-ribbon', id: item.id })}
              title={item.name}
            >
              <img src={wrapMaterial(item.id)} alt={item.name} />
            </button>
          ))}
        </div>
      </div>

      <footer className="arrange__foot">
        <button
          type="button"
          className="arrange__tool"
          onClick={() => dispatch({ type: 'back-to-shop' })}
        >
          花を選ぶ
        </button>

        <span className="arrange__price">¥{total.toLocaleString('ja-JP')}</span>

        <button
          type="button"
          className="button button--small"
          disabled={state.bouquet.stems.length === 0}
          onClick={() => dispatch({ type: 'deliver' })}
        >
          お渡しする
        </button>
      </footer>
    </div>
  );
}
