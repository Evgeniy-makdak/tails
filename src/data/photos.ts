export const EMPTY_ROOM = require('../../assets/img/home-room.png');
export const PERSIK_SCENE = require('../../assets/img/persik-scene.png');
export const PERSIK_AVATAR = require('../../assets/img/persik-avatar.png');
export const GALLERY_1 = require('../../assets/img/gallery-1.png');
export const GALLERY_2 = require('../../assets/img/gallery-2.png');

export const PHOTO_MAP = {
  'home-room': EMPTY_ROOM,
  'persik-scene': PERSIK_SCENE,
  'persik-avatar': PERSIK_AVATAR,
  'gallery-1': GALLERY_1,
  'gallery-2': GALLERY_2,
} as const;

export type PhotoKey = keyof typeof PHOTO_MAP;

export const PHOTO_LIBRARY: number[] = [GALLERY_1, GALLERY_2, PERSIK_AVATAR, PERSIK_SCENE];

export function keyFromSource(source?: number): PhotoKey | undefined {
  if (source == null) {
    return undefined;
  }
  const match = (Object.entries(PHOTO_MAP) as [PhotoKey, number][]).find(([, value]) => value === source);
  return match?.[0];
}

export function sourceFromKey(key?: string): number | undefined {
  if (!key || !(key in PHOTO_MAP)) {
    return undefined;
  }
  return PHOTO_MAP[key as PhotoKey];
}
