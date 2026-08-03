/**
 * ゲームの状態をひとまとめに持つ。
 * 画面はここから読むだけ。状態の変え方は reducer にだけ書く。
 */

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from 'react';

import { CUSTOMERS, customerById, type Customer } from '../data/customers';
import { flowerById } from '../data/flowers';
import { SEASONS, seasonForDay, type Season } from '../data/seasons';
import { customersForDay } from '../data/visits';
import { RIBBONS, WRAPPINGS } from '../data/wrapping';
import { makeStem } from './bunch';
import { evaluate, bouquetPrice, type Evaluation } from './evaluation';
import type { Bouquet, BouquetStyleId, GameState, HintId } from './types';

const STORAGE_KEY = 'flower-shop-hanasaku:v1';

const emptyBouquet = (): Bouquet => ({
  stems: [],
  wrappingId: WRAPPINGS[0].id,
  ribbonId: RIBBONS[0].id,
  styleId: 'round',
});

const initialState: GameState = {
  phase: 'title',
  day: 1,
  earnings: 0,
  customerId: CUSTOMERS[0].id,
  todayCustomerIds: [],
  visitIndex: 0,
  picked: [],
  bouquet: emptyBouquet(),
  library: {},
  favorites: [],
  memories: [],
  frontFlowerId: null,
  hintsDone: [],
  libraryReturn: 'title',
  inspectingFlowerId: null,
  lastResultId: null,
  soundOn: false,
};

