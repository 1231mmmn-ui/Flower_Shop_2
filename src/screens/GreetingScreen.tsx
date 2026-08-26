/**
 * お客様が来店し、想いを聞かせてくれる。
 *
 * ここは書類を読む画面ではない。
 * 見えているのはお客様と、その人の言葉だけ。
 * 覚えておきたいことだけを、小さな紙にひとこと書き留める。
 */

import { useEffect } from 'react';

import './GreetingScreen.css';
import { customer as customerImage } from '../assets/paths';
import { QuietBar } from '../components/QuietBar';
import { TodayFlower } from '../components/TodayFlower';
import { useGame } from '../game/GameContext';
import { useBlink } from '../game/useBlink';
import { useIdleActive } from '../game/useIdleActive';

export function GreetingScreen() {
  const { state, customer, dispatch } = useGame();

  /*
   * 瞬き・呼吸。花を見ている・タブが裏に回っているなど、
   * 人物が主役でない場面では止める（→ useIdleActive.ts）。
   * この画面自体では花を見ることはないが、念のため同じ条件で揃えておく。
   */
  const idleActive = useIdleActive(state.inspectingFlowerId === null);
  const blinking = useBlink(idleActive);

  // 差し替えの瞬間に読み込みが挟まって一瞬透けないよう、先に読んでおく。
  useEffect(() => {
    const img = new Image();
    img.src = customerImage(customer.id, 'blink');
  }, [customer.id]);

  return (
    <div className="greet">
      <QuietBar />

      <p className="greet__entrance">{customer.entrance}</p>

      <div className="greet__figure">
        {/*
          呼吸は、瞬きとは別のレイヤー・別の transform で動かす。
          瞬きは img の src を差し替えるだけ、呼吸はこの外側の箱を
          ごくわずかに上下させるだけなので、互いに影響しない
          （→ 登場アニメーション step-in も img 側の transform なので
          同じ理由でぶつからない）。
        */}
        <div className={`greet__breathe ${idleActive ? '' : 'is-still'}`}>
          <img
            className="greet__person"
            src={customerImage(customer.id, blinking ? 'blink' : 'normal')}
            alt={customer.name} draggable={false} />
        </div>
        <div className="greet__words">
          {customer.lines.map((line, index) => (
            <p key={line} style={{ animationDelay: `${0.5 + index * 0.55}s` }}>
              {line}
            </p>
          ))}
        </div>
      </div>

      {/*
        覚えておくこと。紙きれ一枚ぶんだけ。

        **4行を2行にしました。** 意味は減らしていません。
        もとは 用途 ／ 色みと印象の並び ／ 予算 ／ 好きな花 の4行で、
        お客さまがすでに言ったことを、ラベルにして並べ直していました。
        読む量が二重になるうえ、印象語を「・」でつないだ行が
        いちばん**条件表**に見えていました（→ ⑫お客さま「3行まで。
        4行めが要るなら、それは条件表になりかけている」）。

        いま残しているのは、**あとで思い出せない事実だけ**です。
        用向きと予算は数字なので忘れます。色みと好みは、
        すぐ上のセリフに書いてあります。
      */}
      <div className="greet__note">
        <p className="greet__note-line">{customer.purpose}</p>
        <p className="greet__note-line greet__note-line--sub">
          {customer.wish.toneLabel}　·　{customer.budget.toLocaleString('ja-JP')}円ほど
        </p>
      </div>

      {/*
        季節の一行（「窓の外で、桜がゆっくりほどけています」）は外しました。
        **一日に3〜5回、一字一句おなじものが出ます。** 一年で80回。
        窓の外は、絵にもう描いてあります。
      */}
      <footer className="greet__foot">
        <TodayFlower />
        <button
          type="button"
          className="button"
          onClick={() => dispatch({ type: 'accept-request' })}
        >
          わかりました
        </button>
      </footer>
    </div>
  );
}
