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
import { ageLabelFromBirth, emptyPetProfile, type PetProfileInput } from '../../data/auth';
import { petSexMessageKey, useI18n } from '../../i18n';
import { useActivePet, useAppStore } from '../../store/useAppStore';
import { colors, spacing, type } from '../../theme';
import type { AppStackParamList, MainTabParamList } from '../../types/navigation';

type ProfileNav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Profile'>,
  NativeStackNavigationProp<AppStackParamList>
>;

export function ProfileScreen() {
  const { t } = useI18n();
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
        <Text style={styles.kicker}>{t('profile_title')}</Text>
        <Text style={styles.title}>{t('profile_pet')}</Text>

        {pets.length === 0 ? (
          <Card>
            <Text style={styles.rowTitle}>{t('profile_noPets')}</Text>
            <Text style={styles.rowCopy}>{t('profile_noPetsCopy')}</Text>
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
                  {item.breed} · {item.birthDate ? ageLabelFromBirth(item.birthDate) : item.ageLabel} · {t(petSexMessageKey(item.sex))}
                </Text>
              </View>
              {item.id === pet.id ? <Text style={styles.current}>{t('profile_current')}</Text> : null}
            </Card>
          </Pressable>
        ))}

        <Button
          label={t('pet_add')}
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
              <Text style={styles.rowTitle}>{t('profile_owner')}</Text>
              <Ionicons name="pencil-outline" size={18} color={colors.ink} />
            </View>
            <Text style={styles.rowCopy}>{ownerName || t('profile_nameMissing')}</Text>
            {ownerCity ? <Text style={styles.rowCopy}>{ownerCity}</Text> : null}
            {currentEmail ? <Text style={styles.rowCopy}>{currentEmail}</Text> : null}
          </Card>
        </Pressable>

        <Button label={t('profile_logout')} variant="danger" onPress={logout} />
      </ScrollView>
      <InAppSheet visible={editingOwner} onClose={() => setEditingOwner(false)}>
        <Text style={styles.sheetTitle}>{t('profile_owner')}</Text>
        <TextField
          label={t('pet_name')}
          placeholder={t('onboarding_namePlaceholder')}
          value={ownerDraft.name}
          onChangeText={(name) => setOwnerDraft((current) => ({ ...current, name }))}
        />
        <TextField
          label={t('profile_city')}
          placeholder={t('onboarding_cityPlaceholder')}
          value={ownerDraft.city}
          onChangeText={(city) => setOwnerDraft((current) => ({ ...current, city }))}
        />
        <TextField label={t('auth_email')} value={currentEmail ?? ''} editable={false} />
        <Text style={styles.sheetHint}>{t('profile_emailLocked')}</Text>
        <Button
          label={t('common_save')}
          onPress={() => {
            setOwnerName(ownerDraft.name.trim());
            setOwnerCity(ownerDraft.city.trim());
            setEditingOwner(false);
          }}
        />
        <Button label={t('common_cancel')} variant="ghost" onPress={() => setEditingOwner(false)} />
      </InAppSheet>
      <InAppSheet visible={creating} padded={false} onClose={() => setCreating(false)}>
        <View style={styles.formSheet}>
          <PetProfileForm
            title={t('pet_new')}
            values={form}
            submitLabel={t('common_add')}
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
