/**
 * お客様。機械ではなく、それぞれに性格と人生と想いがある。
 * セリフは必ずあたたかく。冷たい言い方は書かない。
 *
 * id は IMAGE_ASSETS.md §7 の一覧と完全に一致させること。
 */

import type { ColorTone, Impression } from './flowers';
import type { SeasonId } from './seasons';

export interface CustomerWish {
  /** 雰囲気の要望 */
  impressions: Impression[];
  /** 色の要望 */
  tones: ColorTone[];
  /** 値札を見ながら伝えてくれる、色の言い方 */
  toneLabel: string;
  /** 特に喜ぶ花（入っていると嬉しい） */
  loved?: string[];
  lovedHint?: string;
  /** 本数の好み */
  volume: 'small' | 'medium' | 'full';
}

export interface Customer {
  id: string;
  name: string;
  /** 年ごろ。断定しすぎない書き方で。 */
  age: string;
  /** 来店したときの様子 */
  entrance: string;
  /** その人の暮らしが少しだけ見える一行 */
  life: string;
  /** 希望を伝えるセリフ */
  lines: string[];
  purpose: string;
  budget: number;
  wish: CustomerWish;
  /** 来やすい季節（ない場合はいつでも） */
  seasons?: SeasonId[];
  /** 受け取ったときの言葉。どれも笑顔で受け取ってくれる。 */
  reactions: {
    /** 想いがよく届いたとき */
    delighted: string[];
    /** 嬉しく受け取ってくれたとき */
    happy: string[];
    /** それでも必ず笑ってくれる */
    grateful: string[];
  };
  /** 帰りぎわの一言 */
  farewell: string;
}

