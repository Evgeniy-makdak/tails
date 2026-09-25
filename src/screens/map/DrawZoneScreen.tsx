import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../components/ui/Button';
import { MAP_ENGINE } from '../../config/features';
import { useCollarLocation } from '../../location';
import {
  MapCanvas,
  ZoneResizeOverlay,
  boundsToPolygon,
  mapConfig,
  metersPerPixel,
  squareBoundsFromCenter,
} from '../../map';
import { useActivePet } from '../../store/useAppStore';
import { colors, radius, spacing, type } from '../../theme';
import type { AppStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<AppStackParamList, 'DrawZone'>;

const LIVE_MAP = MAP_ENGINE === 'maplibre';
const MIN_HALF_M = 40;
const MAX_HALF_M = 400;

export function DrawZoneScreen({ navigation, route }: Props) {
  const pet = useActivePet();
  const { point } = useCollarLocation({ petId: pet.id, collarId: pet.collarId });
  const [kind, setKind] = useState<'safe' | 'danger'>(route.params?.kind ?? 'safe');
  const [halfSideM, setHalfSideM] = useState(100);
  const [mapZoom, setMapZoom] = useState(16);
  const [followKey, setFollowKey] = useState(0);

  const center = point ?? mapConfig.defaultCamera.center;
  const bounds = useMemo(() => squareBoundsFromCenter(center, halfSideM), [center, halfSideM]);
  const polygons = useMemo(() => [boundsToPolygon(bounds, 'draft-zone', kind)], [bounds, kind]);
  const markers = useMemo(
    () => [{ id: 'pet', coordinate: center, kind: 'pet' as const }],
    [center],
  );

  const mpp = metersPerPixel(center.latitude, mapZoom);
  const sidePx = Math.max(64, Math.min(420, (halfSideM * 2) / mpp));

  const onResizePx = useCallback(
    (nextSidePx: number) => {
      const nextHalf = (nextSidePx * mpp) / 2;
      setHalfSideM(Math.min(MAX_HALF_M, Math.max(MIN_HALF_M, nextHalf)));
    },
    [mpp],
  );

  const stroke = kind === 'safe' ? colors.green : colors.red;
  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <SafeAreaView edges={['top']} style={styles.topChrome} pointerEvents="box-none">
        <View style={styles.header}>
          <Text style={styles.title}>Размер геозоны</Text>
          <Pressable onPress={() => navigation.goBack()} style={styles.close}>
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
        </View>
        <View style={styles.toggles}>
          <Pressable onPress={() => setKind('safe')} style={[styles.toggle, kind === 'safe' && styles.toggleOn]}>
            <Text style={[styles.toggleText, kind === 'safe' && styles.toggleTextOn]}>Безопасные</Text>
          </Pressable>
          <Pressable
            onPress={() => setKind('danger')}
            style={[styles.toggle, kind === 'danger' && styles.toggleOn]}
          >
            <Text style={[styles.toggleText, kind === 'danger' && styles.toggleTextOn]}>Опасные</Text>
          </Pressable>
        </View>
        <Text style={styles.hint}>Потяните углы квадрата, чтобы растянуть или сжать зону</Text>
      </SafeAreaView>

      <View style={styles.map}>
        {LIVE_MAP ? (
          <>
            <MapCanvas
              style={StyleSheet.absoluteFillObject}
              camera={{ center, zoom: mapZoom }}
              markers={markers}
              polygons={polygons}
              followKey={followKey}
            />
            <ZoneResizeOverlay
              sidePx={sidePx}
              strokeColor={stroke}
              fillColor="transparent"
              onResize={onResizePx}
            />          </>
        ) : (
          <View style={[styles.demoMap, { backgroundColor: '#D7E4D2' }]}>
            <View style={[styles.demoPoly, { borderColor: stroke, backgroundColor: kind === 'safe' ? 'rgba(31,157,85,0.22)' : 'rgba(226,75,74,0.22)' }]} />
          </View>
        )}

        <View style={styles.zoom} pointerEvents="box-none">
          <Pressable
            style={styles.zoomBtn}
            onPress={() => setMapZoom((z) => Math.min(mapConfig.maxZoom, Number((z + 0.5).toFixed(1))))}
          >
            <Ionicons name="add" size={18} color={colors.ink} />
          </Pressable>
          <Pressable
            style={styles.zoomBtn}
            onPress={() => setMapZoom((z) => Math.max(mapConfig.minZoom, Number((z - 0.5).toFixed(1))))}
          >
            <Ionicons name="remove" size={18} color={colors.ink} />
          </Pressable>
          <Pressable
            style={styles.zoomBtn}
            onPress={() => {
              setMapZoom(16);
              setFollowKey((k) => k + 1);
            }}
          >
            <Ionicons name="navigate" size={16} color={colors.purple} />
          </Pressable>
        </View>

        <View style={styles.sizePill}>
          <Text style={styles.sizeText}>~{Math.round(halfSideM * 2)} × {Math.round(halfSideM * 2)} м</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Button
          label="Далее"
          onPress={() =>
            navigation.navigate('CreatePlace', {
              kind,
              bounds,
            })
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#E8EEF2',
  },
  topChrome: {
    zIndex: 8,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: 8,
  },
  title: {
    ...type.subtitle,
    color: colors.ink,
  },
  close: {
    position: 'absolute',
    right: 20,
  },
  closeText: {
    fontSize: 20,
    color: colors.ink,
  },
  toggles: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: spacing.xl,
    marginBottom: 4,
  },
  toggle: {
    flex: 1,
    height: 40,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleOn: {
    borderColor: colors.purple,
    backgroundColor: colors.purpleSoft,
  },
  toggleText: {
    ...type.caption,
    color: colors.muted,
  },
  toggleTextOn: {
    color: colors.purple,
  },
  hint: {
    ...type.caption,
    color: colors.inkSoft,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: 8,
  },
  map: {
    flex: 1,
    position: 'relative',
  },
  demoMap: {
    flex: 1,
  },
  demoPoly: {
    position: 'absolute',
    top: '28%',
    left: '22%',
    width: '56%',
    height: '40%',
    borderRadius: 12,
    borderWidth: 3,
  },
  zoom: {
    position: 'absolute',
    right: 16,
    top: 24,
    gap: 8,
    zIndex: 10,
  },
  zoomBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: colors.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizePill: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: 16,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    zIndex: 10,
  },
  sizeText: {
    ...type.caption,
    color: colors.ink,
  },
  footer: {
    padding: 16,
    backgroundColor: colors.paper,
  },
});
