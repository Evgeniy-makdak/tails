import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TailioBlob } from '../../components/brand/TailioMark';
import { Button } from '../../components/ui/Button';
import { InAppSheet } from '../../components/ui/InAppSheet';
import { MAP_ENGINE } from '../../config/features';
import type { GeoZone } from '../../data/auth';
import { useCollarLocation } from '../../location';
import {
  MapCanvas,
  boundsCenter,
  boundsToPolygon,
  mapConfig,
} from '../../map';
import { useActivePet, useAppStore } from '../../store/useAppStore';
import { colors, radius, spacing, type } from '../../theme';
import type { AppStackParamList } from '../../types/navigation';

type Filter = 'all' | 'safe' | 'danger';

type Props = NativeStackScreenProps<AppStackParamList, 'Geozones'>;

const LIVE_MAP = MAP_ENGINE === 'maplibre';

export function GeozonesScreen({ navigation }: Props) {
  const [filter, setFilter] = useState<Filter>('all');
  const [hint, setHint] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const zones = useAppStore((state) => state.geozones);
  const removeGeozone = useAppStore((state) => state.removeGeozone);
  const pet = useActivePet();
  const { point } = useCollarLocation({ petId: pet.id, collarId: pet.collarId });
  const items = zones.filter((item) => filter === 'all' || item.kind === filter);
  const selected = zones.find((z) => z.id === selectedId) ?? null;

  const center = useMemo(() => {
    const withBounds = items.find((z) => z.bounds)?.bounds;
    if (withBounds) return boundsCenter(withBounds);
    return point ?? mapConfig.defaultCamera.center;
  }, [items, point]);

  const polygons = useMemo(
    () =>
      items
        .filter((z) => z.bounds)
        .map((z) => boundsToPolygon(z.bounds!, z.id, z.kind)),
    [items],
  );

  const markers = useMemo(
    () =>
      point
        ? [{ id: 'pet', coordinate: point, kind: 'pet' as const }]
        : [{ id: 'pet', coordinate: center, kind: 'pet' as const }],
    [point, center],
  );

  const openZone = (zone: GeoZone) => {
    setConfirmDelete(false);
    setSelectedId(zone.id);
  };

  const closeSheet = () => {
    setSelectedId(null);
    setConfirmDelete(false);
  };

  const startEdit = () => {
    if (!selected) return;
    const id = selected.id;
    const kind = selected.kind;
    closeSheet();
    navigation.navigate('DrawZone', { zoneId: id, kind });
  };

  const doDelete = () => {
    if (!selected) return;
    removeGeozone(selected.id);
    closeSheet();
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.back}>←</Text>
        </Pressable>
        <Text style={styles.title}>Дом и геозоны</Text>
        <Pressable onPress={() => navigation.navigate('DrawZone', { kind: 'safe' })}>
          <Ionicons name="add" size={24} color={colors.ink} />
        </Pressable>
      </View>

      <View style={styles.tabs}>
        {(
          [
            ['all', 'Все'],
            ['safe', 'Безопасные'],
            ['danger', 'Опасные'],
          ] as const
        ).map(([key, label]) => (
          <Pressable key={key} onPress={() => setFilter(key)} style={[styles.tab, filter === key && styles.tabOn]}>
            <Text style={[styles.tabText, filter === key && styles.tabTextOn]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      {LIVE_MAP ? (
        <View style={styles.mapCard}>
          <MapCanvas
            style={styles.map}
            camera={{ center, zoom: 15 }}
            markers={markers}
            polygons={polygons}
          />
          {polygons.length === 0 ? (
            <View style={styles.mapEmpty} pointerEvents="none">
              <Text style={styles.mapEmptyText}>Пока нет зон на карте — создайте первую</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      <ScrollView contentContainerStyle={styles.list}>
        {items.length === 0 ? (
          <View style={styles.empty}>
            <TailioBlob size={120} />
            <Button label="+ Создать" onPress={() => setHint(true)} />
          </View>
        ) : (
          items.map((item) => (
            <Pressable
              key={item.id}
              style={[styles.card, item.kind === 'safe' ? styles.safe : styles.danger]}
              onPress={() => openZone(item)}
            >
              <View style={styles.cardText}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Ionicons name="ellipsis-horizontal" size={18} color={colors.inkSoft} />
                </View>
                <Text style={styles.cardMeta}>{item.address}</Text>
                <Text style={styles.cardMeta}>
                  {item.kind === 'safe' ? 'Безопасная' : 'Опасная'}
                  {item.bounds ? ' · на карте' : ' · без координат'}
                </Text>
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>

      <View style={styles.fabWrap}>
        <Button label="+ Создать" onPress={() => setHint(true)} />
      </View>

      <InAppSheet visible={hint} onClose={() => setHint(false)}>
        <Text style={styles.sheetTitle}>Безопасные и опасные зоны</Text>
        <Text style={styles.cardMeta}>
          Нарисуйте квадрат на карте. Выход из безопасной зоны — мягкий сигнал; приближение и вход в
          опасную — тревожный. Сохранённые зоны можно изменить или удалить.
        </Text>
        <Button
          label="Создать"
          onPress={() => {
            setHint(false);
            navigation.navigate('DrawZone', { kind: 'safe' });
          }}
        />
      </InAppSheet>

      <InAppSheet visible={Boolean(selected) && !confirmDelete} onClose={closeSheet}>
        <Text style={styles.sheetTitle}>{selected?.title ?? 'Зона'}</Text>
        <Text style={styles.cardMeta}>
          {selected?.address}
          {'\n'}
          {selected?.kind === 'safe' ? 'Безопасная' : 'Опасная'}
          {selected?.bounds ? ' · на карте' : ' · без координат'}
        </Text>
        <Button label="Изменить на карте" onPress={startEdit} />
        <Pressable
          style={styles.deleteBtn}
          onPress={() => setConfirmDelete(true)}
          accessibilityRole="button"
          accessibilityLabel="Удалить зону"
        >
          <Ionicons name="trash-outline" size={18} color={colors.red} />
          <Text style={styles.deleteText}>Удалить зону</Text>
        </Pressable>
      </InAppSheet>

      <InAppSheet visible={Boolean(selected) && confirmDelete} onClose={() => setConfirmDelete(false)}>
        <Text style={styles.sheetTitle}>Удалить «{selected?.title}»?</Text>
        <Text style={styles.cardMeta}>
          Зона исчезнет с карты, сигнализация по ней перестанет срабатывать. Это действие нельзя
          отменить.
        </Text>
        <Button label="Удалить" onPress={doDelete} />
        <Pressable style={styles.cancelBtn} onPress={() => setConfirmDelete(false)}>
          <Text style={styles.cancelText}>Отмена</Text>
        </Pressable>
      </InAppSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.paper,
    position: 'relative',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: 8,
  },
  back: {
    fontSize: 22,
    color: colors.ink,
    width: 28,
  },
  title: {
    ...type.subtitle,
    color: colors.ink,
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: spacing.xl,
    marginBottom: 12,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
  },
  tabOn: {
    borderColor: colors.purple,
    backgroundColor: colors.purpleSoft,
  },
  tabText: {
    ...type.caption,
    color: colors.muted,
  },
  tabTextOn: {
    color: colors.purple,
  },
  mapCard: {
    height: 220,
    marginHorizontal: spacing.xl,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: '#E8EEF2',
  },
  map: {
    flex: 1,
  },
  mapEmpty: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.45)',
    paddingHorizontal: 24,
  },
  mapEmptyText: {
    ...type.caption,
    color: colors.inkSoft,
    textAlign: 'center',
  },
  list: {
    padding: spacing.xl,
    gap: 12,
    paddingBottom: 100,
  },
  card: {
    minHeight: 96,
    borderRadius: radius.lg,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  safe: {
    backgroundColor: '#CDEAD6',
  },
  danger: {
    backgroundColor: '#F6C9C4',
  },
  cardText: {
    backgroundColor: 'rgba(255,255,255,0.88)',
    padding: 12,
    gap: 2,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardTitle: {
    ...type.subtitle,
    color: colors.ink,
    flex: 1,
  },
  cardMeta: {
    ...type.body,
    color: colors.inkSoft,
  },
  empty: {
    alignItems: 'center',
    gap: 16,
    paddingTop: 40,
  },
  fabWrap: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 20,
  },
  sheetTitle: {
    ...type.title,
    color: colors.ink,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#F0C4C0',
    backgroundColor: '#FFF5F4',
  },
  deleteText: {
    ...type.subtitle,
    color: colors.red,
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  cancelText: {
    ...type.subtitle,
    color: colors.muted,
  },
});
