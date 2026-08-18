import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TailioBlob } from '../../components/brand/TailioMark';
import { Button } from '../../components/ui/Button';
import { useAppStore } from '../../store/useAppStore';
import { colors, radius, spacing, type } from '../../theme';
import type { AppStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<AppStackParamList, 'WalkHistory'>;

export function WalkHistoryScreen({ navigation }: Props) {
  const walks = useAppStore((state) => state.walks);
  const addWalk = useAppStore((state) => state.addWalk);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.back}>←</Text>
        </Pressable>
        <Text style={styles.title}>Перемещения</Text>
        <Pressable onPress={addWalk}>
          <Ionicons name="add" size={24} color={colors.ink} />
        </Pressable>
      </View>
      {walks.length === 0 ? (
        <View style={styles.empty}>
          <TailioBlob size={140} />
          <Button label="+ Добавить прогулку" onPress={addWalk} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {walks.map((item) => (
            <View key={item.id} style={styles.card}>
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
            </View>
          ))}
        </ScrollView>
      )}
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
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    paddingHorizontal: spacing.xl,
  },
  list: {
    padding: spacing.xl,
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    padding: 14,
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
});
