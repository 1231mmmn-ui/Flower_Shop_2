/**
 * 今日の朝。
 *
 * 毎日、ほんの少しだけ違う。大きくは変えない。
 * 「今日は少し違うな」と感じる程度でいい。
 *
 * ここに言葉は置かない。天気を文字で知らせた瞬間に、
 * 「今日はどんな朝だろう」が「今日の天気を読む」に変わってしまう。
 * 光と、音と、横切るものだけで伝える。
 */

import type { SeasonId } from './seasons';

/** 朝の天気。季節ごとに、出やすいものが違う。 */
export type Weather = 'bright' | 'soft' | 'hazy' | 'crisp';

/** 空気の中を漂うもの。 */
export type Drifting = 'petal' | 'leaf' | 'none';

/** ときどき横切るもの。 */
export type Passing = 'dragonfly' | 'none';

/** 鳥と風のほかに、その季節だけ鳴るもの。 */
export type SeasonSound = 'cicada' | 'chime' | 'none';

export interface Morning {
  weather: Weather;
  /** 窓からの光の強さ（1.0 がふつう） */
  light: number;
  /** 光の色み。+ であたたかく、− で澄む */
  warmth: number;
  /** 影のはっきりさ。強い朝はくっきり、曇った朝はやわらかい */
  contrast: number;
  /** 光の中を漂う埃の数 */
  motes: number;
  drifting: Drifting;
  passing: Passing;
  sound: SeasonSound;
  /** 息が白くなる朝か */
  breath: boolean;
}

/** 季節ごとに、出やすい天気。同じ日には同じ朝が来る。 */
const WEATHER_BY_SEASON: Record<SeasonId, readonly Weather[]> = {
  // 春はやわらかい光が多い。ときどき、かすんだ朝。
  spring: ['soft', 'soft', 'bright', 'hazy', 'soft'],
  // 夏は陽が強い。曇る日もあるが、暗くはならない。
  summer: ['bright', 'bright', 'bright', 'soft', 'hazy'],
  // 秋は澄んだ朝と、やわらかい朝が半々。
  autumn: ['crisp', 'soft', 'crisp', 'bright', 'hazy'],
  // 冬はとにかく澄んでいる。
  winter: ['crisp', 'crisp', 'soft', 'crisp', 'hazy'],
};

/** 天気ごとの、光の出かた。 */
const AIR: Record<Weather, Pick<Morning, 'light' | 'warmth' | 'contrast' | 'motes'>> = {
  // 朝日が強い日。影がくっきり出る。
  bright: { light: 1.16, warmth: 0.10, contrast: 1.14, motes: 20 },
  // ふつうの朝。
  soft: { light: 1.0, warmth: 0.04, contrast: 1.0, motes: 14 },
  // 少し曇った日。影がやわらかく、埃も見えにくい。
  hazy: { light: 0.86, warmth: -0.02, contrast: 0.88, motes: 8 },
  // 澄んだ空気の朝。明るいのに、色は冷たい。
  crisp: { light: 1.06, warmth: -0.08, contrast: 1.10, motes: 11 },
};

/** 同じ日には、必ず同じ朝が来る。 */
const hash = (day: number): number => {
  const x = Math.sin(day * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

export function morningForDay(day: number, season: SeasonId): Morning {
  const table = WEATHER_BY_SEASON[season];
  const weather = table[(day - 1) % table.length];
  const air = AIR[weather];
  const roll = hash(day);

  return {
    weather,
    ...air,
    // 春は花びらが、秋は落ち葉が舞う。毎日ではなく、三日に二日くらい。
    drifting:
      season === 'spring' && roll < 0.7
        ? 'petal'
        : season === 'autumn' && roll < 0.7
          ? 'leaf'
          : 'none',
    // 赤とんぼ。秋の、晴れた朝だけ。
    passing:
      season === 'autumn' && (weather === 'crisp' || weather === 'bright') && roll > 0.35
        ? 'dragonfly'
        : 'none',
    // 夏は蝉。曇った朝は、代わりに風鈴が鳴る。
    sound:
      season === 'summer' ? (weather === 'hazy' ? 'chime' : 'cicada') : 'none',
    // 冬の、澄んだ朝だけ息が白い。
    breath: season === 'winter' && weather === 'crisp',
  };
}
