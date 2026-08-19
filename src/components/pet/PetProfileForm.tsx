import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { type PetProfileInput } from '../../data/auth';
import { BREEDS } from '../../data/breeds';
import { colors, radius, type } from '../../theme';
import type { PetKind } from '../../types/pet';
import { Button } from '../ui/Button';
import { TextField } from '../ui/TextField';

type Props = {
  title: string;
  values: PetProfileInput;
  submitLabel: string;
  onChange: (patch: Partial<PetProfileInput>) => void;
  onSubmit: () => void;
  onCancel: () => void;
};

export function PetProfileForm({ title, values, submitLabel, onChange, onSubmit, onCancel }: Props) {
  const [pickingBreed, setPickingBreed] = useState(false);
  const [query, setQuery] = useState('');
  const boy = values.sex === 'Кобель' || values.sex === 'Кот';
  const list = BREEDS.filter((item) => item.toLowerCase().includes(query.trim().toLowerCase()));

  const setKind = (kind: PetKind) => {
    onChange({
      kind,
      sex: kind === 'cat' ? (boy ? 'Кот' : 'Кошка') : boy ? 'Кобель' : 'Сука',
    });
  };

  if (pickingBreed) {
    return (
      <View style={styles.root}>
        <Text style={styles.title}>Порода</Text>
        <View style={styles.search}>
          <TextField placeholder="Введите название вашей породы" value={query} onChangeText={setQuery} />
        </View>
        <ScrollView style={styles.breedList} contentContainerStyle={styles.breedContent} keyboardShouldPersistTaps="handled">
          {list.map((item) => (
            <Pressable
              key={item}
              style={styles.breedRow}
              onPress={() => {
                onChange({ breed: item });
                setPickingBreed(false);
                setQuery('');
              }}
            >
              <Text style={styles.breedName}>{item}</Text>
              <View style={[styles.radio, values.breed === item && styles.radioOn]} />
            </Pressable>
          ))}
        </ScrollView>
        <View style={styles.actions}>
          <Button label="Назад" variant="ghost" onPress={() => setPickingBreed(false)} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Text style={styles.title}>{title}</Text>
      <ScrollView style={styles.form} contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
        <TextField
          label="Имя питомца"
          placeholder="Имя питомца"
          value={values.name}
          onChangeText={(name) => onChange({ name })}
        />
        <Pressable onPress={() => setPickingBreed(true)}>
          <TextField
            label="Порода питомца"
            placeholder="Порода питомца"
            value={values.breed}
            editable={false}
            pointerEvents="none"
          />
        </Pressable>
        <TextField
          label="Дата рождения"
          placeholder="01.01.2020"
          value={values.birthDate}
          onChangeText={(birthDate) => onChange({ birthDate })}
        />
        <Text style={styles.section}>Кто ваш питомец?</Text>
        <View style={styles.row}>
          <Choice label="Собака" active={values.kind === 'dog'} onPress={() => setKind('dog')} />
          <Choice label="Кошка" active={values.kind === 'cat'} onPress={() => setKind('cat')} />
        </View>
        <Text style={styles.section}>Пол питомца</Text>
        <View style={styles.row}>
          <Choice
            label="Мальчик"
            active={boy}
            onPress={() => onChange({ sex: values.kind === 'cat' ? 'Кот' : 'Кобель' })}
          />
          <Choice
            label="Девочка"
            active={!boy}
            onPress={() => onChange({ sex: values.kind === 'cat' ? 'Кошка' : 'Сука' })}
          />
        </View>
      </ScrollView>
      <View style={styles.actions}>
        <Button label={submitLabel} disabled={!values.name.trim()} onPress={onSubmit} />
        <Button label="Отмена" variant="ghost" onPress={onCancel} />
      </View>
    </View>
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
  },
  title: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 24,
    lineHeight: 28,
    color: colors.ink,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  search: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  actions: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 4,
  },
  form: {
    flex: 1,
  },
  formContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  section: {
    ...type.subtitle,
    color: colors.ink,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  choice: {
    flex: 1,
    height: 48,
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
  breedList: {
    flex: 1,
  },
  breedContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  breedRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  breedName: {
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
});
