/**
 * デザイン定数。色・角丸・余白・文字サイズ・影・アニメーション時間は
 * すべてここにだけ書く（開発バイブル「実装ルール」）。
 *
 * CSS からは `--fs-<グループ>-<キー>` という名前の変数で参照する。
 * 例: color.ink → var(--fs-color-ink)
 */

/** 彩度の高い色は花だけ。UI はベージュ・アイボリー・木・セージで組む。 */
export const color = {
  /** 背景・紙 */
  cream: '#FBF6EC',
  ivory: '#F5EEE0',
  beige: '#EDE2CE',
  sand: '#E3D5BC',
  /** 木 */
  woodLight: '#C7A57C',
  wood: '#A6825E',
  woodDark: '#7C5F44',
  /** 緑 */
  sage: '#A9BCA5',
  sageDeep: '#7C9376',
  leaf: '#6F8C58',
  /**
   * 文字
   *
   * うすい色は、静けさのためであって**読みにくさのためではありません。**
   * 実測すると、いちばん薄い inkFaint が店内の壁の上で
   * コントラスト比 **2.75** しかなく（本文の目安は4.5）、
   * 「読みにくい」という指摘そのままの数字が出ていました。
   *
   *              紙     壁     木
   *   前  faint  3.28   2.75   1.00
   *   後  faint  5.36   4.50   1.64
   *
   * 色みは変えず、明度だけ落としています（暖かさは残す）。
   * 木のカウンターの上は、どの文字色でも足りません。
   * **木の上に置く文字には、必ず下地を敷くこと。**
   */
  ink: '#4A3F35',
  /*
   * inkSoft / inkFaint は、新しい背景イラスト（写真的な情報量）の上で
   * 薄く感じられたため、#6E60.. 台から #65.. 台まで一段沈めた。
   * ink はもともと基準に合っていたので変えていない。
   */
  inkSoft: '#655B52',
  inkFaint: '#6B6058',
  /** さし色（UI に使うのはここまで。花より目立たせない） */
  petal: '#E2A9B4',
  petalSoft: '#F3DCE0',
  honey: '#D9A85E',
  /** 面 */
  glass: 'rgba(253, 249, 241, 0.82)',
  glassSoft: 'rgba(253, 249, 241, 0.62)',
  glassDeep: 'rgba(250, 245, 236, 0.975)',
  veil: 'rgba(58, 46, 38, 0.46)',
  line: 'rgba(124, 95, 68, 0.18)',
  lineSoft: 'rgba(124, 95, 68, 0.10)',
} as const;

/** 角丸は統一する。 */
export const radius = {
  sm: '10px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  pill: '999px',
} as const;

/** 余白は広く取る。 */
export const space = {
  xs: '4px',
  sm: '8px',
  md: '14px',
  lg: '22px',
  xl: '34px',
  xxl: '52px',
} as const;

/** 文字は詰め込まない。 */
export const font = {
  familyBase:
    '"Hiragino Mincho ProN", "Yu Mincho", "YuMincho", "Noto Serif JP", serif',
  familyUi:
    '"Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic", "Noto Sans JP", sans-serif',
  xs: '11px',
  sm: '13px',
  md: '15px',
  lg: '18px',
  xl: '23px',
  xxl: '30px',
  display: '40px',
  lineTight: '1.5',
  lineBase: '1.9',
  letter: '0.06em',
} as const;

/** 影はやわらかく。光源は左上なので、影は右下に落ちる。 */
export const shadow = {
  soft: '0 6px 18px rgba(96, 74, 54, 0.10)',
  card: '0 10px 30px rgba(96, 74, 54, 0.14)',
  lifted: '0 18px 44px rgba(96, 74, 54, 0.22)',
  petal: '0 14px 34px rgba(96, 74, 54, 0.26)',
  inset: 'inset 0 1px 0 rgba(255, 253, 245, 0.7)',
} as const;

/** ゆっくり、やさしく。派手な演出はしない。 */
export const duration = {
  instant: '120ms',
  quick: '200ms',
  base: '340ms',
  slow: '620ms',
  bloom: '1100ms',
  breath: '7200ms',
} as const;

export const easing = {
  soft: 'cubic-bezier(0.33, 0.02, 0.24, 1)',
  gentle: 'cubic-bezier(0.4, 0.14, 0.3, 1)',
  rise: 'cubic-bezier(0.22, 0.68, 0.32, 1.0)',
} as const;

export const layout = {
  /** スマホゲームの画面比。これより広い時は左右に余白を置く。 */
  maxWidth: '520px',
  maxHeight: '980px',
} as const;

const groups = { color, radius, space, font, shadow, duration, easing, layout };

/** トークンを CSS カスタムプロパティの一覧に変換する。 */
export function cssVariables(): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const [groupName, group] of Object.entries(groups)) {
    for (const [key, value] of Object.entries(group)) {
      vars[`--fs-${groupName}-${kebab(key)}`] = String(value);
    }
  }
  return vars;
}

/** :root に流し込む。アプリ起動時に一度だけ呼ぶ。 */
export function applyTokens(target: HTMLElement = document.documentElement): void {
  for (const [name, value] of Object.entries(cssVariables())) {
    target.style.setProperty(name, value);
  }
}

function kebab(value: string): string {
  return value.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}
