import { fetchCollarLocation } from '../../api/collar';
import type { CollarLocationProvider } from '../CollarLocationProvider';
import type { CollarLocationListener, CollarLocationSubscribeOptions } from '../types';

export function createApiCollarLocationProvider(): CollarLocationProvider {
  return {
    id: 'api',
    async getCurrent(options) {
      try {
        return await fetchCollarLocation(options);
      } catch {
        return null;
      }
    },
    subscribe(options, listener: CollarLocationListener) {
      const intervalMs = options.intervalMs ?? 5000;
      let stopped = false;
      let last: Awaited<ReturnType<typeof fetchCollarLocation>> = null;

      const tick = async () => {
        if (stopped) return;
        try {
          const remote = await fetchCollarLocation(options);
          if (stopped) return;
          if (remote) {
            last = remote;
            listener(remote);
            return;
          }
          listener(last);
        } catch {
          if (!stopped) listener(last);
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
