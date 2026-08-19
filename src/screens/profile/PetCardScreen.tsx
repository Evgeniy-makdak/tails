import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '../../components/ui/Button';
import { InAppSheet } from '../../components/ui/InAppSheet';
import { PHOTO_LIBRARY } from '../../data/photos';
import { useAppStore } from '../../store/useAppStore';
import { colors, type } from '../../theme';
import type { AppStackParamList } from '../../types/navigation';
import type { Pet } from '../../types/pet';

type Props = NativeStackScreenProps<AppStackParamList, 'PetCard'>;
type TabId = 'photo' | 'companion' | 'device';

const TABS: { id: TabId; label: string }[] = [
  { id: 'photo', label: 'Фото' },
  { id: 'companion', label: 'Компаньон' },
  { id: 'device', label: 'Устройство' },
];

export function PetCardScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const pet = useAppStore((state) => state.pets.find((item) => item.id === route.params.petId) ?? state.pets[0]!);
  const updatePet = useAppStore((state) => state.updatePet);
  const removePet = useAppStore((state) => state.removePet);
  const [tab, setTab] = useState<TabId>('photo');
  const [menu, setMenu] = useState(false);
  const [edit, setEdit] = useState(false);
  const [remove, setRemove] = useState(false);

  const kindLabel = pet.kind === 'cat' ? 'Кошка' : 'Собака';
  const sexLabel = pet.sex === 'Сука' || pet.sex === 'Кошка' ? 'Жен' : 'Муж';
  const photos = useMemo(() => uniquePhotos(pet), [pet]);
  const hero = pet.heroPhoto ?? pet.photo;

  const showAvatar = tab !== 'photo' || !hero;
  const sheetTop = tab === 'photo' && hero ? 250 : 168;

  return (
    <View style={styles.root}>
      <StatusBar style={tab === 'photo' && hero ? 'light' : 'dark'} />
      {tab === 'photo' && hero ? (
        <CoverImage source={hero} style={styles.hero} position="center 38%" />
      ) : (
        <LinearGradient colors={['#EFE8FF', '#D8D0FF']} style={styles.heroSoft} />
      )}

      <SafeAreaView edges={['top']} style={styles.topBar}>
        <Pressable style={styles.roundBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={colors.ink} />
        </Pressable>
        <Pressable style={styles.roundBtn} onPress={() => setMenu((value) => !value)}>
          <Ionicons name="ellipsis-horizontal" size={20} color={colors.ink} />
        </Pressable>
      </SafeAreaView>

      <ScrollView
        style={[styles.sheet, { marginTop: sheetTop }]}
        contentContainerStyle={[styles.sheetContent, showAvatar && styles.sheetContentWithAvatar]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.name}>{pet.name}</Text>
        <Text style={styles.subtitle}>
          {kindLabel}  •  {pet.id === 'persik' ? '2 года' : pet.ageLabel}
        </Text>

        <View style={styles.facts}>
          <Fact label="Порода" value={pet.breed} />
          <Fact label="Пол" value={sexLabel} />
          <Fact label="Дата рождения" value={pet.birthDate} />
          <Fact label="Вес" value={`${pet.weightKg} кг`} />
          <Fact label="Рост" value={`${pet.heightCm} см`} />
        </View>

        <View style={styles.tabs}>
          {TABS.map((item) => {
            const active = item.id === tab;
            return (
              <Pressable key={item.id} onPress={() => setTab(item.id)} style={styles.tab}>
                <Text style={[styles.tabLabel, active && styles.tabLabelOn]}>{item.label}</Text>
                {active ? <View style={styles.tabLine} /> : <View style={styles.tabSpacer} />}
              </Pressable>
            );
          })}
        </View>

        {tab === 'photo' ? (
          <PhotoTab
            photos={photos}
            selected={hero}
            onSelect={(photo) => updatePet(pet.id, { heroPhoto: photo, photo })}
          />
        ) : null}
        {tab === 'companion' ? <CompanionTab pet={pet} /> : null}
        {tab === 'device' ? <DeviceTab pet={pet} onChange={(patch) => updatePet(pet.id, patch)} /> : null}
      </ScrollView>

      {showAvatar ? (
        <View style={[styles.avatarFloat, { top: sheetTop - 48 }]} pointerEvents="none">
          {pet.photo ? (
            <CoverImage source={pet.photo} style={styles.avatar} position="center 18%" />
          ) : (
            <View style={[styles.avatar, styles.avatarEmpty]}>
              <Ionicons name="image-outline" size={32} color={colors.muted} />
            </View>
          )}
        </View>
      ) : null}

      {menu ? <Pressable style={styles.menuDismiss} onPress={() => setMenu(false)} /> : null}
      {menu ? (
        <View style={[styles.menu, { top: insets.top + 56 }]}>
          <Pressable
            style={styles.menuRow}
            onPress={() => {
              setMenu(false);
              setEdit(true);
            }}
          >
            <Ionicons name="pencil-outline" size={18} color={colors.ink} />
            <Text style={styles.menuText}>Редактировать</Text>
          </Pressable>
          <Pressable
            style={styles.menuRow}
            onPress={() => {
              setMenu(false);
              setRemove(true);
            }}
          >
            <Ionicons name="trash-outline" size={18} color={colors.red} />
            <Text style={[styles.menuText, { color: colors.red }]}>Удалить</Text>
          </Pressable>
        </View>
      ) : null}

      <InAppSheet visible={edit} onClose={() => setEdit(false)}>
        <Text style={styles.sheetTitle}>Редактировать</Text>
        <EditField label="Имя" value={pet.name} onChange={(name) => updatePet(pet.id, { name })} />
        <EditField label="Порода" value={pet.breed} onChange={(breed) => updatePet(pet.id, { breed })} />
        <EditField
          label="Вес, кг"
          value={String(pet.weightKg)}
          onChange={(value) => updatePet(pet.id, { weightKg: Number(value) || pet.weightKg })}
        />
        <EditField
          label="Рост, см"
          value={String(pet.heightCm)}
          onChange={(value) => updatePet(pet.id, { heightCm: Number(value) || pet.heightCm })}
        />
        <Button label="Готово" onPress={() => setEdit(false)} />
      </InAppSheet>

      <InAppSheet visible={remove} onClose={() => setRemove(false)}>
        <Text style={styles.sheetTitle}>Удалить {pet.name}?</Text>
        <Text style={styles.sheetCopy}>Профиль питомца будет убран из списка.</Text>
        <Button
          label="Удалить"
          variant="danger"
          onPress={() => {
            removePet(pet.id);
            setRemove(false);
            navigation.goBack();
          }}
        />
        <Button label="Отмена" variant="ghost" onPress={() => setRemove(false)} />
      </InAppSheet>
    </View>
  );
}

