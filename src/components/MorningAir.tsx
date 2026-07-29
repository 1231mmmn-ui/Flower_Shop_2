/**
 * 今日の朝の、空気。
 *
 * 舞うもの（花びら・落ち葉）、横切るもの（赤とんぼ）、白い息。
 * どれも小さく、まばらに。**気づかない人がいてよい**大きさにする。
 *
 * 「今日は少し違うな」と感じる程度で十分です。
 */

import { useMemo, type CSSProperties } from 'react';

import './MorningAir.css';
import type { Morning } from '../data/mornings';

interface MorningAirProps {
  morning: Morning;
}

/**
 * 舞うものの数。
 *
 * 9枚だと「演出」に見えました。**3枚**にすると、
 * ふと目に入るだけの、ただの景色になります。
 * 数を増やしたくなったら、それは心を動かしたいのではなく、
 * 動かしたいだけになっているときです。
 */
const DRIFT_COUNT = 3;

export function MorningAir({ morning }: MorningAirProps) {
  // 場所と速さは、毎回同じでいい。動きだけがゆっくり流れる。
  const drifts = useMemo(
    () =>
      Array.from({ length: DRIFT_COUNT }, (_, index) => {
        const seed = ((index * 7717 + 3119) % 9973) / 9973;
        const other = ((index * 3541 + 811) % 6949) / 6949;
        return {
          left: `${(seed * 70 + 14).toFixed(1)}%`,
          size: `${(7 + other * 5).toFixed(1)}px`,
          // ゆっくり落として、間を長く取る。続けて降ると雪に見える。
          duration: `${(24 + seed * 14).toFixed(1)}s`,
          delay: `${(-seed * 34).toFixed(1)}s`,
          spin: `${(other * 2 - 1).toFixed(2)}`,
        };
      }),
    [],
  );

  return (
    <div className="air" aria-hidden>
      {/* 春は花びら、秋は落ち葉。三日に二日くらい。 */}
      {morning.drifting !== 'none' && (
        <div className={`air__drift air__drift--${morning.drifting}`}>
          {drifts.map((drift, index) => (
            <span
              key={index}
              style={
                {
                  left: drift.left,
                  width: drift.size,
                  height: drift.size,
                  animationDuration: drift.duration,
                  animationDelay: drift.delay,
                  '--spin': drift.spin,
                } as CSSProperties
              }
            />
          ))}
        </div>
      )}

      {/* 赤とんぼ。秋の晴れた朝、ときどき窓の向こうを横切る。 */}
      {morning.passing === 'dragonfly' && (
        <span className="air__dragonfly">
          <span className="air__wing air__wing--fore" />
          <span className="air__wing air__wing--aft" />
        </span>
      )}

      {/* 冬の澄んだ朝。息が、ふっと白くなる。 */}
      {morning.breath && <span className="air__breath" />}
    </div>
  );
}
