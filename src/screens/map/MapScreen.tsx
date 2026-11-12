import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PetAvatar } from '../../components/pet/PetAvatar';
import { Button } from '../../components/ui/Button';
import { InAppSheet } from '../../components/ui/InAppSheet';
import { MAP_ENGINE } from '../../config/features';
import { useCollarLocation, useWalkRecordingActions } from '../../location';
import {
  MapCanvas,
  boundsToPolygon,
  buildAllowedZoneCircle,
  buildApproachPolyline,
  mapConfig,
  offsetPoint,
  type MapCamera,
  type MapCircle,
  type MapMarker,
  type MapPolygon,
  type MapPolyline,
} from '../../map';
import { useI18n } from '../../i18n';
import { useActivePet, useAppStore } from '../../store/useAppStore';
import { colors, radius, spacing, type } from '../../theme';
import type { AppStackParamList, MainTabParamList } from '../../types/navigation';
import { playPetCall } from '../../utils/petSounds';
import {
  DEMO_SOS_CONTACTS,
  HELP_HOTLINE_DISPLAY,
  buildNotifyMessage,
  callHelpHotline,
  sharePetGeolocation,
} from '../../utils/sosActions';

type MapNav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Map'>,
  NativeStackNavigationProp<AppStackParamList>
>;

type SosPhase = 'off' | 'info' | 'active' | 'askFound' | 'notFound' | 'continue' | 'found';
type SosActionSheet = 'help' | 'notify' | 'notifySent' | 'shareDone' | 'route' | 'callInfo' | null;

const LIVE_MAP = MAP_ENGINE === 'maplibre';

