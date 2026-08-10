/**
 * 実際に描いた大きさを測って、表示エリアに収める。
 *
 * ── ③「背の高い花が画面から切れる」への対応 ──────────────────
 *
 * 花の絵はどれも正方形のキャンバスだが、絵柄がキャンバスのどこまで
 * 届くかは花ごとに違う（ユーカリはキャンバス上端ぎりぎり、
 * ゲンチアナはずっと余白がある、など）。そこへ「高さを出してすっきり」
 * のような crown の高いスタイルが重なると、主役の伸び（reach）も
 * 大きくなる。花や角度ごとに決め打ちの倍率を足していくやり方では、
 * 組み合わせが増えるたびに調整箇所が増える。
 *
 * ここでは実際に描かれた花・紙の外接矩形（bounding box）を測り、
 * 結び目を軸にした表示エリア（上下左右に小さな余白を残した範囲）に
 * 収まらなければ、束全体を一度だけ縮める。5層構造や配置ロジック
 * そのものは変えない ── 描き終わったあとに、収まっているか確認して
 * 収まっていなければ縮めるだけの、後段のチェックとして足す。
 */

import { useLayoutEffect, useRef, useState, type RefObject } from 'react';

/** 表示エリアの縁から、花・紙をどれだけ離しておくか。 */
const MARGIN_FRACTION = 0.04;

/** これ以上は縮めない（極端な組み合わせでも、消えてしまわないように）。 */
const MIN_FIT = 0.5;

/** 測り直すほどでもない、ごく小さなずれ。 */
const NOISE_THRESHOLD = 0.01;

export function useAutoFitScale(containerRef: RefObject<HTMLDivElement>, signature: string): number {
  const [fit, setFit] = useState(1);
  const fitRef = useRef(1);
  fitRef.current = fit;

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;

    const measure = () => {
      const container = el.getBoundingClientRect();
      if (container.width === 0 || container.height === 0) return;

      // 花（茎）と紙、両方の外接矩形を見る。紙だけが大きくはみ出す
      // 組み合わせも、花だけがはみ出す組み合わせもありうるので。
      const parts = el.querySelectorAll<HTMLElement>('.bouquet__stem, .wrap-cone');
      let top = Infinity;
      let bottom = -Infinity;
      let left = Infinity;
      let right = -Infinity;
      parts.forEach((part) => {
        const r = part.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) return;
        top = Math.min(top, r.top);
        bottom = Math.max(bottom, r.bottom);
        left = Math.min(left, r.left);
        right = Math.max(right, r.right);
      });
      if (!Number.isFinite(top)) return;

      // 結び目（扇の軸）は、この束の中では動かない基準点。
      // `--knot-bottom` は画面ごとに CSS で決めているので、実際の値をここで読む。
      const knotBottomRaw = getComputedStyle(el).getPropertyValue('--knot-bottom');
      const knotBottomFraction = (parseFloat(knotBottomRaw) || 20) / 100;
      const anchorX = container.left + container.width / 2;
      const anchorY = container.top + container.height * (1 - knotBottomFraction);

      const marginV = container.height * MARGIN_FRACTION;
      const marginH = container.width * MARGIN_FRACTION;
      const budget = {
        top: anchorY - (container.top + marginV),
        bottom: container.bottom - marginV - anchorY,
        left: anchorX - (container.left + marginH),
        right: container.right - marginH - anchorX,
      };

      // いま適用中の縮小率で描かれた矩形から、等倍（fit=1）だったら
      // どれだけの距離になるかを逆算する。全部、結び目を軸に等倍で
      // 伸び縮みするので、単純な割り算でよい。
      const current = fitRef.current || 1;
      const need = {
        top: (anchorY - top) / current,
        bottom: (bottom - anchorY) / current,
        left: (anchorX - left) / current,
        right: (right - anchorX) / current,
      };

      const ratios = (['top', 'bottom', 'left', 'right'] as const)
        .filter((k) => need[k] > 0)
        .map((k) => budget[k] / need[k]);
      if (ratios.length === 0) return;

      const nextFit = Math.max(MIN_FIT, Math.min(1, ...ratios));
      if (Math.abs(nextFit - fitRef.current) > NOISE_THRESHOLD) {
        setFit(nextFit);
      }
    };

    // signature が変わった直後でも、DOM にはすでに新しい組み合わせの
    // 花が「前回の縮小率」で描かれている（state 更新はまだこのあと）。
    // 測った距離を `current`（前回の縮小率）で割り戻せば、そのまま
    // 等倍（fit=1）だったときの距離になる ── 縮小率をいったん戻して
    // 描き直させてから測り直す必要はない（一瞬はみ出して見える
    // ちらつきも起きない）。
    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  return fit;
}