function PhotoTab({
  photos,
  selected,
  onSelect,
}: {
  photos: number[];
  selected?: number;
  onSelect: (photo: number) => void;
}) {
  const [width, setWidth] = useState(0);
  const size = width > 0 ? Math.floor((width - 16) / 3) : 0;

  if (!photos.length) {
    return <Text style={styles.empty}>Пока нет фотографий</Text>;
  }
  return (
    <View style={styles.grid} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      {photos.map((photo) => (
        <Pressable
          key={String(photo)}
          onPress={() => onSelect(photo)}
          style={[
            styles.gridCell,
            size ? { width: size, height: size } : null,
            selected === photo && styles.gridCellOn,
          ]}
        >
          <CoverImage source={photo} style={styles.gridImg} position="center center" />
        </Pressable>
      ))}
    </View>
  );
}

function CompanionTab({ pet }: { pet: Pet }) {
  const cover = pet.heroPhoto ?? pet.photo;
  return (
    <View style={{ gap: 18 }}>
      <View style={styles.companionCard}>
        {cover ? <CoverImage source={cover} style={styles.companionImg} position="center 30%" /> : <View style={styles.companionImg} />}
        <View style={styles.badge}>
          <Ionicons name="star" size={12} color={colors.white} />
          <Text style={styles.badgeText}>Основной</Text>
        </View>
      </View>
      <Text style={styles.blockTitle}>Функции</Text>
      <ActionRow icon="add-circle-outline" label="Создать нового" />
      <ActionRow icon="color-palette-outline" label="Изменить стиль" />
      <ActionRow icon="download-outline" label="Сохранить фото" />
    </View>
  );
}

