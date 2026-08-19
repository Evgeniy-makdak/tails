import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../components/ui/Button';
import { EMPTY_ROOM, PHOTO_LIBRARY } from '../../data/photos';
import { useActivePet, useAppStore } from '../../store/useAppStore';
import { colors, type } from '../../theme';
import type { Pet } from '../../types/pet';
import type { AppStackParamList, MainTabParamList } from '../../types/navigation';

type HomeNav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Home'>,
  NativeStackNavigationProp<AppStackParamList>
>;

export function HomeScreen() {
  const navigation = useNavigation<HomeNav>();
  const pet = useActivePet();
  const overlay = useAppStore((state) => state.homeOverlay);
  const setHomeOverlay = useAppStore((state) => state.setHomeOverlay);
  const addPetPhoto = useAppStore((state) => state.addPetPhoto);
  const unread = useAppStore((state) => state.notifications.some((item) => !item.read));
  const [addMode, setAddMode] = useState(false);

  const scene = pet.heroPhoto ?? EMPTY_ROOM;
  const hasPhoto = Boolean(pet.heroPhoto || pet.photo);

  useEffect(() => {
    setAddMode(false);
  }, [pet.id]);

  return (
    <View style={styles.root}>
      <View style={styles.sceneClip} pointerEvents="none">
        <Image source={scene} style={styles.scene} resizeMode="cover" />
      </View>
      <View style={styles.bg}>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <StatusBar style="dark" />
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.avatarHit}>
                <Pressable onPress={() => setAddMode((value) => !value)} style={styles.avatarWrap}>
                  {pet.photo ? (
                    <Image
                      source={pet.photo}
                      style={[
                        styles.avatar,
                        Platform.OS === 'web' ? ({ objectFit: 'cover', objectPosition: 'center 18%' } as object) : null,
                      ]}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.avatarFallback}>
                      <Ionicons name="image-outline" size={22} color="#8E8E93" />
                    </View>
                  )}
                </Pressable>
                {addMode ? (
                  <Pressable
                    style={styles.avatarPlus}
                    onPress={() => setHomeOverlay('photos')}
                    hitSlop={8}
                  >
                    <Ionicons name="add" size={16} color={colors.white} />
                  </Pressable>
                ) : null}
              </View>
              <Pressable
                style={styles.petBtn}
                onPress={() => setHomeOverlay('pets')}
              >
                <Text style={styles.petName}>{pet.name}</Text>
                <Ionicons name="chevron-down" size={22} color={colors.ink} />
              </Pressable>
            </View>
            <Pressable onPress={() => navigation.navigate('Notifications')} hitSlop={10} style={styles.bellBtn}>
              <Ionicons name="notifications-outline" size={24} color={colors.ink} />
              {unread ? <View style={styles.bellDot} /> : null}
            </Pressable>
          </View>

          {addMode && (pet.gallery?.length ?? 0) > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.film}>
              {(pet.gallery ?? []).map((photo) => (
                <Pressable key={String(photo)} onPress={() => addPetPhoto(pet.id, photo)}>
                  <Image source={photo} style={styles.filmThumb} resizeMode="cover" />
                </Pressable>
              ))}
            </ScrollView>
          ) : null}

          {hasPhoto ? (
            <View style={styles.statusCard}>
              <View style={styles.check}>
                <Ionicons name="checkmark" size={20} color={colors.ink} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.statusCopy}>
                  <Text style={styles.statusTitle}>Всё хорошо</Text>
                  <Text style={styles.statusSub}>
                    {pet.name} дома и спокоен
                  </Text>
                </View>
                <View style={styles.statusMeta}>
                  <Ionicons name="battery-half" size={14} color={colors.ink} />
                  <Text style={styles.metaText}>{pet.battery}%</Text>
                  <Text style={styles.metaText}>•</Text>
                  <Text style={styles.metaText}>1 мин. назад</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.emptyWrap}>
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>Добавьте фото питомца</Text>
                <Text style={styles.emptyCopy}>Tailio создаст цифрового компаньона</Text>
              </View>
              <Pressable style={styles.emptyPlus} onPress={() => setHomeOverlay('photos')}>
                <Ionicons name="add" size={32} color={colors.white} />
              </Pressable>
            </View>
          )}
        </SafeAreaView>

        <Pressable style={styles.fab} onPress={() => navigation.navigate('Chat')}>
          <Ionicons name="color-wand-outline" size={22} color={colors.white} />
        </Pressable>
      </View>

      {overlay === 'pets' ? <PetsSheet /> : null}
      {overlay === 'photos' ? <PhotosSheet pet={pet} /> : null}
    </View>
  );
}

