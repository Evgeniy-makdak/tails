import type { CollarLocationProvider } from '../CollarLocationProvider';
import type { CollarLocationListener, CollarLocationSnapshot, CollarLocationSubscribeOptions } from '../types';

/** Same coords as the current MapScreen demo pill. */
export const DEMO_PET_COORDINATES = {
  latitude: 59.9362,
  longitude: 30.3141,
} as const;

function buildDemoSnapshot(options: CollarLocationSubscribeOptions): CollarLocationSnapshot {
  return {
    petId: options.petId,
    collarId: options.collarId,
    point: {
      latitude: DEMO_PET_COORDINATES.latitude,
      longitude: DEMO_PET_COORDINATES.longitude,
      accuracyM: 12,
      updatedAt: new Date().toISOString(),
    },
    batteryPercent: 67,
    online: true,
    source: 'demo',
  };
}

/**
 * Keeps current demo behaviour: fixed SPb point, optional tiny jitter for SOS feel later.
 */
export function createDemoCollarLocationProvider(): CollarLocationProvider {
  return {
    id: 'demo',
    async getCurrent(options) {
      return buildDemoSnapshot(options);
    },
    subscribe(options, listener) {
      const intervalMs = options.intervalMs ?? 5000;
      const emit = () => listener(buildDemoSnapshot(options));
      emit();
      const timer = setInterval(emit, intervalMs);
      return () => clearInterval(timer);
    },
  };
}
