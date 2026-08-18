import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Circle } from 'react-native-svg';

import { Card } from '../../components/ui/Card';
import { IconButton } from '../../components/ui/IconButton';
import { PetAvatar } from '../../components/pet/PetAvatar';
import { useActivePet, useAppStore } from '../../store/useAppStore';
import { colors, radius, spacing, type } from '../../theme';
import type { AppStackParamList } from '../../types/navigation';
import type { MetricId } from '../../types/pet';

function HealthRing({ value }: { value: number }) {
  const size = 168;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.line} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.green}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <Ionicons name="heart-outline" size={18} color={colors.green} />
      <Text style={styles.ringValue}>{value}%</Text>
      <Text style={styles.ringLabel}>Индекс здоровья</Text>
    </View>
  );
}

export function HealthScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const pet = useActivePet();
  const pets = useAppStore((state) => state.pets);
  const setActivePet = useAppStore((state) => state.setActivePet);
  const unread = useAppStore((state) => state.notifications.some((item) => !item.read));

  const open = (metricId: MetricId) => navigation.navigate('MetricDetail', { metricId });

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable
            style={styles.switcher}
            onPress={() => {
              const index = pets.findIndex((item) => item.id === pet.id);
              const next = pets[(index + 1) % pets.length];
              if (next) setActivePet(next.id);
            }}
          >
            <PetAvatar pet={pet} size={44} />
            <View>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{pet.name}</Text>
                <Ionicons name="chevron-down" size={16} color={colors.ink} />
              </View>
              <Text style={[styles.status, { color: pet.collarConnected ? colors.green : colors.muted }]}>
                {pet.collarConnected ? `Ошейник подключён · ${pet.battery}%` : 'Ошейник не подключён'}
              </Text>
            </View>
          </Pressable>
          <IconButton
            name="notifications-outline"
            dot={unread}
            onPress={() => navigation.navigate('Notifications')}
          />
        </View>

        <View style={styles.ringWrap}>
          <HealthRing value={pet.healthScore} />
          <Text style={styles.ok}>Всё в норме</Text>
          <Text style={styles.okSub}>Показатели стабильны сегодня</Text>
        </View>

        <View style={styles.grid}>
          <MetricMini title="Пульс" value={`${pet.pulse} уд/мин`} status="в норме" color={colors.red} onPress={() => open('pulse')} />
          <MetricMini title="Температура" value={`${pet.temperature} °C`} status="в норме" color={colors.purple} onPress={() => open('temperature')} />
          <MetricMini title="Шаги" value={pet.steps.toLocaleString('ru-RU')} status="норма" color={colors.green} onPress={() => open('steps')} />
          <MetricMini title="Бег" value={`${pet.runningMinutes} мин`} status="активность" color={colors.orange} onPress={() => open('running')} />
          <MetricMini title="Сон" value={pet.sleepLabel} status="в норме" color={colors.purple} onPress={() => open('sleep')} />
          <MetricMini title="Отдых" value={`${pet.restHours} ч`} status="в норме" color="#3B82F6" onPress={() => open('rest')} />
        </View>

        <Pressable onPress={() => navigation.navigate('AiSummary')}>
          <Card style={styles.reco}>
            <View style={styles.recoIcon}>
              <Ionicons name="star" size={16} color={colors.white} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.recoTitle}>Рекомендация Tailio</Text>
              <Text style={styles.recoCopy}>Сегодня хорошая активность и стабильный пульс.</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Card>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function MetricMini({
  title,
  value,
  status,
  color,
  onPress,
}: {
  title: string;
  value: string;
  status: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.mini}>
      <Text style={styles.miniTitle}>{title}</Text>
      <Text style={styles.miniValue}>{value}</Text>
      <View style={[styles.pill, { backgroundColor: `${color}22` }]}>
        <Text style={[styles.pillText, { color }]}>{status}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.xl,
    paddingBottom: 120,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switcher: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    paddingRight: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  name: {
    ...type.subtitle,
    color: colors.ink,
  },
  status: {
    ...type.caption,
    marginTop: 2,
  },
  ringWrap: {
    alignItems: 'center',
    gap: 6,
  },
  ringValue: {
    fontSize: 36,
    fontFamily: 'Inter_700Bold',
    color: colors.ink,
  },
  ringLabel: {
    ...type.caption,
    color: colors.muted,
  },
  ok: {
    ...type.subtitle,
    color: colors.green,
  },
  okSub: {
    ...type.body,
    color: colors.muted,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  mini: {
    width: '48%',
    backgroundColor: colors.paper,
    borderRadius: radius.lg,
    padding: 14,
    gap: 8,
  },
  miniTitle: {
    ...type.caption,
    color: colors.muted,
  },
  miniValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: colors.ink,
  },
  pill: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pillText: {
    ...type.caption,
  },
  reco: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  recoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recoTitle: {
    ...type.subtitle,
    color: colors.ink,
  },
  recoCopy: {
    ...type.caption,
    color: colors.muted,
    marginTop: 2,
  },
});
