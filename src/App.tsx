/** お店そのもの。画面の出し分けと、店内の空気だけを受け持つ。 */

import { useEffect, useMemo } from 'react';

import { ambience } from './audio/ambience';
import { FrontVase } from './components/FrontVase';
import { MorningAir } from './components/MorningAir';
import { Scene } from './components/Scene';
import { WindowLife } from './components/WindowLife';
import { eveningOf, morningForDay } from './data/mornings';
import { useGame } from './game/GameContext';
import { AfterScreen } from './screens/AfterScreen';
import { ArrangeScreen } from './screens/ArrangeScreen';
import { DeliverScreen } from './screens/DeliverScreen';
import { EndingScreen } from './screens/EndingScreen';
import { GreetingScreen } from './screens/GreetingScreen';
import { LibraryScreen } from './screens/LibraryScreen';
import { MarketScreen } from './screens/MarketScreen';
import { OpeningScreen } from './screens/OpeningScreen';
import { ShopScreen } from './screens/ShopScreen';
import { TitleScreen } from './screens/TitleScreen';

export function App() {
  const { state, season } = useGame();

  // 今日の朝。毎日ほんの少しだけ違う（→ src/data/mornings.ts）。
  //
  // 余韻の画面だけは、同じ日の**夕方**に倒す。
  // 新しい層を足すのではなく、もとからある光の仕組みを傾けるだけ
  // （そうしないと、朝と夕方が違う店に見える）。
  const morning = useMemo(() => {
    const today = morningForDay(state.day, season.id);
    return state.phase === 'after' ? eveningOf(today) : today;
  }, [state.day, season.id, state.phase]);

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
        place={
          state.phase === 'title' ? 'title' : state.phase === 'market' ? 'market' : 'shop'
        }
        blurred={blurred}
        dimmed={inspecting}
        morning={morning}
      />

      {/* 窓の外の季節。店内をぼかしているあいだは、窓の中も止める。 */}
      <WindowLife season={season.id} morning={morning} paused={blurred} />

      {/* 舞うもの、横切るもの、白い息。花を見ているあいだは出さない。 */}
      {!inspecting && state.phase !== 'library' && <MorningAir morning={morning} />}

      {/*
        入口の一輪挿し。市場で選んだ花が、その日ずっとここにある。
        市場・アルバム・タイトルには出さない（店の中の話なので）。

        **開店前にも出しません。** あの画面では、同じ花が
        まんなかの一輪挿しに大きく立っています（→ OpeningScreen.tsx）。
        両方に出すと、同じ花が二本あるように見えます。
      */}
      {['greeting', 'shop', 'arrange', 'after'].includes(state.phase) &&
        !inspecting && <FrontVase />}

      <div className="stage">
        {state.phase === 'title' && <TitleScreen />}
        {state.phase === 'market' && <MarketScreen />}
        {state.phase === 'opening' && <OpeningScreen />}
        {state.phase === 'greeting' && <GreetingScreen />}
        {state.phase === 'shop' && <ShopScreen />}
        {state.phase === 'arrange' && <ArrangeScreen />}
        {state.phase === 'deliver' && <DeliverScreen />}
        {state.phase === 'after' && <AfterScreen />}
        {state.phase === 'ending' && <EndingScreen />}
        {state.phase === 'library' && <LibraryScreen />}
      </div>
    </div>
  );
}
