/**
 * 店の音。
 *
 * ピアノがぽつり、風がゆっくり、ときどき鳥の声。
 * 音源ファイルは持たず、Web Audio でその場で鳴らしている。
 * 音量は小さく、リズムは作らない（急かさないため）。
 */

const SCALE = [0, 2, 4, 7, 9, 12, 14, 16]; // ペンタトニック。外れた音が出ない。
const ROOT = 261.63; // C4

export class Ambience {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private wind: AudioBufferSourceNode | null = null;
  private timer: number | null = null;
  private running = false;

  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;

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
    this.scheduleNote();
  }

  stop(): void {
    this.running = false;
    if (this.timer !== null) {
      window.clearTimeout(this.timer);
      this.timer = null;
    }
    const { context, master } = this;
    if (!context || !master) return;
    master.gain.cancelScheduledValues(context.currentTime);
    master.gain.setValueAtTime(master.gain.value, context.currentTime);
    master.gain.linearRampToValueAtTime(0, context.currentTime + 1.6);
    window.setTimeout(() => {
      this.wind?.stop();
      this.wind = null;
      master.disconnect();
      this.master = null;
    }, 1800);
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
  }

  /** ぽつり、と一音だけ置く。次の音までの間もまちまち。 */
  private scheduleNote(): void {
    if (!this.running) return;
    const wait = 2600 + Math.random() * 4200;
    this.timer = window.setTimeout(() => {
      this.playNote();
      this.scheduleNote();
    }, wait);
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

    // ときどき、遠くで鳥
    if (Math.random() < 0.16) this.playBird(context, master, now + 0.9);
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
}

export const ambience = new Ambience();
