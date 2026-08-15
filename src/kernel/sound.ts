/**
 * Sound, opt-in and OFF by default. Three voices, all synthesized — key
 * thock (editor), tick (checkbox), whoosh (morph/flip) — under 2KB of code,
 * created lazily on the first enabled gesture so autoplay policies never see
 * a request. First cut under pressure: delete this module and the site holds.
 */

const STORAGE_KEY = "downright-sound";

type Voice = "thock" | "tick" | "whoosh";

let context: AudioContext | null = null;
let enabled = false;

function ensureContext(): AudioContext | null {
  if (context) return context;
  const Ctor = window.AudioContext;
  if (!Ctor) return null;
  context = new Ctor();
  return context;
}

function play(voice: Voice): void {
  if (!enabled) return;
  const ctx = ensureContext();
  if (!ctx) return;
  if (ctx.state === "suspended") void ctx.resume();
  const now = ctx.currentTime;
  const gain = ctx.createGain();
  gain.connect(ctx.destination);

  if (voice === "thock") {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(70, now + 0.06);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    osc.connect(gain);
    osc.start(now);
    osc.stop(now + 0.08);
    return;
  }
  if (voice === "tick") {
    const osc = ctx.createOscillator();
    osc.type = "square";
    osc.frequency.setValueAtTime(2200, now);
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
    osc.connect(gain);
    osc.start(now);
    osc.stop(now + 0.04);
    return;
  }
  // whoosh: filtered noise sweep for morph/flip
  const buffer = ctx.createBuffer(1, 0.3 * ctx.sampleRate, ctx.sampleRate);
  const channel = buffer.getChannelData(0);
  for (let i = 0; i < channel.length; i += 1) channel[i] = (Math.random() * 2 - 1) * (1 - i / channel.length);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(400, now);
  filter.frequency.exponentialRampToValueAtTime(1600, now + 0.25);
  gain.gain.setValueAtTime(0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
  source.connect(filter).connect(gain);
  source.start(now);
}

export const sound = {
  get enabled(): boolean {
    return enabled;
  },
  setEnabled(value: boolean): void {
    enabled = value;
    try {
      localStorage.setItem(STORAGE_KEY, value ? "on" : "off");
    } catch {
      /* storage blocked; still applies for this page view */
    }
    if (value) ensureContext();
  },
  restore(): void {
    try {
      enabled = localStorage.getItem(STORAGE_KEY) === "on";
    } catch {
      enabled = false;
    }
  },
  thock(): void {
    play("thock");
  },
  tick(): void {
    play("tick");
  },
  whoosh(): void {
    play("whoosh");
  },
};
