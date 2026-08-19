import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { useAppStore } from '../../store/useAppStore';
import { colors, radius, spacing, type } from '../../theme';

type Props = {
  onNext: () => void;
  onSkip: () => void;
  onPickBreed: () => void;
};

export function PetSetupScreen({ onNext, onSkip, onPickBreed }: Props) {
  const draft = useAppStore((state) => state.onboarding);
  const patchOnboarding = useAppStore((state) => state.patchOnboarding);
  const setOnboardingSex = useAppStore((state) => state.setOnboardingSex);
  const boy = draft.sex === 'Кобель' || draft.sex === 'Кот';

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <View style={styles.progress}>
        <View style={[styles.dash, styles.dashOn]} />
        <View style={[styles.dash, styles.dashOn]} />
        <View style={[styles.dash, styles.dashOn]} />
        <View style={styles.dash} />
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>Расскажите о вашем питомце</Text>
        <TextField
          label="Имя питомца"
          placeholder="Имя питомца"
          value={draft.petName}
          onChangeText={(value) => patchOnboarding({ petName: value })}
        />
        <Pressable onPress={onPickBreed}>
          <TextField
            label="Порода питомца"
            placeholder="Порода питомца"
            value={draft.breed}
            editable={false}
            pointerEvents="none"
          />
        </Pressable>
        <TextField
          label="Дата рождения"
          placeholder="01.01.2020"
          value={draft.birthDate}
          onChangeText={(value) => patchOnboarding({ birthDate: value })}
        />
        <Text style={styles.section}>Кто ваш питомец?</Text>
        <View style={styles.row}>
          <Choice label="Собака" active={draft.kind === 'dog'} onPress={() => setOnboardingSex('dog', boy)} />
          <Choice label="Кошка" active={draft.kind === 'cat'} onPress={() => setOnboardingSex('cat', boy)} />
        </View>
        <Text style={styles.section}>Пол питомца</Text>
        <View style={styles.row}>
          <Choice label="Мальчик" active={boy} onPress={() => setOnboardingSex(draft.kind, true)} />
          <Choice label="Девочка" active={!boy} onPress={() => setOnboardingSex(draft.kind, false)} />
        </View>
      </View>
      <View style={styles.footer}>
        <Button label="Далее" disabled={!draft.petName.trim()} onPress={onNext} />
        <Button label="Пропустить" variant="ghost" onPress={onSkip} />
      </View>
    </SafeAreaView>
  );
}

function Choice({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.choice, active && styles.choiceOn]}>
      <Text style={[styles.choiceText, active && styles.choiceTextOn]}>{label}</Text>
    </Pressable>
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
    paddingTop: 24,
    gap: 12,
  },
  title: {
    ...type.title,
    color: colors.ink,
    marginBottom: 4,
  },
  section: {
    ...type.subtitle,
    color: colors.ink,
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  choice: {
    flex: 1,
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceOn: {
    borderColor: colors.purple,
    backgroundColor: colors.purpleSoft,
  },
  choiceText: {
    ...type.subtitle,
    color: colors.inkSoft,
  },
  choiceTextOn: {
    color: colors.purple,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
});
