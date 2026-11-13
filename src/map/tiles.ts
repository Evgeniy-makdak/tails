export const OPENFREEMAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

export const OPENFREEMAP_POSITRON_STYLE_URL = 'https://tiles.openfreemap.org/styles/positron';

export const DEFAULT_MAP_STYLE_URL = OPENFREEMAP_STYLE_URL;

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
