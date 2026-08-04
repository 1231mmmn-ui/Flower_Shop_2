/**
 * 今日のお店のお花。
 *
 * 市場で選んだ一輪が、その日ずっと、店のどの画面にもついてきます。
 *
 * ── 入口の一輪挿しから、ここへ移しました ────────────────────
 *
 * 前は画面の左下すみに、小さな一輪挿しの絵を置いていました。
 * 実機で見ると「唐突で、何の表示なのか分からない」── そのとおりでした。
 * 店の絵の中に小さく描かれた花は、**背景の一部**にしか見えません。
 * 市場で自分が選んだものだと気づく手がかりが、どこにもありませんでした。
 *
 * いまは、その日いちばん押す緑のボタンのとなりに、
 * 花と、「今日のお店のお花」という一行を並べます。
 * 名前を書いてあれば、それが自分の選んだものだと分かります。
 *
 * ── 小さすぎて、飾りに見えていた ──────────────────────────
 *
 * 34×30px は、指で押せる大きさでも、見て分かる大きさでもありませんでした。
 * ここは「自分が選んだ花」という、今日いちばん個人的な情報のはずなのに、
 * 効果のない飾りと同じ大きさでは、誰も気に留めません。
 *
 * 2.2倍にして、押せるようにしました。押すと、店頭の一輪と同じ紙
 * （→ FlowerDetail、値段もタップも出さない形）で、名前・花言葉・
 * その花のひとことが読めます。効果は、前と同じくありません。
 * 開くのは知ることだけで、選び直しにも値段にもつながりません。
 */

import { useState } from 'react';

import './TodayFlower.css';
import { flowerSmall as flowerImage } from '../assets/paths';
import { flowerById } from '../data/flowers';
import { FlowerDetail } from './FlowerDetail';
import { useGame } from '../game/GameContext';

export function TodayFlower() {
  const { state, season } = useGame();
  const [open, setOpen] = useState(false);
  if (!state.frontFlowerId) return null;
  const flower = flowerById(state.frontFlowerId);

  return (
    <>
      <button
        type="button"
        className="today-flower"
        onClick={() => setOpen(true)}
        aria-label={`今日のお店のお花：${flower.name}を見る`}
      >
        <img src={flowerImage(flower.id)} alt="" aria-hidden draggable={false} />
        <span className="today-flower__label">今日のお店のお花</span>
      </button>

      {open && (
        <FlowerDetail
          flower={flower}
          inSeason={flower.seasons.includes(season.id)}
          canPick={false}
          showPrice={false}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
