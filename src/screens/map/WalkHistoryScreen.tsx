import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { PetTrack } from '../../api/tracks';
import { InAppSheet } from '../../components/ui/InAppSheet';
import { MAP_ENGINE } from '../../config/features';
import { useCollarLocation, usePetTracks } from '../../location';
import { MapCanvas, mapConfig, type MapCamera, type MapMarker, type MapPolyline } from '../../map';
import { useActivePet } from '../../store/useAppStore';
import { colors, radius, spacing, type } from '../../theme';
import type { AppStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<AppStackParamList, 'WalkHistory'>;
type TabId = 'location' | 'timeline';
type RangeId = '1h' | '3h' | '6h' | '12h' | '24h';

const RANGES: RangeId[] = ['1h', '3h', '6h', '12h', '24h'];
const LIVE_MAP = MAP_ENGINE === 'maplibre';

function rangeToProgress(range: RangeId): number {
  const index = RANGES.indexOf(range);
  return index <= 0 ? 0 : index / (RANGES.length - 1);
}

function progressToRange(progress: number): RangeId {
  const clamped = Math.max(0, Math.min(1, progress));
  const index = Math.round(clamped * (RANGES.length - 1));
  return RANGES[index] ?? '24h';
}

function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatKm(meters: number): string {
  return `${(meters / 1000).toFixed(1)} км`;
}

function formatMinutes(sec: number): string {
  return `${Math.max(1, Math.round(sec / 60))} мин`;
}

function RangeSlider({ value, onChange }: { value: number; onChange: (next: number) => void }) {
  const [width, setWidth] = useState(1);
  const clamp = (x: number) => Math.max(0, Math.min(1, x / Math.max(width, 1)));

  return (
    <View
      style={styles.sliderHit}
      onLayout={(event) => setWidth(Math.max(1, event.nativeEvent.layout.width))}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderTerminationRequest={() => false}
      onResponderGrant={(event) => onChange(clamp(event.nativeEvent.locationX))}
      onResponderMove={(event) => onChange(clamp(event.nativeEvent.locationX))}
      accessibilityRole="adjustable"
      accessibilityLabel="Диапазон истории"
    >
      <View style={styles.sliderTrack}>
        <View style={[styles.sliderFill, { width: `${value * 100}%` }]} />
        <View style={[styles.sliderKnob, { left: `${value * 100}%` }]} />
      </View>
    </View>
  );
}

const TIMELINE = [
  {
    day: 'Сегодня',
    events: [
      { id: 't1', when: '00:00 — сейчас', text: 'в зоне энергосбережения: Дом', kind: 'home' as const },
    ],
  },
  {
    day: 'Вчера',
    events: [
      { id: 't2', when: '23:06 — 23:59', text: 'в зоне энергосбережения: Дом', kind: 'home' as const },
      { id: 't3', when: '16:34 — 22:26', text: 'в зоне энергосбережения: Дом', kind: 'home' as const },
      { id: 't4', when: '15:05', text: 'достиг цели активности за день!', kind: 'goal' as const },
      { id: 't5', when: '07:30 — 08:12', text: 'прогулка · 2.4 км · 3180 шагов', kind: 'walk' as const },
    ],
  },
];

function trackCamera(track: PetTrack | undefined): MapCamera {
  const pts = track?.points ?? [];
  if (pts.length === 0) return mapConfig.defaultCamera;
  const mid = pts[Math.floor(pts.length / 2)] ?? pts[0]!;
  return { center: { latitude: mid.latitude, longitude: mid.longitude }, zoom: 14.5 };
}

export function WalkHistoryScreen({ navigation }: Props) {
  const pet = useActivePet();
  const { point } = useCollarLocation({ petId: pet.id, collarId: pet.collarId });
  const { tracks, loading, source, reload } = usePetTracks({
    petId: pet.id,
    petName: pet.name,
    center: point,
  });

  const [tab, setTab] = useState<TabId>('location');
  const [range, setRange] = useState<RangeId>('24h');
  const [sliderProgress, setSliderProgress] = useState(rangeToProgress('24h'));
  const [activeWalkId, setActiveWalkId] = useState<string | null>(null);
  const [sheetWalkId, setSheetWalkId] = useState<string | null>(null);
  const [dayOffset, setDayOffset] = useState(0);
  const [followKey, setFollowKey] = useState(0);

  useEffect(() => {
    if (tracks[0] && !activeWalkId) {
      setActiveWalkId(tracks[0].id);
    }
  }, [tracks, activeWalkId]);

  const activeTrack = tracks.find((item) => item.id === activeWalkId) ?? tracks[0];
  const sheetTrack = tracks.find((item) => item.id === sheetWalkId) ?? null;
  const dateLabel = dayOffset === 0 ? 'Сегодня' : dayOffset === 1 ? 'Вчера' : `${dayOffset} дн. назад`;

  const camera = useMemo(() => trackCamera(activeTrack), [activeTrack]);
  const polylines = useMemo<MapPolyline[]>(() => {
    if (!activeTrack?.points?.length) return [];
    return [
      {
        id: `path-${activeTrack.id}`,
        coordinates: activeTrack.points,
        color: '#E5A100',
        width: 4,
      },
    ];
  }, [activeTrack]);

  const markers = useMemo<MapMarker[]>(() => {
    const pts = activeTrack?.points ?? [];
    const end = pts[pts.length - 1];
    if (!end) return [];
    return [{ id: 'walk-end', coordinate: end, kind: 'pet' }];
  }, [activeTrack]);

  const selectRange = (next: RangeId) => {
    setRange(next);
    setSliderProgress(rangeToProgress(next));
  };

  const onSliderChange = (next: number) => {
    setSliderProgress(next);
    setRange(progressToRange(next));
  };

  const selectTrack = (id: string) => {
    setActiveWalkId(id);
    setSheetWalkId(id);
    setFollowKey((k) => k + 1);
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Text style={styles.back}>←</Text>
        </Pressable>
        <Text style={styles.title}>История перемещений</Text>
        <Pressable onPress={() => void reload()} hitSlop={8}>
          <Ionicons name="refresh" size={22} color={colors.ink} />
        </Pressable>
      </View>

      <View style={styles.tabs}>
        <Pressable style={[styles.tab, tab === 'location' && styles.tabOn]} onPress={() => setTab('location')}>
          <Text style={[styles.tabText, tab === 'location' && styles.tabTextOn]}>Локация</Text>
        </Pressable>
        <Pressable style={[styles.tab, tab === 'timeline' && styles.tabOn]} onPress={() => setTab('timeline')}>
          <Text style={[styles.tabText, tab === 'timeline' && styles.tabTextOn]}>Лента</Text>
        </Pressable>
      </View>

      {tab === 'location' ? (
        <ScrollView
          style={styles.locationPane}
          contentContainerStyle={styles.locationContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.mapCard}>
            {LIVE_MAP ? (
              <MapCanvas
                style={styles.map}
                camera={camera}
                markers={markers}
                polylines={polylines}
                followKey={followKey}
              />
            ) : (
              <View style={[styles.map, { backgroundColor: '#C9D6C4' }]} />
            )}
            {loading ? (
              <View style={styles.mapLoading}>
                <ActivityIndicator color={colors.purple} />
              </View>
            ) : null}
            <View style={styles.mapBubble} pointerEvents="none">
              <Text style={styles.mapBubbleText}>
                {activeTrack
                  ? `${formatWhen(activeTrack.startedAt)} · ${formatKm(activeTrack.distanceM)}`
                  : `${dateLabel} · маршрут`}
              </Text>
            </View>
            <View style={styles.mapTools}>
              <Pressable style={styles.toolBtn} onPress={() => setFollowKey((k) => k + 1)}>
                <Ionicons name="locate-outline" size={16} color={colors.purple} />
              </Pressable>
              <Pressable style={styles.toolBtn} onPress={() => void reload()}>
                <Ionicons name="layers-outline" size={16} color={colors.ink} />
              </Pressable>
            </View>
          </View>

          <View style={styles.controls}>
            <Text style={styles.sourceHint}>
              {source === 'api'
                ? 'Маршруты с сервера Tailio (Render)'
                : 'Демо-маршруты офлайн — сервер недоступен'}
            </Text>

            <View style={styles.dateRow}>
              <Pressable onPress={() => setDayOffset((value) => value + 1)} style={styles.dateArrow}>
                <Ionicons name="chevron-back" size={18} color={colors.ink} />
              </Pressable>
              <View style={{ alignItems: 'center' }}>
                <Text style={styles.dateTitle}>{dateLabel}</Text>
                <Text style={styles.dateMeta}>
                  {activeTrack
                    ? `${formatWhen(activeTrack.startedAt)} — ${formatWhen(activeTrack.endedAt)} · ${range}`
                    : `08:51 — 23:21 · ${range}`}
                </Text>
              </View>
              <Pressable
                onPress={() => setDayOffset((value) => Math.max(0, value - 1))}
                style={styles.dateArrow}
                disabled={dayOffset === 0}
              >
                <Ionicons name="chevron-forward" size={18} color={dayOffset === 0 ? colors.muted : colors.ink} />
              </Pressable>
            </View>

            <RangeSlider value={sliderProgress} onChange={onSliderChange} />

            <View style={styles.rangeRow}>
              <Pressable style={styles.calBtn}>
                <Ionicons name="calendar-outline" size={18} color={colors.ink} />
              </Pressable>
              {RANGES.map((item) => (
                <Pressable
                  key={item}
                  style={[styles.rangeBtn, range === item && styles.rangeBtnOn]}
                  onPress={() => selectRange(item)}
                >
                  <Text style={[styles.rangeText, range === item && styles.rangeTextOn]}>{item}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.listTitle}>Прогулки</Text>
            {tracks.map((item) => {
              const active = item.id === activeTrack?.id;
              return (
                <Pressable
                  key={item.id}
                  style={[styles.walkCard, active && styles.walkCardOn]}
                  onPress={() => selectTrack(item.id)}
                >
                  <View style={styles.pin}>
                    <Ionicons name="location" size={18} color={colors.green} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.when}>{formatWhen(item.startedAt)}</Text>
                    <Text style={styles.meta}>
                      {formatKm(item.distanceM)} · {formatMinutes(item.durationSec)} · {item.steps} шагов ·{' '}
                      {item.points.length} точек
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.muted} />
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.timeline} showsVerticalScrollIndicator={false}>
          {TIMELINE.map((section) => (
            <View key={section.day} style={styles.dayBlock}>
              <View style={styles.dayHead}>
                <Ionicons name="calendar" size={16} color={colors.purple} />
                <Text style={styles.dayTitle}>{section.day}</Text>
              </View>
              {section.events.map((event, index) => (
                <Pressable
                  key={event.id}
                  style={styles.eventRow}
                  onPress={() => {
                    if (event.kind === 'walk') {
                      setTab('location');
                    }
                  }}
                >
                  <View style={styles.rail}>
                    <View style={[styles.dot, event.kind === 'goal' && styles.dotGoal]} />
                    {index < section.events.length - 1 ? <View style={styles.line} /> : null}
                  </View>
                  <View style={styles.eventCard}>
                    <Text style={styles.eventWhen}>{event.when}</Text>
                    <Text style={styles.eventText}>
                      {pet.name} {event.text}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          ))}
        </ScrollView>
      )}

      <InAppSheet visible={Boolean(sheetTrack)} onClose={() => setSheetWalkId(null)}>
        <Text style={styles.sheetTitle}>{sheetTrack ? formatWhen(sheetTrack.startedAt) : ''}</Text>
        <Text style={styles.sheetCopy}>
          {sheetTrack
            ? `${formatKm(sheetTrack.distanceM)} · ${formatMinutes(sheetTrack.durationSec)} · ${sheetTrack.steps} шагов`
            : ''}
        </Text>
        <Text style={styles.sheetCopy}>
          Маршрут из {sheetTrack?.points.length ?? 0} GPS-точек
          {sheetTrack?.source === 'demo' || sheetTrack?.source === 'local-demo'
            ? ' (демо до телеметрии ошейника)'
            : ''}
          .
        </Text>
      </InAppSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.paper,
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
    marginHorizontal: spacing.xl,
    backgroundColor: colors.bg,
    borderRadius: radius.pill,
    padding: 4,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    minHeight: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabOn: {
    backgroundColor: colors.paper,
  },
  tabText: {
    ...type.caption,
    color: colors.muted,
    fontFamily: 'Inter_600SemiBold',
  },
  tabTextOn: {
    color: colors.ink,
  },
  locationPane: {
    flex: 1,
  },
  locationContent: {
    paddingBottom: 28,
  },
  mapCard: {
    height: 260,
    marginHorizontal: spacing.xl,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#E8EEF2',
  },
  map: {
    flex: 1,
  },
  mapLoading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  mapBubble: {
    position: 'absolute',
    left: 12,
    top: 12,
    maxWidth: '70%',
    backgroundColor: colors.paper,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  mapBubbleText: {
    ...type.caption,
    color: colors.ink,
  },
  mapTools: {
    position: 'absolute',
    right: 12,
    top: 12,
    gap: 8,
  },
  toolBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controls: {
    paddingHorizontal: spacing.xl,
    paddingTop: 14,
    gap: 14,
  },
  sourceHint: {
    ...type.caption,
    color: colors.muted,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateArrow: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateTitle: {
    ...type.subtitle,
    color: colors.ink,
  },
  dateMeta: {
    ...type.caption,
    color: colors.muted,
    marginTop: 2,
  },
  sliderHit: {
    height: 44,
    justifyContent: 'center',
  },
  sliderTrack: {
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.bg,
    position: 'relative',
  },
  sliderFill: {
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.purple,
  },
  sliderKnob: {
    position: 'absolute',
    top: -8,
    width: 28,
    height: 28,
    marginLeft: -14,
    borderRadius: 14,
    backgroundColor: colors.paper,
    borderWidth: 3,
    borderColor: colors.purple,
    shadowColor: colors.ink,
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  rangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  calBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rangeBtn: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  rangeBtnOn: {
    backgroundColor: colors.purple,
  },
  rangeText: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: 'Inter_600SemiBold',
    color: colors.ink,
  },
  rangeTextOn: {
    color: colors.white,
  },
  listTitle: {
    ...type.subtitle,
    color: colors.ink,
    marginTop: 4,
  },
  walkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    padding: 14,
  },
  walkCardOn: {
    borderWidth: 1.5,
    borderColor: colors.purple,
  },
  pin: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  when: {
    ...type.subtitle,
    color: colors.ink,
  },
  meta: {
    ...type.caption,
    color: colors.muted,
    marginTop: 4,
  },
  timeline: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 40,
    gap: 18,
  },
  dayBlock: {
    gap: 8,
  },
  dayHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dayTitle: {
    ...type.subtitle,
    color: colors.ink,
  },
  eventRow: {
    flexDirection: 'row',
    gap: 10,
  },
  rail: {
    width: 16,
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.purple,
    marginTop: 14,
  },
  dotGoal: {
    backgroundColor: '#E7C15A',
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: colors.line,
    marginTop: 4,
  },
  eventCard: {
    flex: 1,
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 8,
  },
  eventWhen: {
    ...type.caption,
    color: colors.muted,
  },
  eventText: {
    ...type.body,
    color: colors.ink,
    marginTop: 4,
  },
  sheetTitle: {
    ...type.title,
    color: colors.ink,
  },
  sheetCopy: {
    ...type.body,
    color: colors.muted,
  },
});
