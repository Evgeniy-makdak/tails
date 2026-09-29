import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { TrackPoint } from '../api/tracks';

const STORAGE_KEY = 'hvostik.walk-recording.v1';
/** Sample GPS while walking — sparse to keep Render Free payloads small. */
export const WALK_SAMPLE_INTERVAL_MS = 8_000;
export const WALK_MIN_MOVE_M = 12;
export const WALK_MAX_LIVE_POINTS = 400;

export type WalkRecordingState = {
  active: boolean;
  petId: string | null;
  petName: string | null;
  startedAt: string | null;
  points: TrackPoint[];
  lastError: string | null;
  uploading: boolean;
  start: (input: { petId: string; petName: string; point?: TrackPoint | null }) => void;
  appendPoint: (point: TrackPoint) => void;
  stopLocal: () => { points: TrackPoint[]; startedAt: string; petId: string; petName: string } | null;
  clearAfterStop: () => void;
  setUploading: (value: boolean) => void;
  setError: (message: string | null) => void;
  reset: () => void;
};

function haversineM(a: TrackPoint, b: TrackPoint) {
  const R = 6371008.8;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export const useWalkRecordingStore = create<WalkRecordingState>()(
  persist(
    (set, get) => ({
      active: false,
      petId: null,
      petName: null,
      startedAt: null,
      points: [],
      lastError: null,
      uploading: false,
      start: ({ petId, petName, point }) => {
        const startedAt = new Date().toISOString();
        const points = point
          ? [{ ...point, recordedAt: point.recordedAt || startedAt }]
          : [];
        set({
          active: true,
          petId,
          petName,
          startedAt,
          points,
          lastError: null,
          uploading: false,
        });
      },
      appendPoint: (point) => {
        const state = get();
        if (!state.active) return;
        const nextPoint = {
          ...point,
          recordedAt: point.recordedAt || new Date().toISOString(),
        };
        const last = state.points[state.points.length - 1];
        if (last) {
          const moved = haversineM(last, nextPoint);
          const lastAt = last.recordedAt ? Date.parse(last.recordedAt) : 0;
          const nextAt = nextPoint.recordedAt ? Date.parse(nextPoint.recordedAt) : Date.now();
          if (moved < WALK_MIN_MOVE_M && nextAt - lastAt < WALK_SAMPLE_INTERVAL_MS) {
            return;
          }
        }
        const points = [...state.points, nextPoint].slice(-WALK_MAX_LIVE_POINTS);
        set({ points });
      },
  stopLocal: () => {
    const state = get();
    if (!state.active || !state.startedAt || !state.petId || !state.petName) {
      return null;
    }
    const snapshot = {
      points: state.points,
      startedAt: state.startedAt,
      petId: state.petId,
      petName: state.petName,
    };
    /** Pause sampling; keep points until upload succeeds or user restarts. */
    set({ active: false });
    return snapshot;
  },
  /** Call after successful upload (or discard). */
  clearAfterStop: () =>
    set({
      active: false,
      petId: null,
      petName: null,
      startedAt: null,
      points: [],
      uploading: false,
    }),
  setUploading: (value) => set({ uploading: value }),
  setError: (message) => set({ lastError: message }),
  reset: () =>
    set({
      active: false,
      petId: null,
      petName: null,
      startedAt: null,
      points: [],
      lastError: null,
      uploading: false,
    }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        active: state.active,
        petId: state.petId,
        petName: state.petName,
        startedAt: state.startedAt,
        points: state.points,
      }),
    },
  ),
);
