import { Platform } from 'react-native';
import * as Location from 'expo-location';

import type { CollarLocationProvider } from '../CollarLocationProvider';
import type {
  CollarLocationListener,
  CollarLocationSnapshot,
  CollarLocationSubscribeOptions,
} from '../types';
import { createDemoCollarLocationProvider } from './demoCollar';

type Coords = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  altitude: number | null;
  speed: number | null;
  heading: number | null;
};

type SharedListener = (coords: Coords) => void;

/**
 * One shared GPS stream for the whole app.
 * Multiple watchPosition calls (map + geofence + history) are unreliable in browsers —
 * they often deliver only the first fix and then go silent until reload.
 */
let sharedListeners = new Set<SharedListener>();
let sharedStop: (() => void) | null = null;
let sharedLast: Coords | null = null;
let sharedStarting: Promise<void> | null = null;

function almostSame(a: Coords, b: Coords) {
  return (
    Math.abs(a.latitude - b.latitude) < 0.000005 &&
    Math.abs(a.longitude - b.longitude) < 0.000005
  );
}

function broadcast(coords: Coords) {
  if (sharedLast && almostSame(sharedLast, coords)) {
    sharedLast = coords;
    return;
  }
  sharedLast = coords;
  for (const listener of sharedListeners) {
    listener(coords);
  }
}

function coordsFromBrowser(pos: GeolocationPosition): Coords {
  return {
    latitude: pos.coords.latitude,
    longitude: pos.coords.longitude,
    accuracy: pos.coords.accuracy ?? null,
    altitude: pos.coords.altitude ?? null,
    speed: pos.coords.speed ?? null,
    heading: pos.coords.heading ?? null,
  };
}

function coordsFromExpo(coords: Location.LocationObjectCoords): Coords {
  return {
    latitude: coords.latitude,
    longitude: coords.longitude,
    accuracy: coords.accuracy ?? null,
    altitude: coords.altitude ?? null,
    speed: coords.speed ?? null,
    heading: coords.heading ?? null,
  };
}

function startBrowserWatch() {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    throw new Error('geolocation_unavailable');
  }

  const geoOpts: PositionOptions = {
    enableHighAccuracy: true,
    maximumAge: 1000,
    timeout: 20_000,
  };

  const watchId = navigator.geolocation.watchPosition(
    (pos) => broadcast(coordsFromBrowser(pos)),
    () => {
      /* keep polling even if watch errors */
    },
    geoOpts,
  );

  /** Browsers often starve watchPosition while moving — poll as a backup. */
  const pollId = setInterval(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => broadcast(coordsFromBrowser(pos)),
      () => undefined,
      { enableHighAccuracy: true, maximumAge: 0, timeout: 12_000 },
    );
  }, 2500);

  navigator.geolocation.getCurrentPosition(
    (pos) => broadcast(coordsFromBrowser(pos)),
    () => undefined,
    { enableHighAccuracy: true, maximumAge: 0, timeout: 15_000 },
  );

  return () => {
    navigator.geolocation.clearWatch(watchId);
    clearInterval(pollId);
  };
}

async function startExpoWatch() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('permission_denied');
  }

  const first = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });
  broadcast(coordsFromExpo(first.coords));

  const watch = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.High,
      distanceInterval: 3,
      timeInterval: 2000,
    },
    (pos) => broadcast(coordsFromExpo(pos.coords)),
  );

  const pollId = setInterval(() => {
    void Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    })
      .then((pos) => broadcast(coordsFromExpo(pos.coords)))
      .catch(() => undefined);
  }, 3000);

  return () => {
    watch.remove();
    clearInterval(pollId);
  };
}

async function ensureSharedWatch() {
  if (sharedStop) return;
  if (sharedStarting) {
    await sharedStarting;
    return;
  }

  sharedStarting = (async () => {
    try {
      if (Platform.OS === 'web') {
        sharedStop = startBrowserWatch();
      } else {
        sharedStop = await startExpoWatch();
      }
    } finally {
      sharedStarting = null;
    }
  })();

  await sharedStarting;
}

function subscribeShared(listener: SharedListener) {
  sharedListeners.add(listener);
  if (sharedLast) listener(sharedLast);

  void ensureSharedWatch().catch(() => {
    /* caller handles empty stream via demo fallback */
  });

  return () => {
    sharedListeners.delete(listener);
    if (sharedListeners.size === 0 && sharedStop) {
      sharedStop();
      sharedStop = null;
      sharedLast = null;
    }
  };
}

/**
 * Temporary stand-in for collar GPS: uses the phone / browser geolocation.
 * When collar API is ready, flip EXPO_PUBLIC_LOCATION_MODE=api.
 * Falls back to demo SPb point if permission is denied.
 */
export function createDeviceCollarLocationProvider(): CollarLocationProvider {
  const fallback = createDemoCollarLocationProvider();

  const toSnapshot = (
    options: CollarLocationSubscribeOptions,
    coords: Coords,
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
        if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.geolocation) {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              maximumAge: 0,
              timeout: 15_000,
            });
          });
          return toSnapshot(options, coordsFromBrowser(pos));
        }

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          return fallback.getCurrent(options);
        }
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        return toSnapshot(options, coordsFromExpo(pos.coords));
      } catch {
        return fallback.getCurrent(options);
      }
    },
    subscribe(options, listener: CollarLocationListener) {
      let cancelled = false;
      let unsubShared: (() => void) | null = null;
      let fallbackUnsub: (() => void) | null = null;
      let sawFix = false;

      const failSafe = setTimeout(() => {
        if (cancelled || sawFix) return;
        fallbackUnsub = fallback.subscribe(options, listener);
      }, 12_000);

      unsubShared = subscribeShared((coords) => {
        if (cancelled) return;
        sawFix = true;
        clearTimeout(failSafe);
        fallbackUnsub?.();
        fallbackUnsub = null;
        listener(toSnapshot(options, coords));
      });

      return () => {
        cancelled = true;
        clearTimeout(failSafe);
        unsubShared?.();
        fallbackUnsub?.();
      };
    },
  };
}
