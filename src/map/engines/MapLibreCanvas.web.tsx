import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, type } from '../../theme';
import type { MapCanvasProps } from '../types';

/**
 * Stub for MapLibre on web. Install later:
 *   npm i maplibre-gl
 * Then replace this body with a MapLibre map using buildRasterStyle() from tiles.ts.
 * Do not enable EXPO_PUBLIC_MAP_ENGINE=maplibre until this file is implemented.
 */
export function MapLibreCanvas(_props: MapCanvasProps): ReactNode {
  return (
    <View style={styles.stub}>
      <Text style={styles.title}>MapLibre (web) — ещё не подключён</Text>
      <Text style={styles.copy}>Оставьте MAP_ENGINE=demo. Сюда войдут тайлы Carto Voyager.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stub: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
    padding: 24,
  },
  title: {
    ...type.subtitle,
    color: colors.ink,
    textAlign: 'center',
  },
  copy: {
    ...type.caption,
    color: colors.muted,
    marginTop: 8,
    textAlign: 'center',
  },
});
