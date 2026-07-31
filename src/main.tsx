import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App';
import { applyTokens } from './design/tokens';
import { GameProvider } from './game/GameContext';
import './styles/global.css';

// デザイン定数を CSS 変数として流し込む（値の出どころは tokens.ts だけ）
applyTokens();

const root = document.getElementById('root');
if (!root) throw new Error('#root が見つかりません');

createRoot(root).render(
  <StrictMode>
    <GameProvider>
      <App />
    </GameProvider>
  </StrictMode>,
);