function DeviceTab({ pet, onChange }: { pet: Pet; onChange: (patch: Partial<Pet>) => void }) {
  if (!pet.collarConnected) {
    return <Text style={styles.empty}>Устройство не подключено</Text>;
  }

  return (
    <View style={{ gap: 18 }}>
      <View style={styles.collarCard}>
        <View>
          <Text style={styles.collarLabel}>Ошейник</Text>
          <Text style={styles.collarModel}>{pet.collarModel ?? 'Ninja 200'}</Text>
          <View style={styles.activePill}>
            <Text style={styles.activePillText}>Активен</Text>
          </View>
        </View>
        <View style={styles.collarVisual}>
          <View style={styles.collarBand} />
          <View style={styles.collarTag} />
        </View>
      </View>

      <View style={styles.stats}>
        <Stat icon="battery-half" label={`${pet.battery}%`} />
        <Stat icon="bluetooth" label={pet.bluetoothOn ? 'Вкл' : 'Выкл'} />
        <Stat icon="hardware-chip-outline" label="5.2" />
        <Stat icon="cellular-outline" label="Сеть" />
      </View>
      <Text style={styles.idLine}>
        ID: {pet.collarId ?? '—'}  •  Версия {pet.firmware ?? '1.4.3'}
      </Text>

      <Text style={styles.blockTitle}>Функции</Text>
      <ToggleRow label="GPS-трекинг" value={pet.gpsOn} onChange={(gpsOn) => onChange({ gpsOn })} />
      <ToggleRow label="Оповещение о здоровье" value={pet.healthAlertsOn} onChange={(healthAlertsOn) => onChange({ healthAlertsOn })} />
      <ToggleRow label="Вибрация ошейника" value={pet.vibrationOn} onChange={(vibrationOn) => onChange({ vibrationOn })} />
      <ToggleRow label="LED-индикатор" value={pet.ledOn} onChange={(ledOn) => onChange({ ledOn })} />

      <Text style={styles.blockTitle}>Чувствительность датчика</Text>
      <Text style={styles.sliderCaption}>Активность движения</Text>
      <SensitivitySlider value={pet.sensitivity} onChange={(sensitivity) => onChange({ sensitivity })} />
      <View style={styles.sliderLabels}>
        <Text style={styles.meta}>Низкая</Text>
        <Text style={styles.meta}>{pet.sensitivity}%</Text>
        <Text style={styles.meta}>Высокая</Text>
      </View>
      <View style={styles.stepRow}>
        <Pressable style={styles.stepBtn} onPress={() => onChange({ sensitivity: Math.max(0, pet.sensitivity - 5) })}>
          <Text style={styles.stepText}>−</Text>
        </Pressable>
        <Pressable style={styles.stepBtn} onPress={() => onChange({ sensitivity: Math.min(100, pet.sensitivity + 5) })}>
          <Text style={styles.stepText}>+</Text>
        </Pressable>
      </View>

      <Text style={styles.blockTitle}>Пороги оповещений</Text>
      <Threshold
        label="Пульс"
        min={pet.pulseMin}
        max={pet.pulseMax}
        onMin={(pulseMin) => onChange({ pulseMin })}
        onMax={(pulseMax) => onChange({ pulseMax })}
        step={5}
      />
      <View style={styles.rangeBar}>
        <View style={[styles.rangeSeg, { flex: 1, backgroundColor: '#B8D4FF' }]} />
        <View style={[styles.rangeSeg, { flex: 2, backgroundColor: '#7FE3B0' }]} />
        <View style={[styles.rangeSeg, { flex: 1, backgroundColor: '#F4A8A0' }]} />
      </View>
      <Threshold
        label="Температура"
        min={pet.tempMin}
        max={pet.tempMax}
        onMin={(tempMin) => onChange({ tempMin })}
        onMax={(tempMax) => onChange({ tempMax })}
        step={0.1}
      />
      <View style={styles.rangeBar}>
        <View style={[styles.rangeSeg, { flex: 1, backgroundColor: '#B8D4FF' }]} />
        <View style={[styles.rangeSeg, { flex: 2, backgroundColor: '#7FE3B0' }]} />
        <View style={[styles.rangeSeg, { flex: 1, backgroundColor: '#F4A8A0' }]} />
      </View>
    </View>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fact}>
      <Text style={styles.factLabel}>{label}</Text>
      <Text style={styles.factValue}>{value}</Text>
    </View>
  );
}

