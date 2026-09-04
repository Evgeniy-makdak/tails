/**
 * Free raster tiles for MapLibre / future native map.
 * Attribution required on the map UI when MAP_ENGINE=maplibre.
 *
 * Carto Voyager — sharp, colourful, free for reasonable use with OSM/Carto credit.
 * @see https://carto.com/basemaps
 */
export const CARTO_VOYAGER_TILES = {
  id: 'carto-voyager',
  urlTemplate: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
  subdomains: ['a', 'b', 'c', 'd'],
  tileSize: 256,
  maxZoom: 20,
  attribution: '© OpenStreetMap contributors © CARTO',
} as const;

/** Lighter style closer to Хвостик paper UI */
export const CARTO_POSITRON_TILES = {
  id: 'carto-positron',
  urlTemplate: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  subdomains: ['a', 'b', 'c', 'd'],
  tileSize: 256,
  maxZoom: 20,
  attribution: '© OpenStreetMap contributors © CARTO',
} as const;

export const DEFAULT_TILES = CARTO_VOYAGER_TILES;

/** MapLibre-style sources stub — fill when wiring maplibre-gl */
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
