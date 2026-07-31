/**
 * エプロンのメモ。
 *
 * このゲームの心臓は「この人には、この花だ」と気づく瞬間で、
 * それが起きるのは**花を選んでいる最中**です。
 * だからそのあいだ、お客さまの言葉が、ずっと手元にある必要があります。
 *
 *   ・画面のすみに、小さな紙の角が見えているだけ
 *   ・ふれると、聞いたことがそのままの言葉で開く
 *   ・**こちらからは、一度も開かない**
 *   ・**どの花が合うかは、絶対に書かない**
 *
 * 条件表ではありません。人のことを書きとめた紙です。
 * （→ design/00-emotion.md【悩む】追加①、design/16-stillness.md 2章）
 */

import { useState } from 'react';

import './ApronMemo.css';
import type { Customer } from '../data/customers';

interface ApronMemoProps {
  customer: Customer;
}

export function ApronMemo({ customer }: ApronMemoProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`apron ${open ? 'is-open' : ''}`}>
      {/*
        紙の角。ボタンに見せない。
        光らせない、震わせない、赤い点を付けない ── 気づかない人がいてよい。
      */}
      <button
        type="button"
        className="apron__corner"
        onClick={() => setOpen((was) => !was)}
        aria-expanded={open}
        aria-label={open ? 'メモをしまう' : 'エプロンのメモを見る'}
      />

      {open && (
        <div className="apron__paper" onClick={() => setOpen(false)}>
          {/* 誰の話か。名前ではなく、渡す相手のことから書く。 */}
          <p className="apron__who">{customer.name}</p>

          <div className="apron__lines">
            {customer.memo.map((line, index) => (
              <p key={index} style={{ animationDelay: `${index * 0.12}s` }}>
                {line}
              </p>
            ))}
          </div>

          {/* 数字も、どの花が合うかも書かない。予算は手の帯にすでに出ている。 */}
        </div>
      )}
    </div>
  );
}
