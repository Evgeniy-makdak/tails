import { LOCATION_MODE } from '../config/features';
import type { CollarLocationProvider } from './CollarLocationProvider';
import { createApiCollarLocationProvider } from './providers/apiCollar';
import { createDemoCollarLocationProvider } from './providers/demoCollar';
import { createDeviceCollarLocationProvider } from './providers/deviceGps';

let singleton: CollarLocationProvider | null = null;

export function getCollarLocationProvider(): CollarLocationProvider {
  if (!singleton) {
    if (LOCATION_MODE === 'api') {
      singleton = createApiCollarLocationProvider();
    } else if (LOCATION_MODE === 'device') {
      singleton = createDeviceCollarLocationProvider();
    } else {
      singleton = createDemoCollarLocationProvider();
    }
  }
  return singleton;
}

/** Test helper — reset after changing env in tests. */
export function resetCollarLocationProvider() {
  singleton = null;
}
