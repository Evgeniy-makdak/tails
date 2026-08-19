import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { InAppSheet } from '../../components/ui/InAppSheet';
import { TextField } from '../../components/ui/TextField';
import { PetAvatar } from '../../components/pet/PetAvatar';
import { PetProfileForm } from '../../components/pet/PetProfileForm';
import { emptyPetProfile, type PetProfileInput } from '../../data/auth';
import { useActivePet, useAppStore } from '../../store/useAppStore';
import { colors, spacing, type } from '../../theme';
import type { AppStackParamList, MainTabParamList } from '../../types/navigation';

type ProfileNav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Profile'>,
  NativeStackNavigationProp<AppStackParamList>
>;

export function ProfileScreen() {
  const navigation = useNavigation<ProfileNav>();
  const pet = useActivePet();
  const pets = useAppStore((state) => state.pets);
  const setActivePet = useAppStore((state) => state.setActivePet);
  const logout = useAppStore((state) => state.logout);
  const ownerName = useAppStore((state) => state.ownerName);
  const ownerCity = useAppStore((state) => state.ownerCity);
  const currentEmail = useAppStore((state) => state.currentEmail);
  const addPet = useAppStore((state) => state.addPet);
  const setOwnerName = useAppStore((state) => state.setOwnerName);
  const setOwnerCity = useAppStore((state) => state.setOwnerCity);
  const [creating, setCreating] = useState(false);
  const [editingOwner, setEditingOwner] = useState(false);
  const [form, setForm] = useState<PetProfileInput>(emptyPetProfile());
  const [ownerDraft, setOwnerDraft] = useState({ name: '', city: '' });

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.kicker}>Профиль</Text>
        <Text style={styles.title}>Питомец</Text>

        {pets.length === 0 ? (
          <Card>
            <Text style={styles.rowTitle}>Пока нет питомцев</Text>
            <Text style={styles.rowCopy}>Добавьте первого, чтобы видеть его на главной</Text>
          </Card>
        ) : null}

        {pets.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => {
              setActivePet(item.id);
              navigation.navigate('PetCard', { petId: item.id });
            }}
          >
            <Card style={[styles.pet, item.id === pet.id && styles.petActive]}>
              <PetAvatar pet={item} size={52} />
              <View style={{ flex: 1 }}>
                <Text style={styles.petName}>{item.name}</Text>
                <Text style={styles.petMeta}>
                  {item.breed} · {item.ageLabel} · {item.sex}
                </Text>
              </View>
              {item.id === pet.id ? <Text style={styles.current}>сейчас</Text> : null}
            </Card>
          </Pressable>
        ))}

        <Button
          label="Добавить питомца"
          variant="soft"
          onPress={() => {
            setForm(emptyPetProfile());
            setCreating(true);
          }}
        />

        <Pressable
          onPress={() => {
            setOwnerDraft({ name: ownerName, city: ownerCity });
            setEditingOwner(true);
          }}
        >
          <Card>
            <View style={styles.ownerHead}>
              <Text style={styles.rowTitle}>Хозяин</Text>
              <Ionicons name="pencil-outline" size={18} color={colors.ink} />
            </View>
            <Text style={styles.rowCopy}>{ownerName || 'Имя не указано'}</Text>
            {ownerCity ? <Text style={styles.rowCopy}>{ownerCity}</Text> : null}
            {currentEmail ? <Text style={styles.rowCopy}>{currentEmail}</Text> : null}
          </Card>
        </Pressable>

        <Button label="Выйти" variant="danger" onPress={logout} />
      </ScrollView>
      <InAppSheet visible={editingOwner} onClose={() => setEditingOwner(false)}>
        <Text style={styles.sheetTitle}>Хозяин</Text>
        <TextField
          label="Имя"
          placeholder="Введите имя"
          value={ownerDraft.name}
          onChangeText={(name) => setOwnerDraft((current) => ({ ...current, name }))}
        />
        <TextField
          label="Город"
          placeholder="Введите город проживания"
          value={ownerDraft.city}
          onChangeText={(city) => setOwnerDraft((current) => ({ ...current, city }))}
        />
        <TextField label="Почта" value={currentEmail ?? ''} editable={false} />
        <Text style={styles.sheetHint}>Почта — это логин, её нельзя изменить</Text>
        <Button
          label="Сохранить"
          onPress={() => {
            setOwnerName(ownerDraft.name.trim());
            setOwnerCity(ownerDraft.city.trim());
            setEditingOwner(false);
          }}
        />
        <Button label="Отмена" variant="ghost" onPress={() => setEditingOwner(false)} />
      </InAppSheet>
      <InAppSheet visible={creating} padded={false} onClose={() => setCreating(false)}>
        <View style={styles.formSheet}>
          <PetProfileForm
            title="Новый питомец"
            values={form}
            submitLabel="Добавить"
            onChange={(patch) => setForm((current) => ({ ...current, ...patch }))}
            onCancel={() => setCreating(false)}
            onSubmit={() => {
              addPet(form);
              setCreating(false);
              setForm(emptyPetProfile());
            }}
          />
        </View>
      </InAppSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.xl,
    gap: 12,
    paddingBottom: 120,
  },
  kicker: {
    ...type.caption,
    color: colors.muted,
    textTransform: 'uppercase',
  },
  title: {
    ...type.title,
    color: colors.ink,
    marginBottom: 8,
  },
  pet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  petActive: {
    borderWidth: 1.5,
    borderColor: colors.purple,
  },
  petName: {
    ...type.subtitle,
    color: colors.ink,
  },
  petMeta: {
    ...type.caption,
    color: colors.muted,
    marginTop: 3,
  },
  current: {
    ...type.caption,
    color: colors.purple,
  },
  rowTitle: {
    ...type.subtitle,
    color: colors.ink,
  },
  rowCopy: {
    ...type.body,
    color: colors.inkSoft,
    marginTop: 4,
  },
  ownerHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 24,
    lineHeight: 28,
    color: colors.ink,
  },
  sheetHint: {
    ...type.caption,
    color: colors.muted,
    marginTop: -4,
  },
  formSheet: {
    height: 520,
  },
});
