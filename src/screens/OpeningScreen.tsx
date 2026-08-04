/**
 * 開店前。
 *
 * ここはゲームではありません。一日の始まりを感じる時間です。
 * （→ design/15-build-order.md 3章、design/02-wireframes.md ⓪-b）
 *
 *   ある     市場で選んだ今日の一輪・鳥・風・窓からの光
 *   ない     注文・メモ・予算・おすすめ・進捗・BGM・目的・日付
 *
 * ── 売り物を、片づけました ────────────────────────────
 *
 * 前は④花選びとまったく同じ棚を並べていました。実際に触ってみると、
 * **市場でアジサイを選んだのに、中央にはチューリップが立っていました。**
 * 選んだ花は左すみの一輪挿しにいて、画面の主役は売り物の棚。
 * 何を選んだのか分からない、という指摘のとおりです。
 *
 * いまは、市場で選んだ一輪だけが、まんなかにあります。
 * 売り物はまだ出しません ── 店を開けてからの話なので。
 *
 * ── 札を、やめました ──────────────────────────────────
 *
 * 「CLOSED」の札を裏返す仕組みは、押してみるまで何が起きるか
 * 分からない操作でした。だから「札を裏返すと、お店が開きます」という
 * 案内が要りました。**説明が要る操作は、たいてい操作のほうが
 * 間違っています。** いまはただの「お店を開く」ボタンです。
 * 案内も一緒に消しました。
 */

import { useEffect, useState } from 'react';

import './OpeningScreen.css';
import { FlowerDetail } from '../components/FlowerDetail';
import { ambience } from '../audio/ambience';
import { flowerSmall as flowerImage, vase } from '../assets/paths';
import { flowerById } from '../data/flowers';
import { useGame } from '../game/GameContext';
import { useBreeze } from '../game/useBreeze';

/** 店を開けるまでの、ひと呼吸。ベルが鳴ってから画面が変わる。 */
const OPEN_MS = 700;

export function OpeningScreen() {
  const { state, dispatch, season } = useGame();
  const [opening, setOpening] = useState(false);
  const breeze = useBreeze();

  // この時間だけは、鳥と風だけ。ピアノは店を開けてから入る。
  useEffect(() => {
    if (state.soundOn) ambience.setMode('morning');
  }, [state.soundOn]);

  const front = state.frontFlowerId ? flowerById(state.frontFlowerId) : null;
  const inspecting = state.inspectingFlowerId
    ? flowerById(state.inspectingFlowerId)
    : null;

  const open = () => {
    if (opening) return;
    setOpening(true);
    window.setTimeout(() => {
      ambience.ringBell();
      ambience.setMode('shop'); // 店の音は、ここで初めて入ってくる
      dispatch({ type: 'open-shop' });
    }, OPEN_MS);
  };

  return (
    <div
      className={[
        'morning',
        inspecting ? 'is-inspecting' : '',
        breeze ? 'is-breezy' : '',
        opening ? 'is-opening' : '',
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

      {/*
        今日の一輪。市場で選んだ花が、まんなかの一輪挿しに。
        ふれると、その花のことが読めます（値段は出しません ──
        これは商品ではなく、今日の店の顔なので）。
      */}
      {front && (
        <button
          type="button"
          className="morning__front"
          onClick={() => dispatch({ type: 'inspect', flowerId: front.id })}
          aria-label={`${front.name}を見る`}
        >
          <span className="morning__front-flower">
            <img src={flowerImage(front.id)} alt="" aria-hidden draggable={false} />
          </span>
          <img className="morning__front-vase" src={vase()} alt="" aria-hidden draggable={false} />
          <span className="morning__front-glow" style={{ background: front.swatch }} aria-hidden />
        </button>
      )}

      {/* 名前だけ。値段も、望みも、ここには出さない。 */}
      {front && (
        <p className="morning__name">
          {front.name}
          <span className="morning__today">今日のお店のお花</span>
        </p>
      )}

      <div className="morning__foot">
        <button type="button" className="button" onClick={open} disabled={opening}>
          お店を開く
        </button>
      </div>

      {/*
        店頭の花の紙。値段は出さず、取ることもできません。
        名前・花言葉・旬・その花のこと ── それだけ。
      */}
      {inspecting && (
        <FlowerDetail
          flower={inspecting}
          inSeason={inspecting.seasons.includes(season.id)}
          canPick={false}
          showPrice={false}
          onClose={() => dispatch({ type: 'inspect', flowerId: null })}
        />
      )}
    </div>
  );
}
