import { LOCATION_MODE } from '../config/features';
import type { CollarLocationProvider } from './CollarLocationProvider';
import { createApiCollarLocationProvider } from './providers/apiCollar';
import { createDemoCollarLocationProvider } from './providers/demoCollar';

let singleton: CollarLocationProvider | null = null;

export function getCollarLocationProvider(): CollarLocationProvider {
  if (!singleton) {
    singleton = LOCATION_MODE === 'api' ? createApiCollarLocationProvider() : createDemoCollarLocationProvider();
  }
  return singleton;
}

/** Test helper — reset after changing env in tests. */
export function resetCollarLocationProvider() {
  singleton = null;
}
