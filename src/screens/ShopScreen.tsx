/**
 * 店頭。
 *
 * 一覧ではなく、作業台に立ち並ぶ花を横に眺めていく画面。
 * 見えているのは花と店内だけで、名前と値段は「いま正面にある花」にだけ、
 * 小さな木札としてそっと出る。
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import './ShopScreen.css';
import { ApronMemo } from '../components/ApronMemo';
import { FlowerDetail } from '../components/FlowerDetail';
import { FlowerStand } from '../components/FlowerStand';
import { QuietBar } from '../components/QuietBar';
import { flowerById, formatPrice } from '../data/flowers';
import { shelfFor } from '../data/shelf';
import { useGame } from '../game/GameContext';

export function ShopScreen() {
  const { state, dispatch, customer, season, pickedTotal } = useGame();
  const counterRef = useRef<HTMLDivElement>(null);
  // 今日の棚。季節で花は入れ替えず、旬のものが手前に来るだけ。
  const shelf = useMemo(() => shelfFor(season.id, state.day), [season.id, state.day]);
  const [center, setCenter] = useState(0);

  /** いま画面の中央にある花を見つける。 */
  const findCenter = useCallback(() => {
    const counter = counterRef.current;
    if (!counter) return;
    const middle = counter.scrollLeft + counter.clientWidth / 2;
    let nearest = 0;
    let best = Infinity;
    counter.querySelectorAll<HTMLElement>('.stand').forEach((stand, index) => {
      const distance = Math.abs(stand.offsetLeft + stand.offsetWidth / 2 - middle);
      if (distance < best) {
        best = distance;
        nearest = index;
      }
    });
    setCenter(nearest);
  }, []);

  useEffect(() => {
    findCenter();
    const counter = counterRef.current;
    if (!counter) return;
    counter.addEventListener('scroll', findCenter, { passive: true });
    return () => counter.removeEventListener('scroll', findCenter);
  }, [findCenter]);

  const inspecting = state.inspectingFlowerId
    ? flowerById(state.inspectingFlowerId)
    : null;
  const countOf = (flowerId: string) =>
    state.picked.filter((stem) => stem.flowerId === flowerId).length;

  const front = shelf[Math.min(center, shelf.length - 1)];
  const overBudget = pickedTotal > customer.budget;

  return (
    <div className={`shop-view ${inspecting ? 'is-inspecting' : ''}`}>
      <QuietBar />

      {/* お客様の望みは、一行のつぶやきとして残しておく */}
      <p className="shop-view__murmur">{customer.wish.toneLabel}</p>

      {/*
        エプロンのメモ。選んでいるあいだ、お客さまの言葉がずっと手元にある。
        こちらからは開かない。気づかない人がいてよい。
      */}
      {!inspecting && <ApronMemo customer={customer} />}

      <div className="shop-view__counter" ref={counterRef}>
        {shelf.map((flower, index) => (
          <FlowerStand
            key={flower.id}
            flower={flower}
            focused={index === center}
            distance={Math.abs(index - center)}
            picked={countOf(flower.id)}
            onSelect={() => dispatch({ type: 'inspect', flowerId: flower.id })}
          />
        ))}
      </div>

      {/* 正面の花にだけ、小さな木札 */}
      <div className="shop-view__label" key={front.id}>
        <span className="shop-view__name">{front.name}</span>
        <span className="shop-view__price">{formatPrice(front.price)}／本</span>
        {front.seasons.length < 4 && front.seasons.includes(season.id) && (
          <span className="shop-view__season">いまが旬</span>
        )}
      </div>

      <footer className="shop-view__hands">
        <span className={`shop-view__purse ${overBudget ? 'is-over' : ''}`}>
          ¥{pickedTotal.toLocaleString('ja-JP')}
          <span className="shop-view__of">／ ¥{customer.budget.toLocaleString('ja-JP')}</span>
        </span>

        <button
          type="button"
          className="button button--small"
          disabled={state.picked.length === 0}
          onClick={() => dispatch({ type: 'go-arrange' })}
        >
          束ねる
          {state.picked.length > 0 && (
            <span className="shop-view__count">{state.picked.length}</span>
          )}
        </button>
      </footer>

      {inspecting && (
        <FlowerDetail
          flower={inspecting}
          inSeason={inspecting.seasons.includes(season.id)}
          picked={countOf(inspecting.id)}
          onPick={() => dispatch({ type: 'pick', flowerId: inspecting.id })}
          onClose={() => dispatch({ type: 'inspect', flowerId: null })}
        />
      )}
    </div>
  );
}
