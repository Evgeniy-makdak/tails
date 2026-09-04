import { DEMO_PET_COORDINATES } from '../location';
import { DEFAULT_TILES } from './tiles';
import type { MapCamera } from './types';

export const mapConfig = {
  tiles: DEFAULT_TILES,
  /** Default camera = current demo pet point (SPb). */
  defaultCamera: {
    center: {
      latitude: DEMO_PET_COORDINATES.latitude,
      longitude: DEMO_PET_COORDINATES.longitude,
    },
    zoom: 15,
  } satisfies MapCamera,
  /**
   * When true, MapCanvas uses MapLibre (after packages are installed).
   * Controlled by EXPO_PUBLIC_MAP_ENGINE — leave `demo` for GitHub Pages until ready.
   */
  preferMapLibrePackages: {
    web: 'maplibre-gl',
    /** Decide later: maplibre-react-native vs react-native-maps */
    native: 'maplibre-react-native',
  },
} as const;
