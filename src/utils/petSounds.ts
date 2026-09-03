import { Platform } from 'react-native';

import type { PetKind } from '../types/pet';

type AudioWindow = Window & {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
};

let activeCtx: AudioContext | null = null;
let stopTimer: ReturnType<typeof setTimeout> | null = null;

function getAudioContext(): AudioContext | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return null;
  }
  const Win = window as AudioWindow;
  const Ctor = Win.AudioContext || Win.webkitAudioContext;
  if (!Ctor) {
    return null;
  }
  if (!activeCtx || activeCtx.state === 'closed') {
    activeCtx = new Ctor();
  }
  return activeCtx;
}

function tone(
  ctx: AudioContext,
  start: number,
  duration: number,
  freq: number,
  type: OscillatorType,
  gainValue: number,
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(gainValue, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

function noiseBurst(ctx: AudioContext, start: number, duration: number, gainValue: number) {
  const length = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  }
  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  source.buffer = buffer;
  filter.type = 'bandpass';
  filter.frequency.value = 900;
  gain.gain.setValueAtTime(gainValue, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start(start);
  source.stop(start + duration);
}

function scheduleBark(ctx: AudioContext, now: number) {
  // Short playful woofs for ~3 seconds
  const pattern = [0, 0.35, 0.7, 1.2, 1.55, 2.1, 2.45];
  pattern.forEach((offset) => {
    const t = now + offset;
    tone(ctx, t, 0.18, 420, 'square', 0.12);
    tone(ctx, t + 0.05, 0.16, 280, 'sawtooth', 0.1);
    noiseBurst(ctx, t, 0.16, 0.18);
  });
}

function scheduleMeow(ctx: AudioContext, now: number) {
  const pattern = [0, 0.7, 1.4, 2.2];
  pattern.forEach((offset) => {
    const t = now + offset;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(780, t);
    osc.frequency.exponentialRampToValueAtTime(520, t + 0.35);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.14, t + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.42);
  });
}

/** Plays a hardcoded dog bark or cat meow for a few seconds (web AudioContext). */
export async function playPetCall(kind: PetKind): Promise<boolean> {
  const ctx = getAudioContext();
  if (!ctx) {
    return false;
  }
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }
  if (stopTimer) {
    clearTimeout(stopTimer);
    stopTimer = null;
  }
  const now = ctx.currentTime + 0.02;
  if (kind === 'cat') {
    scheduleMeow(ctx, now);
  } else {
    scheduleBark(ctx, now);
  }
  stopTimer = setTimeout(() => {
    stopTimer = null;
  }, 3200);
  return true;
}

export function stopPetCall() {
  if (stopTimer) {
    clearTimeout(stopTimer);
    stopTimer = null;
  }
  if (activeCtx && activeCtx.state !== 'closed') {
    void activeCtx.close().catch(() => undefined);
    activeCtx = null;
  }
}
