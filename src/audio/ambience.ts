/**
 * 店の音。
 *
 * 音源ファイルは持たず、Web Audio でその場で鳴らしている。
 * 音量は小さく、リズムは作らない（急かさないため）。
 *
 * 音には二つの層がある。
 *
 *   'morning'  開店前。鳥と風だけ。**ピアノは鳴らさない**
 *   'shop'     開店後。そこにピアノがぽつりと加わる
 *
 * 開店前に音楽を鳴らさないのは、⑮実装の順番 3章の決めごと。
 * 札を裏返した瞬間に初めて店の音が入ってくることで、
 * 「ゲームを始める」ではなく「今日も花屋を開けよう」になる。
 */

const SCALE = [0, 2, 4, 7, 9, 12, 14, 16]; // ペンタトニック。外れた音が出ない。
const ROOT = 261.63; // C4

/** 音の層。開店前は鳥と風だけ。 */
export type AmbienceMode = 'morning' | 'shop';

/** その季節だけ鳴るもの（→ src/data/mornings.ts）。 */
export type SeasonSound = 'cicada' | 'chime' | 'none';

/** 鳥が鳴くまでの間（ミリ秒）。⑮3章「12〜40秒に一度」。 */
const BIRD_GAP: readonly [number, number] = [12_000, 28_000];
/** 風がひと吹きするまでの間。⑮3章「20〜60秒に一度」。 */
const GUST_GAP: readonly [number, number] = [20_000, 40_000];
/** ピアノの音と音のあいだ。 */
const NOTE_GAP: readonly [number, number] = [2_600, 6_800];

const between = ([lo, hi]: readonly [number, number]): number =>
  lo + Math.random() * (hi - lo);

export class Ambience {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private wind: AudioBufferSourceNode | null = null;
  private windGain: GainNode | null = null;
  private cicada: AudioBufferSourceNode | null = null;
  private cicadaGain: GainNode | null = null;
  private timers = new Set<number>();
  private running = false;
  private mode: AmbienceMode = 'shop';
  private seasonSound: SeasonSound = 'none';

  /** いま鳴らしている層。開店前は 'morning'。 */
  get currentMode(): AmbienceMode {
    return this.mode;
  }

  async start(mode: AmbienceMode = 'shop'): Promise<void> {
    if (this.running) {
      this.setMode(mode);
      return;
    }
    this.running = true;
    this.mode = mode;

    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return;

    const context = this.context ?? new Ctor();
    this.context = context;
    if (context.state === 'suspended') await context.resume();

    const master = context.createGain();
    master.gain.setValueAtTime(0, context.currentTime);
    master.gain.linearRampToValueAtTime(0.5, context.currentTime + 4);
    master.connect(context.destination);
    this.master = master;

    this.startWind(context, master);
    this.scheduleBird();
    this.scheduleGust();
    this.scheduleNote();
  }

  /**
   * 層を切り替える。
   * 'morning' → 'shop' は、札を裏返した瞬間。ピアノがここから入る。
   */
  setMode(mode: AmbienceMode): void {
    if (this.mode === mode) return;
    this.mode = mode;
    // ピアノの予約は scheduleNote 側が mode を見て自分で止まる／始まる。
    if (mode === 'shop') this.scheduleNote();
  }

  /**
   * その季節だけ鳴るもの。夏の蝉、曇った夏の朝の風鈴。
   * 毎日ほんの少しだけ違う朝にするための層（→ design/15-build-order.md 3章）。
   */
  setSeasonSound(sound: SeasonSound): void {
    if (this.seasonSound === sound) return;
    this.seasonSound = sound;
    if (sound === 'cicada') this.startCicada();
    else this.stopCicada();
  }

