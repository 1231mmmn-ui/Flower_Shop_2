/**
 * 開店前。
 *
 * ここはゲームではありません。一日の始まりを感じる時間です。
 * （→ design/15-build-order.md 3章、design/02-wireframes.md ⓪-b）
 *
 *   ある     鳥・風・窓からの光・花の揺れ
 *   ない     注文・メモ・予算・おすすめ・進捗・BGM・目的・日付
 *
 * 押せるものは「CLOSED」の札ひとつだけ。裏返すのはプレイヤーではなく、店員です。
 *
 *   ×  「ゲームを始める」
 *   ○  「今日も、花屋を開けよう」
 *
 * 滞在0秒でも成立します。それでも置くのは、素通りしない人のためです。
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import './OpeningScreen.css';
import { FlowerDetail } from '../components/FlowerDetail';
import { FlowerStand } from '../components/FlowerStand';
import { ambience } from '../audio/ambience';
import { flowerById } from '../data/flowers';
import { shelfFor } from '../data/shelf';
import { useGame } from '../game/GameContext';
import { useBreeze } from '../game/useBreeze';

/** 札が裏返りきるまで。急いで押せるが、急いでは進まない。 */
const SIGN_FLIP_MS = 900;

export function OpeningScreen() {
  const { state, dispatch, season } = useGame();
  const shelfRef = useRef<HTMLDivElement>(null);
  // ④花選択とまったく同じ棚。並びも同じ。
  const shelf = useMemo(() => shelfFor(season.id, state.day), [season.id, state.day]);
  const [center, setCenter] = useState(0);
  const [flipping, setFlipping] = useState(false);
  const breeze = useBreeze();

  /** いま画面の中央にある花を見つける。④花選択とまったく同じ見え方にする。 */
  const findCenter = useCallback(() => {
    const shelf = shelfRef.current;
    if (!shelf) return;
    const middle = shelf.scrollLeft + shelf.clientWidth / 2;
    let nearest = 0;
    let best = Infinity;
    shelf.querySelectorAll<HTMLElement>('.stand').forEach((stand, index) => {
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
    const shelf = shelfRef.current;
    if (!shelf) return;
    shelf.addEventListener('scroll', findCenter, { passive: true });
    return () => shelf.removeEventListener('scroll', findCenter);
  }, [findCenter]);

  // この時間だけは、鳥と風だけ。ピアノは札を裏返してから入る。
  useEffect(() => {
    if (state.soundOn) ambience.setMode('morning');
  }, [state.soundOn]);

  const inspecting = state.inspectingFlowerId
    ? flowerById(state.inspectingFlowerId)
    : null;
  const front = shelf[Math.min(center, shelf.length - 1)];

  /** 札を裏返す。ゆっくり返って、揺れて止まり、そこでベルが鳴る。 */
  const flipSign = () => {
    if (flipping) return;
    setFlipping(true);
    window.setTimeout(() => {
      ambience.ringBell();
      ambience.setMode('shop'); // 店の音は、ここで初めて入ってくる
      dispatch({ type: 'open-shop' });
    }, SIGN_FLIP_MS);
  };

  return (
    <div
      className={[
        'morning',
        inspecting ? 'is-inspecting' : '',
        breeze ? 'is-breezy' : '',
        flipping ? 'is-opening' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* 上の帯は、いつもより静か。日付も季節も出さない。 */}
      <div className="morning__bar">
        <button
          type="button"
          className="morning__link"
          onClick={() => dispatch({ type: 'open-library' })}
        >
          アルバム
        </button>
        <button
          type="button"
          className="morning__link"
          onClick={() => dispatch({ type: 'toggle-sound' })}
          aria-pressed={state.soundOn}
        >
          {state.soundOn ? '♪' : '♪ 切'}
        </button>
      </div>

      {/* ④花選択と同じ棚、同じ見え方。別の画面に見せない。 */}
      <div className="morning__shelf" ref={shelfRef}>
        {shelf.map((flower, index) => (
          <FlowerStand
            key={flower.id}
            flower={flower}
            focused={index === center}
            distance={Math.abs(index - center)}
            picked={0}
            onSelect={() => dispatch({ type: 'inspect', flowerId: flower.id })}
          />
        ))}
      </div>

      {/* 正面の花の名前だけ。値段も、望みも、ここには出さない。 */}
      <p className="morning__name">{front.name}</p>

      {/* 札。ボタンに見せない。 */}
      <button
        type="button"
        className="morning__sign"
        onClick={flipSign}
        aria-label="お店を開ける"
      >
        <span className="morning__sign-cord" aria-hidden />
        <span className="morning__sign-plate">
          <span className="morning__sign-face morning__sign-face--closed">CLOSED</span>
          <span className="morning__sign-face morning__sign-face--open">OPEN</span>
        </span>
      </button>

      {/* 花にふれれば詳細は開ける。でも、まだ取れない ── 開店前だから。 */}
      {inspecting && (
        <FlowerDetail
          flower={inspecting}
          inSeason={inspecting.seasons.includes(season.id)}
          canPick={false}
          onClose={() => dispatch({ type: 'inspect', flowerId: null })}
        />
      )}
    </div>
  );
}
