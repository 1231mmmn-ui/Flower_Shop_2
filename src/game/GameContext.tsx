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
import { seasonForDay, type Season } from '../data/seasons';
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
  libraryReturn: 'title',
  inspectingFlowerId: null,
  lastResultId: null,
  soundOn: false,
};

export type Action =
  | { type: 'enter-morning' }
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
  | { type: 'next-customer' }
  | { type: 'open-library' }
  | { type: 'close-library' }
  | { type: 'toggle-favorite'; flowerId: string }
  | { type: 'toggle-sound' }
  | { type: 'restore'; saved: Partial<GameState> };

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    // 扉を押すと、まず開店前の時間に入る。ここはまだゲームではない。
    case 'enter-morning':
      return { ...state, phase: 'opening' };

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
          },
        ].slice(-30),
        lastResultId: `${state.day}-${state.customerId}`,
      };
    }

    case 'next-customer': {
      const day = state.day + 1;
      const next = { ...state, day };
      return {
        ...next,
        // 新しい日は、いつも開店前から始まる。
        phase: 'opening',
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
