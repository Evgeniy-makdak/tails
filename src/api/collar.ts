import { api } from './client';
import type { CollarLocationSnapshot, CollarLocationSubscribeOptions } from '../location/types';

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

export function subscribeCollarLocationStream(
  _options: CollarLocationSubscribeOptions,
  _onMessage: (snapshot: CollarLocationSnapshot) => void,
): () => void {
  return () => undefined;
}