export type Action =
  | { type: 'enter-morning' }
  | { type: 'set-front'; flowerId: string }
  | { type: 'open-shop' }
  | { type: 'accept-request' }
  | { type: 'inspect'; flowerId: string | null }
  | { type: 'pick'; flowerId: string }
  | { type: 'unpick'; uid: string }
  | { type: 'go-arrange' }
  | { type: 'back-to-shop' }
  | { type: 'set-style'; id: BouquetStyleId }
  | { type: 'remove-stem'; uid: string }
  | { type: 'set-wrapping'; id: string }
  | { type: 'set-ribbon'; id: string }
  | { type: 'deliver' }
  | { type: 'see-off' }
  | { type: 'next-day' }
  | { type: 'open-library' }
  | { type: 'close-library' }
  | { type: 'toggle-favorite'; flowerId: string }
  | { type: 'hint-done'; id: HintId }
  | { type: 'toggle-sound' }
  | { type: 'restore'; saved: Partial<GameState> };

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    // 扉を押すと、まず市場へ。ここもまだゲームではない。
    case 'enter-morning':
      return { ...state, phase: 'market' };

    // 入口に飾る花を決めた。決めたら、店へ戻って開店前になる。
    // 何も起きない ── 音も鳴らず、数も増えず、何ももらえない。
    case 'set-front':
      return { ...state, frontFlowerId: action.flowerId, phase: 'opening' };

    /**
     * 「お店を開く」。ここから一日が始まる。
     *
     * 今日いらっしゃる方たちを、**この一箇所で**決める。
     * 3〜5組（→ src/data/visits.ts）。同じ日なら必ず同じ顔ぶれ。
     */
    case 'open-shop': {
      const ids = customersForDay(
        state.day,
        seasonForDay(state.day).id,
        yesterdayGuests(state),
      );
      return {
        ...state,
        phase: 'greeting',
        todayCustomerIds: ids,
        visitIndex: 0,
        customerId: ids[0],
        ...freshHands(),
      };
    }

    case 'accept-request':
      return { ...state, phase: 'shop' };

    case 'inspect':
      return { ...state, inspectingFlowerId: action.flowerId };

    case 'pick': {
      const stem = makeStem(action.flowerId);
      return {
        ...state,
        picked: [...state.picked, stem],
        library: rememberFlower(state, action.flowerId),
        inspectingFlowerId: null,
      };
    }

    case 'unpick':
      return { ...state, picked: state.picked.filter((stem) => stem.uid !== action.uid) };

    case 'go-arrange':
      return { ...state, phase: 'arrange', bouquet: { ...state.bouquet, stems: state.picked } };

    case 'back-to-shop':
      return { ...state, phase: 'shop' };

    /**
     * 束ね方を変える。三つとも成立した束で、優劣はない。
     *
     * **組み直しではなく、選び直しです。** 同じ花が、違う形になるだけ。
     * 花を失わないので「戻す」も「ひとつ前へ」も要りません。
     */
    case 'set-style':
      return { ...state, bouquet: { ...state.bouquet, styleId: action.id } };

    case 'remove-stem': {
      const picked = state.picked.filter((stem) => stem.uid !== action.uid);
      return { ...state, picked, bouquet: { ...state.bouquet, stems: picked } };
    }

    case 'set-wrapping':
      return { ...state, bouquet: { ...state.bouquet, wrappingId: action.id } };

    case 'set-ribbon':
      return { ...state, bouquet: { ...state.bouquet, ribbonId: action.id } };

    case 'deliver': {
      const customer = customerById(state.customerId);
      const result = evaluate(state.bouquet, customer);
      const season = seasonForDay(state.day);
      return {
        ...state,
        phase: 'deliver',
        earnings: state.earnings + bouquetPrice(state.bouquet),
        library: recordDelivery(state),
        memories: [
          ...state.memories,
          {
            day: state.day,
            customerId: state.customerId,
            bouquet: state.bouquet,
            smile: result.smile,
            season: season.id,
            // そのとき返ってきた言葉を、そのまま残す。
            words: result.words,
          },
        ].slice(-30),
        lastResultId: `${state.day}-${state.customerId}`,
      };
    }

    /**
     * お見送りする。
     *
     * **ここが一日の分かれ道です。**
     * まだいらっしゃる方がいれば、次の方へ。
     * 最後の方だったときだけ、静かになった店（余韻）へ。
     *
     * 日はまだ変えません。閉めるのはプレイヤーです。
     */
    case 'see-off': {
      const next = state.visitIndex + 1;
      if (next >= state.todayCustomerIds.length) {
        return { ...state, phase: 'after', ...freshHands(state.bouquet) };
      }
      return {
        ...state,
        phase: 'greeting',
        visitIndex: next,
        customerId: state.todayCustomerIds[next],
        ...freshHands(state.bouquet),
      };
    }

    case 'next-day': {
      const day = state.day + 1;
      return {
        ...state,
        day,
        // 季節がひと巡りした日は、店を開ける前に一度だけ問いが出る。
        // それ以外の朝は、いつもどおり市場から始まる。
        phase: isTurnOfTheYear(state.day) ? 'ending' : 'market',
        // 入口の花は、日をまたがない。毎朝また決める。
        frontFlowerId: null,
        todayCustomerIds: [],
        visitIndex: 0,
        ...freshHands(),
      };
    }

    case 'open-library':
      return { ...state, phase: 'library', libraryReturn: state.phase };

    case 'close-library':
      return { ...state, phase: state.libraryReturn };

    // ♡。押すだけ。音も鳴らさず、数も増えず、何ももらえない。
    case 'toggle-favorite':
      return {
        ...state,
        favorites: state.favorites.includes(action.flowerId)
          ? state.favorites.filter((id) => id !== action.flowerId)
          : [...state.favorites, action.flowerId],
      };

    // 「今後は表示しない」。消すのはプレイヤーの判断。
    case 'hint-done':
      return state.hintsDone.includes(action.id)
        ? state
        : { ...state, hintsDone: [...state.hintsDone, action.id] };

    case 'toggle-sound':
      return { ...state, soundOn: !state.soundOn };

    case 'restore':
      return { ...state, ...action.saved, phase: state.phase };

    default:
      return state;
  }
}

/**
 * 手ぶらに戻す。次の方を迎えるための、いちばん短い所作。
 *
 * 束ね方（styleId）と資材は**持ち越します。** 一日のうちに
 * 何度も同じ好みを選び直させるのは、丁寧ではなく手間なので。
 */
function freshHands(
  keep?: Bouquet,
): Pick<GameState, 'picked' | 'bouquet' | 'inspectingFlowerId'> {
  const empty = emptyBouquet();
  return {
    picked: [],
    bouquet: keep
      ? { ...empty, styleId: keep.styleId, wrappingId: keep.wrappingId, ribbonId: keep.ribbonId }
      : empty,
    inspectingFlowerId: null,
  };
}

