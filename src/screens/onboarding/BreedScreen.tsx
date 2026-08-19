import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { useAppStore } from '../../store/useAppStore';
import { colors, spacing, type } from '../../theme';

import { BREEDS } from '../../data/breeds';

type Props = {
  onSave: () => void;
  onBack: () => void;
};

export function BreedScreen({ onSave, onBack }: Props) {
  const breed = useAppStore((state) => state.onboarding.breed);
  const patchOnboarding = useAppStore((state) => state.patchOnboarding);
  const [query, setQuery] = useState('');
  const list = BREEDS.filter((item) => item.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable onPress={onBack}>
          <Text style={styles.back}>←</Text>
        </Pressable>
        <Text style={styles.title}>Порода</Text>
        <View style={{ width: 28 }} />
      </View>
      <View style={styles.search}>
        <TextField placeholder="Введите название вашей породы" value={query} onChangeText={setQuery} />
      </View>
      <ScrollView contentContainerStyle={styles.list}>
        {list.map((item) => (
          <Pressable key={item} style={styles.row} onPress={() => patchOnboarding({ breed: item })}>
            <Text style={styles.name}>{item}</Text>
            <View style={[styles.radio, breed === item && styles.radioOn]} />
          </Pressable>
        ))}
      </ScrollView>
      <View style={styles.footer}>
        <Button label="Сохранить" disabled={!breed.trim()} onPress={onSave} />
      </View>
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
  search: {
    paddingHorizontal: spacing.xl,
    paddingTop: 12,
  },
  list: {
    padding: spacing.xl,
    gap: 4,
  },
  row: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  name: {
    ...type.body,
    color: colors.ink,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.line,
  },
  radioOn: {
    borderColor: colors.purple,
    backgroundColor: colors.purple,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
});
