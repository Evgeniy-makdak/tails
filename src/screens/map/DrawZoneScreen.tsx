import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../components/ui/Button';
import { colors, radius, spacing, type } from '../../theme';
import type { AppStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<AppStackParamList, 'DrawZone'>;

export function DrawZoneScreen({ navigation, route }: Props) {
  const [kind, setKind] = useState<'safe' | 'danger'>(route.params?.kind ?? 'safe');
  const fill = kind === 'safe' ? 'rgba(31,157,85,0.28)' : 'rgba(232,93,76,0.28)';
  const stroke = kind === 'safe' ? colors.green : colors.red;

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Распределите точки</Text>
          <Pressable onPress={() => navigation.goBack()} style={styles.close}>
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
        </View>
        <View style={styles.toggles}>
          <Pressable onPress={() => setKind('safe')} style={[styles.toggle, kind === 'safe' && styles.toggleOn]}>
            <Text style={[styles.toggleText, kind === 'safe' && styles.toggleTextOn]}>Безопасные</Text>
          </Pressable>
          <Pressable onPress={() => setKind('danger')} style={[styles.toggle, kind === 'danger' && styles.toggleOn]}>
            <Text style={[styles.toggleText, kind === 'danger' && styles.toggleTextOn]}>Опасные</Text>
          </Pressable>
        </View>
      </SafeAreaView>

      <View style={styles.map}>
        <View style={[styles.poly, { backgroundColor: fill, borderColor: stroke }]} />
        <View style={[styles.dot, { backgroundColor: stroke, top: '28%', left: '32%' }]} />
        <View style={[styles.dot, { backgroundColor: stroke, top: '26%', left: '68%' }]} />
        <View style={[styles.dot, { backgroundColor: stroke, top: '62%', left: '70%' }]} />
        <View style={[styles.dot, { backgroundColor: stroke, top: '66%', left: '30%' }]} />
        <View style={styles.here} />
        <View style={styles.zoom}>
          <View style={styles.zoomBtn}>
            <Ionicons name="add" size={18} color={colors.ink} />
          </View>
          <View style={styles.zoomBtn}>
            <Ionicons name="remove" size={18} color={colors.ink} />
          </View>
          <View style={styles.zoomBtn}>
            <Ionicons name="navigate" size={16} color={colors.purple} />
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Button label="Далее" onPress={() => navigation.navigate('CreatePlace', { kind })} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#D7E4D2',
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
    marginBottom: 8,
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
  map: {
    flex: 1,
  },
  poly: {
    position: 'absolute',
    top: '24%',
    left: '22%',
    width: '56%',
    height: '42%',
    borderRadius: 18,
    borderWidth: 3,
  },
  dot: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.white,
  },
  here: {
    position: 'absolute',
    top: '46%',
    alignSelf: 'center',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#3B82F6',
    borderWidth: 3,
    borderColor: colors.white,
  },
  zoom: {
    position: 'absolute',
    right: 16,
    top: 24,
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
  footer: {
    padding: 16,
    backgroundColor: colors.paper,
  },
});