function ActionRow({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.actionRow}>
      <Ionicons name={icon} size={20} color={colors.purple} />
      <Text style={styles.actionLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </View>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (next: boolean) => void }) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.actionLabel}>{label}</Text>
      <Pressable onPress={() => onChange(!value)} style={[styles.switch, value && styles.switchOn]}>
        <View style={[styles.switchThumb, value && styles.switchThumbOn]} />
      </Pressable>
    </View>
  );
}

function Threshold({
  label,
  min,
  max,
  onMin,
  onMax,
  step,
}: {
  label: string;
  min: number;
  max: number;
  onMin: (value: number) => void;
  onMax: (value: number) => void;
  step: number;
}) {
  const format = (value: number) => (step < 1 ? value.toFixed(1) : String(value));
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.sliderCaption}>{label}</Text>
      <View style={styles.thresholdRow}>
        <Stepper label="Min" value={format(min)} onMinus={() => onMin(round(min - step, step))} onPlus={() => onMin(round(min + step, step))} />
        <Stepper label="Max" value={format(max)} onMinus={() => onMax(round(max - step, step))} onPlus={() => onMax(round(max + step, step))} />
      </View>
    </View>
  );
}

function Stepper({
  label,
  value,
  onMinus,
  onPlus,
}: {
  label: string;
  value: string;
  onMinus: () => void;
  onPlus: () => void;
}) {
  return (
    <View style={styles.stepper}>
      <Text style={styles.meta}>{label}</Text>
      <View style={styles.stepperCtrl}>
        <Pressable onPress={onMinus} style={styles.nudge}>
          <Text style={styles.stepText}>−</Text>
        </Pressable>
        <Text style={styles.stepperValue}>{value}</Text>
        <Pressable onPress={onPlus} style={styles.nudge}>
          <Text style={styles.stepText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Stat({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={16} color={colors.purple} />
      <Text style={styles.statText}>{label}</Text>
    </View>
  );
}

function EditField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.meta}>{label}</Text>
      <TextInput value={value} onChangeText={onChange} style={styles.input} />
    </View>
  );
}

function CoverImage({
  source,
  style,
  position = 'center 20%',
}: {
  source: number;
  style?: object;
  position?: string;
}) {
  return (
    <View style={[style, { overflow: 'hidden' }]}>
      <Image
        source={source}
        resizeMode="cover"
        style={[
          StyleSheet.absoluteFillObject,
          { width: '100%', height: '100%' },
          Platform.OS === 'web' ? ({ objectFit: 'cover', objectPosition: position } as object) : null,
        ]}
      />
    </View>
  );
}

function SensitivitySlider({ value, onChange }: { value: number; onChange: (next: number) => void }) {
  const [width, setWidth] = useState(1);
  const clamp = (x: number) => Math.round(Math.min(100, Math.max(0, (x / width) * 100)));

  return (
    <View
      style={styles.sliderHit}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={(event) => onChange(clamp(event.nativeEvent.locationX))}
      onResponderMove={(event) => onChange(clamp(event.nativeEvent.locationX))}
    >
      <View style={styles.sliderTrack}>
        <View style={[styles.sliderFill, { width: `${value}%` }]} />
        <View style={[styles.sliderKnob, { left: `${Math.max(0, Math.min(100, value))}%` }]} />
      </View>
    </View>
  );
}

function uniquePhotos(pet: Pet) {
  const own = [pet.heroPhoto, pet.photo, ...(pet.gallery ?? [])].filter((item): item is number => Boolean(item));
  const extras = pet.id === 'persik' ? PHOTO_LIBRARY : [];
  return [...new Set([...own, ...extras])];
}

