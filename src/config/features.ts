/**
 * Feature flags for map / collar location / live chat.
 *
 * IMPORTANT: Expo only inlines `process.env.EXPO_PUBLIC_*` with a static property access.
 * Dynamic `process.env[name]` stays empty in the web bundle and breaks Pages builds.
 */
export type LocationMode = 'demo' | 'api' | 'device';
export type MapEngine = 'demo' | 'maplibre';

/**
 * `device` = phone/browser GPS as stand-in for collar (default while collar API is not ready).
 * `api` = real collar HTTP/WS.
 * `demo` = fixed SPb point.
 */
export const LOCATION_MODE: LocationMode =
  process.env.EXPO_PUBLIC_LOCATION_MODE === 'api'
    ? 'api'
    : process.env.EXPO_PUBLIC_LOCATION_MODE === 'demo'
      ? 'demo'
      : 'device';

/**
 * `maplibre` = real OpenFreeMap tiles via MapLibre (default).
 * `demo` = painted green Figma mock.
 */
export const MAP_ENGINE: MapEngine =
  process.env.EXPO_PUBLIC_MAP_ENGINE === 'demo' ? 'demo' : 'maplibre';

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
  /**
   * Phone GPS is used only as temporary pet position until collar telemetry is live.
   * Product target remains collar-only (`LOCATION_MODE=api`).
   */
  ownerPhoneGps: LOCATION_MODE === 'device',
  chatLive: CHAT_LIVE,
  apiBaseUrl: API_BASE_URL,
} as const;

export function toWsBaseUrl(httpBase: string) {
  if (httpBase.startsWith('https://')) return `wss://${httpBase.slice('https://'.length)}`;
  if (httpBase.startsWith('http://')) return `ws://${httpBase.slice('http://'.length)}`;
  return httpBase;
}
