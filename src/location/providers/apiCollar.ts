import { fetchCollarLocation } from '../../api/collar';
import type { CollarLocationProvider } from '../CollarLocationProvider';
import type { CollarLocationListener, CollarLocationSubscribeOptions } from '../types';
import { createDemoCollarLocationProvider } from './demoCollar';

/**
 * Ready for collar backend. Until API exists, falls back to demo so UI never breaks.
 * Flip EXPO_PUBLIC_LOCATION_MODE=api when endpoint is live.
 */
export function createApiCollarLocationProvider(): CollarLocationProvider {
  const fallback = createDemoCollarLocationProvider();

  return {
    id: 'api',
    async getCurrent(options) {
      try {
        const remote = await fetchCollarLocation(options);
        if (remote) {
          return remote;
        }
      } catch {
        // keep demo fallback
      }
      return fallback.getCurrent(options);
    },
    subscribe(options, listener: CollarLocationListener) {
      const intervalMs = options.intervalMs ?? 4000;
      let stopped = false;

      const tick = async () => {
        if (stopped) {
          return;
        }
        try {
          const remote = await fetchCollarLocation(options);
          if (!stopped) {
            listener(remote ?? (await fallback.getCurrent(options)));
          }
        } catch {
          if (!stopped) {
            listener(await fallback.getCurrent(options));
          }
        }
      };

      void tick();
      const timer = setInterval(() => {
        void tick();
      }, intervalMs);

      return () => {
        stopped = true;
        clearInterval(timer);
      };
    },
  };
}
