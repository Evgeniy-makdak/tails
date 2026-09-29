import { useCallback, useEffect, useState } from 'react';

import { upsertChatUser } from '../api/chat';
import {
  clearPetTracks,
  deletePetTrack,
  fetchPetTracks,
  type PetTrack,
} from '../api/tracks';
import { useAppStore } from '../store/useAppStore';

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(label)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

export function usePetTracks(options: {
  petId: string;
  petName: string;
  enabled?: boolean;
}) {
  const enabled = options.enabled !== false;
  const email = useAppStore((s) => s.currentEmail);
  const ownerName = useAppStore((s) => s.ownerName);
  const ownerCity = useAppStore((s) => s.ownerCity);

  const [tracks, setTracks] = useState<PetTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<'api' | 'empty' | 'offline'>('empty');

  const withAuth = useCallback(async () => {
    if (!email) throw new Error('no_email');
    return withTimeout(
      upsertChatUser({
        email,
        name: ownerName,
        city: ownerCity,
        pet: { id: options.petId, name: options.petName },
      }),
      25_000,
      'auth_timeout',
    );
  }, [email, options.petId, options.petName, ownerCity, ownerName]);

  const reload = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const auth = await withAuth();
      const list = await withTimeout(
        fetchPetTracks({ token: auth.token, petId: options.petId }),
        25_000,
        'tracks_timeout',
      );
      setTracks(list);
      setSource(list.length > 0 ? 'api' : 'empty');
    } catch (err) {
      setTracks([]);
      setSource('offline');
      setError(err instanceof Error ? err.message : 'tracks_failed');
    } finally {
      setLoading(false);
    }
  }, [enabled, options.petId, withAuth]);

  const removeTrack = useCallback(
    async (trackId: string) => {
      const auth = await withAuth();
      await deletePetTrack({ token: auth.token, trackId });
      setTracks((prev) => prev.filter((item) => item.id !== trackId));
    },
    [withAuth],
  );

  const clearAll = useCallback(
    async (onlyDemo = false) => {
      const auth = await withAuth();
      await clearPetTracks({ token: auth.token, onlyDemo });
      if (onlyDemo) {
        setTracks((prev) => prev.filter((item) => item.source !== 'demo' && item.source !== 'local-demo'));
      } else {
        setTracks([]);
        setSource('empty');
      }
    },
    [withAuth],
  );

  useEffect(() => {
    void reload();
  }, [reload]);

  return { tracks, loading, error, source, reload, removeTrack, clearAll };
}
