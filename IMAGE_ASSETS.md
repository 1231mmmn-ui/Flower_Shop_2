# 画像アセット一覧（リアル画像化のための仕様書）

このゲームは現在、花・人物・背景をすべてコードで描いています。
ここに挙げる画像を用意して `assets/` 以下の指定パスに置けば、コード側の差し替え口
（`img:` 指定）にそのまま流し込めます。まずは **花12〜21種＋背景1〜4枚** から始めるのが
コストに対して見た目が最も変わるのでおすすめです。

## 共通ルール

- 背景透過PNG（花・小物・人物）／背景つきJPGまたはPNG（窓の景色・店内）
- スタイル統一のため、どの画像にも同じ一言を必ず含めてください：

  > 水彩とやわらかい光を基調にした、日本のスマホゲームのイラスト。
  > 『あつまれ どうぶつの森』『ようこそ実力至上主義の花屋さん』のような、
  > 癒し系・ナチュラルで優しい雰囲気。過度に写実的にせず、あたたかみのある半写実。

- 光源は共通で「左上からやわらかい自然光」に統一してください（影の向きがバラバラだと違和感が出ます）
- ファイル名・置き場所は下表のパスの通り（`index.html` の `img:` にそのまま書けます）

---

## 1. 花（優先度：最高／12〜21枚）

> **（追記・この表は「第一弾」です）** 花はゆくゆく **182種**まで増やします。
> **この節の共通ルール（1024×1024・背景透過PNG・構図・命名）は、追加ぶんにもそのまま適用します。**
> 追加ぶんの一覧は別紙 `design/14-flowers.md`（⑭花の設計書）にあります。
> **下の表は消しません。** ここに載っている花が、最初に描く花です。

正方形・**1024×1024px**・背景透過PNG。花瓶に生けた状態ではなく、茎付きの1本の花を
斜め正面・やや上から見たアングルで、画像の下端近くまで茎が伸びている構図（茎の下端で切れてOK）。

置き場所: `assets/flowers/<id>.png`

> **（追記・縮小版について）** 同じ絵を 512×512 でも書き出し、
> `assets/flowers/small/<id>.png` に置きます。
> **別の絵ではありません。仕様も命名も上と同じで、大きさだけが違います。**
> 完成画に差し替えるときも、1024版を1枚用意すれば縮小版は自動で作られます。
>
> 使い分け（端末の実ピクセル・DPR2 想定）
>
> | どこ | 表示 | 要る解像度 | 使う絵 |
> |---|---|---|---|
> | 一輪の画面・ブーケ | 447pt | 894px | **1024版** |
> | 棚・花瓶 | 224pt | 448px | 512版 |
> | アルバム | 118pt | 236px | 512版 |
>
> 棚とアルバムが1024版を読んでいたころ、扉を押した直後に **6.96MB**
> 読み込んでいました。開店前の30秒が、待ち時間から始まってしまいます。
> 512版にして **2.41MB**。撮り比べた画素の差は平均 0.900/255 で、
> **見た目は変わりません。**（減色で軽くする案は、色が平均3.51ずれるので採りません）

