import { api } from './client';
import type { CollarLocationSnapshot, CollarLocationSubscribeOptions } from '../location/types';

/**
 * Contract for collar backend. Paths are placeholders — adjust when API is final.
 * Expected response shape (example):
 * {
 *   petId, collarId, latitude, longitude, accuracyM, batteryPercent, online, updatedAt
 * }
 */
export type CollarLocationApiDto = {
  petId: string;
  collarId?: string;
  latitude: number;
  longitude: number;
  accuracyM?: number;
  altitudeM?: number;
  speedMps?: number;
  headingDeg?: number;
  batteryPercent?: number;
  online?: boolean;
  updatedAt?: string;
};

export function mapCollarDtoToSnapshot(dto: CollarLocationApiDto): CollarLocationSnapshot {
  return {
    petId: dto.petId,
    collarId: dto.collarId,
    point: {
      latitude: dto.latitude,
      longitude: dto.longitude,
      accuracyM: dto.accuracyM,
      altitudeM: dto.altitudeM,
      speedMps: dto.speedMps,
      headingDeg: dto.headingDeg,
      updatedAt: dto.updatedAt ?? new Date().toISOString(),
    },
    batteryPercent: dto.batteryPercent,
    online: dto.online ?? true,
    source: 'api',
  };
}

/**
 * GET collar location. Returns null while endpoint is not deployed
 * (404 / network) so ApiCollarLocationProvider can fall back to demo.
 */
export async function fetchCollarLocation(
  options: CollarLocationSubscribeOptions,
): Promise<CollarLocationSnapshot | null> {
  const collarKey = options.collarId ?? options.petId;
  const { data, status } = await api.get<CollarLocationApiDto>(`/collars/${collarKey}/location`, {
    params: { petId: options.petId },
    validateStatus: (code) => code === 200 || code === 404 || code === 501,
  });

  if (status !== 200 || !data || typeof data.latitude !== 'number') {
    return null;
  }

  return mapCollarDtoToSnapshot(data);
}

/**
 * Future: open WebSocket / SSE for push updates.
 * Keep signature stable so providers can switch from polling without UI changes.
 */
export function subscribeCollarLocationStream(
  _options: CollarLocationSubscribeOptions,
  _onMessage: (snapshot: CollarLocationSnapshot) => void,
): () => void {
  // Placeholder — implement when collar backend exposes a stream.
  return () => undefined;
}
