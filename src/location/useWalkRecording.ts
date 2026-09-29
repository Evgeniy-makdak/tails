import { useCallback, useEffect } from 'react';

import { upsertChatUser } from '../api/chat';
import { uploadPetTrack, type PetTrack } from '../api/tracks';
import { useAppStore } from '../store/useAppStore';
import { useCollarLocation } from './useCollarLocation';
import {
  WALK_SAMPLE_INTERVAL_MS,
  useWalkRecordingStore,
} from './walkRecordingStore';

/**
 * Keeps sampling GPS while a walk is active — even if user leaves the Map tab
 * (in-app "background"). True OS background is limited on web/Pages.
 */
export function useWalkRecordingController(enabled: boolean) {
  const active = useWalkRecordingStore((s) => s.active);
  const appendPoint = useWalkRecordingStore((s) => s.appendPoint);
  const pet = useAppStore((s) => s.pets.find((p) => p.id === s.activePetId) ?? s.pets[0]);
  const { point } = useCollarLocation({
    petId: pet?.id || 'none',
    collarId: pet?.collarId,
    enabled: enabled && Boolean(pet?.id) && active,
    intervalMs: WALK_SAMPLE_INTERVAL_MS,
  });

  useEffect(() => {
    if (!enabled || !active || !point) return;
    appendPoint({
      latitude: point.latitude,
      longitude: point.longitude,
      recordedAt: point.updatedAt || new Date().toISOString(),
    });
  }, [active, appendPoint, enabled, point?.latitude, point?.longitude, point?.updatedAt]);
}

export function useWalkRecordingActions() {
  const email = useAppStore((s) => s.currentEmail);
  const ownerName = useAppStore((s) => s.ownerName);
  const ownerCity = useAppStore((s) => s.ownerCity);
  const start = useWalkRecordingStore((s) => s.start);
  const stopLocal = useWalkRecordingStore((s) => s.stopLocal);
  const clearAfterStop = useWalkRecordingStore((s) => s.clearAfterStop);
  const setUploading = useWalkRecordingStore((s) => s.setUploading);
  const setError = useWalkRecordingStore((s) => s.setError);
  const uploading = useWalkRecordingStore((s) => s.uploading);
  const active = useWalkRecordingStore((s) => s.active);
  const points = useWalkRecordingStore((s) => s.points);
  const startedAt = useWalkRecordingStore((s) => s.startedAt);
  const lastError = useWalkRecordingStore((s) => s.lastError);

  const startWalk = useCallback(
    (input: { petId: string; petName: string; point?: { latitude: number; longitude: number } | null }) => {
      start({
        petId: input.petId,
        petName: input.petName,
        point: input.point
          ? {
              latitude: input.point.latitude,
              longitude: input.point.longitude,
              recordedAt: new Date().toISOString(),
            }
          : null,
      });
    },
    [start],
  );

  const finishWalk = useCallback(async (): Promise<PetTrack | null> => {
    const snapshot = stopLocal();
    if (!snapshot) return null;
    if (snapshot.points.length < 2) {
      setError('Слишком короткая прогулка — пройдите ещё немного.');
      return null;
    }
    if (!email) {
      setError('Войдите в аккаунт, чтобы сохранить прогулку.');
      return null;
    }

    setUploading(true);
    setError(null);
    try {
      const auth = await upsertChatUser({
        email,
        name: ownerName,
        city: ownerCity,
        pet: { id: snapshot.petId, name: snapshot.petName },
      });
      const track = await uploadPetTrack({
        token: auth.token,
        petId: snapshot.petId,
        petName: snapshot.petName,
        points: snapshot.points,
        startedAt: snapshot.startedAt,
        endedAt: new Date().toISOString(),
      });
      clearAfterStop();
      return track;
    } catch {
      setError('Не удалось сохранить прогулку. Проверьте интернет и попробуйте снова.');
      return null;
    } finally {
      setUploading(false);
    }
  }, [clearAfterStop, email, ownerCity, ownerName, setError, setUploading, stopLocal]);

  return {
    active,
    uploading,
    points,
    startedAt,
    lastError,
    startWalk,
    finishWalk,
  };
}
