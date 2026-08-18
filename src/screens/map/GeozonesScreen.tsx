import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TailioBlob } from '../../components/brand/TailioMark';
import { Button } from '../../components/ui/Button';
import { InAppSheet } from '../../components/ui/InAppSheet';
import { useAppStore } from '../../store/useAppStore';
import { colors, radius, spacing, type } from '../../theme';
import type { AppStackParamList } from '../../types/navigation';

type Filter = 'all' | 'safe' | 'danger';

type Props = NativeStackScreenProps<AppStackParamList, 'Geozones'>;

export function GeozonesScreen({ navigation }: Props) {
  const [filter, setFilter] = useState<Filter>('all');
  const [hint, setHint] = useState(false);
  const zones = useAppStore((state) => state.geozones);
  const items = zones.filter((item) => filter === 'all' || item.kind === filter);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.back}>←</Text>
        </Pressable>
        <Text style={styles.title}>Геозоны</Text>
        <Pressable onPress={() => navigation.navigate('DrawZone', { kind: 'safe' })}>
          <Ionicons name="add" size={24} color={colors.ink} />
        </Pressable>
      </View>

      <View style={styles.tabs}>
        {([
          ['all', 'Все'],
          ['safe', 'Безопасные'],
          ['danger', 'Опасные'],
        ] as const).map(([key, label]) => (
          <Pressable key={key} onPress={() => setFilter(key)} style={[styles.tab, filter === key && styles.tabOn]}>
            <Text style={[styles.tabText, filter === key && styles.tabTextOn]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {items.length === 0 ? (
          <View style={styles.empty}>
            <TailioBlob size={120} />
            <Button label="+ Создать" onPress={() => setHint(true)} />
          </View>
        ) : (
          items.map((item) => (
            <View key={item.id} style={[styles.card, item.kind === 'safe' ? styles.safe : styles.danger]}>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardMeta}>{item.address}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <View style={styles.fabWrap}>
        <Button label="+ Создать" onPress={() => setHint(true)} />
      </View>

      <InAppSheet visible={hint} onClose={() => setHint(false)}>
        <Text style={styles.sheetTitle}>Безопасные и опасные зоны</Text>
        <Text style={styles.cardMeta}>
          Можно создать зону вокруг дома или отметить опасные места. При выходе придёт уведомление.
        </Text>
        <Button
          label="Создать"
          onPress={() => {
            setHint(false);
            navigation.navigate('DrawZone', { kind: 'safe' });
          }}
        />
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
  list: {
    padding: spacing.xl,
    gap: 12,
    paddingBottom: 100,
  },
  card: {
    height: 140,
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
  },
  cardTitle: {
    ...type.subtitle,
    color: colors.ink,
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
  emptyTitle: {
    ...type.subtitle,
    color: colors.ink,
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
});
