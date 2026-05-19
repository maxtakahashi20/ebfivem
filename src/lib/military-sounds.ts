/**
 * Efeitos sonoros leves (Web Audio) — rádio, terminal, scanner, hover metálico.
 * Volume baixo por padrão; respeita preferência do usuário em localStorage.
 */

const STORAGE_KEY = "cmf_sfx_enabled";

let ctx: AudioContext | null = null;
let enabled = true;

function readPref(): boolean {
  if (typeof window === "undefined") return false;
  const v = localStorage.getItem(STORAGE_KEY);
  if (v === "0") return false;
  return true;
}

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!enabled) return null;
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function setMilitarySoundsEnabled(on: boolean) {
  enabled = on;
  if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, on ? "1" : "0");
}

export function isMilitarySoundsEnabled(): boolean {
  return enabled;
}

export function initMilitarySounds() {
  enabled = readPref();
}

function tone(
  ac: AudioContext,
  freq: number,
  duration: number,
  type: OscillatorType,
  volume: number,
  ramp?: { endFreq?: number; attack?: number },
) {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  const t = ac.currentTime;
  const attack = ramp?.attack ?? 0.008;
  osc.frequency.setValueAtTime(freq, t);
  if (ramp?.endFreq) osc.frequency.exponentialRampToValueAtTime(ramp.endFreq, t + duration);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.linearRampToValueAtTime(volume, t + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(t);
  osc.stop(t + duration + 0.02);
}

function noiseBurst(ac: AudioContext, duration: number, volume: number, filterFreq: number) {
  const bufferSize = Math.floor(ac.sampleRate * duration);
  const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  const src = ac.createBufferSource();
  src.buffer = buffer;
  const filter = ac.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = filterFreq;
  const gain = ac.createGain();
  const t = ac.currentTime;
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(ac.destination);
  src.start(t);
  src.stop(t + duration);
}

/** Hover metálico suave */
export function playHoverMetal() {
  const ac = getCtx();
  if (!ac) return;
  tone(ac, 1200, 0.05, "triangle", 0.018, { endFreq: 600 });
}

/** Clique de terminal */
export function playTerminalClick() {
  const ac = getCtx();
  if (!ac) return;
  tone(ac, 1800, 0.04, "square", 0.012);
  tone(ac, 900, 0.06, "sine", 0.008);
}

/** Scanner / leitura de documento */
export function playScanner() {
  const ac = getCtx();
  if (!ac) return;
  noiseBurst(ac, 0.12, 0.025, 2800);
  tone(ac, 2400, 0.08, "sine", 0.01, { endFreq: 1200 });
}

/** Squawk de rádio militar (muito curto) */
export function playRadioSquawk() {
  const ac = getCtx();
  if (!ac) return;
  noiseBurst(ac, 0.06, 0.02, 900);
  tone(ac, 440, 0.05, "sawtooth", 0.006);
  tone(ac, 880, 0.04, "sine", 0.005);
}

/** Confirmação positiva */
export function playConfirm() {
  const ac = getCtx();
  if (!ac) return;
  tone(ac, 523, 0.06, "sine", 0.015);
  tone(ac, 659, 0.08, "sine", 0.012);
}

let lastHover = 0;
export function playHoverThrottled() {
  const now = Date.now();
  if (now - lastHover < 80) return;
  lastHover = now;
  playHoverMetal();
}
