/**
 * 花をタップしたとき。
 * 画面が少し暗くなり、選んだ花だけが前へ出て、光が当たる。
 * 情報を読む画面ではなく、花を眺める時間を楽しむ画面。
 */

import { useState } from 'react';

import './FlowerDetail.css';
import { flower as flowerImage } from '../assets/paths';
import { flowerById, formatPrice, type Flower } from '../data/flowers';
import { useGame } from '../game/GameContext';

interface FlowerDetailProps {
  flower: Flower;
  inSeason: boolean;
  picked?: number;
  /** 図鑑から開いたときは、花を取るボタンを出さない */
  canPick?: boolean;
  onPick?: () => void;
  onClose: () => void;
}

export function FlowerDetail({
  flower,
  inSeason,
  picked = 0,
  canPick = true,
  onPick,
  onClose,
}: FlowerDetailProps) {
  // 紙を下げて、花だけを見られるようにする。
  // 「一輪の花を、しばらく見つめてしまう」（→ design/16-stillness.md 2章）は
  // 五つの立ち止まる時間のひとつで、紙が出たままだと視線がそちらへ移ってしまう。
  const [paperDown, setPaperDown] = useState(false);
  const { state, dispatch } = useGame();
  const loved = state.favorites.includes(flower.id);

  // はじめて手に取った日。まだ会っていない花には、何も出さない。
  const met = state.library[flower.id];

  return (
    <div
      className={`detail fade ${paperDown ? 'is-quiet' : ''}`}
      role="dialog"
      aria-label={flower.name}
    >
      <button
        type="button"
        className="detail__backdrop"
        onClick={onClose}
        aria-label="花瓶に戻す"
      />

      {/*
        ♡。押すだけ。
        音も鳴らさない、数も増えない、何ももらえない。
        ご褒美を付けた瞬間、「好き」が「集める」に変わるので。
        こちらからは一度も「好きな花を選んでください」と言わない。
      */}
      <button
        type="button"
        className={`detail__heart ${loved ? 'is-on' : ''}`}
        onClick={() => dispatch({ type: 'toggle-favorite', flowerId: flower.id })}
        aria-pressed={loved}
        aria-label={loved ? 'お気に入りから外す' : 'お気に入りに入れる'}
      >
        {loved ? '♥' : '♡'}
      </button>

      {/* 花にふれると紙が下がる。もう一度ふれると戻る。 */}
      <button
        type="button"
        className="detail__stage"
        onClick={() => setPaperDown((was) => !was)}
        aria-label={paperDown ? '説明を見る' : '花だけを見る'}
      >
        <span className="detail__light" aria-hidden />
        <img
          className="detail__flower"
          src={flowerImage(flower.id)}
          alt={flower.name}
          draggable={false}
        />
      </button>

      <div className="detail__card panel panel--deep scroll">
        <header className="detail__head">
          <div>
            <h2 className="detail__name">{flower.name}</h2>
            <p className="whisper">{flower.reading}</p>
          </div>
          <div className="detail__price">
            <span className="detail__yen">{formatPrice(flower.price)}</span>
            <span className="whisper">／本</span>
          </div>
        </header>

        <p className="detail__meanings">
          {flower.meanings.map((meaning) => (
            <span key={meaning} className="detail__meaning">
              {meaning}
            </span>
          ))}
        </p>

        {/*
          出会った日。
          花言葉のすぐ下、知識より前に置く。
          ここは辞典ではなくアルバムなので、**その花について知っていること**より、
          **その花と自分のあいだに起きたこと**のほうが先に来る。
          本数は書かない ── 数えはじめた瞬間、思い出は収集に変わる。
        */}
        {met && <p className="detail__met">{met.metOnDay}日目に出会いました</p>}

        {/*
          ひとこと。**知識より前。**
          「出会った日」と「ひとこと」は、どちらも花との距離の話なので、
          ここでひと続きにする。読み終わって最後に残るのが
          「相性：ヒマワリ／かすみ草」ではなく
          「首が少し傾くのは、この花の癖です」であってほしい。

          この順にすると、知識（旬・用途・相性）はスクロールの下へ回る。
          それでよい ── **知識は、読みたい人が取りに行くもの。**
          紙は画面の52%までのまま厚くしない。厚くすると、
          一輪ではなくカードへ視線が移る。
        */}
        <p className="detail__note">{flower.note}</p>

        <dl className="detail__rows">
          <div className="detail__row">
            <dt className="label">旬</dt>
            <dd className="body">
              {flower.seasonLabel}
              {inSeason && <span className="detail__badge">いま、いちばん元気です</span>}
            </dd>
          </div>
          <div className="detail__row">
            <dt className="label">おすすめの用途</dt>
            <dd className="body">{flower.occasions.join('　/　')}</dd>
          </div>
          <div className="detail__row">
            <dt className="label">ブーケとの相性</dt>
            <dd className="body">
              {flower.goesWith.map((id) => flowerById(id).name).join('　/　')}
              <span className="detail__hint">{flower.goesWithNote}</span>
            </dd>
          </div>
        </dl>

        <div className="detail__actions">
          <button
            type="button"
            className={canPick ? 'button button--quiet' : 'button'}
            onClick={onClose}
          >
            {canPick ? 'そっと戻す' : '閉じる'}
          </button>
          {canPick && (
            <button type="button" className="button" onClick={onPick}>
              この花を取る
              {picked > 0 && <span className="detail__picked">いま {picked} 本</span>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
