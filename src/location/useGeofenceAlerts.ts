import { useEffect, useRef } from 'react';

import type { GeoZone } from '../data/auth';
import { pointInBounds, signedDistanceOutsideBoundsM } from '../map/geofence';
import { useActivePet, useAppStore } from '../store/useAppStore';
import { playDangerZoneEnterAlert, playSafeZoneExitAlert } from '../utils/zoneSounds';
import { useCollarLocation } from './useCollarLocation';

const DANGER_APPROACH_M = 25;
const ALERT_COOLDOWN_MS = 45_000;

type ZonePresence = {
  inside: boolean;
  approachingDanger: boolean;
  primed: boolean;
};

/**
 * Watches pet GPS against saved geozones and plays:
 * - soft chime when leaving a safe zone
 * - alarm when approaching / entering a danger zone
 */
export function useGeofenceAlerts(enabled = true) {
  const pet = useActivePet();
  const zones = useAppStore((s) => s.geozones);
  const { point } = useCollarLocation({
    petId: pet.id,
    collarId: pet.collarId,
    enabled,
  });

  const presenceRef = useRef<Map<string, ZonePresence>>(new Map());
  const lastAlertRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    if (!enabled || !point) return;

    const now = Date.now();
    const withBounds = zones.filter((z): z is GeoZone & { bounds: NonNullable<GeoZone['bounds']> } =>
      Boolean(z.bounds),
    );

    for (const zone of withBounds) {
      const inside = pointInBounds(point, zone.bounds);
      const distOut = signedDistanceOutsideBoundsM(point, zone.bounds);
      const approachingDanger =
        zone.kind === 'danger' && !inside && distOut > 0 && distOut <= DANGER_APPROACH_M;

      const prev = presenceRef.current.get(zone.id);

      if (!prev || !prev.primed) {
        presenceRef.current.set(zone.id, { inside, approachingDanger, primed: true });
        continue;
      }

      const alertKey = (kind: string) => `${zone.id}:${kind}`;
      const canAlert = (kind: string) => {
        const last = lastAlertRef.current.get(alertKey(kind)) ?? 0;
        return now - last > ALERT_COOLDOWN_MS;
      };
      const markAlert = (kind: string) => {
        lastAlertRef.current.set(alertKey(kind), now);
      };

      if (zone.kind === 'safe' && prev.inside && !inside && canAlert('safe-exit')) {
        markAlert('safe-exit');
        void playSafeZoneExitAlert();
      }

      if (zone.kind === 'danger') {
        const entered = !prev.inside && inside;
        const startedApproach = !prev.approachingDanger && approachingDanger;
        if ((entered || startedApproach) && canAlert('danger')) {
          markAlert('danger');
          void playDangerZoneEnterAlert();
        }
      }

      presenceRef.current.set(zone.id, { inside, approachingDanger, primed: true });
    }

    const ids = new Set(withBounds.map((z) => z.id));
    for (const id of presenceRef.current.keys()) {
      if (!ids.has(id)) presenceRef.current.delete(id);
    }
  }, [enabled, point, zones]);
}
