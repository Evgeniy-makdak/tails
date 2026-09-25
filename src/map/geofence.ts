import type { MapCircle, MapLatLng, MapPolyline } from './types';

const EARTH_RADIUS_M = 6371008.8;

export type GeofenceKind = 'allowed' | 'forbidden' | 'home';

/** Destination point from start, distance (m) and bearing (deg clockwise from north). */
export function offsetPoint(start: MapLatLng, distanceM: number, bearingDeg: number): MapLatLng {
  const δ = distanceM / EARTH_RADIUS_M;
  const θ = (bearingDeg * Math.PI) / 180;
  const φ1 = (start.latitude * Math.PI) / 180;
  const λ1 = (start.longitude * Math.PI) / 180;
  const sinφ1 = Math.sin(φ1);
  const cosφ1 = Math.cos(φ1);
  const sinδ = Math.sin(δ);
  const cosδ = Math.cos(δ);
  const sinφ2 = sinφ1 * cosδ + cosφ1 * sinδ * Math.cos(θ);
  const φ2 = Math.asin(sinφ2);
  const λ2 = λ1 + Math.atan2(Math.sin(θ) * sinδ * cosφ1, cosδ - sinφ1 * sinφ2);
  return {
    latitude: (φ2 * 180) / Math.PI,
    longitude: (((λ2 * 180) / Math.PI + 540) % 360) - 180,
  };
}

/** Approximate geodesic circle as GeoJSON polygon (lon, lat rings). */
export function circleToLonLatRing(center: MapLatLng, radiusM: number, steps = 64): [number, number][] {
  const ring: [number, number][] = [];
  for (let i = 0; i <= steps; i += 1) {
    const p = offsetPoint(center, radiusM, (i / steps) * 360);
    ring.push([p.longitude, p.latitude]);
  }
  return ring;
}

export function circleToGeoJSON(center: MapLatLng, radiusM: number, steps = 64) {
  return {
    type: 'Feature' as const,
    properties: {},
    geometry: {
      type: 'Polygon' as const,
      coordinates: [circleToLonLatRing(center, radiusM, steps)],
    },
  };
}

export function lineToGeoJSON(coordinates: MapLatLng[]) {
  return {
    type: 'Feature' as const,
    properties: {},
    geometry: {
      type: 'LineString' as const,
      coordinates: coordinates.map((c) => [c.longitude, c.latitude] as [number, number]),
    },
  };
}

/** Default “allowed” geofence around pet — ready for real zones from API later. */
export function buildAllowedZoneCircle(
  center: MapLatLng,
  radiusM = 120,
  id = 'zone-allowed',
): MapCircle {
  return {
    id,
    center,
    radiusM,
    color: 'rgba(31,157,85,0.18)',
    strokeColor: 'rgba(31,157,85,0.55)',
  };
}

export function buildForbiddenZoneCircle(
  center: MapLatLng,
  radiusM: number,
  id = 'zone-forbidden',
): MapCircle {
  return {
    id,
    center,
    radiusM,
    color: 'rgba(220,60,60,0.16)',
    strokeColor: 'rgba(220,60,60,0.55)',
  };
}

/** Short demo trail ending at pet — placeholder until collar path history arrives. */
export function buildApproachPolyline(center: MapLatLng, id = 'track-demo'): MapPolyline {
  const start = offsetPoint(center, 45, 210);
  const mid = offsetPoint(center, 22, 200);
  return {
    id,
    coordinates: [start, mid, center],
    color: '#E24B4A',
    width: 3,
  };
}
