import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PetAvatar } from '../../components/pet/PetAvatar';
import { Button } from '../../components/ui/Button';
import { InAppSheet } from '../../components/ui/InAppSheet';
import { useCollarLocation } from '../../location';
import { MapCanvas } from '../../map';
import { useActivePet, useAppStore } from '../../store/useAppStore';
import { colors, radius, spacing, type } from '../../theme';
import type { AppStackParamList, MainTabParamList } from '../../types/navigation';
import { playPetCall } from '../../utils/petSounds';

type MapNav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Map'>,
  NativeStackNavigationProp<AppStackParamList>
>;

type SosPhase = 'off' | 'info' | 'active' | 'askFound' | 'notFound' | 'continue' | 'found';

export function MapScreen() {
  const navigation = useNavigation<MapNav>();
  const pet = useActivePet();
  const updatePet = useAppStore((state) => state.updatePet);
  const { coordsLabel } = useCollarLocation({
    petId: pet.id,
    collarId: pet.collarId,
  });
  const [expanded, setExpanded] = useState(true);
  const [sosPhase, setSosPhase] = useState<SosPhase>('off');
  const [soundOn, setSoundOn] = useState(false);
  const [zoom, setZoom] = useState(1);
  const lightPulse = useRef(new Animated.Value(0)).current;
  const foundTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sosActive = sosPhase === 'active' || sosPhase === 'askFound' || sosPhase === 'notFound' || sosPhase === 'continue';
  const ledOn = pet.ledOn;

  useEffect(() => {
    return () => {
      if (foundTimer.current) {
        clearTimeout(foundTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!ledOn) {
      lightPulse.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(lightPulse, { toValue: 1, duration: 550, useNativeDriver: true }),
        Animated.timing(lightPulse, { toValue: 0.25, duration: 550, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [ledOn, lightPulse]);

  const toggleSound = async () => {
    if (soundOn) {
      setSoundOn(false);
      return;
    }
    setSoundOn(true);
    const ok = await playPetCall(pet.kind);
    if (!ok) {
      Alert.alert('Сигнал', pet.kind === 'cat' ? 'Мяу! (демо без звука на этой платформе)' : 'Гав! (демо без звука на этой платформе)');
    }
    setTimeout(() => setSoundOn(false), 3200);
  };

  const toggleLight = () => {
    updatePet(pet.id, { ledOn: !pet.ledOn });
  };

  const startSos = () => setSosPhase('info');
  const confirmSos = () => {
    setSosPhase('active');
    setExpanded(true);
  };
  const exitSosAsk = () => setSosPhase('askFound');
  const markFound = () => {
    setSosPhase('found');
    foundTimer.current = setTimeout(() => setSosPhase('off'), 2800);
  };
  const markNotFound = () => setSosPhase('notFound');
  const continueSearch = () => setSosPhase('continue');
  const stopSearch = () => setSosPhase('off');

  const toast =
    sosPhase === 'found'
      ? `${pet.name} найден. Экстренный поиск завершён.`
      : sosPhase === 'continue'
        ? 'Поиск продолжится: сообщим о новом сигнале'
        : null;

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <MapCanvas previewScale={zoom} style={styles.map}>
        <SafeAreaView edges={['top']} style={styles.topBar} pointerEvents="box-none">
          <View style={styles.live}>
            <View style={[styles.liveDot, sosActive && styles.liveDotSos]} />
            <Text style={styles.liveText}>Live · {pet.battery || 67}%</Text>
          </View>
          <Text style={styles.coords}>{coordsLabel ?? '59.9362, 30.3141'}</Text>
        </SafeAreaView>

        {toast ? (
          <View style={[styles.toast, sosPhase === 'found' && styles.toastOk]}>
            <Ionicons
              name={sosPhase === 'found' ? 'checkmark-circle' : 'radio-outline'}
              size={16}
              color={sosPhase === 'found' ? colors.green : colors.purple}
            />
            <Text style={styles.toastText}>{toast}</Text>
          </View>
        ) : null}

        {!sosActive ? <View style={styles.zone} /> : null}

        {sosActive ? (
          <>
            <View style={styles.sosTrail} />
            <View style={styles.distanceTag}>
              <Text style={styles.distanceText}>30 м</Text>
            </View>
            <View style={styles.sosPinGhost} />
          </>
        ) : null}

        <View style={[styles.pin, sosActive && styles.pinSos]}>
          <Animated.View
            style={[
              styles.ledGlow,
              {
                opacity: ledOn ? lightPulse : 0,
              },
            ]}
          />
          <PetAvatar pet={pet} size={52} />
        </View>
      </MapCanvas>

      <View style={styles.zoom} pointerEvents="box-none">
        <Pressable style={styles.zoomBtn} onPress={() => setZoom((z) => Math.min(1.35, Number((z + 0.1).toFixed(2))))}>
          <Ionicons name="add" size={18} color={colors.ink} />
        </Pressable>
        <Pressable style={styles.zoomBtn} onPress={() => setZoom((z) => Math.max(0.85, Number((z - 0.1).toFixed(2))))}>
          <Ionicons name="remove" size={18} color={colors.ink} />
        </Pressable>
        <Pressable style={styles.zoomBtn} onPress={() => setZoom(1)}>
          <Ionicons name="navigate" size={16} color={colors.purple} />
        </Pressable>
      </View>

      <View style={styles.card}>
        <Pressable onPress={() => setExpanded((value) => !value)} style={styles.handleWrap}>
          <View style={styles.handle} />
        </Pressable>
        <View style={styles.cardHead}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardName}>{pet.name}</Text>
            <Text style={[styles.cardMeta, sosActive && styles.cardMetaSos]}>
              {sosActive
                ? `Ищем ${pet.name} • Обновлено 15 сек. назад`
                : 'Все хорошо • Обновлено 15 сек. назад'}
            </Text>
          </View>
          <Pressable
            style={[styles.iconBtn, soundOn && styles.iconBtnOn]}
            onPress={toggleSound}
            accessibilityLabel="Подать звуковой сигнал"
          >
            <Ionicons name={soundOn ? 'volume-high' : 'volume-high-outline'} size={18} color={soundOn ? colors.purple : colors.ink} />
          </Pressable>
          <Pressable
            style={[styles.iconBtn, ledOn && styles.iconBtnOn]}
            onPress={toggleLight}
            accessibilityLabel="Включить свет ошейника"
          >
            <Ionicons name={ledOn ? 'bulb' : 'bulb-outline'} size={18} color={ledOn ? '#E5A100' : colors.ink} />
          </Pressable>
        </View>

        {expanded && !sosActive ? (
          <View style={styles.actions}>
            <Pressable style={styles.sosAction} onPress={startSos}>
              <View style={[styles.miniIcon, { backgroundColor: '#FDECEC' }]}>
                <Ionicons name="notifications" size={18} color={colors.red} />
              </View>
              <Text style={styles.actionLabel}>Экстренный поиск</Text>
            </Pressable>
            <View style={styles.actionRow}>
              <Pressable style={styles.halfAction} onPress={() => navigation.navigate('Geozones')}>
                <View style={[styles.miniIcon, { backgroundColor: colors.greenSoft }]}>
                  <Ionicons name="home-outline" size={18} color={colors.green} />
                </View>
                <Text style={styles.halfLabel}>Дом и геозоны</Text>
              </Pressable>
              <Pressable style={styles.halfAction} onPress={() => navigation.navigate('WalkHistory')}>
                <View style={[styles.miniIcon, { backgroundColor: colors.blueSoft }]}>
                  <Ionicons name="git-branch-outline" size={18} color="#3B82F6" />
                </View>
                <Text style={styles.halfLabel}>История перемещений</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {expanded && sosActive ? (
          <View style={styles.sosPanel}>
            <Text style={styles.sosTitle}>SOS-режим</Text>
            <View style={styles.sosLinks}>
              <Pressable style={styles.sosLink} onPress={() => Alert.alert('Сообщить близким', 'Демо: уведомление отправлено контактам.')}>
                <Ionicons name="flag-outline" size={16} color={colors.red} />
                <Text style={styles.sosLinkText}>Сообщить близким</Text>
              </Pressable>
              <Pressable style={styles.sosLink} onPress={() => Alert.alert('Поделиться', 'Демо: ссылка на геолокацию скопирована.')}>
                <Ionicons name="share-outline" size={16} color={colors.red} />
                <Text style={styles.sosLinkText}>Поделиться геолокацией</Text>
              </Pressable>
            </View>
            <Pressable style={styles.callBtn} onPress={() => Alert.alert('Служба помощи', 'Демо: звонок в службу помощи.')}>
              <Text style={styles.callText}>Связаться со службой помощи</Text>
            </Pressable>
            <Button label="Выйти из режима" variant="ghost" onPress={exitSosAsk} />
          </View>
        ) : null}
      </View>

      <InAppSheet visible={sosPhase === 'info'} onClose={() => setSosPhase('off')}>
        <Text style={styles.sheetTitle}>Как работает экстренный поиск?</Text>
        <Text style={styles.sheetCopy}>
          Tailio будет чаще обновлять геолокацию, чтобы быстрее найти {pet.name}. Это сильнее расходует батарею
          ошейника.
        </Text>
        <Button label="Понятно" onPress={confirmSos} />
      </InAppSheet>

      <InAppSheet visible={sosPhase === 'askFound'} onClose={() => setSosPhase('active')}>
        <Text style={styles.sheetTitle}>Вы нашли {pet.name}?</Text>
        <View style={styles.askRow}>
          <Pressable style={styles.askNo} onPress={markNotFound}>
            <Text style={styles.askNoText}>Нет</Text>
          </Pressable>
          <Pressable style={styles.askYes} onPress={markFound}>
            <Text style={styles.askYesText}>Да</Text>
          </Pressable>
        </View>
      </InAppSheet>

      <InAppSheet visible={sosPhase === 'notFound'} onClose={() => setSosPhase('active')}>
        <Text style={styles.sheetTitle}>Пока {pet.name} не нашли</Text>
        <Text style={styles.sheetCopy}>
          Поиск продолжается. Мы сообщим, когда появится новый сигнал ошейника.
        </Text>
        <Button label="Продолжить поиск" onPress={continueSearch} />
        <Button label="Получить помощь" variant="soft" onPress={() => Alert.alert('Помощь', 'Демо: заявка в поддержку.')} />
        <Button
          label="Поделиться геолокацией"
          variant="ghost"
          onPress={() => Alert.alert('Поделиться', 'Демо: ссылка скопирована.')}
        />
      </InAppSheet>

      <InAppSheet visible={sosPhase === 'continue'} onClose={stopSearch}>
        <Text style={styles.sheetTitle}>Продолжаем поиск</Text>
        <Text style={styles.sheetCopy}>• Обновляем точку при каждом сигнале</Text>
        <Text style={styles.sheetCopy}>• Уведомляем близких о статусе</Text>
        <Text style={styles.sheetCopy}>• Держите ошейник включённым</Text>
        <Text style={[styles.blockTitle, { marginTop: 8 }]}>Что можно сделать</Text>
        <View style={styles.sosGrid}>
          <SosAction icon="volume-high-outline" label="Громкий сигнал" onPress={toggleSound} />
          <SosAction
            icon="navigate-outline"
            label="Построить маршрут"
            onPress={() => Alert.alert('Маршрут', 'Демо: маршрут до последней точки построен.')}
          />
          <SosAction
            icon="flag-outline"
            label="Сообщить близким"
            onPress={() => Alert.alert('Сообщить близким', 'Демо: уведомление отправлено.')}
          />
        </View>
        <Pressable style={styles.stopBtn} onPress={stopSearch}>
          <Text style={styles.stopText}>Остановить поиск</Text>
        </Pressable>
      </InAppSheet>
    </View>
  );
}

function SosAction({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
}) {
  return (
    <Pressable style={styles.sosItem} onPress={onPress}>
      <Ionicons name={icon} size={20} color={colors.red} />
      <Text style={styles.sosItemLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#D7E4D2',
    position: 'relative',
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  topBar: {
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },
  live: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.88)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.green,
  },
  liveDotSos: {
    backgroundColor: colors.red,
  },
  liveText: {
    ...type.caption,
    color: colors.ink,
  },
  coords: {
    ...type.caption,
    color: colors.inkSoft,
    backgroundColor: 'rgba(255,255,255,0.88)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  toast: {
    position: 'absolute',
    top: 96,
    alignSelf: 'center',
    maxWidth: '90%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.paper,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 10,
    zIndex: 3,
    shadowColor: colors.ink,
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  toastOk: {
    backgroundColor: colors.greenSoft,
  },
  toastText: {
    ...type.caption,
    color: colors.ink,
    flexShrink: 1,
  },
  zone: {
    position: 'absolute',
    alignSelf: 'center',
    top: '32%',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(31,157,85,0.18)',
    borderWidth: 2,
    borderColor: 'rgba(31,157,85,0.45)',
  },
  sosTrail: {
    position: 'absolute',
    alignSelf: 'center',
    top: '38%',
    width: 4,
    height: 72,
    backgroundColor: colors.red,
    borderRadius: 2,
    transform: [{ rotate: '28deg' }, { translateX: 36 }],
  },
  distanceTag: {
    position: 'absolute',
    alignSelf: 'center',
    top: '36%',
    marginLeft: 78,
    backgroundColor: colors.paper,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#F5C2C0',
  },
  distanceText: {
    ...type.caption,
    color: colors.red,
  },
  sosPinGhost: {
    position: 'absolute',
    alignSelf: 'center',
    top: '34%',
    marginLeft: -48,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.red,
    opacity: 0.55,
  },
  pin: {
    position: 'absolute',
    alignSelf: 'center',
    top: '42%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinSos: {
    borderWidth: 3,
    borderColor: colors.red,
    borderRadius: 40,
    padding: 2,
  },
  ledGlow: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFE08A',
  },
  zoom: {
    position: 'absolute',
    right: 16,
    top: 110,
    gap: 8,
    zIndex: 4,
  },
  zoomBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: colors.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: colors.paper,
    borderRadius: 24,
    padding: 16,
    shadowColor: colors.ink,
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    zIndex: 5,
  },
  handleWrap: {
    alignItems: 'center',
    paddingBottom: 8,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.line,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardName: {
    ...type.subtitle,
    color: colors.ink,
  },
  cardMeta: {
    ...type.caption,
    color: colors.green,
    marginTop: 2,
  },
  cardMetaSos: {
    color: colors.red,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnOn: {
    backgroundColor: colors.purpleSoft,
  },
  actions: {
    marginTop: 14,
    gap: 8,
  },
  sosAction: {
    minHeight: 52,
    borderRadius: radius.md,
    backgroundColor: colors.bg,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  halfAction: {
    flex: 1,
    minHeight: 72,
    borderRadius: radius.md,
    backgroundColor: colors.bg,
    padding: 12,
    gap: 8,
  },
  halfLabel: {
    ...type.caption,
    color: colors.ink,
    fontFamily: 'Inter_600SemiBold',
  },
  actionLabel: {
    ...type.subtitle,
    color: colors.ink,
  },
  miniIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosPanel: {
    marginTop: 14,
    gap: 10,
  },
  sosTitle: {
    ...type.title,
    color: colors.red,
    fontSize: 22,
  },
  sosLinks: {
    gap: 8,
  },
  sosLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  sosLinkText: {
    ...type.body,
    color: colors.ink,
  },
  sheetTitle: {
    ...type.title,
    color: colors.ink,
  },
  sheetCopy: {
    ...type.body,
    color: colors.muted,
  },
  blockTitle: {
    ...type.subtitle,
    color: colors.ink,
  },
  askRow: {
    flexDirection: 'row',
    gap: 10,
  },
  askNo: {
    flex: 1,
    minHeight: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  askNoText: {
    ...type.button,
    color: colors.ink,
  },
  askYes: {
    flex: 1,
    minHeight: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  askYesText: {
    ...type.button,
    color: colors.white,
  },
  sosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  sosItem: {
    width: '31%',
    flexGrow: 1,
    backgroundColor: '#FDECEC',
    borderRadius: radius.md,
    padding: 12,
    gap: 8,
    minHeight: 88,
  },
  sosItemLabel: {
    ...type.caption,
    color: colors.ink,
  },
  callBtn: {
    backgroundColor: colors.red,
    minHeight: 56,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callText: {
    ...type.button,
    color: colors.white,
  },
  stopBtn: {
    minHeight: 56,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.paper,
  },
  stopText: {
    ...type.button,
    color: colors.red,
  },
});
