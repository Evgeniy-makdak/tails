import { DEMO_PET_COORDINATES } from '../location';
import { DEFAULT_MAP_STYLE_URL, DEFAULT_TILES } from './tiles';
import type { MapCamera } from './types';

export const mapConfig = {
  /** OpenFreeMap Liberty (vector) — free, no API key. */
  styleUrl: DEFAULT_MAP_STYLE_URL,
  /** Raster fallback metadata (tests / offline stubs). */
  tiles: DEFAULT_TILES,
  /** Default camera before first GPS fix (SPb). */
  defaultCamera: {
    center: {
      latitude: DEMO_PET_COORDINATES.latitude,
      longitude: DEMO_PET_COORDINATES.longitude,
    },
    zoom: 15,
  } satisfies MapCamera,
  minZoom: 12,
  maxZoom: 19,
} as const;
