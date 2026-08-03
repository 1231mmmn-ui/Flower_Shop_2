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
import { RIBBONS, WRAPPINGS } from '../data/wrapping';
import { arrange, bringForward, makeStem } from './arrange';
import { evaluate, bouquetPrice, type Evaluation } from './evaluation';
import type { Bouquet, GameState } from './types';

const STORAGE_KEY = 'flower-shop-hanasaku:v1';

const emptyBouquet = (): Bouquet => ({
  stems: [],
  wrappingId: WRAPPINGS[0].id,
  ribbonId: RIBBONS[0].id,
});

const initialState: GameState = {
  phase: 'title',
  day: 1,
  earnings: 0,
  customerId: CUSTOMERS[0].id,
  picked: [],
  bouquet: emptyBouquet(),
  history: [],
  library: {},
  favorites: [],
  memories: [],
  frontFlowerId: null,
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
  | { type: 'move-stem'; uid: string; angle: number; reach: number }
  | { type: 'bring-forward'; uid: string }
  | { type: 'remove-stem'; uid: string }
  | { type: 'rearrange' }
  | { type: 'undo' }
  | { type: 'reset-bouquet' }
  | { type: 'set-wrapping'; id: string }
  | { type: 'set-ribbon'; id: string }
  | { type: 'deliver' }
  | { type: 'close-shop' }
  | { type: 'next-day' }
  | { type: 'open-library' }
  | { type: 'close-library' }
  | { type: 'toggle-favorite'; flowerId: string }
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

    // 「CLOSED」の札を裏返した。ここから一日が始まる。
    case 'open-shop':
      return { ...state, phase: 'greeting', customerId: pickCustomer(state) };

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

    case 'go-arrange': {
      const stems = arrange(state.picked);
      return {
        ...state,
        phase: 'arrange',
        bouquet: { ...state.bouquet, stems },
        history: [],
      };
    }

    case 'back-to-shop':
      return { ...state, phase: 'shop' };

    case 'move-stem':
      return withHistory(state, {
        ...state.bouquet,
        stems: state.bouquet.stems.map((stem) =>
          stem.uid === action.uid
            ? { ...stem, angle: action.angle, reach: action.reach }
            : stem,
        ),
      });

    case 'bring-forward':
      return withHistory(state, {
        ...state.bouquet,
        stems: bringForward(state.bouquet.stems, action.uid),
      });

    case 'remove-stem':
      return {
        ...withHistory(state, {
          ...state.bouquet,
          stems: state.bouquet.stems.filter((stem) => stem.uid !== action.uid),
        }),
        picked: state.picked.filter((stem) => stem.uid !== action.uid),
      };

    case 'rearrange':
      return withHistory(state, {
        ...state.bouquet,
        stems: arrange(state.bouquet.stems),
      });

    case 'undo': {
      if (state.history.length === 0) return state;
      const previous = state.history[state.history.length - 1];
      return {
        ...state,
        bouquet: previous,
        history: state.history.slice(0, -1),
        picked: state.picked.filter((stem) =>
          previous.stems.some((s) => s.uid === stem.uid),
        ),
      };
    }

    case 'reset-bouquet':
      return withHistory(state, { ...state.bouquet, stems: arrange(state.picked) });

    case 'set-wrapping':
      return withHistory(state, { ...state.bouquet, wrappingId: action.id });

    case 'set-ribbon':
      return withHistory(state, { ...state.bouquet, ribbonId: action.id });

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

    // お客さまが帰った。まだ日は変えない ── 静かになった店が残る。
    case 'close-shop':
      return { ...state, phase: 'after' };

    case 'next-day': {
      const day = state.day + 1;
      const next = { ...state, day };
      return {
        ...next,
        // 季節がひと巡りした日は、店を開ける前に一度だけ問いが出る。
        // それ以外の朝は、いつもどおり開店前から始まる。
        phase: isTurnOfTheYear(state.day) ? 'ending' : 'market',
        // 入口の花は、日をまたがない。毎朝また決める。
        frontFlowerId: null,
        customerId: pickCustomer(next),
        picked: [],
        bouquet: emptyBouquet(),
        history: [],
        inspectingFlowerId: null,
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

    case 'toggle-sound':
      return { ...state, soundOn: !state.soundOn };

    case 'restore':
      return { ...state, ...action.saved, phase: state.phase };

    default:
      return state;
  }
}

function withHistory(state: GameState, bouquet: Bouquet): GameState {
  return {
    ...state,
    bouquet,
    history: [...state.history, state.bouquet].slice(-20),
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

/** 同じ人が続けて来ないように、そっと選ぶ。 */
function pickCustomer(state: GameState): string {
  const season = seasonForDay(state.day).id;
  const recent = new Set(state.memories.slice(-3).map((memory) => memory.customerId));
  const suited = CUSTOMERS.filter(
    (customer) => !customer.seasons || customer.seasons.includes(season),
  );
  const fresh = suited.filter((customer) => !recent.has(customer.id));
  const pool = fresh.length > 0 ? fresh : suited;
  return pool[(state.day - 1 + pool.length) % pool.length].id;
}

// --------------------------------------------------------------------------

interface GameValue {
  state: GameState;
  dispatch: Dispatch<Action>;
  customer: Customer;
  season: Season;
  result: Evaluation | null;
  pickedTotal: number;
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
          // frontFlowerId は保存しない。**その日で終わるもの**なので。
          soundOn: state.soundOn,
        }),
      );
    } catch {
      /* 保存できなくても遊べる */
    }
  }, [state.day, state.earnings, state.library, state.memories, state.soundOn]);

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
    };
  }, [state]);

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameValue {
  const value = useContext(GameContext);
  if (!value) throw new Error('GameProvider の中で使ってください');
  return value;
}
