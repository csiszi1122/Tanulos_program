/** Lightweight Web Audio SFX — respects global mute flag. */

let muted = false;
let sharedCtx: AudioContext | null = null;

export function setSoundMuted(value: boolean) {
  muted = value;
}

export function isSoundMuted() {
  return muted;
}

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!sharedCtx) {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    sharedCtx = new Ctx();
  }
  return sharedCtx;
}

function tone(freq: number, durationMs: number, type: OscillatorType = "sine", gain = 0.08) {
  if (muted) return;
  const ctx = getCtx();
  if (!ctx) return;
  void ctx.resume();

  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.value = gain;
  osc.connect(g);
  g.connect(ctx.destination);

  const now = ctx.currentTime;
  g.gain.setValueAtTime(gain, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + durationMs / 1000);
  osc.start(now);
  osc.stop(now + durationMs / 1000);
}

export function playSuccess() {
  tone(523.25, 90, "triangle", 0.09);
  setTimeout(() => tone(659.25, 90, "triangle", 0.09), 80);
  setTimeout(() => tone(783.99, 140, "triangle", 0.1), 160);
}

export function playFail() {
  tone(220, 160, "sawtooth", 0.05);
  setTimeout(() => tone(165, 200, "sawtooth", 0.04), 100);
}

export function playClick() {
  tone(880, 40, "square", 0.04);
}

export function useSfx() {
  return { playSuccess, playFail, playClick };
}
