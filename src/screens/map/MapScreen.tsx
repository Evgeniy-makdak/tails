import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PetAvatar } from '../../components/pet/PetAvatar';
import { Button } from '../../components/ui/Button';
import { InAppSheet } from '../../components/ui/InAppSheet';
import { useActivePet } from '../../store/useAppStore';
import { colors, radius, spacing, type } from '../../theme';
import type { AppStackParamList, MainTabParamList } from '../../types/navigation';

type MapNav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Map'>,
  NativeStackNavigationProp<AppStackParamList>
>;

export function MapScreen() {
  const navigation = useNavigation<MapNav>();
  const pet = useActivePet();
  const [expanded, setExpanded] = useState(true);
  const [sos, setSos] = useState(false);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <View style={styles.map}>
        <SafeAreaView edges={['top']} style={styles.topBar}>
          <View style={styles.live}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Live · {pet.battery || 67}%</Text>
          </View>
          <Text style={styles.coords}>59.9362, 30.3141</Text>
        </SafeAreaView>

        <View style={styles.zone} />
        <View style={styles.pin}>
          <PetAvatar pet={pet} size={52} />
        </View>

        <View style={styles.zoom}>
          <Pressable style={styles.zoomBtn}>
            <Ionicons name="add" size={18} color={colors.ink} />
          </Pressable>
          <Pressable style={styles.zoomBtn}>
            <Ionicons name="remove" size={18} color={colors.ink} />
          </Pressable>
          <Pressable style={styles.zoomBtn}>
            <Ionicons name="navigate" size={16} color={colors.purple} />
          </Pressable>
        </View>
      </View>

      <View style={styles.card}>
        <Pressable onPress={() => setExpanded((value) => !value)} style={styles.handleWrap}>
          <View style={styles.handle} />
        </Pressable>
        <View style={styles.cardHead}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardName}>{pet.name}</Text>
            <Text style={styles.cardMeta}>Обновлено 15 сек. назад</Text>
          </View>
          <Pressable style={styles.iconBtn}>
            <Ionicons name="volume-high-outline" size={18} color={colors.ink} />
          </Pressable>
          <Pressable style={styles.iconBtn}>
            <Ionicons name="bulb-outline" size={18} color={colors.ink} />
          </Pressable>
        </View>

        {expanded ? (
          <View style={styles.actions}>
            <Pressable style={styles.sos} onPress={() => setSos(true)}>
              <Ionicons name="notifications" size={18} color={colors.white} />
              <Text style={styles.sosText}>Экстренный поиск</Text>
            </Pressable>
            <View style={styles.row}>
              <Pressable style={styles.mini} onPress={() => navigation.navigate('Geozones')}>
                <View style={[styles.miniIcon, { backgroundColor: colors.greenSoft }]}>
                  <Ionicons name="grid-outline" size={18} color={colors.green} />
                </View>
                <Text style={styles.miniLabel}>Геозона</Text>
              </Pressable>
              <Pressable style={styles.mini} onPress={() => navigation.navigate('WalkHistory')}>
                <View style={[styles.miniIcon, { backgroundColor: colors.blueSoft }]}>
                  <Ionicons name="git-branch-outline" size={18} color="#3B82F6" />
                </View>
                <Text style={styles.miniLabel}>История перемещений</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>

      <InAppSheet visible={sos} onClose={() => setSos(false)}>
        <Text style={styles.sosTitle}>SOS-режим активен</Text>
        <Text style={styles.cardMeta}>
          {pet.name} вне безопасной зоны. Последняя точка: ул. Лесная, 12
        </Text>
        <View style={styles.sosGrid}>
          <SosAction icon="bulb-outline" label="Включить свет" />
          <SosAction icon="navigate-outline" label="Построить маршрут" />
          <SosAction icon="share-outline" label="Поделиться" />
          <SosAction icon="alert-circle-outline" label="Сообщить о пропаже" />
        </View>
        <Pressable style={styles.callBtn} onPress={() => setSos(false)}>
          <Text style={styles.callText}>Позвонить в службу поддержки</Text>
        </Pressable>
        <Button label="Отменить SOS" variant="ghost" onPress={() => setSos(false)} />
      </InAppSheet>
    </View>
  );
}

function SosAction({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.sosItem}>
      <Ionicons name={icon} size={20} color={colors.red} />
      <Text style={styles.sosItemLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#D7E4D2',
    position: 'relative',
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  topBar: {
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  live: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.88)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.green,
  },
  liveText: {
    ...type.caption,
    color: colors.ink,
  },
  coords: {
    ...type.caption,
    color: colors.inkSoft,
  },
  zone: {
    position: 'absolute',
    alignSelf: 'center',
    top: '32%',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(31,157,85,0.18)',
    borderWidth: 2,
    borderColor: 'rgba(31,157,85,0.45)',
  },
  pin: {
    position: 'absolute',
    alignSelf: 'center',
    top: '42%',
  },
  zoom: {
    position: 'absolute',
    right: 16,
    top: 110,
    gap: 8,
  },
  zoomBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: colors.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: colors.paper,
    borderRadius: 24,
    padding: 16,
    shadowColor: colors.ink,
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  handleWrap: {
    alignItems: 'center',
    paddingBottom: 8,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.line,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardName: {
    ...type.subtitle,
    color: colors.ink,
  },
  cardMeta: {
    ...type.caption,
    color: colors.muted,
    marginTop: 2,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    marginTop: 14,
    gap: 10,
  },
  sos: {
    backgroundColor: colors.red,
    borderRadius: radius.md,
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  sosText: {
    ...type.button,
    color: colors.white,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  mini: {
    flex: 1,
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    padding: 12,
    gap: 8,
  },
  miniIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniLabel: {
    ...type.caption,
    color: colors.ink,
  },
  sosTitle: {
    ...type.title,
    color: colors.red,
  },
  sosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  sosItem: {
    width: '48%',
    backgroundColor: '#FDECEC',
    borderRadius: radius.md,
    padding: 12,
    gap: 8,
    minHeight: 72,
  },
  sosItemLabel: {
    ...type.caption,
    color: colors.ink,
  },
  callBtn: {
    backgroundColor: colors.red,
    minHeight: 56,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callText: {
    ...type.button,
    color: colors.white,
  },
});
