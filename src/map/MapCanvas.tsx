import type { ReactNode } from 'react';

import { MAP_ENGINE } from '../config/features';
import { DemoMapSurface } from './DemoMapSurface';
import { MapLibreCanvas } from './engines/MapLibreCanvas';
import type { MapCanvasProps } from './types';

/**
 * Single entry for map rendering.
 * - demo (default): current green mock — unchanged UX
 * - maplibre: real tiles (stubs until packages are added)
 */
export function MapCanvas({
  previewScale = 1,
  children,
  style,
  ...props
}: MapCanvasProps & { children?: ReactNode }) {
  if (MAP_ENGINE === 'maplibre') {
    return (
      <MapLibreCanvas previewScale={previewScale} style={style} {...props}>
        {children}
      </MapLibreCanvas>
    );
  }

  return (
    <DemoMapSurface previewScale={previewScale} style={style}>
      {children}
    </DemoMapSurface>
  );
}
