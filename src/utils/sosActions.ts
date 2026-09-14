import * as Sharing from 'expo-sharing';
import { Alert, Linking, Platform, Share } from 'react-native';

export type SosContact = {
  id: string;
  name: string;
  relation: string;
  phone?: string;
};

export const DEMO_SOS_CONTACTS: SosContact[] = [
  { id: '1', name: 'Анна', relation: 'Семья', phone: '+7 900 000-00-01' },
  { id: '2', name: 'Игорь', relation: 'Друг', phone: '+7 900 000-00-02' },
  { id: '3', name: 'Ветеринарная клиника «Лапки»', relation: 'Клиника', phone: '+7 812 000-00-00' },
];

export function buildLiveLocationMessage(petName: string, coordsLabel: string) {
  const mapsUrl = coordsLabel.includes(',')
    ? `https://maps.google.com/?q=${coordsLabel.replace(/\s/g, '')}`
    : 'https://maps.google.com';
  return `SOS Tailio: ищем ${petName}. Последняя точка: ${coordsLabel}. Открыть на карте: ${mapsUrl}`;
}

export async function sharePetGeolocation(petName: string, coordsLabel: string) {
  const message = buildLiveLocationMessage(petName, coordsLabel);

  try {
    const result = await Share.share(
      Platform.OS === 'ios'
        ? { message, url: coordsLabel.includes(',') ? `https://maps.google.com/?q=${coordsLabel.replace(/\s/g, '')}` : undefined }
        : { message, title: `Геолокация ${petName}` },
    );

    if (result.action === Share.sharedAction) {
      return true;
    }
    if (result.action === Share.dismissedAction) {
      return false;
    }
  } catch {
    // Fallback below
  }

  if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(message);
    Alert.alert('Геолокация', 'Ссылка на точку скопирована в буфер обмена.');
    return true;
  }

  Alert.alert('Геолокация', message);
  return true;
}

export async function notifyRelatives(petName: string, coordsLabel: string, contacts: SosContact[] = DEMO_SOS_CONTACTS) {
  const message = `Tailio SOS: ${petName} в режиме поиска. Координаты: ${coordsLabel}. Пожалуйста, помогите найти.`;
  const names = contacts.map((c) => c.name).join(', ');

  return new Promise<boolean>((resolve) => {
    Alert.alert(
      'Сообщить близким',
      `Отправить уведомление: ${names}?\n\n«${message}»`,
      [
        { text: 'Отмена', style: 'cancel', onPress: () => resolve(false) },
        {
          text: 'Отправить',
          onPress: () => {
            Alert.alert('Отправлено', `Близкие уведомлены о поиске ${petName}.`);
            resolve(true);
          },
        },
      ],
    );
  });
}

export async function contactHelpService(options: {
  petName: string;
  coordsLabel: string;
  onOpenChat: () => void;
}) {
  const hotline = 'tel:+78003002000';

  Alert.alert('Служба помощи', `Связаться по поводу ${options.petName}`, [
    { text: 'Отмена', style: 'cancel' },
    {
      text: 'Позвонить',
      onPress: async () => {
        const can = await Linking.canOpenURL(hotline);
        if (can) {
          await Linking.openURL(hotline);
          return;
        }
        Alert.alert('Звонок', 'Демо: +7 800 300-20-00 — линия поддержки Tailio.');
      },
    },
    {
      text: 'Чат со специалистом',
      onPress: options.onOpenChat,
    },
  ]);
}

export async function canUseNativeShareSheet() {
  try {
    return await Sharing.isAvailableAsync();
  } catch {
    return false;
  }
}