function rememberFlower(state: GameState, flowerId: string): GameState['library'] {
  const existing = state.library[flowerId];
  return {
    ...state.library,
    [flowerId]: existing ?? { flowerId, delivered: 0, metOnDay: state.day },
  };
}

function recordDelivery(state: GameState): GameState['library'] {
  const library = { ...state.library };
  for (const stem of state.bouquet.stems) {
    const entry = library[stem.flowerId] ?? {
      flowerId: stem.flowerId,
      delivered: 0,
      metOnDay: state.day,
    };
    library[stem.flowerId] = { ...entry, delivered: entry.delivered + 1 };
  }
  return library;
}

/**
 * 季節がひと巡りした日か。
 *
 * 1季節は5日（→ `seasonForDay`）なので、20日で春夏秋冬が一周します。
 * その日を終えたところで、一度だけ「好きな花は、できましたか？」を出します。
 *
 * **そこで終わりにはしません。** きれいに終わると、そこで満足してしまいます
 * （→ design/00-emotion.md【余韻】「終わりきらないこと」）。
 * 問いのあとは、また春の朝が来ます。
 */
function isTurnOfTheYear(day: number): boolean {
  return day % (SEASONS.length * 5) === 0;
}

/**
 * 昨日いらした方たち。
 *
 * 続けて同じ人が来ると、せっかくの再会が「また来た」になるので、
 * 今日の並びでは後ろへ回します（→ src/data/visits.ts）。
 */
function yesterdayGuests(state: GameState): string[] {
  return state.memories
    .filter((memory) => memory.day === state.day - 1)
    .map((memory) => memory.customerId);
}

// --------------------------------------------------------------------------

interface GameValue {
  state: GameState;
  dispatch: Dispatch<Action>;
  customer: Customer;
  season: Season;
  result: Evaluation | null;
  pickedTotal: number;
  /**
   * 今日の何組目か。
   *
   * **画面には「3人中2人目」とは出しません。** 出した瞬間、
   * 残り人数を数える一日になります。使うのは
   * 「この方が最後だったか」を知るためだけです。
   */
  visit: { index: number; total: number; last: boolean };
  /** 今日、花をお渡しした方たち（余韻の画面で使う）。 */
  todayGuests: Customer[];
}

const GameContext = createContext<GameValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // 保存されたお店の記録を読み込む
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as Partial<GameState>;
      dispatch({ type: 'restore', saved });
    } catch {
      /* 記録が読めなくても、お店はいつも通り開く */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          day: state.day,
          earnings: state.earnings,
          library: state.library,
          favorites: state.favorites,
          memories: state.memories,
          hintsDone: state.hintsDone,
          // frontFlowerId は保存しない。**その日で終わるもの**なので。
          soundOn: state.soundOn,
        }),
      );
    } catch {
      /* 保存できなくても遊べる */
    }
  }, [
    state.day,
    state.earnings,
    state.library,
    state.favorites,
    state.memories,
    state.hintsDone,
    state.soundOn,
  ]);

  const value = useMemo<GameValue>(() => {
    const customer = customerById(state.customerId);
    return {
      state,
      dispatch,
      customer,
      season: seasonForDay(state.day),
      result: state.phase === 'deliver' ? evaluate(state.bouquet, customer) : null,
      // 画面に出す「使用中」の金額。包み紙とリボンは束ねるときに加わる。
      pickedTotal: state.picked.reduce(
        (sum, stem) => sum + flowerById(stem.flowerId).price,
        0,
      ),
      visit: {
        index: state.visitIndex,
        total: state.todayCustomerIds.length,
        last: state.visitIndex >= state.todayCustomerIds.length - 1,
      },
      todayGuests: state.memories
        .filter((memory) => memory.day === state.day)
        .map((memory) => customerById(memory.customerId)),
    };
  }, [state]);

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameValue {
  const value = useContext(GameContext);
  if (!value) throw new Error('GameProvider の中で使ってください');
  return value;
}
