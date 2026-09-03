import { Audio, type AVPlaybackStatusSuccess } from 'expo-av';
import { Platform } from 'react-native';

import type { PetKind } from '../types/pet';

const DOG_WOOF = require('../../assets/sounds/dog-woof.wav');
const CAT_MEOW = require('../../assets/sounds/cat-meow.mp3');

let activeSound: Audio.Sound | null = null;
let stopTimer: ReturnType<typeof setTimeout> | null = null;

async function unloadActive() {
  if (stopTimer) {
    clearTimeout(stopTimer);
    stopTimer = null;
  }
  if (activeSound) {
    const sound = activeSound;
    activeSound = null;
    try {
      await sound.stopAsync();
    } catch {
      // ignore
    }
    try {
      await sound.unloadAsync();
    } catch {
      // ignore
    }
  }
}

/** Plays dog woof or cat meow from assets/sounds for a few seconds. */
export async function playPetCall(kind: PetKind): Promise<boolean> {
  try {
    await unloadActive();

    if (Platform.OS !== 'web') {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        allowsRecordingIOS: false,
      });
    }

    const source = kind === 'cat' ? CAT_MEOW : DOG_WOOF;
    const { sound } = await Audio.Sound.createAsync(source, {
      shouldPlay: true,
      volume: 1,
    });
    activeSound = sound;

    const status = (await sound.getStatusAsync()) as AVPlaybackStatusSuccess;
    const durationMs = status.isLoaded && status.durationMillis ? status.durationMillis : 3500;
    const playMs = Math.min(durationMs, 4500);

    stopTimer = setTimeout(() => {
      void unloadActive();
    }, playMs + 200);

    sound.setOnPlaybackStatusUpdate((next) => {
      if (!next.isLoaded) {
        return;
      }
      if (next.didJustFinish) {
        void unloadActive();
      }
    });

    return true;
  } catch {
    await unloadActive();
    return false;
  }
}

export async function stopPetCall() {
  await unloadActive();
}
