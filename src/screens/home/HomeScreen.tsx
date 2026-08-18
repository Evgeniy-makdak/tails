import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Image, ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PetAvatar } from '../../components/pet/PetAvatar';
import { Button } from '../../components/ui/Button';
import { InAppSheet } from '../../components/ui/InAppSheet';
import { useActivePet, useAppStore } from '../../store/useAppStore';
import { colors, spacing, type } from '../../theme';
import type { AppStackParamList, MainTabParamList } from '../../types/navigation';

type HomeNav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Home'>,
  NativeStackNavigationProp<AppStackParamList>
>;

export function HomeScreen() {
  const navigation = useNavigation<HomeNav>();
  const pet = useActivePet();
  const pets = useAppStore((state) => state.pets);
  const setActivePet = useAppStore((state) => state.setActivePet);
  const [picker, setPicker] = useState(false);
  const [addedPhoto, setAddedPhoto] = useState(Boolean(pet.photo));
  const showPhoto = Boolean(pet.photo) || addedPhoto;

  return (
    <View style={styles.root}>
      <ImageBackground source={require('../../../assets/home-room.png')} style={styles.bg} resizeMode="cover">
        <SafeAreaView style={styles.safe} edges={['top']}>
          <StatusBar style="light" />
          <View style={styles.header}>
            <Pressable style={styles.petBtn} onPress={() => setPicker(true)}>
              <Text style={styles.petName}>{pet.name}</Text>
              <Ionicons name="chevron-down" size={18} color={colors.white} />
            </Pressable>
          </View>

          {showPhoto ? (
            <View style={styles.banner}>
              <Text style={styles.bannerTitle}>Всё хорошо</Text>
              <Text style={styles.bannerCopy}>{pet.name} дома и спокоен</Text>
            </View>
          ) : (
            <View style={styles.emptyBanner}>
              <Text style={styles.emptyTitle}>Добавьте фото питомца</Text>
              <Text style={styles.emptyCopy}>Tailio создаст цифрового компаньона</Text>
            </View>
          )}

          {showPhoto && pet.photo ? (
            <Image source={pet.photo} style={styles.hero} resizeMode="contain" />
          ) : null}
        </SafeAreaView>

        {!showPhoto ? (
          <Pressable style={styles.plus} onPress={() => setAddedPhoto(true)}>
            <Ionicons name="add" size={28} color={colors.white} />
          </Pressable>
        ) : null}

        <Pressable style={styles.chatFab} onPress={() => navigation.navigate('Chat')}>
          <Ionicons name="chatbubble-ellipses" size={22} color={colors.white} />
        </Pressable>
      </ImageBackground>

      <InAppSheet visible={picker} onClose={() => setPicker(false)}>
        <Text style={styles.sheetTitle}>Ваши питомцы</Text>
        {pets.map((item) => (
          <Pressable
            key={item.id}
            style={styles.sheetRow}
            onPress={() => {
              setActivePet(item.id);
              setAddedPhoto(Boolean(item.photo));
              setPicker(false);
            }}
          >
            <PetAvatar pet={item} size={44} />
            <View style={{ flex: 1 }}>
              <Text style={styles.sheetName}>{item.name}</Text>
              <Text style={styles.sheetMeta}>
                {item.collarConnected ? `${item.breed} · онлайн` : 'Устройство не подключено'}
              </Text>
            </View>
            <Ionicons name="pencil-outline" size={16} color={colors.muted} />
          </Pressable>
        ))}
        <Button label="Сохранить" onPress={() => setPicker(false)} />
      </InAppSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.ink,
    position: 'relative',
    overflow: 'hidden',
  },
  bg: {
    flex: 1,
  },
  safe: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  petBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  petName: {
    ...type.title,
    color: colors.white,
  },
  banner: {
    marginTop: 14,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 20,
    padding: 14,
    alignItems: 'center',
  },
  bannerTitle: {
    ...type.subtitle,
    fontSize: 24,
    color: colors.ink,
  },
  bannerCopy: {
    ...type.body,
    color: colors.inkSoft,
    marginTop: 4,
  },
  emptyBanner: {
    marginTop: 14,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 20,
    padding: 14,
    alignItems: 'center',
  },
  emptyTitle: {
    ...type.subtitle,
    fontSize: 20,
    color: colors.ink,
  },
  emptyCopy: {
    ...type.caption,
    color: colors.inkSoft,
    marginTop: 4,
  },
  hero: {
    width: 220,
    height: 220,
    alignSelf: 'center',
    marginTop: 24,
  },
  plus: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: 120,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatFab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  sheetTitle: {
    ...type.title,
    fontSize: 22,
    color: colors.ink,
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  sheetName: {
    ...type.subtitle,
    color: colors.ink,
  },
  sheetMeta: {
    ...type.caption,
    color: colors.muted,
    marginTop: 2,
  },
});
