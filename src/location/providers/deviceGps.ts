import * as Location from 'expo-location';

import type { CollarLocationProvider } from '../CollarLocationProvider';
import type { CollarLocationListener, CollarLocationSnapshot, CollarLocationSubscribeOptions } from '../types';
import { createDemoCollarLocationProvider } from './demoCollar';

/**
 * Temporary stand-in for collar GPS: uses the phone / browser geolocation.
 * When collar API is ready, flip EXPO_PUBLIC_LOCATION_MODE=api.
 * Falls back to demo SPb point if permission is denied.
 */
export function createDeviceCollarLocationProvider(): CollarLocationProvider {
  const fallback = createDemoCollarLocationProvider();

  const toSnapshot = (
    options: CollarLocationSubscribeOptions,
    coords: Location.LocationObjectCoords,
  ): CollarLocationSnapshot => ({
    petId: options.petId,
    collarId: options.collarId,
    point: {
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracyM: coords.accuracy ?? undefined,
      altitudeM: coords.altitude ?? undefined,
      speedMps: coords.speed ?? undefined,
      headingDeg: coords.heading ?? undefined,
      updatedAt: new Date().toISOString(),
    },
    online: true,
    source: 'device',
  });

  return {
    id: 'device',
    async getCurrent(options) {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          return fallback.getCurrent(options);
        }
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        return toSnapshot(options, pos.coords);
      } catch {
        return fallback.getCurrent(options);
      }
    },
    subscribe(options, listener: CollarLocationListener) {
      let cancelled = false;
      let watch: Location.LocationSubscription | null = null;
      let fallbackUnsub: (() => void) | null = null;

      const start = async () => {
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (cancelled) return;
          if (status !== 'granted') {
            fallbackUnsub = fallback.subscribe(options, listener);
            return;
          }

          const first = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          if (cancelled) return;
          listener(toSnapshot(options, first.coords));

          watch = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.Balanced,
              /** Fire when the device moves ~5 m (platform may coalesce). */
              distanceInterval: 5,
              /** Also refresh at least about every 3 s while the watch is active. */
              timeInterval: 3000,
            },
            (pos) => {
              if (!cancelled) listener(toSnapshot(options, pos.coords));
            },
          );
        } catch {
          if (!cancelled) {
            fallbackUnsub = fallback.subscribe(options, listener);
          }
        }
      };

      void start();

      return () => {
        cancelled = true;
        watch?.remove();
        fallbackUnsub?.();
      };
    },
  };
}
