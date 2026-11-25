// Dapur Kilat — tiny synthesised sound effects (Web Audio, no audio files).
// Every sound is a short oscillator blip, so the game ships zero audio assets.

let ctx = null;
let muted = false;

function audio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function isMuted() {
  return muted;
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

// One note: frequency, length in seconds, waveform, volume.
function tone(freq, dur, type = 'sine', vol = 0.12, when = 0) {
  if (muted) return;
  const ac = audio();
  if (!ac) return;
  const t0 = ac.currentTime + when;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function sweep(from, to, dur, type = 'triangle', vol = 0.1) {
  if (muted) return;
  const ac = audio();
  if (!ac) return;
  const t0 = ac.currentTime;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, t0);
  osc.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export const sfx = {
  pickup() {
    tone(520, 0.08, 'triangle', 0.1);
  },
  place() {
    tone(340, 0.09, 'triangle', 0.1);
    tone(260, 0.1, 'sine', 0.07, 0.05);
  },
  chop() {
    tone(180, 0.06, 'square', 0.06);
  },
  ready() {
    tone(880, 0.12, 'sine', 0.12);
    tone(1174, 0.16, 'sine', 0.1, 0.1);
  },
  serve() {
    tone(659, 0.1, 'triangle', 0.12);
    tone(880, 0.12, 'triangle', 0.12, 0.09);
    tone(1318, 0.2, 'sine', 0.1, 0.18);
  },
  error() {
    sweep(220, 110, 0.22, 'sawtooth', 0.08);
  },
  walkout() {
    sweep(320, 90, 0.5, 'sawtooth', 0.09);
  },
  levelup() {
    [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.14, 'triangle', 0.11, i * 0.08));
  },
  win() {
    [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, 0.22, 'triangle', 0.11, i * 0.11));
  },
  lose() {
    [392, 330, 262, 196].forEach((f, i) => tone(f, 0.25, 'triangle', 0.1, i * 0.13));
  },
  tick() {
    tone(980, 0.05, 'square', 0.05);
  },
};
