/** お店そのもの。画面の出し分けと、店内の空気だけを受け持つ。 */

import { useEffect, useMemo } from 'react';

import { ambience } from './audio/ambience';
import { MorningAir } from './components/MorningAir';
import { Scene } from './components/Scene';
import { morningForDay } from './data/mornings';
import { useGame } from './game/GameContext';
import { ArrangeScreen } from './screens/ArrangeScreen';
import { DeliverScreen } from './screens/DeliverScreen';
import { GreetingScreen } from './screens/GreetingScreen';
import { LibraryScreen } from './screens/LibraryScreen';
import { OpeningScreen } from './screens/OpeningScreen';
import { ShopScreen } from './screens/ShopScreen';
import { TitleScreen } from './screens/TitleScreen';

export function App() {
  const { state, season } = useGame();

  // 今日の朝。毎日ほんの少しだけ違う（→ src/data/mornings.ts）。
  const morning = useMemo(
    () => morningForDay(state.day, season.id),
    [state.day, season.id],
  );

  // 店の音。プレイヤーが望んだときだけ流れる。
  // 開店前は鳥と風だけで、ピアノは札を裏返してから入る。
  const beforeOpen = state.phase === 'opening';
  useEffect(() => {
    if (state.soundOn) void ambience.start(beforeOpen ? 'morning' : 'shop');
    else ambience.stop();
    return () => ambience.stop();
    // beforeOpen は意図的に外している。層の切り替えは OpeningScreen が受け持つ。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.soundOn]);

  // 蝉・風鈴は、その季節の朝だけ。
  useEffect(() => {
    if (state.soundOn) ambience.setSeasonSound(morning.sound);
  }, [state.soundOn, morning.sound]);

  // 花を眺めているときは、背景をぼかして少し暗くする。
  const inspecting = state.inspectingFlowerId !== null;
  const blurred = inspecting || state.phase === 'library' || state.phase === 'arrange';

  return (
    <div className="shop">
      <Scene
        season={season.id}
        title={state.phase === 'title'}
        blurred={blurred}
        dimmed={inspecting}
        morning={morning}
      />

      {/* 舞うもの、横切るもの、白い息。花を見ているあいだは出さない。 */}
      {!inspecting && state.phase !== 'library' && <MorningAir morning={morning} />}

      <div className="stage">
        {state.phase === 'title' && <TitleScreen />}
        {state.phase === 'opening' && <OpeningScreen />}
        {state.phase === 'greeting' && <GreetingScreen />}
        {state.phase === 'shop' && <ShopScreen />}
        {state.phase === 'arrange' && <ArrangeScreen />}
        {state.phase === 'deliver' && <DeliverScreen />}
        {state.phase === 'library' && <LibraryScreen />}
      </div>
    </div>
  );
}
