/**
 * Expo only inlines `process.env.EXPO_PUBLIC_*` with static property access.
 * Dynamic `process.env[name]` stays empty in the web bundle.
 */
export type LocationMode = 'demo' | 'api' | 'device';
export type MapEngine = 'demo' | 'maplibre';

export const LOCATION_MODE: LocationMode =
  process.env.EXPO_PUBLIC_LOCATION_MODE === 'api'
    ? 'api'
    : process.env.EXPO_PUBLIC_LOCATION_MODE === 'demo'
      ? 'demo'
      : 'device';

export const MAP_ENGINE: MapEngine =
  process.env.EXPO_PUBLIC_MAP_ENGINE === 'demo' ? 'demo' : 'maplibre';

export const CHAT_LIVE = process.env.EXPO_PUBLIC_CHAT_LIVE !== '0';

export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8787').replace(
  /\/$/,
  '',
);

export const features = {
  locationMode: LOCATION_MODE,
  mapEngine: MAP_ENGINE,
  ownerPhoneGps: LOCATION_MODE === 'device',
  chatLive: CHAT_LIVE,
  apiBaseUrl: API_BASE_URL,
} as const;

export function toWsBaseUrl(httpBase: string) {
  if (httpBase.startsWith('https://')) return `wss://${httpBase.slice('https://'.length)}`;
  if (httpBase.startsWith('http://')) return `ws://${httpBase.slice('http://'.length)}`;
  return httpBase;
}
