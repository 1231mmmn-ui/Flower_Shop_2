/** 季節。窓の外の景色と、店に並ぶ花の旬に効く。 */

export type SeasonId = 'spring' | 'summer' | 'autumn' | 'winter';

export interface Season {
  id: SeasonId;
  name: string;
  /** 窓の外に見えるもの */
  window: string;
  /** 店に入った時の一言。急かさない、静かな言葉で。 */
  greeting: string;
}

export const SEASONS: Season[] = [
  {
    id: 'spring',
    name: '春',
    window: '窓の外で、桜がゆっくりほどけています',
    greeting: '風がぬるくなりましたね。今日はどんな花に会えるでしょう。',
  },
  {
    id: 'summer',
    name: '夏',
    window: '窓の外は、高い青空',
    greeting: '陽射しが白い日です。水をたっぷり吸った花が待っています。',
  },
  {
    id: 'autumn',
    name: '秋',
    window: '窓の外を、紅葉が横切っていきます',
    greeting: '日暮れが早くなりました。少しあたたかい色を選びたくなる日。',
  },
  {
    id: 'winter',
    name: '冬',
    window: '窓の外は、しんとした雪景色',
    greeting: '外は冷たいけれど、店の中はあたたかいです。ゆっくりどうぞ。',
  },
];

export const seasonById = (id: SeasonId): Season =>
  SEASONS.find((season) => season.id === id) ?? SEASONS[0];

/** 日が進むごとに、季節はゆっくり巡る。 */
export const seasonForDay = (day: number): Season =>
  SEASONS[Math.floor((day - 1) / 5) % SEASONS.length];
