import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, type } from '../../theme';
import type { MapCanvasProps } from '../types';

/**
 * Stub for native MapLibre / maps. Choose package when leaving Expo Go constraints:
 *   maplibre-react-native  OR  react-native-maps + same Carto raster tiles
 */
export function MapLibreCanvas(_props: MapCanvasProps): ReactNode {
  return (
    <View style={styles.stub}>
      <Text style={styles.title}>MapLibre (native) — ещё не подключён</Text>
      <Text style={styles.copy}>Демо-карта остаётся активной, пока MAP_ENGINE=demo.</Text>
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
