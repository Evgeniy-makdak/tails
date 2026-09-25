/**
 * Free basemap config for MapLibre.
 * Primary: OpenFreeMap Liberty (vector, no API key, OSM attribution auto via MapLibre).
 * Fallback: CARTO raster Voyager if vector style URL is overridden.
 *
 * @see https://openfreemap.org/quick_start/
 */
export const OPENFREEMAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

/** Softer light style — closer to Хвостик paper UI */
export const OPENFREEMAP_POSITRON_STYLE_URL = 'https://tiles.openfreemap.org/styles/positron';

export const DEFAULT_MAP_STYLE_URL = OPENFREEMAP_STYLE_URL;

/**
 * Free raster tiles (Carto) — used only if a consumer needs raster MapLibre style object
 * (e.g. offline stub). Prefer DEFAULT_MAP_STYLE_URL for live maps.
 */
export const CARTO_VOYAGER_TILES = {
  id: 'carto-voyager',
  urlTemplate: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
  subdomains: ['a', 'b', 'c', 'd'],
  tileSize: 256,
  maxZoom: 20,
  attribution: '© OpenStreetMap contributors © CARTO',
} as const;

export const CARTO_POSITRON_TILES = {
  id: 'carto-positron',
  urlTemplate: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  subdomains: ['a', 'b', 'c', 'd'],
  tileSize: 256,
  maxZoom: 20,
  attribution: '© OpenStreetMap contributors © CARTO',
} as const;

export const DEFAULT_TILES = CARTO_VOYAGER_TILES;

/** Build an inline MapLibre style from raster tiles (fallback / tests). */
export function buildRasterStyle(tiles = DEFAULT_TILES) {
  return {
    version: 8 as const,
    sources: {
      [tiles.id]: {
        type: 'raster' as const,
        tiles: tiles.subdomains.map(
          (s) => tiles.urlTemplate.replace('{s}', s).replace('{r}', ''),
        ),
        tileSize: tiles.tileSize,
        attribution: tiles.attribution,
      },
    },
    layers: [
      {
        id: `${tiles.id}-layer`,
        type: 'raster' as const,
        source: tiles.id,
      },
    ],
  };
}