  /** 蝉。ひと夏ぶんの、遠い地鳴りのような層。 */
  private startCicada(): void {
    const { context, master } = this;
    if (!context || !master || this.cicada) return;

    // 帯域を絞った雑音を細かく震わせると、遠くの蝉時雨に近くなる。
    const seconds = 4;
    const buffer = context.createBuffer(1, context.sampleRate * seconds, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;

    const source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const band = context.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = 4200;
    band.Q.value = 5.5;

    const gain = context.createGain();
    gain.gain.setValueAtTime(0, context.currentTime);
    gain.gain.linearRampToValueAtTime(0.012, context.currentTime + 5);

    // 蝉の、細かい震え
    const tremolo = context.createOscillator();
    tremolo.frequency.value = 22;
    const depth = context.createGain();
    depth.gain.value = 0.006;
    tremolo.connect(depth).connect(gain.gain);
    tremolo.start();

    source.connect(band).connect(gain).connect(master);
    source.start();
    this.cicada = source;
    this.cicadaGain = gain;
  }

  private stopCicada(): void {
    const { context, cicada, cicadaGain } = this;
    if (!context || !cicada || !cicadaGain) return;
    cicadaGain.gain.cancelScheduledValues(context.currentTime);
    cicadaGain.gain.setValueAtTime(cicadaGain.gain.value, context.currentTime);
    cicadaGain.gain.linearRampToValueAtTime(0, context.currentTime + 2);
    window.setTimeout(() => cicada.stop(), 2200);
    this.cicada = null;
    this.cicadaGain = null;
  }

  /** 風鈴。風がひと吹きしたときだけ、ちりん、と一度。 */
  private playChime(): void {
    const { context, master } = this;
    if (!context || !master) return;
    const at = context.currentTime + 0.1 + Math.random() * 0.4;

    // ガラスの風鈴は、倍音が整数比から少しずれている。
    for (const [ratio, level] of [
      [1, 0.028],
      [2.41, 0.012],
      [4.83, 0.005],
    ] as const) {
      const osc = context.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = 2340 * ratio;

      const gain = context.createGain();
      gain.gain.setValueAtTime(0, at);
      gain.gain.linearRampToValueAtTime(level, at + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 2.6);

      osc.connect(gain).connect(master);
      osc.start(at);
      osc.stop(at + 2.7);
    }
  }

  stop(): void {
    this.running = false;
    for (const id of this.timers) window.clearTimeout(id);
    this.timers.clear();

    const { context, master } = this;
    if (!context || !master) return;
    master.gain.cancelScheduledValues(context.currentTime);
    master.gain.setValueAtTime(master.gain.value, context.currentTime);
    master.gain.linearRampToValueAtTime(0, context.currentTime + 1.6);
    window.setTimeout(() => {
      this.wind?.stop();
      this.wind = null;
      this.windGain = null;
      this.cicada?.stop();
      this.cicada = null;
      this.cicadaGain = null;
      this.seasonSound = 'none';
      master.disconnect();
      this.master = null;
    }, 1800);
  }

  /** あとで自分で片づけられるように、タイマーを覚えておく。 */
  private later(ms: number, run: () => void): void {
    const id = window.setTimeout(() => {
      this.timers.delete(id);
      run();
    }, ms);
    this.timers.add(id);
  }

  /** 木々を渡る風。フィルタをかけた雑音をゆっくり揺らす。 */
  private startWind(context: AudioContext, master: GainNode): void {
    const seconds = 6;
    const buffer = context.createBuffer(1, context.sampleRate * seconds, context.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i += 1) {
      // ブラウンノイズ。白より、風や木立に近い。
      last = (last + Math.random() * 2 - 1) * 0.5;
      data[i] = last * 0.5;
    }

    const source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 480;

    const gain = context.createGain();
    gain.gain.value = 0.055;

    // ゆっくりした呼吸のような揺れ
    const breath = context.createOscillator();
    breath.frequency.value = 0.06;
    const breathDepth = context.createGain();
    breathDepth.gain.value = 0.03;
    breath.connect(breathDepth).connect(gain.gain);
    breath.start();

    source.connect(filter).connect(gain).connect(master);
    source.start();
    this.wind = source;
    this.windGain = gain;
  }

  /**
   * ひと吹きの風。葉が大きく揺れる合図でもある。
   * 常時の風とは別に、ときどき膨らませて、また戻す。
   */
  private scheduleGust(): void {
    if (!this.running) return;
    this.later(between(GUST_GAP), () => {
      this.playGust();
      // 風鈴は、風が吹いたときにだけ鳴る。ひとりでには鳴らない。
      if (this.seasonSound === 'chime') this.playChime();
      this.scheduleGust();
    });
  }

  private playGust(): void {
    const { context, windGain } = this;
    if (!context || !windGain) return;
    const now = context.currentTime;
    const peak = 0.1 + Math.random() * 0.05;
    windGain.gain.cancelScheduledValues(now);
    windGain.gain.setValueAtTime(windGain.gain.value, now);
    windGain.gain.linearRampToValueAtTime(peak, now + 2.2);
    windGain.gain.linearRampToValueAtTime(0.055, now + 6.5);
  }

  /** 鳥。開店前も開店後も鳴く。 */
  private scheduleBird(): void {
    if (!this.running) return;
    this.later(between(BIRD_GAP), () => {
      const { context, master } = this;
      if (context && master) {
        this.playBird(context, master, context.currentTime + 0.2);
        // ときどき、二声つづけて
        if (Math.random() < 0.4) {
          this.playBird(context, master, context.currentTime + 0.2 + 0.42);
        }
      }
      this.scheduleBird();
    });
  }

  /** ぽつり、と一音だけ置く。次の音までの間もまちまち。 */
  private scheduleNote(): void {
    if (!this.running || this.mode !== 'shop') return;
    this.later(between(NOTE_GAP), () => {
      // 予約が入ったあとに開店前へ戻ったときは、鳴らさない。
      if (this.mode === 'shop') this.playNote();
      this.scheduleNote();
    });
  }

  private playNote(): void {
    const { context, master } = this;
    if (!context || !master) return;

    const step = SCALE[Math.floor(Math.random() * SCALE.length)];
    const octave = Math.random() < 0.3 ? 2 : 1;
    const frequency = ROOT * octave * 2 ** (step / 12);
    const now = context.currentTime;

    // 基音と、うすい倍音。アコースティックな響きに寄せる。
    for (const [ratio, level, length] of [
      [1, 0.11, 4.2],
      [2, 0.035, 3.0],
      [3, 0.014, 2.2],
    ] as const) {
      const osc = context.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = frequency * ratio;

      const gain = context.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(level, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + length);

      osc.connect(gain).connect(master);
      osc.start(now);
      osc.stop(now + length + 0.1);
    }
  }

  private playBird(context: AudioContext, master: GainNode, at: number): void {
    const osc = context.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1900 + Math.random() * 500, at);
    osc.frequency.exponentialRampToValueAtTime(2600, at + 0.09);
    osc.frequency.exponentialRampToValueAtTime(2100, at + 0.18);

    const gain = context.createGain();
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(0.022, at + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.3);

    osc.connect(gain).connect(master);
    osc.start(at);
    osc.stop(at + 0.35);
  }

  /**
   * 扉のベル。札を裏返したときに、一度だけ。
   * 音の層とは別に、単発で鳴らせるようにしてある。
   */
  ringBell(): void {
    const { context, master } = this;
    if (!context || !master) return;
    const at = context.currentTime + 0.05;

    for (const [ratio, level] of [
      [1, 0.05],
      [2.76, 0.022],
      [5.4, 0.009],
    ] as const) {
      const osc = context.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = 1180 * ratio;

      const gain = context.createGain();
      gain.gain.setValueAtTime(0, at);
      gain.gain.linearRampToValueAtTime(level, at + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 1.9);

      osc.connect(gain).connect(master);
      osc.start(at);
      osc.stop(at + 2);
    }
  }
}

export const ambience = new Ambience();
