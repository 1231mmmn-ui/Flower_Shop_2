/** ゲームの状態に出てくる形。 */

import type { SeasonId } from '../data/seasons';

/** 画面の流れ。急かす要素は入れない。 */
export type Phase =
  | 'title'      // お店を開ける前
  | 'opening'    // 開店前。鳥と風だけの時間（→ design/15-build-order.md 3章）
  | 'greeting'   // お客様が来店し、希望を聞く
  | 'shop'       // 花瓶から花を選ぶ
  | 'arrange'    // 束ねる・包む
  | 'deliver'    // お渡しして、言葉を受け取る
  | 'library';   // 図鑑

/** ブーケに挿さっている1本。 */
export interface BouquetStem {
  /** 同じ花を何本挿しても区別できるように */
  uid: string;
  flowerId: string;
  /** 扇の角度（度）。0 が真上、右が正。 */
  angle: number;
  /** 束の中心からの伸び具合（0.0〜1.0） */
  reach: number;
  /** 手前ほど大きい（0.0=奥, 1.0=手前） */
  depth: number;
  /** 一本ずつ表情を変えるための、ごく小さなゆらぎ */
  sway: number;
  scale: number;
}

export interface Bouquet {
  stems: BouquetStem[];
  wrappingId: string;
  ribbonId: string;
}

/** 図鑑に集まった記録。 */
export interface LibraryEntry {
  flowerId: string;
  /** 何本お客様に届けたか */
  delivered: number;
  /** はじめて手に取った日 */
  metOnDay: number;
}

export interface DeliveredMemory {
  day: number;
  customerId: string;
  /** 届けたときのブーケ（あとから眺められる） */
  bouquet: Bouquet;
  smile: number;
  season: SeasonId;
}

export interface GameState {
  phase: Phase;
  day: number;
  /** これまでのお店の記録。競うためのものではない。 */
  earnings: number;
  customerId: string;
  /** 花瓶から取って、作業台に置いた花 */
  picked: BouquetStem[];
  bouquet: Bouquet;
  /** 束ねる前の、取り消し用の履歴 */
  history: Bouquet[];
  library: Record<string, LibraryEntry>;
  memories: DeliveredMemory[];
  /** 図鑑を開く直前にいた画面 */
  libraryReturn: Phase;
  /** 眺めている花（詳細を開いている） */
  inspectingFlowerId: string | null;
  /** 直前に届けたブーケの評価 */
  lastResultId: string | null;
  soundOn: boolean;
}