| id | 和名 | 優先度 | 生成プロンプト（英語推奨・末尾に共通スタイル文を追加） |
|---|---|---|---|
| `sunflower` | ヒマワリ | 高 | A single sunflower stem with leaves, bright yellow petals, brown center, isolated on transparent background |
| `lisianthus` | トルコキキョウ | 高 | A single lisianthus stem, ruffled purple petals, isolated on transparent background |
| `lily` | ユリ | 高 | A single white lily stem with leaves, trumpet-shaped petals, visible stamens, isolated on transparent background |
| `carnation` | カーネーション | 高 | A single pink carnation stem with ruffled petals, isolated on transparent background |
| `delphinium` | デルフィニウム | 中 | A single delphinium stem, tall spike of small blue flowers, isolated on transparent background |
| `gypsophila` | かすみ草 | 中 | A single gypsophila (baby's breath) stem, many tiny white flowers, airy and delicate, isolated on transparent background |
| `rose` | バラ（ピンク） | 最高 | A single pink rose stem with leaves and thorns, classic layered petals, isolated on transparent background |
| `hydrangea` | アジサイ | 中 | A single hydrangea stem, large round cluster of pale white-blue florets, isolated on transparent background |
| `gerbera` | ガーベラ | 高 | A single pink gerbera daisy stem, round flat bloom, isolated on transparent background |
| `alstroemeria` | アルストロメリア | 中 | A single alstroemeria stem with multiple yellow speckled blooms, isolated on transparent background |
| `statice` | スターチス | 低 | A single statice stem, small papery purple clustered flowers, isolated on transparent background |
| `eucalyptus` | ユーカリ | 中 | A single eucalyptus stem with round silvery-green leaves in pairs, isolated on transparent background |
| `tulip` | チューリップ | 高 | A single pink tulip stem with a broad leaf, closed cup-shaped bloom, isolated on transparent background |
| `sweetpea` | スイートピー | 低 | A single sweet pea stem, ruffled light pink butterfly-shaped petals, isolated on transparent background |
| `ranunculus` | ラナンキュラス | 中 | A single orange ranunculus stem, densely layered rose-like petals, isolated on transparent background |
| `cosmos` | コスモス | 中 | A single pink cosmos stem with feathery leaves, thin daisy-like petals, isolated on transparent background |
| `dahlia` | ダリア | 中 | A single deep red dahlia stem, dense spiky layered petals, isolated on transparent background |
| `gentian` | リンドウ | 低 | A single gentian stem, trumpet-shaped deep blue-purple flowers, isolated on transparent background |
| `anemone` | アネモネ | 低 | A single purple anemone stem, dark center, isolated on transparent background |
| `poinsettia` | ポインセチア | 低 | A single poinsettia stem, star-shaped red bracts with yellow center, isolated on transparent background |
| `narcissus` | スイセン | 低 | A single white narcissus stem, trumpet-shaped yellow-orange center, isolated on transparent background |

> 優先度「高〜最高」の9枚（sunflower, lisianthus, lily, carnation, rose, gerbera, tulip, ranunculus, dahlia）は
> 参考イラストの店頭に写っている花＋人気の高い花です。まずここから着手すると効果が大きいです。

#### 追加ぶん（薄い棚を埋める8種）

**上の表は消していません。** ここは、そのあとに足したぶんです。
共通ルール（1024×1024・背景透過PNG・構図・命名）は、このぶんにもそのまま適用します。

足した理由は数あわせではありません。アルバムを季節の棚に分けたとき、
実測でこうなっていたためです。

```
通年 8 ／ 冬 5 ／ 夏 3 ／ 春 2 ／ 秋 2 ／ みどり 1
```

**春・秋・みどりがほとんど空**で、その季節にアルバムを開くと
ほとんどが影のままでした。いちばん薄いところから足しています。

| id | 和名 | 棚 | 生成プロンプト（英語推奨・末尾に共通スタイル文を追加） |
|---|---|---|---|
| `freesia` | フリージア | 春 | A single yellow freesia stem, trumpet flowers opening along one side of the arching stalk, isolated on transparent background |
| `marguerite` | マーガレット | 春 | A single white marguerite daisy, yellow center, finely divided leaves, isolated on transparent background |
| `muscari` | ムスカリ | 春 | A single muscari stem, dense deep blue-violet grape-like bells, two strap leaves, isolated on transparent background |
| `zinnia` | ジニア | 夏 | A single orange zinnia, many layered flat petals, sturdy stem, isolated on transparent background |
| `celosia` | ケイトウ | 秋 | A single crimson celosia plume, dense velvety texture, isolated on transparent background |
| `pompon` | ピンポンマム | 秋 | A single yellow pompon chrysanthemum, perfectly spherical head of tight petals, isolated on transparent background |
| `ruscus` | ルスカス | みどり | A single ruscus stem, pointed dark green leaf-like flattened stems spaced along the branch, isolated on transparent background |
| `solidago` | ソリダゴ | みどり | A single solidago stem, fine sprays of small yellow flowers, airy filler, isolated on transparent background |

---

## 2. 完成ブーケ用の花（任意・上級）

上の「1本の花」画像とは別に、ブーケ全体を1枚絵で生成する方法もあります（自由度は高いが実装難度も上がる）。
まずは上記「1本の花」を12〜21枚生成し、コード側で扇状に合成する現行方式を維持することを推奨します。

---

## 3. 店内背景（優先度：最高／5枚）

横長 **1600×1200px** 程度、背景まで描き込んだ完成画（透過不要）。木目の店内、正面に大きな窓、
右にラッピングコーナーという構図は共通。窓の中の景色だけ季節で差し替えます。

置き場所: `assets/scenes/shop-<season>.jpg`（またはPNG）

| ファイル | 季節 | プロンプト |
|---|---|---|
| `shop-spring.jpg` | 春 | Cozy wooden flower shop interior, large window showing cherry blossom trees and blue sky outside, wrapping paper rolls and ribbons on shelves to the right, warm sunlight, watercolor illustration style |
| `shop-summer.jpg` | 夏 | Cozy wooden flower shop interior, large window showing lush green trees and bright summer sky with clouds outside, wrapping paper rolls and ribbons on shelves to the right, warm sunlight, watercolor illustration style |
| `shop-autumn.jpg` | 秋 | Cozy wooden flower shop interior, large window showing autumn foliage trees in orange and red outside, wrapping paper rolls and ribbons on shelves to the right, warm sunlight, watercolor illustration style |
| `shop-winter.jpg` | 冬 | Cozy wooden flower shop interior, large window showing snow-covered trees and pale winter sky outside, wrapping paper rolls and ribbons on shelves to the right, warm sunlight, watercolor illustration style |
| `shop-title.jpg` | タイトル用 | Same as spring, wider framing to leave empty space at bottom center for a title card overlay |

窓だけを差し替えたい場合は、店内を共通の1枚にして「窓の景色」だけ4枚（透過PNG、窓枠の内側サイズ）
用意する方法でも構いません。実装コストは窓4枚方式のほうが低くなります。

推奨: 窓の景色だけ4枚（透過PNG、**800×600px** 程度）
`assets/scenes/window-spring.png` / `window-summer.png` / `window-autumn.png` / `window-winter.png`
プロンプトは上表から「Cozy wooden flower shop interior,」以降の景色描写だけを使う。

### （追記）⓪-a 市場 ── 店内とは別の場所

`assets/scenes/market-<season>.jpg`（**1600×1200px**・季節ごとに4枚）

**店内ではありません。外です。**
市場を店内の絵の上に描いたら、ただの「店の中の別画面」に見えました。
市場は花屋の朝そのものなので、場所が違わないと意味がありません。

とはいえ新しい画風は持ち込みません。窓の外の景色 ── プレイヤーが毎朝
ながめているあの風景 ── を、**まわりに広げただけ**の場所として描きます。

```
奥    季節の空と木立（窓の景色と同じ語彙。しっかりぼかす）
中    朝もや
手前  木の台。花はこの上に並ぶ（絵の高さの 0.72 のところに天板の線）
```

**天板の線の位置は動かさないでください。** 画面側は、この 0.72 から
花を立たせる位置を逆算しています（`useSceneBox.ts` の `MARKET_BENCH_Y`）。
ここがずれると、花が宙に浮きます。

光は店内と同じく左上から。ただし**窓の光の帯は描きません**（外なので）。

---

## 4. お客さま（優先度：中／3〜8枚）

正方形 **800×800px**、背景透過PNG、バストアップ、やわらかい笑顔。

置き場所: `assets/customers/<id>.png`

現在8人の依頼テンプレートがあり、性別・年齢感がそれぞれ異なります。最低限は
「にこにこ（通常）」と「もっと嬉しそう（受け取り後）」の表情差分2枚を1人ぶん
用意し、共通の1〜2人を使い回す形でも成立します。フル対応するなら8人×2表情＝16枚。

| id | 人物像 |
|---|---|
| `customer-01` | よく笑う同僚。ビタミンカラーの服 |
| `customer-02` | 落ち着いた雰囲気の女性 |
| `customer-03` | 実家を離れて暮らしている若い社会人 |
| `customer-04` | 仕事と子育てを両立している母 |
| `customer-05` | 家を出る娘を送り出す父親 |
| `customer-06` | 上品でやさしい、旧友を大切にする女性 |
| `customer-07` | 上品でおだやかな、長年連れ添った夫を持つ女性 |
| `customer-08` | 入院中の親友 |

各表情: `-normal.png`（依頼を聞いているとき）／`-happy.png`（花束を受け取ったとき）

### 人物像を決める順序（必ずこの順で）

かつて customer-02〜05 は、この順序を守らずに依頼文だけを先に作ったため、
実際に用意された画像の年齢・性別と食い違ってしまったことがあります
（例: 「落ち着いた雰囲気の男性」という設定に、女性の画像が入るなど）。
以後、新しい customer を追加するときは、必ずこの順で進めること。

1. **人物画像を確定する**（normal / blink とも、実際にゲームへ組み込んで確認する）
2. **年齢・性別・生活背景を、その画像を見て固定する**（画像を正とする。先に設定を決めて画像を当てはめない）
3. **その人物が自然に話しそうな依頼を設計する**（`src/data/customers.ts` の `age` / `persona` / `entrance` / `lines` などは、すべてこの人物像に合わせる）

この表の「人物像」列は、`src/data/customers.ts` の `persona` と常に一致させること。

---

> **（追記・半写実の水彩人物画へ）**
>
> 水彩の質感はなじんでいたのに、**造形がキャラクターのまま**でした。
> 丸い顔＋「⌒」の目＋大きな服。これは記号です。
> にじみをいくら足しても、記号は記号のままです。
> 足りなかったのは水彩ではなく、**人体**でした。
>
> **順番を変えました。**
>
> ```
> 前   単純な人物を描く → 水彩加工を掛ける
> いま 人体と顔を描く → 光と陰影を入れる → 水彩へ落とす
> ```
>
> 水彩は最後の一手であって、作り方ではありません。
>
> | | 描くこと |
> |---|---|
> | 顔 | 真円をやめる。額 → こめかみ → 頬骨 → 顎 とすぼまる輪郭 |
> | 目 | まぶた・白目・虹彩（上をまぶたで切る）・瞳・光・下まぶた・まつげ |
> | 鼻 | **輪郭線は描かない。** 鼻筋の右の影、小鼻、鼻先の下の影だけ |
> | 口 | 一本線をやめる。上唇（濃い）と下唇（明るい）の二枚 |
> | 髪 | 一枚の面をやめる。生え際・毛束・分け目・つや・後れ毛 |
> | 首肩 | 顎の下の影・丸首・鎖骨。なで肩は左右で高さを変える |
>
> **枠の中の位置**（DeliverScreen.css がここから花束の大きさを逆算します）
>
> | | 前 | いま |
> |---|---|---|
> | 顔の中心 | 0.42 | **0.34** |
> | あご | 0.58 | **0.555** |
> | 頭の高さ | 枠の35% | 枠の**47%** |
>
> 顔が枠の35%しかなかったころ、目は20pxで、
> まぶたも虹彩も鼻の影も、描いても潰れていました。
> **造形を上げるには、まず描く場所が要ります。**
>
> **全員を同じ顔にしないこと。**
> `face_w` / `face_h`（顔の縦横）、`tilt`（首の傾き）、
> `shoulder`（肩の傾き）、`gaze`（視線）、`hair_style` を人ごとに変えます。
>
> **避けるもの**（参考画のNG例）
> 顔や目が大きすぎる／輪郭がくっきりしすぎる／影が濃すぎる／
> ポーズが硬い／3D・写真風。ここは水彩の絵で、写実画ではありません。

> **（追記・腕だけの一枚）**
>
> 表情2種のほかに、**その人の前腕と手だけ**を描いた一枚を持ちます。
>
> | ファイル | 用途 |
> |---|---|
> | `assets/customers/<id>-arms.png` | 800×800・透過。人物とまったく同じ枠 |
>
> お渡しの画面で、ブーケが人物の**横に浮いて**いました。
> 同じ画面に並んでいるだけで、同じ空間にいません。
> 抱えている姿にするには、束が**体より手前、腕より奥**に
> なければならず、一枚の絵ではその順番が作れません。
>
> ```
> 人物（-happy） → ブーケ → 腕（-arms）
> ```
>
> **手を描き足すだけでは何も変わりません**（手が束の後ろに隠れます）。
> これは絵の話ではなく、**重ねる順番**の話です。
>
> 描くときの決めごと
>   ・枠は人物と同じ 800×800。同じ位置に重ねるだけで合うこと
>   ・手は**小さく**。束を包む手は、束より目立ってはいけない
>   ・前腕は細く（太いと羽根に見える）。ひじはふくらませない
>   ・袖は体より **9% ほど濃く**（同じ色だと体と溶けて腕に見えない）
>   ・手を持ってくる高さは胸より下（胸の高さだと、赤ちゃんを抱く形になる）

> **（追記・半写実をやめ、絵本風の水彩人物へ）**
>
> 上の「半写実の水彩人物画」の方針は、**やめます。** 市場・店頭の背景を
> 絵本調の水彩（→ 本書2章・3章、`design/` の市場背景の作業記録）に
> 揃えたところ、半写実の人物だけが背景から浮いて見えるようになったため。
>
> ```
> 前   人体・光・陰影を描き込んでから水彩へ落とす（半写実）
> いま  背景と同じ、線が細くやわらかい絵本の水彩（素朴・静か）
> ```
>
> **主役は花です。** 人物が精巧すぎると、花より先に人物へ目が行きます。
> 人物は「花を引き立てる、静かな存在」にとどめます。
>
> ### 画風
>
> - 背景（店頭）と同じ世界にいると感じる、やわらかい絵本風の水彩
> - 半写実には戻さない。3D感、強い立体陰影、アニメ的すぎる顔、
>   はっきりした黒線は避ける
> - 線は細くやわらかく、必要最小限
> - にじみ・やわらかい塗りはOKだが、**顔の形は崩れないこと**
>   （にじみは輪郭の外側・髪や服の縁で使い、目鼻の位置がぶれる
>   ほど崩さない）
>
> ### 印象
>
> - 落ち着いていて、やさしい。生活感があり、普通の人として自然
> - おしゃれ感よりも、安心感・親しみやすさを優先
> - 花より目立たないが、違和感なく見ていられる存在
>
> ### 構図
>
> - 接客画面に合う、正面〜ごく軽い3/4向き
> - 範囲は**胸上〜腰上くらい**（バストアップ、`customer-*.png` の
>   従来の枠と同じ用途）
> - 画面中央下に置いてもバランスが崩れないこと
> - 頭だけ大きすぎる見え方は避ける。首・肩・胴のつながりを自然にする
>
> ### 顔
>
> - 目は小さめで穏やか。口は控えめ、微笑みすぎない
> - 鼻・口の描写は最小限でよい（→ 半写実期の「輪郭線は描かない、
>   影だけ」という考え方はそのまま活かせる）
> - 顔の左右差や歪みが出ないこと
> - **閉じ目にしたときも違和感がないこと**（→ `-blink` 差分。
>   まぶたの線一本で静かに閉じる。まつげを強く描き込まない）
>
> ### 髪・服
>
> - 髪型・服はシンプル。模様の強い服、情報量の多いアクセサリーは避ける
> - 色は花と競合しない、くすみ系・淡色系。服で目立たせない
> - まずは「基準人物」なので、個性を盛りすぎない
>   （個性は8人へ展開するときに、髪型・服の色みだけで差をつける）
>
> ### 色
>
> - 背景の店頭に合う、やわらかい色。彩度は低〜中程度
> - 肌・髪・服ともに、花の鮮やかさを邪魔しないこと
>
> ### 基準人物1人（発注用サンプル）
>
> 8人へ展開する前に、**この1人だけ**をまず本番用に作る。
>
> | 項目 | 内容 |
> |---|---|
> | 年齢感 | 30代前半くらいの女性 |
> | 顔立ち | やさしく、親しみやすい普通の人 |
> | 髪型 | 肩につくくらいのまっすぐなボブ |
> | 前髪 | 薄めに少しだけ分かれる自然な前髪 |
> | 髪色 | やわらかいダークブラウン |
> | 服 | 無地のシンプルな長袖ブラウスまたはカットソー |
> | 服色 | くすんだ淡いグレイッシュグリーン |
> | アクセサリー | 基本なし。あっても目立たない小さいものだけ |
> | 表情・角度 | 正面寄り、ほんの少しだけ角度がある程度 |
> | 表情の強さ | ごく薄い微笑み。落ち着いていて安心感がある |
>
> 塗りは水彩のにじみを少し残してよいが、顔は崩さない。花より目立たない
> 色調にし、背景の店頭と並べたときに同じ世界の絵に見えることを優先する。
>
> ### まず用意する差分（優先順）
>
> | 順番 | ファイル | 内容 |
> |---|---|---|
> | 1 | `assets/customers/customer-01-normal.png` | 通常の目 |
> | 2 | `assets/customers/customer-01-blink.png` | 閉じ目。通常の雰囲気を崩さず、静かに目を閉じる |
> | 3（後日） | `assets/customers/customer-01-happy.png` | 少し表情がやわらぐ差分 |
> | 4（後日） | `assets/customers/customer-01-arms.png` | 前腕と手だけ（→ 上の「腕だけの一枚」を参照） |
>
> `normal` / `blink` の2枚がそろい、実機で以下を確認してから
> 残り7人へ展開する。
>
> - 花より人物が主役になっていないか
> - 逆に、人物が雑すぎて浮いていないか
> - 店頭背景と同じ世界観に見えるか
> - 瞬き・呼吸（→ `src/game/useBlink.ts` / `useIdleActive.ts`）を
>   入れても不自然でないか
> - 正面で見たときに顔が怖くないか・のっぺりしすぎないか
> - 長時間見ても疲れないか
>
> **枠の中の位置**は、半写実期の数値（顔の中心0.34／あご0.555／
> 頭の高さ47%）をいったんの目安として引き継ぐ。ただし
> `GreetingScreen` は `object-fit: contain` で自由に収めているため、
> 絵本風の顔の縦横比が変わるようなら、実機確認のうえでここを
> 調整してよい。お渡し画面（`-happy` / `-arms`）の座標合わせは、
> その2枚を作る段になってから確認する。

---

## 5. 花瓶・カゴ・小物（優先度：高／4枚）

正方形 **512×512px**、背景透過PNG。

| ファイル | 用途 | プロンプト |
|---|---|---|
| `assets/props/vase.png` | 店頭の花瓶（花なし） | A simple clear glass vase with a little water inside, empty, isolated on transparent background, soft watercolor style |
| `assets/props/basket.png` | ブーケ用バスケット | A rustic wicker basket for holding cut flowers, empty, isolated on transparent background, soft watercolor style |
| `assets/props/basket-full.png` | 花が入ったカゴ（演出用） | Same wicker basket filled with an assortment of colorful cut flowers, isolated on transparent background |
| `assets/props/counter.jpg` | カウンターの木目テクスチャ（タイル可） | Close-up wood counter texture, warm brown tone, seamless tileable, soft lighting |

> **（追記・花瓶に「中」を描くこと）**
>
> `vase.png` は、**縮めたあとに何が残るか**まで見て描いてください。
> 棚では 512px の絵を 112px ほどで出します。**4.6倍に縮みます。**
>
> 前の絵には口の輪も水面の線も描いてありましたが、
> 縮めると口の輪は 4.6px、水面は 0.5px になり、消えていました。
> 残るのは「半透明の角丸長方形」だけで、
> 茎はその後ろを素通りするので、
> **「花瓶の前に茎が置かれている」ように見えていました。**
>
> 中に挿さって見せるために、次の四つを**縮めても残る寸法**で描くこと。
>
> | | 512px での寸法 | なぜ要るか |
> |---|---|---|
> | 口の楕円（奥の縁） | 高さ 32px・暗い色 | 輪ではなく**穴**に見せる |
> | 口の楕円（手前の縁） | 高さ 32px・**不透明** | **茎がここで切れる**。いちばん効く |
> | 水面 | 楕円の面・高さ 23px | 線ではなく面。線は消える |
> | 水の色 | 下ほど濃く（α52→92） | 水中の茎が沈んで見える |
>
> 手前の縁だけは、**ぼかしたあとに**描くこと。
> 先に描いてぼかすと、にじんで透け、茎が縁を素通りして見えます。

---

## 6. ラッピング資材（優先度：中／11枚）

> **（追記・包んだ姿）** 資材（紙のロール・リボンの巻き）とは別に、
> **ブーケを包んだ姿**の絵も置きます。
>
> ```
> assets/wrap/cone-<paper-id>.png   768×640・透過   円錐に巻いた紙
> assets/wrap/bow-<ribbon-id>.png   512×512・透過   蝶結び
> ```
>
> **これまで CSS の多角形で描いていました。** 真っ直ぐな辺と、
> 等間隔の折り目と、角丸の四角を5枚並べた蝶結び ──
> 花と店内が水彩なのに、**ここだけ図形**に見えていました。
> 花・人物と同じ筆で描き直しています。
>
> 描くときの決めごと（人物と同じ）
>
> ```
> にじみ  輪郭は切り抜きではなく、紙の縁。ただし広い面なので弱く（0.07）
> 光      左上ひとつ。左が明るく、右へ落ちる
> 重なり  折り目ごとに隣の面へ影
> 縁      口もとをまっすぐ切らない。波は大きく（小さいと横棒に見える）
> ```
>
> **かたちのほうも、三角形にしないでください。**
> 水彩の質感を入れても、辺がまっすぐだと「きれいに描かれた紙」に見えます。
> 本物のラッピングで起きていることを、輪郭に入れます。
>
> ```
> 口が開く       いちばん上が外へ反り返る。切りっぱなしの縁が立つ
> 花に押される   中ほどがふくらむ。辺は直線ではなく、外へ張る
> リボンで締まる 結び目の上で急に細くなり、しわが寄る（下ほど密に）
> 手で巻く       左右がそろわない。片側だけ多く重なる
> 紙に厚みがある 折り返しは「濃い色の帯」ではなく、
>                **上を向いた面（明るい）＋その下の影**の二本で出す
>                帯の**下辺も波に沿わせる**こと。
>                上だけ波で下がまっすぐだと、厚みではなく黒い横棒に見える
> ```
>
> 束の太さは、**画面側が幅で応えます**（花が多いほど紙が押し広げられる）。
> 絵は紙の色ごとに一枚で足ります。
>
> 紙6色・リボン5色ぶん、あらかじめ書き出します。

**512×512px**、背景透過PNG。ロール状の紙・リボンの束。

置き場所: `assets/wrap/paper-<id>.png`（6枚）／`assets/wrap/ribbon-<id>.png`（5枚）

| id | 色 |
|---|---|
| `paper-kraft` | クラフト（茶） |
| `paper-cream` | クリーム |
| `paper-pink` | くすみピンク |
| `paper-sage` | セージグリーン |
| `paper-navy` | ネイビー |
| `paper-lilac` | ライラック |
| `ribbon-ivory` | アイボリー |
| `ribbon-rose` | ローズ |
| `ribbon-gold` | ゴールド |
| `ribbon-moss` | モスグリーン |
| `ribbon-blue` | スモークブルー |

プロンプト共通形: “A roll of [色] wrapping paper standing upright” / “A spool of [色] satin ribbon”

---

## 7. 温室（優先度：低／4枚）── **現時点では不使用**

> **（不使用）** 本編では温室を使いません。花屋は花を育てず、市場から仕入れるためです。
> 育成に相当する要素は「今日の市場（今朝の入荷）」で扱います（→ `design/12-customers.md` 9-2章）。
>
> **仕様は残します。** 将来の DLC・イベント・番外編で使う可能性があるためです。
> 素材を作る場合も、本編の画面には出しません。

正方形 **512×512px**、背景透過PNG。1つの鉢または畝の中で生育段階を描く。

置き場所: `assets/greenhouse/stage-<0-3>.png`

| ファイル | 段階 |
|---|---|
| `stage-0.png` | 土に種をまいた直後の鉢植え |
| `stage-1.png` | 小さな双葉が出た鉢植え |
| `stage-2.png` | つぼみがついた鉢植え |
| `stage-3.png` | 花が開いた鉢植え（花は種類ごとに1で作った画像と合成するため、鉢と葉のみでもよい） |

---

## 8. 完成ブーケ・メッセージカード台紙（優先度：低）

- `assets/props/card-blank.png`：クラフト色の小さなメッセージカード、背景透過、**512×384px**
- 完成ブーケ全体は、当面は「1本の花」画像をコード側で重ねる現行方式を継続（実装コストが低いため）

---

## 導入手順（画像が揃ったら）

1. 上記パスに画像を置く
2. `index.html` の `FLOWERS` 配列に `img:"assets/flowers/sunflower.png"` のように1行足す
   → その花だけ店頭・詳細・ブーケ・図鑑すべてに自動反映（すでに実装済みの仕組み）
3. 背景・人物・小物は現状 `img:` 差し替えの仕組みが未実装なので、画像が揃った段階で
   同様の差し替え口をこちらで追加します（花で仕組みが確認できてから広げるのが安全）

## まず着手する最小セット（8枚）

これだけでも見た目の印象は大きく変わります。

1. `assets/flowers/rose.png`
2. `assets/flowers/tulip.png`
3. `assets/flowers/sunflower.png`
4. `assets/flowers/lily.png`
5. `assets/flowers/gerbera.png`
6. `assets/flowers/lisianthus.png`
7. `assets/scenes/window-spring.png`
8. `assets/props/vase.png`
