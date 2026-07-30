/**
 * 店のアルバム。
 *
 * **辞典ではありません。** 引くためではなく、見返すための場所です。
 * （→ design/14-flowers.md 3章「アルバムの軸は花」）
 *
 *   ×  このアルバムは、何を集める場所か
 *   ○  このアルバムは、何を思い出す場所か
 *
 * 決めごと
 *   ・開いて最初に出るのは、♡好きな花（0個のときは、段ごと出さない）
 *   ・並べ替えも検索も作らない。季節という**構造**だけ置く
 *   ・並びは固定。棚と違って、日によって動かさない
 *   ・未収集は影だけ。名前も出さない
 *   ・到達率はいちばん下に、いちばん小さく
 */

import { useMemo, useState } from 'react';

import './LibraryScreen.css';
// アルバムの花は 118pt（端末で236px）。512で十分に余る。
import { flowerSmall as flowerImage } from '../assets/paths';
import { FlowerDetail } from '../components/FlowerDetail';
import { customerById } from '../data/customers';
import { FLOWERS, flowerById, type Flower } from '../data/flowers';
import { SEASONS, type SeasonId } from '../data/seasons';
import { useGame } from '../game/GameContext';

/** アルバムの入口。ふたつだけ。 */
type Page = 'flowers' | 'people';

/** 季節の棚。「通年」と「みどり」を足して6つ。並べ替えではなく、構造。 */
type Shelf = SeasonId | 'allyear' | 'green';

const SHELVES: { id: Shelf; label: string }[] = [
  ...SEASONS.map((s) => ({ id: s.id as Shelf, label: s.name })),
  { id: 'allyear', label: '通年' },
  { id: 'green', label: 'みどり' },
];

/**
 * その花がどの棚に載るか。
 * **一輪につき、ひとつの棚。** 複数に出すと「どこにあったか」を覚えられない。
 */
function shelfOf(flower: Flower): Shelf {
  if (flower.role === 'green') return 'green';
  if (flower.seasons.length >= 3) return 'allyear';
  return flower.seasons[0] ?? 'allyear';
}

export function LibraryScreen() {
  const { state, dispatch, season } = useGame();
  const [page, setPage] = useState<Page>('flowers');
  // 開いたとき、まず出るのは**今の季節**の棚。
  // 五十音の先頭でも、実装順の先頭でもない ── 今日この店にある花のページ。
  const [shelf, setShelf] = useState<Shelf>(season.id);
  const [opened, setOpened] = useState<string | null>(null);

  const met = state.library;

  /**
   * 棚ごとの並び。**日によって動かさない。**
   *
   * 店頭の棚は、今日の店に見えるよう日ごとに少し並びが変わる。
   * アルバムでそれをやってはいけない。物理のアルバムは、
   * いつも同じページに同じ写真があるから、指が場所を覚える。
   * 「あのへんにガーベラがあったな」は、順番が固定されて初めて生まれる。
   */
  const shelves = useMemo(() => {
    const map = new Map<Shelf, Flower[]>();
    for (const item of FLOWERS) {
      const key = shelfOf(item);
      map.set(key, [...(map.get(key) ?? []), item]);
    }
    return map;
  }, []);

  // ♡。押した順のまま。並べ替えない。
  const loved = state.favorites
    .map((id) => FLOWERS.find((f) => f.id === id))
    .filter((f): f is Flower => Boolean(f));

  const flower = opened ? flowerById(opened) : null;
  const shown = shelves.get(shelf) ?? [];

  return (
    <div className={`album ${flower ? 'is-looking' : ''}`}>
      <header className="album__head">
        <button
          type="button"
          className="album__back"
          onClick={() => dispatch({ type: 'close-library' })}
        >
          ← 閉じる
        </button>
        <h2 className="album__title">店のアルバム</h2>
        <span />
      </header>

      <div className="album__body scroll">
        {page === 'flowers' && (
          <>
            {/*
              ♡好きな花。
              **0個のときは、この段ごと出しません。**
              「まだありません」も、代わりの花も置きません。
              最初に♡を押した次の日、無かった段が現れる ── それが♡の意味です。
            */}
            {loved.length > 0 && (
              <section className="album__loved">
                <h3 className="album__section">♡ 好きな花</h3>
                <div className="album__row">
                  {loved.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="album__loved-card"
                      onClick={() => setOpened(item.id)}
                    >
                      <img src={flowerImage(item.id)} alt="" aria-hidden />
                      <span>{item.name}</span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* 季節。並べ替えではなく、構造。 */}
            <nav className="album__shelves">
              {SHELVES.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  className={`album__shelf ${shelf === id ? 'is-active' : ''}`}
                  onClick={() => setShelf(id)}
                >
                  {label}
                </button>
              ))}
            </nav>

            <div className="album__grid">
              {shown.map((item) => {
                const entry = met[item.id];
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`album__card ${entry ? '' : 'is-unmet'}`}
                    onClick={() => entry && setOpened(item.id)}
                    aria-label={entry ? item.name : 'まだ会っていない花'}
                  >
                    <span className="album__thumb">
                      <img src={flowerImage(item.id)} alt="" aria-hidden />
                    </span>
                    {/* まだ会っていない花は、影だけ。名前も出しません。 */}
                    {entry && <span className="album__name">{item.name}</span>}
                    {entry && state.favorites.includes(item.id) && (
                      <span className="album__heart" aria-hidden>
                        ♡
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {page === 'people' && (
          <div className="album__people">
            {state.memories.length === 0 ? (
              <p className="whisper album__quiet">まだ、どなたも見えていません。</p>
            ) : (
              [...state.memories].reverse().map((memory, index) => {
                const person = customerById(memory.customerId);
                const main = memory.bouquet.stems[0];
                // その日の言葉。古い記録にしか無いときは、何も出さない。
                const said = memory.words?.[0];
                return (
                  <article key={index} className="album__leaf">
                    <p className="album__day">{memory.day}日目</p>
                    <p className="album__who">
                      {person.name}
                      <span className="whisper">　{person.purpose}</span>
                    </p>
                    {main && (
                      <img
                        className="album__flower"
                        src={flowerImage(main.flowerId)}
                        alt=""
                        aria-hidden
                      />
                    )}
                    {said && <p className="album__word">「{said}」</p>}
                  </article>
                );
              })
            )}
          </div>
        )}
      </div>

      <footer className="album__foot">
        <nav className="album__pages">
          {(
            [
              ['flowers', '花のページ'],
              ['people', '人のページ'],
            ] as [Page, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`album__page ${page === key ? 'is-active' : ''}`}
              onClick={() => setPage(key)}
            >
              {label}
            </button>
          ))}
        </nav>
        {/* 到達率は、いちばん下に、いちばん小さく。押しても何も起きません。 */}
        <span className="album__tally">
          {Object.keys(met).length} / {FLOWERS.length}
        </span>
      </footer>

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
