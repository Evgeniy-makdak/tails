/**
 * Feature flags for map / collar location / live chat.
 * Demo stays default until product decision — do not flip in production without QA.
 *
 * IMPORTANT: Expo only inlines `process.env.EXPO_PUBLIC_*` with a static property access.
 * Dynamic `process.env[name]` stays empty in the web bundle and breaks Pages builds.
 */
export type LocationMode = 'demo' | 'api';
export type MapEngine = 'demo' | 'maplibre';

/** `demo` = current mock map + fake collar coords. `api` = collar HTTP/WS (when ready). */
export const LOCATION_MODE: LocationMode =
  process.env.EXPO_PUBLIC_LOCATION_MODE === 'api' ? 'api' : 'demo';

/**
 * `demo` = painted green map (current UI).
 * `maplibre` = real tiles (Carto) — engine stubs exist; enable only after MapLibre is wired.
 */
export const MAP_ENGINE: MapEngine =
  process.env.EXPO_PUBLIC_MAP_ENGINE === 'maplibre' ? 'maplibre' : 'demo';

/** Live operator chat via Tailio server WebSocket. Default ON; set EXPO_PUBLIC_CHAT_LIVE=0 for fake demo. */
export const CHAT_LIVE = process.env.EXPO_PUBLIC_CHAT_LIVE !== '0';

/** Base URL of Tailio Node server (REST + WS). */
export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8787').replace(
  /\/$/,
  '',
);

export const features = {
  locationMode: LOCATION_MODE,
  mapEngine: MAP_ENGINE,
  /** Owner phone GPS is intentionally out of scope — only collar/pet location. */
  ownerPhoneGps: false as const,
  chatLive: CHAT_LIVE,
  apiBaseUrl: API_BASE_URL,
} as const;

export function toWsBaseUrl(httpBase: string) {
  if (httpBase.startsWith('https://')) return `wss://${httpBase.slice('https://'.length)}`;
  if (httpBase.startsWith('http://')) return `ws://${httpBase.slice('http://'.length)}`;
  return httpBase;
}
