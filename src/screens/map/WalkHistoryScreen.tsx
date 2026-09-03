import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  LayoutChangeEvent,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PetAvatar } from '../../components/pet/PetAvatar';
import { InAppSheet } from '../../components/ui/InAppSheet';
import { useActivePet, useAppStore } from '../../store/useAppStore';
import { colors, radius, spacing, type } from '../../theme';
import type { AppStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<AppStackParamList, 'WalkHistory'>;
type TabId = 'location' | 'timeline';
type RangeId = '1h' | '3h' | '6h' | '12h' | '24h';

const RANGES: RangeId[] = ['1h', '3h', '6h', '12h', '24h'];
const RANGE_PROGRESS: Record<RangeId, number> = {
  '1h': 0.12,
  '3h': 0.28,
  '6h': 0.48,
  '12h': 0.7,
  '24h': 1,
};

function progressToRange(progress: number): RangeId {
  let best: RangeId = '1h';
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const id of RANGES) {
    const distance = Math.abs(RANGE_PROGRESS[id] - progress);
    if (distance < bestDistance) {
      best = id;
      bestDistance = distance;
    }
  }
  return best;
}

function RangeSlider({
  progress,
  onChange,
  onChangeEnd,
}: {
  progress: number;
  onChange: (next: number) => void;
  onChangeEnd: (next: number) => void;
}) {
  const trackRef = useRef<View>(null);
  const widthRef = useRef(0);
  const leftRef = useRef(0);
  const progressRef = useRef(progress);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  const measureTrack = () => {
    trackRef.current?.measureInWindow((x, _y, width) => {
      leftRef.current = x;
      widthRef.current = width;
    });
  };

  const updateFromPageX = (pageX: number) => {
    const width = widthRef.current;
    if (width <= 0) {
      return;
    }
    const next = Math.max(0, Math.min(1, (pageX - leftRef.current) / width));
    progressRef.current = next;
    onChange(next);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (event) => {
        measureTrack();
        updateFromPageX(event.nativeEvent.pageX);
      },
      onPanResponderMove: (event) => {
        updateFromPageX(event.nativeEvent.pageX);
      },
      onPanResponderRelease: () => {
        onChangeEnd(progressRef.current);
      },
      onPanResponderTerminate: () => {
        onChangeEnd(progressRef.current);
      },
    }),
  ).current;

  const onLayout = (event: LayoutChangeEvent) => {
    widthRef.current = event.nativeEvent.layout.width;
    measureTrack();
  };

  const clamped = Math.max(0, Math.min(1, progress));

  return (
    <View
      ref={trackRef}
      style={styles.sliderHit}
      onLayout={onLayout}
      {...panResponder.panHandlers}
      accessibilityRole="adjustable"
      accessibilityLabel="Диапазон истории"
    >
      <View style={styles.sliderTrack}>
        <View style={[styles.sliderFill, { width: `${clamped * 100}%` }]} />
        <View style={[styles.sliderKnob, { left: `${clamped * 100}%` }]} />
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

export function WalkHistoryScreen({ navigation }: Props) {
  const pet = useActivePet();
  const walks = useAppStore((state) => state.walks);
  const addWalk = useAppStore((state) => state.addWalk);
  const [tab, setTab] = useState<TabId>('location');
  const [range, setRange] = useState<RangeId>('24h');
  const [sliderProgress, setSliderProgress] = useState(RANGE_PROGRESS['24h']);
  const [selectedWalk, setSelectedWalk] = useState<string | null>(null);
  const [dayOffset, setDayOffset] = useState(0);

  const displayWalks = useMemo(() => {
    if (walks.length > 0) {
      return walks;
    }
    return [
      { id: 'demo-1', when: 'Сегодня 17:45', km: '2.9 км', minutes: '38 мин', steps: '3780' },
      { id: 'demo-2', when: 'Сегодня 07:30', km: '2.4 км', minutes: '32 мин', steps: '3180' },
      { id: 'demo-3', when: 'Вчера 18:15', km: '3.1 км', minutes: '41 мин', steps: '4050' },
    ];
  }, [walks]);

  const activeWalk = displayWalks.find((item) => item.id === selectedWalk) ?? displayWalks[0];
  const dateLabel = dayOffset === 0 ? 'Сегодня' : dayOffset === 1 ? 'Вчера' : `${dayOffset} дн. назад`;

  const selectRange = (next: RangeId) => {
    setRange(next);
    setSliderProgress(RANGE_PROGRESS[next]);
  };

  const finishSlider = (next: number) => {
    const snapped = progressToRange(next);
    setRange(snapped);
    setSliderProgress(RANGE_PROGRESS[snapped]);
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Text style={styles.back}>←</Text>
        </Pressable>
        <Text style={styles.title}>История перемещений</Text>
        <Pressable onPress={addWalk} hitSlop={8}>
          <Ionicons name="add" size={24} color={colors.ink} />
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
        <View style={styles.locationPane}>
          <View style={styles.mapCard}>
            <View style={styles.heatA} />
            <View style={styles.heatB} />
            <View style={styles.heatC} />
            <View style={styles.path} />
            <View style={styles.mapPin}>
              <PetAvatar pet={pet} size={44} />
            </View>
            <View style={styles.mapBubble}>
              <Text style={styles.mapBubbleText}>
                {activeWalk?.when ?? dateLabel} · {activeWalk?.km ?? '2.9 км'}
              </Text>
            </View>
            <View style={styles.mapTools}>
              <Pressable style={styles.toolBtn}>
                <Ionicons name="share-outline" size={16} color={colors.ink} />
              </Pressable>
              <Pressable style={styles.toolBtn}>
                <Ionicons name="locate-outline" size={16} color={colors.purple} />
              </Pressable>
              <Pressable style={styles.toolBtn}>
                <Ionicons name="layers-outline" size={16} color={colors.ink} />
              </Pressable>
            </View>
          </View>

          <View style={styles.controls}>
            <View style={styles.dateRow}>
              <Pressable onPress={() => setDayOffset((value) => value + 1)} style={styles.dateArrow}>
                <Ionicons name="chevron-back" size={18} color={colors.ink} />
              </Pressable>
              <View style={{ alignItems: 'center' }}>
                <Text style={styles.dateTitle}>{dateLabel}</Text>
                <Text style={styles.dateMeta}>08:51 — 23:21</Text>
              </View>
              <Pressable
                onPress={() => setDayOffset((value) => Math.max(0, value - 1))}
                style={styles.dateArrow}
                disabled={dayOffset === 0}
              >
                <Ionicons name="chevron-forward" size={18} color={dayOffset === 0 ? colors.muted : colors.ink} />
              </Pressable>
            </View>

            <RangeSlider progress={sliderProgress} onChange={setSliderProgress} onChangeEnd={finishSlider} />

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rangeRow}>
              <Pressable style={styles.calBtn}>
                <Ionicons name="calendar-outline" size={16} color={colors.ink} />
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
            </ScrollView>

            <Text style={styles.listTitle}>Прогулки</Text>
            {displayWalks.map((item) => {
              const active = item.id === activeWalk?.id;
              return (
                <Pressable
                  key={item.id}
                  style={[styles.walkCard, active && styles.walkCardOn]}
                  onPress={() => setSelectedWalk(item.id)}
                >
                  <View style={styles.pin}>
                    <Ionicons name="location" size={18} color={colors.green} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.when}>{item.when}</Text>
                    <Text style={styles.meta}>
                      {item.km} · {item.minutes} · {item.steps} шагов
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.muted} />
                </Pressable>
              );
            })}
          </View>
        </View>
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

      <InAppSheet visible={Boolean(selectedWalk)} onClose={() => setSelectedWalk(null)}>
        <Text style={styles.sheetTitle}>{activeWalk?.when}</Text>
        <Text style={styles.sheetCopy}>
          {activeWalk?.km} · {activeWalk?.minutes} · {activeWalk?.steps} шагов
        </Text>
        <Text style={styles.sheetCopy}>Демо-маршрут на карте выше. Живой GPS появится позже.</Text>
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
  mapCard: {
    height: 260,
    marginHorizontal: spacing.xl,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#C9D6C4',
  },
  heatA: {
    position: 'absolute',
    left: '18%',
    top: '28%',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(46, 204, 113, 0.35)',
  },
  heatB: {
    position: 'absolute',
    left: '34%',
    top: '34%',
    width: 110,
    height: 70,
    borderRadius: 40,
    backgroundColor: 'rgba(241, 196, 15, 0.4)',
    transform: [{ rotate: '18deg' }],
  },
  heatC: {
    position: 'absolute',
    left: '52%',
    top: '40%',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(231, 76, 60, 0.35)',
  },
  path: {
    position: 'absolute',
    left: '22%',
    top: '42%',
    width: '48%',
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F39C12',
    transform: [{ rotate: '12deg' }],
  },
  mapPin: {
    position: 'absolute',
    left: '58%',
    top: '38%',
  },
  mapBubble: {
    position: 'absolute',
    left: '42%',
    top: '22%',
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
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: 14,
    gap: 12,
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
    height: 36,
    justifyContent: 'center',
  },
  sliderTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.bg,
    position: 'relative',
  },
  sliderFill: {
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.purple,
  },
  sliderKnob: {
    position: 'absolute',
    top: -6,
    width: 22,
    height: 22,
    marginLeft: -11,
    borderRadius: 11,
    backgroundColor: colors.paper,
    borderWidth: 3,
    borderColor: colors.purple,
  },
  rangeRow: {
    gap: 8,
    alignItems: 'center',
  },
  calBtn: {
    width: 40,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rangeBtn: {
    minWidth: 48,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  rangeBtnOn: {
    backgroundColor: colors.purple,
  },
  rangeText: {
    ...type.caption,
    color: colors.ink,
    fontFamily: 'Inter_600SemiBold',
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
