import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { useAppStore } from '../../store/useAppStore';
import { colors, spacing, type } from '../../theme';

type Props = {
  onNext: () => void;
  onSkip: () => void;
};

export function OwnerScreen({ onNext, onSkip }: Props) {
  const name = useAppStore((state) => state.onboarding.ownerName);
  const city = useAppStore((state) => state.onboarding.ownerCity);
  const patchOnboarding = useAppStore((state) => state.patchOnboarding);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <View style={styles.progress}>
        <View style={[styles.dash, styles.dashOn]} />
        <View style={[styles.dash, styles.dashOn]} />
        <View style={styles.dash} />
        <View style={styles.dash} />
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>Как вас зовут?</Text>
        <Text style={styles.copy}>Давайте познакомимся, чтобы настроить Tailio для вас и вашего питомца</Text>
        <TextField
          placeholder="Введите имя"
          value={name}
          onChangeText={(value) => patchOnboarding({ ownerName: value })}
        />
        <TextField
          placeholder="Введите город проживания"
          value={city}
          onChangeText={(value) => patchOnboarding({ ownerCity: value })}
        />
      </View>
      <View style={styles.footer}>
        <Button label="Далее" disabled={!name.trim()} onPress={onNext} />
        <Button label="Пропустить" variant="ghost" onPress={onSkip} />
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
    gap: 14,
  },
  title: {
    ...type.title,
    color: colors.ink,
  },
  copy: {
    ...type.body,
    color: colors.muted,
    marginBottom: 4,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
});
