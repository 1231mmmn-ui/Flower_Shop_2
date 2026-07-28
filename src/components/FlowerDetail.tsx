/**
 * 花をタップしたとき。
 * 画面が少し暗くなり、選んだ花だけが前へ出て、光が当たる。
 * 情報を読む画面ではなく、花を眺める時間を楽しむ画面。
 */

import './FlowerDetail.css';
import { flowerStem } from '../assets/paths';
import { flowerById, formatPrice, type Flower } from '../data/flowers';

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
  return (
    <div className="detail fade" role="dialog" aria-label={flower.name}>
      <button
        type="button"
        className="detail__backdrop"
        onClick={onClose}
        aria-label="花瓶に戻す"
      />

      <div className="detail__stage">
        <span className="detail__light" aria-hidden />
        <img
          className="detail__flower"
          src={flowerStem(flower.id)}
          alt={flower.name}
          draggable={false}
        />
      </div>

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
