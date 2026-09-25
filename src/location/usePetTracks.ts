import { useCallback, useEffect, useState } from 'react';

import { upsertChatUser } from '../api/chat';
import { fetchPetTracks, type PetTrack } from '../api/tracks';
import { mapConfig, offsetPoint, type MapLatLng } from '../map';
import { useAppStore } from '../store/useAppStore';

function buildLocalDemoTracks(center: MapLatLng, petName: string): PetTrack[] {
  const now = Date.now();
  const make = (
    id: string,
    phaseDeg: number,
    radiusM: number,
    durationSec: number,
    startedAgoMs: number,
    steps: number,
  ): PetTrack => {
    const startedAt = new Date(now - startedAgoMs).toISOString();
    const points: MapLatLng[] = [];
    const n = 40;
    for (let i = 0; i <= n; i += 1) {
      const t = i / n;
      const bearing = t * 360 * 1.15 + phaseDeg;
      const r = radiusM * (0.55 + 0.45 * Math.sin(t * Math.PI * 2));
      points.push(offsetPoint(center, r, bearing));
    }
    const endedAt = new Date(now - startedAgoMs + durationSec * 1000).toISOString();
    return {
      id,
      userId: 'local',
      petName,
      startedAt,
      endedAt,
      distanceM: Math.round(radiusM * 4.2),
      durationSec,
      steps,
      points,
      source: 'local-demo',
      createdAt: startedAt,
    };
  };

  return [
    make('local-1', 20, 260, 38 * 60, 2 * 60 * 60 * 1000, 3780),
    make('local-2', 140, 320, 32 * 60, 10 * 60 * 60 * 1000, 3180),
    make('local-3', 250, 400, 41 * 60, 28 * 60 * 60 * 1000, 4050),
  ];
}

export function usePetTracks(options: {
  petId: string;
  petName: string;
  center?: MapLatLng | null;
  enabled?: boolean;
}) {
  const email = useAppStore((s) => s.currentEmail);
  const ownerName = useAppStore((s) => s.ownerName);
  const ownerCity = useAppStore((s) => s.ownerCity);
  const [tracks, setTracks] = useState<PetTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<'api' | 'local-demo'>('local-demo');

  const center = options.center ?? mapConfig.defaultCamera.center;

  const reload = useCallback(async () => {
    if (!options.enabled) return;
    setLoading(true);
    setError(null);
    try {
      if (!email) {
        throw new Error('no_email');
      }
      const auth = await upsertChatUser({
        email,
        name: ownerName,
        city: ownerCity,
        pet: { id: options.petId, name: options.petName },
      });
      const list = await fetchPetTracks({
        token: auth.token,
        petId: options.petId,
        petName: options.petName,
        center,
      });
      setTracks(list);
      setSource('api');
    } catch (err) {
      setTracks(buildLocalDemoTracks(center, options.petName));
      setSource('local-demo');
      setError(err instanceof Error ? err.message : 'tracks_failed');
    } finally {
      setLoading(false);
    }
  }, [
    center,
    email,
    options.enabled,
    options.petId,
    options.petName,
    ownerCity,
    ownerName,
  ]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { tracks, loading, error, source, reload };
}