export function MapScreen() {
  const { t, locale } = useI18n();
  const navigation = useNavigation<MapNav>();
  const pet = useActivePet();
  const updatePet = useAppStore((state) => state.updatePet);
  const geozones = useAppStore((state) => state.geozones);
  const { coordsLabel, point, source, snapshot } = useCollarLocation({
    petId: pet.id,
    collarId: pet.collarId,
  });
  const {
    active: walkActive,
    uploading: walkUploading,
    points: walkPoints,
    lastError: walkError,
    startWalk,
    finishWalk,
  } = useWalkRecordingActions();
  const [walkHint, setWalkHint] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [sosPhase, setSosPhase] = useState<SosPhase>('off');
  const [actionSheet, setActionSheet] = useState<SosActionSheet>(null);
  const [shareHint, setShareHint] = useState('');
  const [soundOn, setSoundOn] = useState(false);
  /** Demo surface CSS scale; live map uses mapZoom instead. */
  const [previewScale, setPreviewScale] = useState(1);
  const [mapZoom, setMapZoom] = useState(mapConfig.defaultCamera.zoom);
  /** Bump to force MapLibre back onto the pet after the user panned away. */
  const [followKey, setFollowKey] = useState(0);
  const lightPulse = useRef(new Animated.Value(0)).current;
  const foundTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sosActive = sosPhase === 'active' || sosPhase === 'askFound' || sosPhase === 'notFound' || sosPhase === 'continue';
  const ledOn = pet.ledOn;
  const center = point ?? mapConfig.defaultCamera.center;

  const camera = useMemo<MapCamera>(
    () => ({
      center,
      zoom: mapZoom,
    }),
    [center, mapZoom],
  );

  const markers = useMemo<MapMarker[]>(() => {
    const list: MapMarker[] = [{ id: 'pet', coordinate: center, kind: 'pet' }];
    if (sosActive) {
      list.push({
        id: 'sos-ghost',
        coordinate: offsetPoint(center, 35, 300),
        kind: 'sos-ghost',
      });
    }
    return list;
  }, [center, sosActive]);

  const circles = useMemo<MapCircle[]>(() => {
    if (sosActive) return [];
    const hasSaved = geozones.some((z) => z.bounds);
    if (hasSaved) return [];
    return [buildAllowedZoneCircle(center, 120, 'zone-allowed')];
  }, [center, sosActive, geozones]);

  const polygons = useMemo<MapPolygon[]>(() => {
    if (sosActive) return [];
    return geozones
      .filter((z) => z.bounds)
      .map((z) => boundsToPolygon(z.bounds!, z.id, z.kind));
  }, [geozones, sosActive]);

  const polylines = useMemo<MapPolyline[]>(() => {
    if (sosActive) return [buildApproachPolyline(center, 'sos-trail')];
    if (walkActive && walkPoints.length >= 2) {
      return [
        {
          id: 'live-walk',
          coordinates: walkPoints,
          color: colors.purple,
          width: 4,
        },
      ];
    }
    return [];
  }, [center, sosActive, walkActive, walkPoints]);

  const onToggleWalk = async () => {
    if (walkUploading) return;
    if (!walkActive) {
      startWalk({ petId: pet.id, petName: pet.name, point });
      setWalkHint(null);
      return;
    }
    const track = await finishWalk();
    if (track) {
      setWalkHint(t('map_walkSaved', { distance: (track.distanceM / 1000).toFixed(1) }));
      setTimeout(() => setWalkHint(null), 3500);
    }
  };

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
      setShareHint(pet.kind === 'cat' ? t('map_catSoundDemo') : t('map_dogSoundDemo'));
      setActionSheet('shareDone');
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
  const liveCoords = coordsLabel ?? `${center.latitude.toFixed(4)}, ${center.longitude.toFixed(4)}`;
  const updatedLabel = snapshot?.point.updatedAt
    ? new Date(snapshot.point.updatedAt).toLocaleTimeString(locale === 'en' ? 'en-US' : 'ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : null;
  const notifyPreview = buildNotifyMessage(pet.name, liveCoords);
  const sourceHint =
    source === 'device' ? t('map_live') : source === 'api' ? t('map_collar') : null;

  const zoomIn = () => {
    if (LIVE_MAP) {
      setMapZoom((z) => Math.min(mapConfig.maxZoom, Number((z + 0.5).toFixed(1))));
    } else {
      setPreviewScale((z) => Math.min(1.35, Number((z + 0.1).toFixed(2))));
    }
  };
  const zoomOut = () => {
    if (LIVE_MAP) {
      setMapZoom((z) => Math.max(mapConfig.minZoom, Number((z - 0.5).toFixed(1))));
    } else {
      setPreviewScale((z) => Math.max(0.85, Number((z - 0.1).toFixed(2))));
    }
  };
  const recenter = () => {
    if (LIVE_MAP) {
      setMapZoom(mapConfig.defaultCamera.zoom);
      setFollowKey((k) => k + 1);
    } else {
      setPreviewScale(1);
    }
  };
  const contactNames = DEMO_SOS_CONTACTS.map((c) => c.name).join(', ');

  const onNotifyRelatives = () => setActionSheet('notify');

  const onShareGeolocation = async () => {
    const result = await sharePetGeolocation(pet.name, liveCoords);
    if (!result.ok) {
      return;
    }
    setShareHint(
      result.method === 'clipboard'
        ? t('map_linkCopied')
        : result.method === 'share'
          ? t('map_locationSent')
          : result.message,
    );
    setActionSheet('shareDone');
  };

  const onContactHelp = () => setActionSheet('help');

  const onConfirmNotify = () => {
    setActionSheet('notifySent');
  };

  const onCallHelp = async () => {
    const result = await callHelpHotline();
    setShareHint(
      result.ok
        ? t('map_calling', { phone: result.detail })
        : t('map_demoHelpLine', { phone: result.detail }),
    );
    setActionSheet('callInfo');
  };

  const onOpenHelpChat = () => {
    setActionSheet(null);
    navigation.navigate('Chat', { mode: 'help' });
  };

  const toast =
    sosPhase === 'found'
      ? t('map_petFound', { name: pet.name })
      : sosPhase === 'continue'
        ? t('map_searchWillContinue')
        : null;

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <MapCanvas
        previewScale={LIVE_MAP ? 1 : previewScale}
        style={styles.map}
        camera={camera}
        markers={LIVE_MAP ? markers : undefined}
        circles={LIVE_MAP ? circles : undefined}
        polygons={LIVE_MAP ? polygons : undefined}
        polylines={LIVE_MAP ? polylines : undefined}
        followKey={followKey}
      >
        <SafeAreaView edges={['top']} style={styles.topBar} pointerEvents="box-none">
          <View style={styles.live}>
            <View style={[styles.liveDot, sosActive && styles.liveDotSos]} />
            <Text style={styles.liveText}>
              {t('map_live')} · {pet.battery || 67}%
            </Text>
          </View>
          <Text style={styles.coords}>
            {liveCoords}
            {LIVE_MAP && sourceHint ? ` · ${sourceHint}` : ''}
            {updatedLabel ? ` · ${updatedLabel}` : ''}
          </Text>
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

        {walkActive && !sosActive ? (
          <View style={styles.recToast}>
            <View style={styles.recDot} />
            <Text style={styles.recToastText}>{t('map_walkRecording')}</Text>
          </View>
        ) : null}

        {!LIVE_MAP && !sosActive ? <View style={styles.zone} /> : null}

        {!LIVE_MAP && sosActive ? (
          <>
            <View style={styles.sosTrail} />
            <View style={styles.distanceTag}>
              <Text style={styles.distanceText}>{t('map_distanceMeters', { value: 30 })}</Text>
            </View>
            <View style={styles.sosPinGhost} />
          </>
        ) : null}

        {!LIVE_MAP ? (
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
        ) : null}
      </MapCanvas>

      <View style={styles.zoom} pointerEvents="box-none">
        <Pressable style={styles.zoomBtn} onPress={zoomIn}>
          <Ionicons name="add" size={18} color={colors.ink} />
        </Pressable>
        <Pressable style={styles.zoomBtn} onPress={zoomOut}>
          <Ionicons name="remove" size={18} color={colors.ink} />
        </Pressable>
        <Pressable style={styles.zoomBtn} onPress={recenter}>
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
                ? t('map_searchingUpdated', { name: pet.name })
                : t('map_allGoodUpdated')}
            </Text>
          </View>
          <Pressable
            style={[styles.iconBtn, soundOn && styles.iconBtnOn]}
            onPress={toggleSound}
            accessibilityLabel={t('map_soundAccessibility')}
          >
            <Ionicons name={soundOn ? 'volume-high' : 'volume-high-outline'} size={18} color={soundOn ? colors.purple : colors.ink} />
          </Pressable>
          <Pressable
            style={[styles.iconBtn, ledOn && styles.iconBtnOn]}
            onPress={toggleLight}
            accessibilityLabel={t('map_lightAccessibility')}
          >
            <Ionicons name={ledOn ? 'bulb' : 'bulb-outline'} size={18} color={ledOn ? '#E5A100' : colors.ink} />
          </Pressable>
        </View>

        {expanded && !sosActive ? (
          <View style={styles.actions}>
            <Button
              label={
                walkUploading
                  ? t('map_saving')
                  : walkActive
                    ? t('map_finishWalk')
                    : t('map_startWalk')
              }
              variant={walkActive ? 'danger' : 'primary'}
              disabled={walkUploading}
              onPress={() => void onToggleWalk()}
            />
            {walkError || walkHint ? (
              <Text style={styles.walkHint}>{walkError || walkHint}</Text>
            ) : null}
            <Pressable style={styles.sosAction} onPress={startSos}>
              <View style={[styles.miniIcon, { backgroundColor: '#FDECEC' }]}>
                <Ionicons name="notifications" size={18} color={colors.red} />
              </View>
              <Text style={styles.actionLabel}>{t('map_emergencySearch')}</Text>
            </Pressable>
            <View style={styles.actionRow}>
              <Pressable style={styles.halfAction} onPress={() => navigation.navigate('Geozones')}>
                <View style={[styles.miniIcon, { backgroundColor: colors.greenSoft }]}>
                  <Ionicons name="home-outline" size={18} color={colors.green} />
                </View>
                <Text style={styles.halfLabel}>{t('map_homeAndZones')}</Text>
              </Pressable>
              <Pressable style={styles.halfAction} onPress={() => navigation.navigate('WalkHistory')}>
                <View style={[styles.miniIcon, { backgroundColor: colors.blueSoft }]}>
                  <Ionicons name="git-branch-outline" size={18} color="#3B82F6" />
                </View>
                <Text style={styles.halfLabel}>{t('map_history')}</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {expanded && sosActive ? (
          <View style={styles.sosPanel}>
            <Text style={styles.sosTitle}>{t('map_sosMode')}</Text>
            <View style={styles.sosCards}>
              <Pressable style={styles.sosCard} onPress={onNotifyRelatives}>
                <Ionicons name="flag-outline" size={22} color={colors.red} />
                <Text style={styles.sosCardText}>{t('map_notifyRelatives')}</Text>
              </Pressable>
              <Pressable style={styles.sosCard} onPress={onShareGeolocation}>
                <Ionicons name="share-outline" size={22} color={colors.red} />
                <Text style={styles.sosCardText}>{t('map_shareLocation')}</Text>
              </Pressable>
            </View>
            <Pressable style={styles.callBtn} onPress={onContactHelp}>
              <Text style={styles.callText}>{t('map_contactHelp')}</Text>
            </Pressable>
            <Button label={t('map_exitMode')} variant="ghost" onPress={exitSosAsk} />
          </View>
        ) : null}
      </View>

      <InAppSheet visible={sosPhase === 'info'} onClose={() => setSosPhase('off')}>
        <Text style={styles.sheetTitle}>{t('map_sosHowTitle')}</Text>
        <Text style={styles.sheetCopy}>
          {t('map_sosHowCopy', { name: pet.name })}
        </Text>
        <Button label={t('map_understood')} onPress={confirmSos} />
      </InAppSheet>

      <InAppSheet visible={sosPhase === 'askFound'} onClose={() => setSosPhase('active')}>
        <Text style={styles.sheetTitle}>{t('map_foundQuestion', { name: pet.name })}</Text>
        <View style={styles.askRow}>
          <Pressable style={styles.askNo} onPress={markNotFound}>
            <Text style={styles.askNoText}>{t('map_no')}</Text>
          </Pressable>
          <Pressable style={styles.askYes} onPress={markFound}>
            <Text style={styles.askYesText}>{t('map_yes')}</Text>
          </Pressable>
        </View>
      </InAppSheet>

      <InAppSheet visible={sosPhase === 'notFound'} onClose={() => setSosPhase('active')}>
        <Text style={styles.sheetTitle}>{t('map_notFoundTitle', { name: pet.name })}</Text>
        <Text style={styles.sheetCopy}>
          {t('map_notFoundCopy')}
        </Text>
        <Button label={t('map_continueSearch')} onPress={continueSearch} />
        <Button label={t('map_getHelp')} variant="soft" onPress={onContactHelp} />
        <Button label={t('map_shareLocation')} variant="ghost" onPress={onShareGeolocation} />
      </InAppSheet>

      <InAppSheet visible={sosPhase === 'continue'} onClose={stopSearch}>
        <Text style={styles.sheetTitle}>{t('map_searchContinues')}</Text>
        <Text style={styles.sheetCopy}>{t('map_updateEachSignal')}</Text>
        <Text style={styles.sheetCopy}>{t('map_notifyStatus')}</Text>
        <Text style={styles.sheetCopy}>{t('map_keepCollarOn')}</Text>
        <Text style={[styles.blockTitle, { marginTop: 8 }]}>{t('map_whatCanDo')}</Text>
        <View style={styles.sosGrid}>
          <SosAction icon="volume-high-outline" label={t('map_loudSignal')} onPress={toggleSound} />
          <SosAction icon="navigate-outline" label={t('map_buildRoute')} onPress={() => setActionSheet('route')} />
          <SosAction icon="flag-outline" label={t('map_notifyRelatives')} onPress={onNotifyRelatives} />
        </View>
        <Pressable style={styles.stopBtn} onPress={stopSearch}>
          <Text style={styles.stopText}>{t('map_stopSearch')}</Text>
        </Pressable>
      </InAppSheet>

      <InAppSheet visible={actionSheet === 'help'} onClose={() => setActionSheet(null)}>
        <Text style={styles.sheetTitle}>{t('map_helpService')}</Text>
        <Text style={styles.sheetCopy}>{t('map_helpCoordinates', { name: pet.name, coordinates: liveCoords })}</Text>
        <Button label={t('map_call', { phone: HELP_HOTLINE_DISPLAY })} onPress={() => void onCallHelp()} />
        <Button label={t('map_specialistChat')} variant="soft" onPress={onOpenHelpChat} />
        <Button label={t('common_cancel')} variant="ghost" onPress={() => setActionSheet(null)} />
      </InAppSheet>

      <InAppSheet visible={actionSheet === 'notify'} onClose={() => setActionSheet(null)}>
        <Text style={styles.sheetTitle}>{t('map_notifyRelatives')}</Text>
        <Text style={styles.sheetCopy}>{t('map_notifyQuestion', { names: contactNames })}</Text>
        <Text style={styles.sheetCopy}>«{notifyPreview}»</Text>
        <Button label={t('common_send')} onPress={onConfirmNotify} />
        <Button label={t('common_cancel')} variant="ghost" onPress={() => setActionSheet(null)} />
      </InAppSheet>

      <InAppSheet visible={actionSheet === 'notifySent'} onClose={() => setActionSheet(null)}>
        <Text style={styles.sheetTitle}>{t('map_sent')}</Text>
        <Text style={styles.sheetCopy}>{t('map_relativesNotified', { name: pet.name })}</Text>
        <Button label={t('common_ok')} onPress={() => setActionSheet(null)} />
      </InAppSheet>

      <InAppSheet visible={actionSheet === 'shareDone'} onClose={() => setActionSheet(null)}>
        <Text style={styles.sheetTitle}>{t('map_ready')}</Text>
        <Text style={styles.sheetCopy}>{shareHint}</Text>
        <Button label={t('common_ok')} onPress={() => setActionSheet(null)} />
      </InAppSheet>

      <InAppSheet visible={actionSheet === 'callInfo'} onClose={() => setActionSheet(null)}>
        <Text style={styles.sheetTitle}>{t('map_callTitle')}</Text>
        <Text style={styles.sheetCopy}>{shareHint}</Text>
        <Button label={t('map_specialistChat')} variant="soft" onPress={onOpenHelpChat} />
        <Button label={t('common_close')} variant="ghost" onPress={() => setActionSheet(null)} />
      </InAppSheet>

      <InAppSheet visible={actionSheet === 'route'} onClose={() => setActionSheet(null)}>
        <Text style={styles.sheetTitle}>{t('map_route')}</Text>
        <Text style={styles.sheetCopy}>{t('map_routeCopy', { name: pet.name, coordinates: liveCoords })}</Text>
        <Button label={t('common_ok')} onPress={() => setActionSheet(null)} />
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
    backgroundColor: '#E8EEF2',
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
  recToast: {
    position: 'absolute',
    top: 96,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.paper,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 10,
    zIndex: 3,
    borderWidth: 1,
    borderColor: colors.purpleSoft,
  },
  recDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.red,
  },
  recToastText: {
    ...type.caption,
    color: colors.ink,
  },
  walkHint: {
    ...type.caption,
    color: colors.muted,
    textAlign: 'center',
    paddingHorizontal: 4,
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
    zIndex: 20,
    elevation: 20,
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
  sosCards: {
    flexDirection: 'row',
    gap: 8,
  },
  sosCard: {
    flex: 1,
    minHeight: 88,
    borderRadius: radius.md,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 12,
    gap: 10,
    justifyContent: 'space-between',
  },
  sosCardText: {
    ...type.caption,
    color: colors.ink,
    fontFamily: 'Inter_600SemiBold',
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
