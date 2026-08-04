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
 * **押せません。効果もありません。**
 * ボタンのとなりに置きますが、ボタンではありません。
 * ここに効果を付けた瞬間、明日から「得な花」を選びはじめます。
 * 一日ついてくるだけ ── それだけのものです。
 */

import './TodayFlower.css';
import { flowerSmall as flowerImage } from '../assets/paths';
import { flowerById } from '../data/flowers';
import { useGame } from '../game/GameContext';

export function TodayFlower() {
  const { state } = useGame();
  if (!state.frontFlowerId) return null;
  const flower = flowerById(state.frontFlowerId);

  return (
    <span className="today-flower" aria-label={`今日のお店のお花：${flower.name}`}>
      <img src={flowerImage(flower.id)} alt="" aria-hidden draggable={false} />
      <span className="today-flower__label">今日のお店のお花</span>
    </span>
  );
}
