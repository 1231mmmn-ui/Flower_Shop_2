/** ゲームの状態に出てくる形。 */

import type { SeasonId } from '../data/seasons';

/** 画面の流れ。急かす要素は入れない。 */
export type Phase =
  | 'title'      // お店を開ける前
  | 'market'     // ⓪-a 市場。今日いちばん美しい花に出会う（→ src/data/market.ts）
  | 'opening'    // 開店前。鳥と風だけの時間（→ design/15-build-order.md 3章）
  | 'greeting'   // お客様が来店し、希望を聞く
  | 'shop'       // 花瓶から花を選ぶ
  | 'arrange'    // 束ねる・包む
  | 'deliver'    // お渡しして、言葉を受け取る
  | 'after'      // 余韻。帰ったあとの静かな店（→ design/00-emotion.md【余韻】）
  | 'ending'     // 季節がひと巡りした日。「好きな花は、できましたか？」
  | 'library';   // 店のアルバム

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
  /**
   * そのとき**実際に**返ってきた言葉。
   *
   * アルバムであとから引き直してはいけない。引き直すと、
   * 同じ人が二度来たときに一字一句おなじ台詞が並び、
   * 「あの日の言葉」ではなく「その人の設定」になってしまう。
   * （古い記録には無いので、読むときは省略可として扱う）
   */
  words?: string[];
}

/**
 * 初めての人にだけ出す一言の、種類。
 *
 * 押せると分からないものだけです。**遊び方の説明ではありません。**
 */
export type HintId =
  | 'sign'      // 「CLOSED」の札を裏返すと、一日が始まる／終わる
  | 'inspect';  // 花にふれると、その花だけの紙が開く

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
  /**
   * ♡お気に入り。押した順に並ぶ。
   *
   * 並べ替えも、フォルダも、上限も作らない。
   * **何個入れても、何も起きない。** ご褒美を付けた瞬間に
   * 「好き」が「集める」に変わるため（→ design/14-flowers.md 3-2章）。
   *
   * ここは、このゲームの最後の問い「好きな花は、できましたか？」に
   * プレイヤー自身が答える場所。こちらからは一度も「選んでください」と言わない。
   */
  favorites: string[];
  memories: DeliveredMemory[];
  /**
   * 今日、入口の一輪挿しに飾った花。
   *
   * お客さまが店に入って**最初に見る花**です。「今日の店の顔」。
   * 効果はひとつもありません。能力も、売上補正も、贔屓も。
   *
   * **記録しません。** 毎朝決めて、その日で終わります。
   * 一年ぶんためて「あなたが飾った20輪」と並べたくなりますが、
   * 並べた瞬間に集めるものになります。このゲームで唯一
   * **残らない選択**があるのは、むしろいいことだと思います。
   */
  frontFlowerId: string | null;
  /**
   * もう出さなくていい一言。
   *
   * 消すのはプレイヤーの判断です（「今後は表示しない」）。
   * こちらから「分かりましたか？」とは聞きません。試している感じになるので。
   * ここは**保存します** ── 毎回また出てきたら、ただの邪魔なので。
   */
  hintsDone: HintId[];
  /** 図鑑を開く直前にいた画面 */
  libraryReturn: Phase;
  /** 眺めている花（詳細を開いている） */
  inspectingFlowerId: string | null;
  /** 直前に届けたブーケの評価 */
  lastResultId: string | null;
  soundOn: boolean;
}
