/**
 * 一輪の絵（`assets/flowers/<id>.png` / `flowers/small/<id>.png`）の中で、
 * 実際に花・葉・茎が描かれている範囲（キャンバスに対する割合）。
 *
 * ── なぜこれが要るか ────────────────────────────────────────
 *
 * キャンバスはどれも正方形（1024×1024）だが、絵柄がその正方形の
 * どこまで届いているかは花によってまるで違う。ユーカリはキャンバス
 * 上端ぎりぎりまで枝が伸びているが、ゲンチアナはずっと余白がある。
 * これを何も考えずに同じ大きさの正方形として並べると、
 *
 *   ・余白の少ない花（ユーカリ・ムスカリ等）は画面から切れやすい
 *   ・余白の多い花（ゲンチアナ・フリージア等）はやけに小さく見える
 *
 * という二つの問題が同時に起きる。ここに実測した bounding box を
 * 置き、`SingleFlower` コンポーネントがこれを使って「花の絵柄その
 * ものが表示エリアの中で毎回同じくらいの大きさに見える」よう、
 * 花ごとに拡大率を自動で変える（→ SingleFlower.tsx）。
 *
 * 測り方: 各PNGのアルファチャンネルの bounding box（透明でない範囲）
 * を Pillow で実測。`bottom` はどの花も茎がキャンバス下端で
 * 切れているため、ほぼ 1.0 で揃っている。
 *
 * ── `presence`（見た目の存在感の微調整）─────────────────────
 *
 * bounding box をそのまま高さ基準で正規化すると、**縦の届き方は
 * そろっても、横に細い花（ムスカリ・ユーカリ等）と横に大きい花
 * （アジサイ等）とで、画面上の占有面積の見え方が最後までそろわない**
 * ── 縦が同じ長さでも、横に細長い花は「線」に、横に広い花は「塊」に
 * 見えるため。実測した横幅（left〜right）をもとに、狭い花はわずかに
 * 大きく、広い花はわずかに小さくなる係数を計算し、初期値としてここに
 * 置いた。あくまで**微調整**の初期値で、実機で見て個別に直してよい
 * （既定は 1.0）。
 */

export interface FlowerBounds {
  /** キャンバス上端から、絵柄がはじまるまでの割合（0〜1）。 */
  top: number;
  /** キャンバス上端から、絵柄が終わるまでの割合（0〜1）。ほぼ茎の切り口＝1.0 に近い。 */
  bottom: number;
  left: number;
  right: number;
  /** 見た目の存在感の微調整（既定 1.0）。1 より大きいとその花だけ少し大きく見せる。 */
  presence?: number;
}

export const FLOWER_BOUNDS: Record<string, FlowerBounds> = {
  alstroemeria: { top: 0.1562, bottom: 1.0, left: 0.2539, right: 0.7422, presence: 0.97 },
  anemone: { top: 0.0615, bottom: 0.9678, left: 0.2031, right: 0.7969, presence: 0.91 },
  carnation: { top: 0.1436, bottom: 1.0, left: 0.252, right: 0.7891, presence: 0.94 },
  celosia: { top: 0.1963, bottom: 1.0, left: 0.3721, right: 0.6533, presence: 1.18 },
  cosmos: { top: 0.1309, bottom: 1.0, left: 0.2275, right: 0.6777, presence: 1.0 },
  dahlia: { top: 0.1094, bottom: 1.0, left: 0.3174, right: 0.7451, presence: 1.02 },
  delphinium: { top: 0.1562, bottom: 1.0, left: 0.3223, right: 0.5811, presence: 1.21 },
  eucalyptus: { top: 0.0459, bottom: 0.9834, left: 0.2822, right: 0.7178, presence: 1.01 },
  freesia: { top: 0.1992, bottom: 1.0, left: 0.3164, right: 0.6475, presence: 1.11 },
  gentian: { top: 0.208, bottom: 1.0, left: 0.3506, right: 0.6338, presence: 1.18 },
  gerbera: { top: 0.0713, bottom: 1.0, left: 0.2529, right: 0.7363, presence: 0.98 },
  gypsophila: { top: 0.1406, bottom: 1.0, left: 0.2051, right: 0.7852, presence: 0.92 },
  hydrangea: { top: 0.0625, bottom: 0.9658, left: 0.1602, right: 0.8398, presence: 0.9 },
  lily: { top: 0.0977, bottom: 1.0, left: 0.1836, right: 0.7363, presence: 0.93 },
  lisianthus: { top: 0.1094, bottom: 1.0, left: 0.2617, right: 0.7656, presence: 0.96 },
  marguerite: { top: 0.125, bottom: 1.0, left: 0.2432, right: 0.7686, presence: 0.95 },
  muscari: { top: 0.0449, bottom: 0.9844, left: 0.3418, right: 0.6582, presence: 1.13 },
  narcissus: { top: 0.1426, bottom: 1.0, left: 0.2734, right: 0.6631, presence: 1.05 },
  poinsettia: { top: 0.0996, bottom: 1.0, left: 0.292, right: 0.7246, presence: 1.01 },
  pompon: { top: 0.1797, bottom: 1.0, left: 0.3428, right: 0.6514, presence: 1.14 },
  ranunculus: { top: 0.0625, bottom: 0.9658, left: 0.2402, right: 0.7588, presence: 0.95 },
  rose: { top: 0.0449, bottom: 0.9834, left: 0.2373, right: 0.7637, presence: 0.95 },
  ruscus: { top: 0.1709, bottom: 1.0, left: 0.3848, right: 0.6143, presence: 1.25 },
  solidago: { top: 0.124, bottom: 1.0, left: 0.2402, right: 0.7764, presence: 0.94 },
  statice: { top: 0.0625, bottom: 0.9678, left: 0.1699, right: 0.8301, presence: 0.9 },
  sunflower: { top: 0.0244, bottom: 1.0, left: 0.2051, right: 0.7822, presence: 0.92 },
  sweetpea: { top: 0.1572, bottom: 1.0, left: 0.2861, right: 0.7109, presence: 1.02 },
  tulip: { top: 0.0566, bottom: 0.9668, left: 0.2559, right: 0.7441, presence: 0.97 },
  zinnia: { top: 0.1553, bottom: 1.0, left: 0.333, right: 0.666, presence: 1.11 },
};

/** 実測が無い花（今後追加された花など）の、控えめな既定値。 */
export const DEFAULT_FLOWER_BOUNDS: FlowerBounds = { top: 0.12, bottom: 1.0, left: 0.25, right: 0.75 };

export function flowerBoundsOf(id: string): FlowerBounds {
  return FLOWER_BOUNDS[id] ?? DEFAULT_FLOWER_BOUNDS;
}
