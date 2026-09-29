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
}): Promise<PetTrack[]> {
  const params = new URLSearchParams();
  if (options.petId) params.set('petId', options.petId);

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

export async function deletePetTrack(options: { token: string; trackId: string }): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/tracks/${encodeURIComponent(options.trackId)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${options.token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || data.error || `track_delete_${res.status}`);
  }
}

export async function clearPetTracks(options: {
  token: string;
  onlyDemo?: boolean;
}): Promise<number> {
  const params = new URLSearchParams();
  if (options.onlyDemo) params.set('demo', '1');
  const qs = params.toString();
  const res = await fetch(`${API_BASE_URL}/api/tracks${qs ? `?${qs}` : ''}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${options.token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || data.error || `tracks_clear_${res.status}`);
  }
  return Number(data.removed) || 0;
}
