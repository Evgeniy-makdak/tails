import { useEffect, useState } from 'react';

import { getCollarLocationProvider } from './createCollarLocationProvider';
import type { CollarLocationSnapshot } from './types';

type Options = {
  petId: string;
  collarId?: string;
  intervalMs?: number;
  enabled?: boolean;
};

/**
 * Subscribe to collar (pet) location only — never owner phone GPS.
 * In demo mode returns the same fixed point shown today on MapScreen.
 */
export function useCollarLocation({ petId, collarId, intervalMs, enabled = true }: Options) {
  const [snapshot, setSnapshot] = useState<CollarLocationSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !petId) {
      setSnapshot(null);
      return;
    }

    const provider = getCollarLocationProvider();
    setError(null);

    try {
      return provider.subscribe({ petId, collarId, intervalMs }, (next) => {
        setSnapshot(next);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'location_error');
      return undefined;
    }
  }, [petId, collarId, intervalMs, enabled]);

  return {
    snapshot,
    point: snapshot?.point ?? null,
    online: snapshot?.online ?? false,
    source: snapshot?.source,
    error,
    coordsLabel: snapshot
      ? `${snapshot.point.latitude.toFixed(4)}, ${snapshot.point.longitude.toFixed(4)}`
      : null,
  };
}