export const CUSTOMERS: Customer[] = [
  {
    id: 'haruka',
    name: 'はるかさん',
    age: '20代',
    entrance: '仕事帰りのようで、鞄を抱えたまま、少し急いで入ってきました。',
    life: '来週、学生時代の友人の誕生日。毎年ふたりでお祝いしています。',
    lines: [
      '友人の誕生日プレゼントにしたくて。',
      'あの子、笑うと本当に元気が出る子なんです。',
      '明るくて、元気が出るようなブーケをお願いできますか。',
    ],
    purpose: '誕生日プレゼント（友人へ）',
    budget: 2000,
    wish: {
      impressions: ['bright', 'lively'],
      tones: ['warm'],
      toneLabel: '明るい色のお花が好き',
      loved: ['gerbera', 'sunflower'],
      lovedHint: '丸くて元気な花がとくに好きだそうです',
      volume: 'medium',
    },
    reactions: {
      delighted: [
        'わぁ……！ とっても素敵です。',
        'これ、あの子の顔が浮かびました。きっと喜びます。',
      ],
      happy: [
        'かわいい……！ 想像していたより明るいです。',
        'これを渡したら、あの子どんな顔するかな。',
      ],
      grateful: [
        'ありがとうございます。ちゃんと気持ちが入ってる感じがします。',
        '選んでくださる時間そのものが、うれしかったです。',
      ],
    },
    farewell: 'また、なにかお祝いのときに寄らせてください。',
  },
  {
    id: 'yoshiko',
    name: 'よしこさん',
    age: '70代',
    entrance: 'ゆっくり扉を開けて、店の中の匂いを少し吸い込んでから入ってきました。',
    life: '今日は月命日。連れ合いの方が、白い花が好きだったそうです。',
    lines: [
      '毎月この日に、少しだけ花を替えているんです。',
      'あの人、派手なのは好まない人でしたから。',
      '白い花を中心に、静かな感じにしていただけますか。',
    ],
    purpose: '月命日のお花',
    budget: 2600,
    wish: {
      impressions: ['calm', 'pure'],
      tones: ['white', 'green'],
      toneLabel: '白と、みどりを少し',
      loved: ['lily', 'babysbreath'],
      lovedHint: '白いユリを、毎月欠かさず入れているそうです',
      volume: 'medium',
    },
    reactions: {
      delighted: [
        'まぁ……。あの人、こういうのが好きでした。',
        'ありがとう。今日はいい話ができそうです。',
      ],
      happy: [
        'きれいですねぇ。部屋が明るくなります。',
        'こういう静かな花を見ると、落ち着きます。',
      ],
      grateful: [
        'ありがとう。あなたが選んでくださったこと、伝えておきますね。',
        '花のある日は、一日がゆっくり進む気がします。',
      ],
    },
    farewell: 'また来月、寄らせてもらいますね。',
  },
  {
    id: 'taichi',
    name: 'たいちさん',
    age: '30代',
    entrance: '入り口で少し迷ってから、「すみません」と小さく声をかけてきました。',
    life: '明日は娘さんの卒園式。花を買うのは、たぶん人生で二度目。',
    lines: [
      '娘の卒園式で、渡してやりたくて。',
      '花のことは、正直よく分からないんです。',
      'かわいらしい感じにしてもらえると助かります。',
    ],
    purpose: '卒園式のお祝い（娘さんへ）',
    budget: 1800,
    wish: {
      impressions: ['gentle', 'bright'],
      tones: ['warm', 'white'],
      toneLabel: 'やさしい色がいい',
      loved: ['carnation', 'babysbreath'],
      lovedHint: '小さな手でも持てる、軽い束がよさそうです',
      volume: 'small',
    },
    reactions: {
      delighted: [
        'あ……これ、いいですね。娘、絶対よろこびます。',
        '花屋さんに来てよかったです。ありがとうございます。',
      ],
      happy: [
        'かわいいですね。持てるかな、これくらいなら大丈夫か。',
        '自分じゃ、こんなふうに選べませんでした。',
      ],
      grateful: [
        'ありがとうございます。ちゃんと渡してきます。',
        '花のこと、少し分かった気がします。',
      ],
    },
    farewell: '入学式にも、また来ますね。',
  },
  {
    id: 'mei',
    name: 'めいさん',
    age: '高校生',
    entrance: '制服のまま、財布を握りしめて入ってきました。',
    life: '母の日。アルバイトを始めて、はじめて自分のお金で買う花。',
    lines: [
      'あの、母の日の花を……。',
      'あまり多くは出せないんですけど、ちゃんとしたのを渡したくて。',
      'ありがとうって伝わる感じに、できますか。',
    ],
    purpose: '母の日',
    budget: 1200,
    wish: {
      impressions: ['warm', 'gentle'],
      tones: ['warm'],
      toneLabel: 'ピンクっぽい色',
      loved: ['carnation'],
      lovedHint: 'カーネーションが入っていると、気持ちが伝わりそうです',
      volume: 'small',
    },
    reactions: {
      delighted: [
        'えっ、これ、この値段でこんなに素敵になるんですか……！',
        'お母さん、たぶん泣きます。ありがとうございます。',
      ],
      happy: [
        'かわいい……！ ちゃんと母の日っぽいです。',
        '思い切って買いに来てよかったです。',
      ],
      grateful: [
        'ありがとうございます。大事に持って帰ります。',
        '来年は、もう少し大きいのを買えるようにします。',
      ],
    },
    farewell: 'また、誕生日のときに来ます！',
  },
  {
    id: 'souta',
    name: 'そうたさん',
    age: '20代',
    entrance: '何度か店の前を通り過ぎてから、意を決したように入ってきました。',
    life: '今夜、三年つきあった人に気持ちを伝えるつもりでいます。',
    lines: [
      '今夜、渡したい人がいて。',
      '……その、大事な話をするので。',
      '上品で、きちんとした感じの花束をお願いします。',
    ],
    purpose: '大切な人へ',
    budget: 3800,
    wish: {
      impressions: ['elegant', 'gentle'],
      tones: ['warm', 'white'],
      toneLabel: '落ち着いた、上品な色',
      loved: ['rose', 'lisianthus'],
      lovedHint: 'バラを主役にすると、気持ちがまっすぐ伝わりそうです',
      volume: 'full',
    },
    reactions: {
      delighted: [
        'これ……すごくいいです。手が震えてきました。',
        'ありがとうございます。ちゃんと言えそうな気がします。',
      ],
      happy: [
        'きれいですね。持って歩くのが少し恥ずかしいくらいです。',
        'これなら、まっすぐ渡せそうです。',
      ],
      grateful: [
        'ありがとうございます。緊張しますが、行ってきます。',
        '相談に乗ってもらえて、落ち着きました。',
      ],
    },
    farewell: 'うまくいったら、報告に来てもいいですか。',
  },
  {
    id: 'rin',
    name: 'りんさん',
    age: '30代',
    entrance: 'エプロンのまま、隣の通りから歩いてきたようです。',
    life: '小さなカフェを営んでいて、毎週カウンターの花を替えています。',
    lines: [
      '今週のカウンターの花をお願いします。',
      'お客さんが、季節を感じてくれるといいなと思っていて。',
      'ナチュラルな感じで、飾りすぎないものが好みです。',
    ],
    purpose: 'お店に飾る花',
    budget: 2400,
    wish: {
      impressions: ['natural', 'calm'],
      tones: ['green', 'white'],
      toneLabel: 'みどりが多めで、落ち着いた色',
      loved: ['eucalyptus', 'hydrangea'],
      lovedHint: '葉ものが入ると、店の木の色と馴染むそうです',
      volume: 'medium',
    },
    reactions: {
      delighted: [
        'いいですね、これ。うちの店の空気に合います。',
        'お客さんが、きっと足を止めてくれます。',
      ],
      happy: [
        '素敵です。今週はこれを見ながら仕事できます。',
        'ナチュラルな感じ、好きです。',
      ],
      grateful: [
        'ありがとうございます。飾ってみますね。',
        '毎週この時間が、少し楽しみなんです。',
      ],
    },
    farewell: 'また来週、同じ時間に来ますね。',
  },
  {
    id: 'kaoru',
    name: 'かおるさん',
    age: '40代',
    entrance: '大きな紙袋を提げて、ゆったりとした足取りで入ってきました。',
    life: '友人が引っ越したばかり。今日は新居に招かれています。',
    lines: [
      '友人の新しい家に、お邪魔するんです。',
      '玄関に置いても邪魔にならないくらいの、明るい花がいいなと。',
      '家族みんなで見られるようなものがいいですね。',
    ],
    purpose: '新居祝い',
    budget: 2800,
    wish: {
      impressions: ['bright', 'natural'],
      tones: ['warm', 'green'],
      toneLabel: '明るいけれど、うるさくない色',
      loved: ['hydrangea', 'alstroemeria'],
      lovedHint: '長く楽しめる花だと、新しい暮らしに寄り添えます',
      volume: 'full',
    },
    reactions: {
      delighted: [
        'あら、いいわね。家族みんなで見られる感じ。',
        'これを持っていったら、玄関が明るくなりますね。',
      ],
      happy: [
        '素敵です。ちょうどいい大きさですね。',
        '持っていくのが楽しみになりました。',
      ],
      grateful: [
        'ありがとうございます。喜んでくれるといいな。',
        'こういう時間、久しぶりでした。',
      ],
    },
    farewell: 'また、なにかのお祝いに寄らせてください。',
  },
  {
    id: 'nao',
    name: 'なおさん',
    age: '20代',
    entrance: '静かに扉を開けて、しばらく花を眺めてから声をかけてくれました。',
    life: '大学の恩師が、今年で退官されるそうです。',
    lines: [
      'お世話になった先生に、お礼を渡したくて。',
      '四年間、ずっと見守ってくださった方なんです。',
      '落ち着いた、きちんとした花束にできますか。',
    ],
    purpose: '恩師への感謝',
    budget: 3200,
    wish: {
      impressions: ['elegant', 'calm'],
      tones: ['cool', 'white'],
      toneLabel: '派手すぎない、上品な色',
      loved: ['lisianthus', 'delphinium'],
      lovedHint: '感謝の花言葉を持つ花が、そっと想いを添えてくれます',
      volume: 'medium',
    },
    reactions: {
      delighted: [
        'ありがとうございます。……先生、こういうの好きだと思います。',
        '四年分の気持ちが、ちゃんと形になりました。',
      ],
      happy: [
        'きれいですね。渡すときのこと、考えてしまいます。',
        '落ち着いた感じで、とてもいいです。',
      ],
      grateful: [
        'ありがとうございます。しっかり渡してきます。',
        '選んでいる時間に、いろいろ思い出しました。',
      ],
    },
    farewell: '報告に、また寄りますね。',
  },
];

export const customerById = (id: string): Customer =>
  CUSTOMERS.find((customer) => customer.id === id) ?? CUSTOMERS[0];
