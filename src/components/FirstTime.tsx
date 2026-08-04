/**
 * 初めての人にだけ、一言。
 *
 * このゲームは説明をしません。急かさないし、指も差しません。
 * ただ、**押せると分からないものは、押されません。**
 *
 *   ・「CLOSED」の札を裏返すと一日が始まる／終わる
 *   ・花にふれると、その花だけの紙が開く
 *
 * どちらも、知っていれば一度で分かり、知らなければ一生気づきません。
 * そこだけ、最初に一度そっと置きます。
 *
 * 決めごと
 *   ・**一度で消えます。** 出したままにしない
 *   ・「今後は表示しない」を置く。消す判断はプレイヤーがする
 *   ・矢印も、光る枠も、指のアイコンも出さない
 *   ・押さなくても進める。閉じても、また同じ場所に出る（消すまで）
 *   ・急かす言葉、褒める言葉は書かない
 */

import './FirstTime.css';
import { useGame } from '../game/GameContext';
import type { HintId } from '../game/types';

interface FirstTimeProps {
  id: HintId;
  /** 何が起きるか。ひとこと。 */
  text: string;
}

export function FirstTime({ id, text }: FirstTimeProps) {
  const { state, dispatch } = useGame();
  if (state.hintsDone.includes(id)) return null;

  return (
    <div className="first-time" role="note">
      <p className="first-time__text">{text}</p>
      <button
        type="button"
        className="first-time__hide"
        onClick={() => dispatch({ type: 'hint-done', id })}
      >
        今後は表示しない
      </button>
    </div>
  );
}
