/**
 * 入口の一輪挿し。
 *
 * 市場で選んだ花が、その日ずっとここにあります。
 * お客さまが店に入って**最初に見る花** ── 今日の店の顔です。
 *
 * **効果はありません。** そのかわり、**ずっと見えています。**
 *
 * これは飾りではなく、この仕組みが成り立つための条件です。
 * ♡が成り立つのは、あとでアルバムと最後の問いに効いてくるからですが、
 * 入口の花は毎朝選び直すので、選んだ直後に見えなくなると、
 * 三日目には選ぶこと自体をやめます。
 * ご褒美ではなく、**置いたものが、そこにある**というだけのこと。
 *
 * だから、目立たせません。左下のすみに、小さく、いつも。
 * 押せません。数も出ません。名前も出しません。
 */

import './FrontVase.css';
import { flowerSmall as flowerImage } from '../assets/paths';
import { flowerById } from '../data/flowers';
import { useGame } from '../game/GameContext';

export function FrontVase() {
  const { state } = useGame();
  if (!state.frontFlowerId) return null;
  const flower = flowerById(state.frontFlowerId);

  return (
    <span className="front-vase" aria-hidden>
      <img src={flowerImage(flower.id)} alt="" />
    </span>
  );
}
