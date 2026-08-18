import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '../../components/ui/Button';
import { colors, spacing, type } from '../../theme';

type Props = {
  onNext: () => void;
};

const ITEMS = [
  { icon: 'locate-outline' as const, title: 'Live-геолокация', copy: 'Безопасные зоны и место питомца в реальном времени' },
  { icon: 'pulse-outline' as const, title: 'Анализ состояния', copy: 'Пульс, сон, активность и спокойствие в одном месте' },
  { icon: 'notifications-outline' as const, title: 'SOS-уведомления', copy: 'Мгновенный сигнал, если питомец вне зоны или в стрессе' },
];

export function FeaturesScreen({ onNext }: Props) {
  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <View style={styles.progress}>
        <View style={[styles.dash, styles.dashOn]} />
        <View style={styles.dash} />
        <View style={styles.dash} />
        <View style={styles.dash} />
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>Понимайте питомца лучше</Text>
        {ITEMS.map((item) => (
          <View key={item.title} style={styles.row}>
            <View style={styles.icon}>
              <Ionicons name={item.icon} size={22} color={colors.purple} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemCopy}>{item.copy}</Text>
            </View>
          </View>
        ))}
      </View>
      <View style={styles.footer}>
        <Button label="Далее" onPress={onNext} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  progress: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: spacing.xl,
    paddingTop: 8,
  },
  dash: {
    flex: 1,
    height: 4,
    borderRadius: 4,
    backgroundColor: colors.line,
  },
  dashOn: {
    backgroundColor: colors.purple,
  },
  body: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: 28,
    gap: 20,
  },
  title: {
    ...type.title,
    color: colors.ink,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.purpleSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitle: {
    ...type.subtitle,
    color: colors.ink,
  },
  itemCopy: {
    ...type.body,
    color: colors.muted,
    marginTop: 4,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
});
