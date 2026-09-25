import type { MapCamera, MapCircle, MapLatLng, MapMarker, MapPolygon, MapPolyline } from './types';

/** Serializable snapshot pushed into MapLibre (web DOM or native WebView). */
export type MapScene = {
  camera: MapCamera;
  markers: MapMarker[];
  circles: MapCircle[];
  polylines: MapPolyline[];
  polygons: MapPolygon[];
  follow: boolean;
};

export const CIRCLES_SOURCE = 'hvostik-circles';
export const CIRCLES_FILL = 'hvostik-circles-fill';
export const CIRCLES_LINE = 'hvostik-circles-line';
export const LINES_SOURCE = 'hvostik-lines';
export const LINES_LAYER = 'hvostik-lines-layer';

export function lonLat(c: MapLatLng): [number, number] {
  return [c.longitude, c.latitude];
}

export function circlesToFeatureCollection(circles: MapCircle[]) {
  const EARTH = 6371008.8;
  const features = circles.map((circle) => {
    const steps = 64;
    const ring: [number, number][] = [];
    for (let i = 0; i <= steps; i += 1) {
      const bearing = (i / steps) * 2 * Math.PI;
      const δ = circle.radiusM / EARTH;
      const φ1 = (circle.center.latitude * Math.PI) / 180;
      const λ1 = (circle.center.longitude * Math.PI) / 180;
      const sinφ2 =
        Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(bearing);
      const φ2 = Math.asin(sinφ2);
      const λ2 =
        λ1 +
        Math.atan2(
          Math.sin(bearing) * Math.sin(δ) * Math.cos(φ1),
          Math.cos(δ) - Math.sin(φ1) * sinφ2,
        );
      ring.push([(((λ2 * 180) / Math.PI + 540) % 360) - 180, (φ2 * 180) / Math.PI]);
    }
    return {
      type: 'Feature' as const,
      id: circle.id,
      properties: {
        id: circle.id,
        color: circle.color,
        strokeColor: circle.strokeColor || circle.color,
      },
      geometry: { type: 'Polygon' as const, coordinates: [ring] },
    };
  });
  return { type: 'FeatureCollection' as const, features };
}

export function polygonsToFeatureCollection(polygons: MapPolygon[]) {
  return {
    type: 'FeatureCollection' as const,
    features: polygons.map((poly) => {
      const ring = poly.ring.map(lonLat);
      const first = ring[0];
      const last = ring[ring.length - 1];
      if (
        first &&
        last &&
        (first[0] !== last[0] || first[1] !== last[1])
      ) {
        ring.push([first[0], first[1]]);
      }
      return {
        type: 'Feature' as const,
        id: poly.id,
        properties: {
          id: poly.id,
          color: poly.color,
          strokeColor: poly.strokeColor || poly.color,
        },
        geometry: { type: 'Polygon' as const, coordinates: [ring] },
      };
    }),
  };
}

export function mergeFeatureCollections(
  ...collections: { type: 'FeatureCollection'; features: readonly unknown[] }[]
) {
  return {
    type: 'FeatureCollection' as const,
    features: collections.flatMap((c) => [...c.features]),
  };
}

export function polylinesToFeatureCollection(polylines: MapPolyline[]) {
  return {
    type: 'FeatureCollection' as const,
    features: polylines.map((line) => ({
      type: 'Feature' as const,
      id: line.id,
      properties: {
        id: line.id,
        color: line.color,
        width: line.width ?? 3,
      },
      geometry: {
        type: 'LineString' as const,
        coordinates: line.coordinates.map(lonLat),
      },
    })),
  };
}

export function markerColor(kind: MapMarker['kind']): string {
  if (kind === 'sos-ghost') return '#E24B4A';
  if (kind === 'pet') return '#8B7FFF';
  return '#5B5B5B';
}
