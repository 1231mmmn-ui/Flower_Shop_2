/**
 * 束ねて、包む。
 *
 * ── 一本ずつ動かす方式を、やめました ──────────────────────
 *
 * 実機で触ってみると、あれは**画像を配置する操作**でした。
 * うまく置けても嬉しくなく、置けないと自分が下手に思えます。
 * 「自由度を高く」より「思ったとおりに気持ちよく動く」を優先しても、
 * 直るのは操作の精度だけで、**その時間の意味は変わりません。**
 *
 * いまは、こちらが最後まで組んだ束を三つ出します。
 *
 *   丸くやわらかい      高さを出してすっきり      自然に広がる
 *
 * **三つとも成立しています。優劣も、正解も、点数もありません。**
 * どれを選んでも、お客さまの受け取り方は変わりません（→ evaluation.ts）。
 * ここでしてほしいのは「この人には、どんな束が似合うだろう」と
 * 考えることで、うまく置けたかどうかではありません。
 *
 * 一日に3〜5組いらっしゃるようになったので、テンポの話でもあります。
 * ただし**軽くしたのは操作だけで、考える時間は削っていません。**
 */

import './ArrangeScreen.css';
import { wrapMaterial } from '../assets/paths';
import { Bouquet } from '../components/Bouquet';
import { ApronMemo } from '../components/ApronMemo';
import { QuietBar } from '../components/QuietBar';
import { TodayFlower } from '../components/TodayFlower';
import { flowerById } from '../data/flowers';
import { RIBBONS, WRAPPINGS, ribbonById, wrappingById } from '../data/wrapping';
import { bouquetPrice } from '../game/evaluation';
import { BOUQUET_STYLES, styleById } from '../game/styles';
import { useGame } from '../game/GameContext';

export function ArrangeScreen() {
  const { state, dispatch, customer } = useGame();

  const total = bouquetPrice(state.bouquet);
  const wrap = wrappingById(state.bouquet.wrappingId);
  const ribbon = ribbonById(state.bouquet.ribbonId);
  const style = styleById(state.bouquet.styleId);

  /*
   * いま束の中にいる花を、種類ごとに数える。
   *
   * 「今日のお店のお花」と混同されるという指摘のとおり、束ねている
   * あいだは「いま自分が選んでいる花」も、どこかに見えているべきだった。
   * 常時大きくは出さない ── ここは花を眺める画面なので、
   * 下の帯にひとことだけ添える。
   */
  const pickedCounts = new Map<string, number>();
  state.bouquet.stems.forEach((stem) => {
    pickedCounts.set(stem.flowerId, (pickedCounts.get(stem.flowerId) ?? 0) + 1);
  });

  return (
    <div className="arrange">
      <QuietBar />

      {/* 束ねているあいだも、お客さまの言葉は手元にある。 */}
      <ApronMemo customer={customer} />

      <div className="arrange__stage">
        <Bouquet
          bouquet={state.bouquet}
          className={state.bouquet.stems.length === 0 ? 'bouquet--empty' : ''}
        />
      </div>

      {/*
        束ね方。三つ。

        名前だけ並べます。**印も、星も、「おすすめ」も付けません。**
        どれかが良いことにした瞬間、選ぶことがなくなります。
      */}
      <div className="arrange__styles" role="group" aria-label="束ね方">
        {BOUQUET_STYLES.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`arrange__style ${
              state.bouquet.styleId === item.id ? 'is-chosen' : ''
            }`}
            aria-pressed={state.bouquet.styleId === item.id}
            onClick={() => dispatch({ type: 'set-style', id: item.id })}
          >
            {item.name}
          </button>
        ))}
      </div>

      {/* いま選んでいる形の、一行だけ。良し悪しは言わない。 */}
      <p className="arrange__style-note" key={style.id}>
        {style.note}
      </p>

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
              <img src={wrapMaterial(item.id)} alt={item.name} draggable={false} />
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
              <img src={wrapMaterial(item.id)} alt={item.name} draggable={false} />
            </button>
          ))}
        </div>
      </div>

      {/*
        いま束の中にいる花。「今日のお店のお花」と紛れないよう、
        名前と本数だけ小さく。良し悪しは言わない。
      */}
      {pickedCounts.size > 0 && (
        <p className="arrange__picked">
          {[...pickedCounts.entries()].map(([flowerId, count]) => (
            <span key={flowerId} className="arrange__picked-item">
              {flowerById(flowerId).name}
              <span className="arrange__picked-count">×{count}</span>
            </span>
          ))}
        </p>
      )}

      <footer className="arrange__foot">
        <button
          type="button"
          className="arrange__tool"
          onClick={() => dispatch({ type: 'back-to-shop' })}
        >
          花を選ぶ
        </button>

        <span className="arrange__price">¥{total.toLocaleString('ja-JP')}</span>

        <TodayFlower />

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