function round(value: number, step: number) {
  const n = step < 1 ? Math.round(value * 10) / 10 : Math.round(value);
  return n;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  hero: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 320,
  },
  heroSoft: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 220,
  },
  topBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  roundBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menu: {
    position: 'absolute',
    right: 16,
    zIndex: 30,
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingVertical: 8,
    width: 200,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  menuText: {
    ...type.body,
    color: colors.ink,
  },
  menuDismiss: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 25,
  },
  sheet: {
    flex: 1,
    marginTop: 250,
    backgroundColor: colors.paper,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  sheetContent: {
    padding: 20,
    paddingBottom: 48,
    gap: 4,
  },
  sheetContentWithAvatar: {
    paddingTop: 56,
  },
  avatarFloat: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 6,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    borderColor: colors.white,
    backgroundColor: colors.line,
    overflow: 'hidden',
  },
  avatarEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    ...type.title,
    color: colors.ink,
    textAlign: 'center',
  },
  subtitle: {
    ...type.body,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: 12,
  },
  facts: {
    gap: 8,
    marginBottom: 8,
  },
  fact: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  factLabel: {
    ...type.body,
    color: colors.muted,
  },
  factValue: {
    ...type.subtitle,
    color: colors.ink,
  },
  tabs: {
    flexDirection: 'row',
    marginTop: 8,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  tabLabel: {
    ...type.caption,
    color: colors.muted,
  },
  tabLabelOn: {
    color: colors.purple,
    fontFamily: 'Inter_600SemiBold',
  },
  tabLine: {
    marginTop: 8,
    height: 3,
    width: 28,
    borderRadius: 2,
    backgroundColor: colors.purple,
  },
  tabSpacer: {
    marginTop: 8,
    height: 3,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gridCell: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.line,
  },
  gridCellOn: {
    borderWidth: 2,
    borderColor: colors.purple,
  },
  gridImg: {
    width: '100%',
    height: '100%',
  },
  empty: {
    ...type.body,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 12,
  },
  companionCard: {
    height: 180,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: colors.purpleSoft,
  },
  companionImg: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    left: 12,
    top: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.purple,
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeText: {
    ...type.caption,
    color: colors.white,
  },
  blockTitle: {
    ...type.subtitle,
    color: colors.ink,
    marginTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  actionLabel: {
    ...type.body,
    color: colors.ink,
    flex: 1,
  },
  collarCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1B1B1F',
    borderRadius: 20,
    padding: 16,
  },
  collarLabel: {
    ...type.caption,
    color: 'rgba(255,255,255,0.6)',
  },
  collarModel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    color: colors.white,
    marginTop: 4,
  },
  activePill: {
    alignSelf: 'flex-start',
    marginTop: 8,
    backgroundColor: '#1F9D55',
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  activePillText: {
    ...type.caption,
    color: colors.white,
  },
  collarVisual: {
    width: 88,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  collarBand: {
    width: 72,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#3A3A40',
    borderWidth: 3,
    borderColor: '#111',
  },
  collarTag: {
    position: 'absolute',
    width: 18,
    height: 22,
    borderRadius: 4,
    backgroundColor: '#8B7FFF',
    bottom: 8,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stat: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  statText: {
    ...type.caption,
    color: colors.ink,
  },
  idLine: {
    ...type.caption,
    color: colors.muted,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  switch: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.line,
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  switchOn: {
    backgroundColor: colors.purple,
  },
  switchThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.white,
  },
  switchThumbOn: {
    alignSelf: 'flex-end',
  },
  sliderCaption: {
    ...type.body,
    color: colors.ink,
  },
  sliderHit: {
    height: 28,
    justifyContent: 'center',
  },
  sliderTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.line,
    justifyContent: 'center',
  },
  sliderFill: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.purple,
  },
  sliderKnob: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.purple,
    marginLeft: -11,
    top: -7,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  meta: {
    ...type.caption,
    color: colors.muted,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 8,
  },
  stepBtn: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.purpleSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    ...type.subtitle,
    color: colors.ink,
  },
  thresholdRow: {
    flexDirection: 'row',
    gap: 12,
  },
  stepper: {
    flex: 1,
    gap: 6,
  },
  stepperCtrl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    paddingHorizontal: 8,
    height: 44,
  },
  stepperValue: {
    ...type.subtitle,
    color: colors.ink,
  },
  nudge: {
    width: 28,
    alignItems: 'center',
  },
  rangeBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  rangeSeg: {
    height: 8,
  },
  sheetTitle: {
    ...type.title,
    fontSize: 22,
    color: colors.ink,
  },
  sheetCopy: {
    ...type.body,
    color: colors.muted,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
    ...type.body,
    color: colors.ink,
  },
});
