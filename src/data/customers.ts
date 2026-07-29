/**
 * お客様。機械ではなく、それぞれに性格と人生と想いがある。
 * セリフは必ずあたたかく。冷たい言い方は書かない。
 *
 * id と人物像は IMAGE_ASSETS.md §4 の一覧に合わせること。
 * 画像は assets/customers/<id>-normal.png / <id>-happy.png を id から自動で引く。
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
  /** 人物像（IMAGE_ASSETS.md §4 と対応） */
  persona: string;
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
    id: 'customer-01',
    name: 'はるかさん',
    age: '20代',
    persona: 'よく笑う同僚。ビタミンカラーの服',
    entrance: '仕事帰りのようで、鞄を抱えたまま、少し急いで入ってきました。',
    life: '来週、同じ部署の同僚の誕生日。毎年こっそりお祝いしています。',
    lines: [
      '同僚の誕生日プレゼントにしたくて。',
      'あの子、笑うと本当に元気が出る子なんです。',
      '明るくて、元気が出るようなブーケをお願いできますか。',
    ],
    purpose: '誕生日プレゼント（同僚へ）',
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
    id: 'customer-02',
    name: 'なおきさん',
    age: '20代',
    persona: '落ち着いた雰囲気の男性',
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
      loved: ['lisianthus', 'gentian'],
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
  {
    id: 'customer-03',
    name: 'さとみさん',
    age: '40代',
    persona: '家族の世話を焼くのが好きな母',
    entrance: '買い物袋を提げたまま、「ちょっといいかしら」と入ってきました。',
    life: '毎週金曜に食卓の花を替えるのが、この家のならわしだそうです。',
    lines: [
      '毎週、食卓に飾る花を買っているんです。',
      '子どもたちが「今週はこれか」って見てくれるのが嬉しくて。',
      '長もちして、あたたかい感じのものをお願いします。',
    ],
    purpose: '家族の食卓に飾る花',
    budget: 1800,
    wish: {
      impressions: ['warm', 'natural'],
      tones: ['warm', 'green'],
      toneLabel: 'あたたかい色と、みどりを少し',
      loved: ['alstroemeria', 'carnation'],
      lovedHint: '長く楽しめる花だと、次の金曜まで持ってくれます',
      volume: 'medium',
    },
    reactions: {
      delighted: [
        'あら、いいわね。食卓が明るくなりそう。',
        'これは家族みんなが気づいてくれるやつです。',
      ],
      happy: [
        'かわいい。ちょうどいい大きさですね。',
        '今週はこれを見ながらごはんを作ります。',
      ],
      grateful: [
        'ありがとう。飾るのが楽しみです。',
        'こういう時間、私にとっては息抜きなんです。',
      ],
    },
    farewell: 'また来週の金曜に、寄らせてくださいね。',
  },
  {
    id: 'customer-04',
    name: 'よしこさん',
    age: '70代',
    persona: '和の趣味がある年配の女性',
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
      loved: ['lily', 'gypsophila'],
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
    id: 'customer-05',
    name: 'めいさん',
    age: '高校生',
    persona: '春から進学する高校生',
    entrance: '制服のまま、財布を握りしめて入ってきました。',
    life: '春から遠くの学校へ。家を出る前に、どうしても渡したいものがあるそうです。',
    lines: [
      'あの、母に渡す花を……。',
      '春から家を出るので、その前に。',
      'あまり多くは出せないんですけど、ありがとうって伝わる感じにできますか。',
    ],
    purpose: '母へ、家を出る前に',
    budget: 1200,
    wish: {
      impressions: ['warm', 'gentle'],
      tones: ['warm'],
      toneLabel: 'ピンクっぽい色',
      loved: ['carnation', 'sweetpea'],
      lovedHint: '「門出」の花言葉を持つ花が、そっと背中を押してくれます',
      volume: 'small',
    },
    reactions: {
      delighted: [
        'えっ、これ、この値段でこんなに素敵になるんですか……！',
        'お母さん、たぶん泣きます。ありがとうございます。',
      ],
      happy: [
        'かわいい……！ ちゃんと気持ちが伝わりそうです。',
        '思い切って買いに来てよかったです。',
      ],
      grateful: [
        'ありがとうございます。大事に持って帰ります。',
        '次は、もう少し大きいのを買えるようにします。',
      ],
    },
    farewell: '向こうでも、花屋さんを探してみます。',
  },
  {
    id: 'customer-06',
    name: 'りんさん',
    age: '30代',
    persona: 'ひとり暮らしの人',
    entrance: '部屋着に近い服のまま、近所から歩いてきたようです。',
    life: 'ひとり暮らしの部屋。窓辺に一輪だけ花を置くのが、長い習慣です。',
    lines: [
      '自分のための花を買いにきました。',
      '誰に見せるでもないんですけど、あると一日が違うんです。',
      'ナチュラルな感じで、飾りすぎないものが好みです。',
    ],
    purpose: '自分の部屋に飾る花',
    budget: 1500,
    wish: {
      impressions: ['natural', 'calm'],
      tones: ['green', 'white'],
      toneLabel: 'みどりが多めで、落ち着いた色',
      loved: ['eucalyptus', 'gypsophila'],
      lovedHint: '葉ものが入ると、狭い部屋でも重たくならないそうです',
      volume: 'small',
    },
    reactions: {
      delighted: [
        'いいですね、これ。うちの窓辺に合います。',
        '帰るのが楽しみになりました。',
      ],
      happy: [
        '素敵です。今週はこれを見ながら過ごせます。',
        'ナチュラルな感じ、好きです。',
      ],
      grateful: [
        'ありがとうございます。飾ってみますね。',
        'この時間が、私のごほうびなんです。',
      ],
    },
    farewell: 'また、ふらっと寄らせてください。',
  },
  {
    id: 'customer-07',
    name: 'かおるさん',
    age: '40代',
    persona: '家族で新居に引っ越した夫婦の一方',
    entrance: '大きな紙袋を提げて、ゆったりとした足取りで入ってきました。',
    life: '家族で新しい家に越したばかり。まだ玄関ががらんとしているそうです。',
    lines: [
      '先週、家族で新しい家に越したんです。',
      '玄関に置いても邪魔にならないくらいの、明るい花がいいなと。',
      '家族みんなで見られるようなものがいいですね。',
    ],
    purpose: '新居に飾る花',
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
        'これを玄関に置いたら、あの家が「うち」になりそうです。',
      ],
      happy: [
        '素敵です。ちょうどいい大きさですね。',
        '持って帰るのが楽しみになりました。',
      ],
      grateful: [
        'ありがとうございます。喜んでくれるといいな。',
        'こういう時間、久しぶりでした。',
      ],
    },
    farewell: '落ち着いたら、また寄らせてください。',
  },
  {
    id: 'customer-08',
    name: 'そうたさん',
    age: '20代',
    persona: '入院中の親友のお見舞いに',
    entrance: '何度か店の前を通り過ぎてから、意を決したように入ってきました。',
    life: '学生時代からの親友が入院中。明日、面会に行くそうです。',
    lines: [
      '入院している友人のところへ行くんです。',
      '重たくならないように、でも元気が出るものがいいなと思って。',
      '香りの強すぎないものにできますか。',
    ],
    purpose: 'お見舞い（親友へ）',
    budget: 2200,
    wish: {
      impressions: ['gentle', 'bright'],
      tones: ['warm', 'white'],
      toneLabel: 'やさしくて、少し明るい色',
      loved: ['gerbera', 'gypsophila'],
      lovedHint: '香りの穏やかな花のほうが、病室では過ごしやすいそうです',
      volume: 'small',
    },
    reactions: {
      delighted: [
        'これ、いいですね。あいつ、笑うと思います。',
        'ありがとうございます。ちゃんと会ってきます。',
      ],
      happy: [
        'やさしい感じですね。病室でも重たくならなそうです。',
        'これなら、まっすぐ渡せそうです。',
      ],
      grateful: [
        'ありがとうございます。持っていきますね。',
        '相談に乗ってもらえて、落ち着きました。',
      ],
    },
    farewell: '元気になったら、ふたりで寄りますね。',
  },
];

export const customerById = (id: string): Customer =>
  CUSTOMERS.find((customer) => customer.id === id) ?? CUSTOMERS[0];
