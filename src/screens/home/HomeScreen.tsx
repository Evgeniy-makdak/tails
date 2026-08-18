import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PetAvatar } from '../../components/pet/PetAvatar';
import { Button } from '../../components/ui/Button';
import { InAppSheet } from '../../components/ui/InAppSheet';
import { useActivePet, useAppStore } from '../../store/useAppStore';
import { colors, radius, spacing, type } from '../../theme';
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
  const unread = useAppStore((state) => state.notifications.some((item) => !item.read));
  const [picker, setPicker] = useState(false);

  return (
    <View style={styles.root}>
      <ImageBackground source={require('../../../assets/home-room.png')} style={styles.bg} resizeMode="cover">
        <SafeAreaView style={styles.safe} edges={['top']}>
          <StatusBar style="light" />
          <View style={styles.header}>
            <Pressable style={styles.petBtn} onPress={() => setPicker(true)}>
              <Text style={styles.petName}>{pet.name} ▾</Text>
              <Text style={styles.petAge}>{pet.ageLabel}</Text>
              <View style={styles.tags}>
                <Text style={styles.tag}>🏠 {pet.online ? 'Дома' : 'Не в сети'}</Text>
                <Text style={styles.tag}>🛡️ Спокоен</Text>
              </View>
            </Pressable>
            <Pressable onPress={() => navigation.navigate('Notifications')} style={styles.bell}>
              <Ionicons name="notifications-outline" size={22} color={colors.ink} />
              {unread ? <View style={styles.dot} /> : null}
            </Pressable>
          </View>

          <View style={styles.banner}>
            <Text style={styles.bannerTitle}>Всё хорошо</Text>
            <Text style={styles.bannerCopy}>
              {pet.name} дома и спокоен
              {pet.collarConnected ? `  ·  🔋 ${pet.battery}%` : '  ·  устройство не подключено'}
            </Text>
          </View>
        </SafeAreaView>

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
            {item.id === pet.id ? <Text style={styles.now}>сейчас</Text> : null}
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  petBtn: {
    flex: 1,
  },
  petName: {
    ...type.title,
    color: colors.white,
  },
  petAge: {
    ...type.caption,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  tags: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  tag: {
    ...type.caption,
    color: colors.ink,
    backgroundColor: 'rgba(255,255,255,0.88)',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  bell: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: colors.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.purple,
  },
  banner: {
    marginTop: 14,
    backgroundColor: colors.greenSoft,
    borderRadius: radius.md,
    padding: 14,
  },
  bannerTitle: {
    ...type.subtitle,
    color: colors.green,
  },
  bannerCopy: {
    ...type.caption,
    color: colors.inkSoft,
    marginTop: 4,
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
  now: {
    ...type.caption,
    color: colors.purple,
  },
});
