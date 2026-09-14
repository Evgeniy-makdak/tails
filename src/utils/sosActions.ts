import { Linking, Platform, Share } from 'react-native';

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

export const HELP_HOTLINE_DISPLAY = '+7 800 300-20-00';
export const HELP_HOTLINE_TEL = 'tel:+78003002000';

export function buildLiveLocationMessage(petName: string, coordsLabel: string) {
  const mapsUrl = coordsLabel.includes(',')
    ? `https://maps.google.com/?q=${coordsLabel.replace(/\s/g, '')}`
    : 'https://maps.google.com';
  return `SOS Tailio: ищем ${petName}. Последняя точка: ${coordsLabel}. Открыть на карте: ${mapsUrl}`;
}

export function buildNotifyMessage(petName: string, coordsLabel: string) {
  return `Tailio SOS: ${petName} в режиме поиска. Координаты: ${coordsLabel}. Пожалуйста, помогите найти.`;
}

export type ShareGeoResult = {
  ok: boolean;
  method: 'share' | 'clipboard' | 'fallback';
  message: string;
};

export async function sharePetGeolocation(petName: string, coordsLabel: string): Promise<ShareGeoResult> {
  const message = buildLiveLocationMessage(petName, coordsLabel);
  const mapsUrl = coordsLabel.includes(',')
    ? `https://maps.google.com/?q=${coordsLabel.replace(/\s/g, '')}`
    : undefined;

  try {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      await navigator.share({ title: `Геолокация ${petName}`, text: message, url: mapsUrl });
      return { ok: true, method: 'share', message };
    }

    const result = await Share.share(
      Platform.OS === 'ios'
        ? { message, url: mapsUrl }
        : { message, title: `Геолокация ${petName}` },
    );

    if (result.action === Share.dismissedAction) {
      return { ok: false, method: 'share', message };
    }
    return { ok: true, method: 'share', message };
  } catch {
    // fall through
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(message);
      return { ok: true, method: 'clipboard', message };
    } catch {
      // fall through
    }
  }

  return { ok: true, method: 'fallback', message };
}

export async function callHelpHotline(): Promise<{ ok: boolean; detail: string }> {
  try {
    const can = await Linking.canOpenURL(HELP_HOTLINE_TEL);
    if (can) {
      await Linking.openURL(HELP_HOTLINE_TEL);
      return { ok: true, detail: HELP_HOTLINE_DISPLAY };
    }
  } catch {
    // fall through
  }

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    try {
      window.location.href = HELP_HOTLINE_TEL;
      return { ok: true, detail: HELP_HOTLINE_DISPLAY };
    } catch {
      // fall through
    }
  }

  return { ok: false, detail: HELP_HOTLINE_DISPLAY };
}
