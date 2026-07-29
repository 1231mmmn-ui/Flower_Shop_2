/**
 * 店頭。花はガラスの花瓶に生けられていて、
 * 手前の花は少し大きく、奥の花は少し小さく見える。
 */

import { useMemo } from 'react';

import './ShopScreen.css';
import { flower as flowerImage } from '../assets/paths';
import { FlowerDetail } from '../components/FlowerDetail';
import { FlowerVase } from '../components/FlowerVase';
import { TopBar } from '../components/TopBar';
import { FLOWERS, flowerById } from '../data/flowers';
import { useGame } from '../game/GameContext';

/** 奥の列から手前の列へ。1列3台。 */
const PER_ROW = 3;

export function ShopScreen() {
  const { state, dispatch, customer, season, pickedTotal } = useGame();

  const rows = useMemo(() => {
    const chunks = [];
    for (let i = 0; i < FLOWERS.length; i += PER_ROW) {
      chunks.push(FLOWERS.slice(i, i + PER_ROW));
    }
    return chunks;
  }, []);

  const inspecting = state.inspectingFlowerId
    ? flowerById(state.inspectingFlowerId)
    : null;

  const countOf = (flowerId: string) =>
    state.picked.filter((stem) => stem.flowerId === flowerId).length;

  return (
    <div className={`shop-screen ${inspecting ? 'is-inspecting' : ''}`}>
      <TopBar />

      <div className="shop-screen__wish fade">
        <p className="whisper">
          {customer.name}のご希望　—　{customer.wish.toneLabel}
        </p>
        <span className={`tag ${pickedTotal > customer.budget ? 'tag--gentle' : ''}`}>
          予算 ¥{customer.budget.toLocaleString('ja-JP')}
          <span className="tag__value">いま ¥{pickedTotal.toLocaleString('ja-JP')}</span>
        </span>
      </div>

      <div className="shop-screen__shelves scroll">
        {rows.map((row, rowIndex) => {
          // いちばん下の列が手前
          const depth = rows.length === 1 ? 1 : rowIndex / (rows.length - 1);
          return (
            <div
              className="shop-screen__row"
              key={rowIndex}
              style={{ zIndex: rowIndex + 1 }}
            >
              {row.map((flower) => (
                <FlowerVase
                  key={flower.id}
                  flower={flower}
                  depth={depth}
                  inSeason={
                    flower.seasons.length < 4 && flower.seasons.includes(season.id)
                  }
                  picked={countOf(flower.id)}
                  onSelect={() => dispatch({ type: 'inspect', flowerId: flower.id })}
                />
              ))}
            </div>
          );
        })}
      </div>

      <footer className="shop-screen__basket panel panel--soft">
        <div className="shop-screen__picked scroll">
          {state.picked.length === 0 ? (
            <p className="whisper shop-screen__empty">
              気になった花をタップして、ゆっくり選んでください。
            </p>
          ) : (
            state.picked.map((stem) => {
              const flower = flowerById(stem.flowerId);
              return (
                <button
                  key={stem.uid}
                  type="button"
                  className="shop-screen__chip"
                  onClick={() => dispatch({ type: 'unpick', uid: stem.uid })}
                  title={`${flower.name}を花瓶に戻す`}
                >
                  <span className="shop-screen__chip-art">
                    <img src={flowerImage(flower.id)} alt={flower.name} />
                  </span>
                  <span className="shop-screen__chip-name">{flower.name}</span>
                </button>
              );
            })
          )}
        </div>

        <button
          type="button"
          className="button"
          disabled={state.picked.length === 0}
          onClick={() => dispatch({ type: 'go-arrange' })}
        >
          束ねる
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
