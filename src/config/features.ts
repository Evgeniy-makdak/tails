/**
 * Feature flags for map / collar location.
 * Demo stays default until product decision — do not flip in production without QA.
 */
export type LocationMode = 'demo' | 'api';
export type MapEngine = 'demo' | 'maplibre';

function readEnv(name: string): string | undefined {
  try {
    return (process.env as Record<string, string | undefined>)[name];
  } catch {
    return undefined;
  }
}

/** `demo` = current mock map + fake collar coords. `api` = collar HTTP/WS (when ready). */
export const LOCATION_MODE: LocationMode =
  readEnv('EXPO_PUBLIC_LOCATION_MODE') === 'api' ? 'api' : 'demo';

/**
 * `demo` = painted green map (current UI).
 * `maplibre` = real tiles (Carto) — engine stubs exist; enable only after MapLibre is wired.
 */
export const MAP_ENGINE: MapEngine =
  readEnv('EXPO_PUBLIC_MAP_ENGINE') === 'maplibre' ? 'maplibre' : 'demo';

export const features = {
  locationMode: LOCATION_MODE,
  mapEngine: MAP_ENGINE,
  /** Owner phone GPS is intentionally out of scope — only collar/pet location. */
  ownerPhoneGps: false as const,
} as const;
