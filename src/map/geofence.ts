import type { GeoZoneBounds } from '../data/auth';
import type { MapCircle, MapLatLng, MapPolygon, MapPolyline } from './types';

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

/** Approximate meters-per-pixel at a latitude and zoom (WebMercator). */
export function metersPerPixel(latitude: number, zoom: number): number {
  return (156543.03392 * Math.cos((latitude * Math.PI) / 180)) / 2 ** zoom;
}

/** Screen px east/south from map camera center → geographic offset. */
export function screenDeltaToLatLngDelta(
  dxPx: number,
  dyPx: number,
  cameraLat: number,
  zoom: number,
): { dLat: number; dLng: number } {
  const mpp = metersPerPixel(cameraLat, zoom);
  const metersEast = dxPx * mpp;
  const metersNorth = -dyPx * mpp; // screen Y grows downward
  const dLat = metersNorth / 110540;
  const dLng = metersEast / (111320 * Math.max(0.2, Math.cos((cameraLat * Math.PI) / 180)));
  return { dLat, dLng };
}

/** Geographic point relative to camera → screen px from viewport center. */
export function latLngDeltaToScreenPx(
  point: MapLatLng,
  camera: MapLatLng,
  zoom: number,
): { x: number; y: number } {
  const mpp = metersPerPixel(camera.latitude, zoom);
  const metersEast =
    (point.longitude - camera.longitude) *
    111320 *
    Math.max(0.2, Math.cos((camera.latitude * Math.PI) / 180));
  const metersNorth = (point.latitude - camera.latitude) * 110540;
  return { x: metersEast / mpp, y: -metersNorth / mpp };
}

/** Square geofence: halfSideM from center to each side. */
export function squareBoundsFromCenter(center: MapLatLng, halfSideM: number): GeoZoneBounds {
  const north = offsetPoint(center, halfSideM, 0).latitude;
  const south = offsetPoint(center, halfSideM, 180).latitude;
  const east = offsetPoint(center, halfSideM, 90).longitude;
  const west = offsetPoint(center, halfSideM, 270).longitude;
  return { north, south, east, west };
}

export function boundsCenter(bounds: GeoZoneBounds): MapLatLng {
  return {
    latitude: (bounds.north + bounds.south) / 2,
    longitude: (bounds.east + bounds.west) / 2,
  };
}

/** Half of the north–south extent in meters (approx). */
export function boundsHalfSideM(bounds: GeoZoneBounds): number {
  const center = boundsCenter(bounds);
  const north = { latitude: bounds.north, longitude: center.longitude };
  return haversineM(center, north);
}

export function haversineM(a: MapLatLng, b: MapLatLng): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function pointInBounds(point: MapLatLng, bounds: GeoZoneBounds): boolean {
  const minLng = Math.min(bounds.west, bounds.east);
  const maxLng = Math.max(bounds.west, bounds.east);
  return (
    point.latitude <= bounds.north &&
    point.latitude >= bounds.south &&
    point.longitude >= minLng &&
    point.longitude <= maxLng
  );
}

/** Positive = outside (meters to nearest edge); negative = inside. */
export function signedDistanceOutsideBoundsM(point: MapLatLng, bounds: GeoZoneBounds): number {
  const minLng = Math.min(bounds.west, bounds.east);
  const maxLng = Math.max(bounds.west, bounds.east);

  if (pointInBounds(point, bounds)) {
    const toNorth = haversineM(point, { latitude: bounds.north, longitude: point.longitude });
    const toSouth = haversineM(point, { latitude: bounds.south, longitude: point.longitude });
    const toEast = haversineM(point, { latitude: point.latitude, longitude: maxLng });
    const toWest = haversineM(point, { latitude: point.latitude, longitude: minLng });
    return -Math.min(toNorth, toSouth, toEast, toWest);
  }

  const clamped: MapLatLng = {
    latitude: Math.min(bounds.north, Math.max(bounds.south, point.latitude)),
    longitude: Math.min(maxLng, Math.max(minLng, point.longitude)),
  };
  return haversineM(point, clamped);
}

export function boundsToPolygon(
  bounds: GeoZoneBounds,
  id: string,
  kind: 'safe' | 'danger',
): MapPolygon {
  const ring: MapLatLng[] = [
    { latitude: bounds.north, longitude: bounds.west },
    { latitude: bounds.north, longitude: bounds.east },
    { latitude: bounds.south, longitude: bounds.east },
    { latitude: bounds.south, longitude: bounds.west },
  ];
  if (kind === 'safe') {
    return {
      id,
      ring,
      color: 'rgba(31,157,85,0.22)',
      strokeColor: 'rgba(31,157,85,0.7)',
    };
  }
  return {
    id,
    ring,
    color: 'rgba(226,75,74,0.22)',
    strokeColor: 'rgba(226,75,74,0.75)',
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
