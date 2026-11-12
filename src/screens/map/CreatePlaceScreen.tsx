import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import type { GeoZoneBounds } from '../../data/auth';
import { useI18n } from '../../i18n';
import { useAppStore } from '../../store/useAppStore';
import { colors, spacing, type } from '../../theme';
import type { AppStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<AppStackParamList, 'CreatePlace'>;

export function CreatePlaceScreen({ navigation, route }: Props) {
  const { t } = useI18n();
  const addGeozone = useAppStore((state) => state.addGeozone);
  const updateGeozone = useAppStore((state) => state.updateGeozone);
  const kind = route.params?.kind ?? 'safe';
  const zoneId = route.params?.zoneId;
  const isEdit = Boolean(zoneId);
  const bounds = route.params?.bounds as GeoZoneBounds | undefined;
  const [name, setName] = useState(
    route.params?.title ?? (kind === 'safe' ? t('zones_defaultSafeName') : t('zones_defaultDangerName')),
  );
  const [address, setAddress] = useState(route.params?.address ?? t('zones_defaultAddress'));
  const ready = name.trim().length > 0 && address.trim().length > 0;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <View style={{ width: 28 }} />
        <Text style={styles.title}>{isEdit ? t('zones_editPlace') : t('zones_newPlace')}</Text>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.close}>✕</Text>
        </Pressable>
      </View>
      <View style={styles.body}>
        <TextField
          placeholder={t('zones_placeNamePlaceholder')}
          value={name}
          onChangeText={setName}
          style={{ backgroundColor: colors.bg, borderWidth: 0 }}
        />
        <TextField
          placeholder={t('zones_addressPlaceholder')}
          value={address}
          onChangeText={setAddress}
          style={{ backgroundColor: colors.bg, borderWidth: 0 }}
        />
        {bounds ? (
          <Text style={styles.meta}>
            {kind === 'safe' ? t('zones_savedSafe') : t('zones_savedDanger')}
          </Text>
        ) : (
          <Text style={styles.meta}>
            {t('zones_noCoordinatesWarning')}
          </Text>
        )}
      </View>
      <View style={styles.footer}>
        <Button
          label={isEdit ? t('zones_saveChanges') : t('common_save')}
          disabled={!ready}
          onPress={() => {
            const payload = {
              title: name.trim(),
              address: address.trim(),
              kind,
              bounds,
            };
            if (zoneId) {
              updateGeozone(zoneId, payload);
            } else {
              addGeozone(payload);
            }
            navigation.navigate('Geozones');
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: 12,
  },
  title: {
    ...type.subtitle,
    color: colors.ink,
  },
  close: {
    fontSize: 20,
    color: colors.ink,
    width: 28,
    textAlign: 'right',
  },
  body: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    gap: 14,
  },
  meta: {
    ...type.caption,
    color: colors.inkSoft,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
});