function PetsSheet() {
  const pet = useActivePet();
  const pets = useAppStore((state) => state.pets);
  const setHomeOverlay = useAppStore((state) => state.setHomeOverlay);
  const setActivePet = useAppStore((state) => state.setActivePet);
  const addPet = useAppStore((state) => state.addPet);
  const [draftId, setDraftId] = useState(pet.id);

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <Pressable style={styles.backdrop} onPress={() => setHomeOverlay(null)} />
      <View style={styles.sheetStack}>
        <Pressable style={styles.backBtn} onPress={() => setHomeOverlay(null)}>
          <Ionicons name="chevron-back" size={22} color={colors.ink} />
        </Pressable>
        <View style={styles.sheet}>
        <View style={styles.sheetHead}>
          <Text style={styles.sheetTitle}>Ваши питомцы</Text>
          <Pressable onPress={addPet} hitSlop={8}>
            <Ionicons name="add" size={24} color={colors.ink} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.sheetList} showsVerticalScrollIndicator={false}>
          {pets.map((item) => {
            const selected = item.id === draftId;
            return (
              <Pressable
                key={item.id}
                style={[styles.petRow, selected && styles.petRowSelected]}
                onPress={() => setDraftId(item.id)}
              >
                <SheetAvatar pet={item} />
                <View style={styles.petRowCopy}>
                  <Text style={styles.sheetName}>{item.name}</Text>
                  {item.collarConnected ? (
                    <Text style={styles.okLine}>Все хорошо  •  Дома</Text>
                  ) : (
                    <Text style={styles.offLine}>Устройство не подключено</Text>
                  )}
                  {item.collarConnected ? (
                    <View style={styles.rowMeta}>
                      <Ionicons name="battery-half" size={14} color={colors.ink} />
                      <Text style={styles.rowMetaText}>{item.battery}%</Text>
                      <Text style={styles.rowMetaText}>•</Text>
                      <Text style={styles.rowMetaText}>1 мин. назад</Text>
                    </View>
                  ) : null}
                </View>
                <Ionicons name="pencil-outline" size={18} color={colors.ink} />
              </Pressable>
            );
          })}
        </ScrollView>
        <View style={styles.sheetFooter}>
          <Button
            label="Сохранить"
            onPress={() => {
              setActivePet(draftId);
              setHomeOverlay(null);
            }}
            style={styles.saveBtn}
          />
        </View>
        </View>
      </View>
    </View>
  );
}

