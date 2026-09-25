import { API_BASE_URL } from '../config/features';
import type { MapLatLng } from '../map';

export type TrackPoint = MapLatLng & {
  recordedAt?: string | null;
};

export type PetTrack = {
  id: string;
  userId: string;
  petId?: string | null;
  petName?: string | null;
  startedAt: string;
  endedAt: string;
  distanceM: number;
  durationSec: number;
  steps: number;
  points: TrackPoint[];
  source: string;
  createdAt: string;
};

export async function fetchPetTracks(options: {
  token: string;
  petId?: string;
  petName?: string;
  center?: MapLatLng;
  seed?: boolean;
}): Promise<PetTrack[]> {
  const params = new URLSearchParams();
  if (options.petId) params.set('petId', options.petId);
  if (options.petName) params.set('petName', options.petName);
  if (options.center) {
    params.set('lat', String(options.center.latitude));
    params.set('lng', String(options.center.longitude));
  }
  if (options.seed === false) params.set('seed', '0');

  const res = await fetch(`${API_BASE_URL}/api/tracks?${params.toString()}`, {
    headers: { Authorization: `Bearer ${options.token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || data.error || `tracks_${res.status}`);
  }
  return (data.tracks || []) as PetTrack[];
}

export async function uploadPetTrack(options: {
  token: string;
  petId?: string;
  petName?: string;
  points: TrackPoint[];
  startedAt?: string;
  endedAt?: string;
  steps?: number;
}): Promise<PetTrack> {
  const res = await fetch(`${API_BASE_URL}/api/tracks`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${options.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      petId: options.petId,
      petName: options.petName,
      points: options.points,
      startedAt: options.startedAt,
      endedAt: options.endedAt,
      steps: options.steps,
      source: 'device',
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || data.error || `track_upload_${res.status}`);
  }
  return data.track as PetTrack;
}
