/** お店そのもの。画面の出し分けと、店内の空気だけを受け持つ。 */

import { useEffect } from 'react';

import { ambience } from './audio/ambience';
import { Scene } from './components/Scene';
import { useGame } from './game/GameContext';
import { ArrangeScreen } from './screens/ArrangeScreen';
import { DeliverScreen } from './screens/DeliverScreen';
import { GreetingScreen } from './screens/GreetingScreen';
import { LibraryScreen } from './screens/LibraryScreen';
import { ShopScreen } from './screens/ShopScreen';
import { TitleScreen } from './screens/TitleScreen';

export function App() {
  const { state, season } = useGame();

  // 店の音。プレイヤーが望んだときだけ流れる。
  useEffect(() => {
    if (state.soundOn) void ambience.start();
    else ambience.stop();
    return () => ambience.stop();
  }, [state.soundOn]);

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
      />

      <div className="stage">
        {state.phase === 'title' && <TitleScreen />}
        {state.phase === 'greeting' && <GreetingScreen />}
        {state.phase === 'shop' && <ShopScreen />}
        {state.phase === 'arrange' && <ArrangeScreen />}
        {state.phase === 'deliver' && <DeliverScreen />}
        {state.phase === 'library' && <LibraryScreen />}
      </div>
    </div>
  );
}