function PhotosSheet({ pet }: { pet: Pet }) {
  const setHomeOverlay = useAppStore((state) => state.setHomeOverlay);
  const addPetPhoto = useAppStore((state) => state.addPetPhoto);

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <Pressable style={styles.backdrop} onPress={() => setHomeOverlay(null)} />
      <View style={styles.photoSheet}>
        <Text style={styles.sheetTitle}>Добавить фото</Text>
        <Text style={styles.photoHint}>Выберите изображение из папки img</Text>
        <View style={styles.photoGrid}>
          {PHOTO_LIBRARY.map((photo) => (
            <Pressable
              key={String(photo)}
              style={styles.photoCell}
              onPress={() => {
                addPetPhoto(pet.id, photo);
                setHomeOverlay(null);
              }}
            >
              <Image source={photo} style={styles.photoCellImg} resizeMode="cover" />
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

function SheetAvatar({ pet }: { pet: Pet }) {
  if (pet.photo) {
    return (
      <View style={styles.sheetAvatar}>
        <Image source={pet.photo} style={styles.sheetAvatarImg} resizeMode="cover" />
      </View>
    );
  }
  return (
    <View style={styles.sheetAvatarFallback}>
      <Ionicons name="image-outline" size={20} color="#8E8E93" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#E6E6E6',
    overflow: 'hidden',
  },
  sceneClip: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  scene: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    ...(Platform.OS === 'web'
      ? ({
          objectFit: 'cover',
          objectPosition: 'center 40%',
        } as object)
      : null),
  },
  bg: {
    flex: 1,
  },
  safe: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 56,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  avatarHit: {
    width: 50,
    height: 50,
  },
  avatarWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    backgroundColor: '#D3D3D3',
  },
  avatar: {
    width: 50,
    height: 50,
  },
  avatarFallback: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlus: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  petBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    flexShrink: 1,
  },
  petName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 28,
    lineHeight: 32,
    color: colors.ink,
  },
  bellBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellDot: {
    position: 'absolute',
    top: 1,
    right: 1,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.red,
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  film: {
    gap: 8,
    paddingVertical: 8,
  },
  filmThumb: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: colors.white,
  },
  statusCard: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(200, 243, 221, 0.55)',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 4 },
  },
  check: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#7FE3B0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusCopy: {
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(25, 45, 35, 0.1)',
    gap: 2,
  },
  statusTitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 20,
    lineHeight: 24,
    color: '#192D23',
  },
  statusSub: {
    ...type.body,
    fontSize: 14,
    lineHeight: 18,
    color: '#192D23',
  },
  statusMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 8,
    opacity: 0.5,
  },
  metaText: {
    ...type.caption,
    color: colors.ink,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 80,
    gap: 16,
  },
  emptyCard: {
    alignSelf: 'stretch',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 20,
    alignItems: 'center',
  },
  emptyTitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 24,
    lineHeight: 28,
    color: '#141414',
    textAlign: 'center',
  },
  emptyCopy: {
    ...type.body,
    fontSize: 14,
    color: colors.ink,
    opacity: 0.5,
    textAlign: 'center',
    marginTop: 2,
  },
  emptyPlus: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: 40,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(1, 1, 1, 0.5)',
  },
  sheetStack: {
    width: '100%',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
    marginBottom: 12,
  },
  sheet: {
    backgroundColor: colors.paper,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: 502,
    width: '100%',
  },
  sheetHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  sheetTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 28,
    lineHeight: 32,
    color: colors.ink,
  },
  sheetList: {
    paddingHorizontal: 8,
    paddingBottom: 88,
    gap: 4,
  },
  petRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  petRowSelected: {
    backgroundColor: '#F2F2F2',
  },
  petRowCopy: {
    flex: 1,
    gap: 4,
  },
  sheetName: {
    fontFamily: 'Inter_500Medium',
    fontSize: 24,
    lineHeight: 28,
    color: colors.ink,
  },
  okLine: {
    ...type.caption,
    color: '#00C012',
  },
  offLine: {
    ...type.caption,
    color: colors.ink,
    opacity: 0.5,
  },
  rowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    opacity: 0.5,
  },
  rowMetaText: {
    ...type.caption,
    color: colors.ink,
  },
  sheetAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    backgroundColor: '#E6E6E6',
  },
  sheetAvatarImg: {
    width: 50,
    height: 50,
  },
  sheetAvatarFallback: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E6E6E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    backgroundColor: colors.paper,
  },
  saveBtn: {
    backgroundColor: '#A197FF',
  },
  photoSheet: {
    backgroundColor: colors.paper,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    paddingBottom: 28,
    gap: 12,
  },
  photoHint: {
    ...type.body,
    color: colors.muted,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  photoCell: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.line,
  },
  photoCellImg: {
    width: '100%',
    height: '100%',
  },
});
