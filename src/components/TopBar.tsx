/** 画面上のごく小さな案内。UI は主役ではないので、情報は最小限。 */

import './TopBar.css';
import { useGame } from '../game/GameContext';

export function TopBar() {
  const { state, dispatch, season } = useGame();

  return (
    <header className="topbar fade">
      <div className="topbar__left">
        <span className="tag">
          {season.name}
          <span className="topbar__day">{state.day}日目</span>
        </span>
      </div>

      <div className="topbar__right">
        <button
          type="button"
          className="button button--quiet button--icon"
          onClick={() => dispatch({ type: 'open-library' })}
        >
          図鑑
        </button>
        <button
          type="button"
          className="button button--quiet button--icon"
          onClick={() => dispatch({ type: 'toggle-sound' })}
          aria-pressed={state.soundOn}
          title={state.soundOn ? '店の音を止める' : '店の音を流す'}
        >
          {state.soundOn ? '♪' : '♪̶'}
        </button>
      </div>
    </header>
  );
}
