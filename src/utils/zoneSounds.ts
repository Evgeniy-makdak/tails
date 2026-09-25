import { Audio } from 'expo-av';
import { Platform } from 'react-native';

import { playPetCall, stopPetCall } from './petSounds';

type Tone = { freq: number; ms: number; gap?: number; type?: OscillatorType; gain?: number };

let audioCtx: AudioContext | null = null;

function getWebCtx(): AudioContext | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) audioCtx = new Ctx();
  return audioCtx;
}

async function playToneSequence(tones: Tone[]): Promise<boolean> {
  const ctx = getWebCtx();
  if (!ctx) return false;
  try {
    if (ctx.state === 'suspended') await ctx.resume();
    let t = ctx.currentTime + 0.02;
    for (const tone of tones) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = tone.type ?? 'sine';
      osc.frequency.value = tone.freq;
      const level = tone.gain ?? 0.18;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(level, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + tone.ms / 1000);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + tone.ms / 1000 + 0.02);
      t += tone.ms / 1000 + (tone.gap ?? 80) / 1000;
    }
    return true;
  } catch {
    return false;
  }
}

/** Soft double-chime: left a safe geofence. */
export async function playSafeZoneExitAlert(): Promise<void> {
  const ok = await playToneSequence([
    { freq: 660, ms: 160, gap: 90, type: 'sine', gain: 0.16 },
    { freq: 520, ms: 220, gap: 0, type: 'sine', gain: 0.14 },
  ]);
  if (!ok) {
    await playPetCall('cat');
  }
}

/** Urgent alarm: approaching / entered a danger geofence. */
export async function playDangerZoneEnterAlert(): Promise<void> {
  const ok = await playToneSequence([
    { freq: 880, ms: 120, gap: 50, type: 'square', gain: 0.2 },
    { freq: 640, ms: 120, gap: 50, type: 'square', gain: 0.2 },
    { freq: 880, ms: 120, gap: 50, type: 'square', gain: 0.22 },
    { freq: 640, ms: 180, gap: 50, type: 'square', gain: 0.22 },
    { freq: 980, ms: 280, gap: 0, type: 'sawtooth', gain: 0.18 },
  ]);
  if (!ok) {
    await playPetCall('dog');
    setTimeout(() => {
      void playPetCall('dog');
    }, 500);
  }
}

export async function stopGeofenceAlerts() {
  await stopPetCall();
  try {
    await Audio.setIsEnabledAsync(true);
  } catch {
    // ignore
  }
}
