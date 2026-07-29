/** 花の図鑑。出会った花の花言葉を、ゆっくり読み返す場所。 */

import { useState } from 'react';

import './LibraryScreen.css';
import { flower as flowerImage } from '../assets/paths';
import { FlowerDetail } from '../components/FlowerDetail';
import { FLOWERS, flowerById } from '../data/flowers';
import { useGame } from '../game/GameContext';

type Sort = 'shelf' | 'meeting' | 'meaning';

export function LibraryScreen() {
  const { state, dispatch, season } = useGame();
  const [sort, setSort] = useState<Sort>('shelf');
  const [opened, setOpened] = useState<string | null>(null);

  const met = state.library;
  const flowers = [...FLOWERS].sort((a, b) => {
    if (sort === 'meeting') {
      return (met[b.id]?.delivered ?? -1) - (met[a.id]?.delivered ?? -1);
    }
    if (sort === 'meaning') return a.meanings[0].localeCompare(b.meanings[0], 'ja');
    return 0;
  });

  const flower = opened ? flowerById(opened) : null;

  return (
    <div className="library">
      <header className="library__head">
        <button
          type="button"
          className="library__back"
          onClick={() => dispatch({ type: 'close-library' })}
        >
          ← 戻る
        </button>
        <h2 className="library__title">花の図鑑</h2>
        <span className="whisper">
          {Object.keys(met).length} / {FLOWERS.length}
        </span>
      </header>

      <nav className="library__sorts">
        {(
          [
            ['shelf', '店の並び順'],
            ['meeting', 'よく使った順'],
            ['meaning', '花言葉順'],
          ] as [Sort, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`library__sort ${sort === key ? 'is-active' : ''}`}
            onClick={() => setSort(key)}
          >
            {label}
          </button>
        ))}
      </nav>

      <div className="library__grid scroll">
        {flowers.map((item) => {
          const entry = met[item.id];
          return (
            <button
              key={item.id}
              type="button"
              className={`library__card panel panel--flat ${entry ? '' : 'is-unmet'}`}
              onClick={() => setOpened(item.id)}
            >
              <span className="library__thumb">
                <img src={flowerImage(item.id)} alt={item.name} />
              </span>
              <span className="library__name">{item.name}</span>
              <span className="library__meaning">
                {entry
                  ? `花言葉：${item.meanings.join('・')}`
                  : 'まだ、手に取ったことがありません'}
              </span>
              {entry && entry.delivered > 0 && (
                <span className="library__count">{entry.delivered}本 お届けしました</span>
              )}
            </button>
          );
        })}
      </div>

      {state.memories.length > 0 && (
        <p className="whisper library__memory">
          これまでに{state.memories.length}束のブーケを束ねました。
        </p>
      )}

      {flower && (
        <FlowerDetail
          flower={flower}
          inSeason={flower.seasons.includes(season.id)}
          canPick={false}
          onClose={() => setOpened(null)}
        />
      )}
    </div>
  );
}
