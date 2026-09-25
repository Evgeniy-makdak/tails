import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import type { GeoZoneBounds } from '../../data/auth';
import { useAppStore } from '../../store/useAppStore';
import { colors, spacing, type } from '../../theme';
import type { AppStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<AppStackParamList, 'CreatePlace'>;

export function CreatePlaceScreen({ navigation, route }: Props) {
  const addGeozone = useAppStore((state) => state.addGeozone);
  const updateGeozone = useAppStore((state) => state.updateGeozone);
  const kind = route.params?.kind ?? 'safe';
  const zoneId = route.params?.zoneId;
  const isEdit = Boolean(zoneId);
  const bounds = route.params?.bounds as GeoZoneBounds | undefined;
  const [name, setName] = useState(
    route.params?.title ?? (kind === 'safe' ? 'Дом' : 'Парковка'),
  );
  const [address, setAddress] = useState(route.params?.address ?? 'ул. Пушкина, д. 15');
  const ready = name.trim().length > 0 && address.trim().length > 0;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <View style={{ width: 28 }} />
        <Text style={styles.title}>{isEdit ? 'Изменение места' : 'Создание нового места'}</Text>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.close}>✕</Text>
        </Pressable>
      </View>
      <View style={styles.body}>
        <TextField
          placeholder="Введите название места"
          value={name}
          onChangeText={setName}
          style={{ backgroundColor: colors.bg, borderWidth: 0 }}
        />
        <TextField
          placeholder="Введите адрес"
          value={address}
          onChangeText={setAddress}
          style={{ backgroundColor: colors.bg, borderWidth: 0 }}
        />
        {bounds ? (
          <Text style={styles.meta}>
            Зона на карте сохранена ({kind === 'safe' ? 'безопасная' : 'опасная'})
          </Text>
        ) : (
          <Text style={styles.meta}>
            Без координат на карте сигнализация работать не будет — вернитесь и задайте размер зоны.
          </Text>
        )}
      </View>
      <View style={styles.footer}>
        <Button
          label={isEdit ? 'Сохранить изменения' : 'Сохранить'}
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
