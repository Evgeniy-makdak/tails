import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { PetAvatar } from '../../components/pet/PetAvatar';
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
  const replayIntro = useAppStore((state) => state.replayIntro);
  const ownerName = useAppStore((state) => state.ownerName);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.kicker}>Профиль</Text>
        <Text style={styles.title}>Питомец</Text>

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

        <Card>
          <Text style={styles.rowTitle}>Хозяин</Text>
          <Text style={styles.rowCopy}>{ownerName}</Text>
        </Card>

        <Button label="Показать первый вход" variant="soft" onPress={replayIntro} />
        <Button label="Выйти" variant="danger" onPress={logout} />
      </ScrollView>
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
});
