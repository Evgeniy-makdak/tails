import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { colors, radius, spacing, type } from '../../theme';
import type { PetKind, PetSex } from '../../types/pet';

type Props = {
  onNext: () => void;
  onSkip: () => void;
};

export function PetSetupScreen({ onNext, onSkip }: Props) {
  const [name, setName] = useState('Персик');
  const [kind, setKind] = useState<PetKind>('dog');
  const [sex, setSex] = useState<PetSex>('Кобель');

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
        <TextField label="Имя питомца" value={name} onChangeText={setName} />
        <TextField label="Дата рождения" placeholder="01.09.2022" />
        <TextField label="Вес" placeholder="кг" keyboardType="decimal-pad" />
        <Text style={styles.section}>Кто ваш питомец?</Text>
        <View style={styles.row}>
          <Choice label="Собака" active={kind === 'dog'} onPress={() => setKind('dog')} />
          <Choice label="Кошка" active={kind === 'cat'} onPress={() => setKind('cat')} />
        </View>
        <Text style={styles.section}>Пол питомца</Text>
        <View style={styles.row}>
          <Choice label="Мальчик" active={sex === 'Кобель' || sex === 'Кот'} onPress={() => setSex(kind === 'cat' ? 'Кот' : 'Кобель')} />
          <Choice label="Девочка" active={sex === 'Сука' || sex === 'Кошка'} onPress={() => setSex(kind === 'cat' ? 'Кошка' : 'Сука')} />
        </View>
      </View>
      <View style={styles.footer}>
        <Button
          label="Далее"
          disabled={!name.trim()}
          onPress={onNext}
        />
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
