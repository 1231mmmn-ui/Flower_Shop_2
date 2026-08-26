/**
 * 瞬き・呼吸など、人物の「じっとしていても止まっていない」動きを
 * 動かしてよい状況かどうか。
 *
 * `active`（呼び出し側が渡す条件。例: 画面がぼけていない）に加えて、
 * タブが裏に回っているあいだも false にする。裏に回っているあいだも
 * タイマーを進めると、戻ってきた瞬間に溜まっていた分がまとめて
 * 起きて不自然になるため。
 */
import { useEffect, useState } from 'react';

export function useIdleActive(active: boolean): boolean {
  const [visible, setVisible] = useState(
    () => typeof document === 'undefined' || document.visibilityState === 'visible',
  );

  useEffect(() => {
    const onVisibility = () => setVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  return active && visible;
}
