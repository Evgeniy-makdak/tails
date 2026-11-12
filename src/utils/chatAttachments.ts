import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';

import { translate, useLocaleStore } from '../i18n';

function tr(key: Parameters<typeof translate>[1]) {
  return translate(useLocaleStore.getState().locale, key);
}

export type ChatAttachment = {
  kind: 'image' | 'file';
  name: string;
  uri: string;
};

async function ensureCameraPermission() {
  const current = await ImagePicker.getCameraPermissionsAsync();
  if (current.granted) {
    return true;
  }
  const next = await ImagePicker.requestCameraPermissionsAsync();
  return next.granted;
}

async function ensureLibraryPermission() {
  const current = await ImagePicker.getMediaLibraryPermissionsAsync();
  if (current.granted) {
    return true;
  }
  const next = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return next.granted;
}

function fileNameFromUri(uri: string, fallback: string) {
  const cleaned = uri.split('?')[0] ?? uri;
  const last = cleaned.split('/').pop();
  return last && last.length > 0 ? decodeURIComponent(last) : fallback;
}

export async function pickChatCamera(): Promise<ChatAttachment | null> {
  const ok = await ensureCameraPermission();
  if (!ok) {
    Alert.alert(tr('chat_camera'), tr('alert_cameraPermission'));
    return null;
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    quality: 0.85,
    allowsEditing: false,
  });

  if (result.canceled || !result.assets?.[0]) {
    return null;
  }

  const asset = result.assets[0];
  return {
    kind: 'image',
    name: asset.fileName ?? fileNameFromUri(asset.uri, 'photo.jpg'),
    uri: asset.uri,
  };
}

export async function pickChatGallery(): Promise<ChatAttachment | null> {
  const ok = await ensureLibraryPermission();
  if (!ok) {
    Alert.alert(tr('alert_gallery'), tr('alert_galleryPermission'));
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.85,
    allowsEditing: false,
    selectionLimit: 1,
  });

  if (result.canceled || !result.assets?.[0]) {
    return null;
  }

  const asset = result.assets[0];
  return {
    kind: 'image',
    name: asset.fileName ?? fileNameFromUri(asset.uri, 'image.jpg'),
    uri: asset.uri,
  };
}

export async function pickChatDocument(): Promise<ChatAttachment | null> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      multiple: false,
      type: '*/*',
    });

    if (result.canceled || !result.assets?.[0]) {
      return null;
    }

    const asset = result.assets[0];
    return {
      kind: 'file',
      name: asset.name || fileNameFromUri(asset.uri, 'document'),
      uri: asset.uri,
    };
  } catch (error) {
    Alert.alert(
      tr('chat_file'),
      Platform.OS === 'web'
        ? tr('alert_filePickerWeb')
        : error instanceof Error
          ? error.message
          : tr('alert_filePicker'),
    );
    return null;
  }
}
