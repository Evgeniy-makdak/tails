import type { PetSex } from '../types/pet';

import type { MessageKey } from './locales';

/** Stored sex values stay Russian enums; this maps them to display keys. */
export function petSexMessageKey(sex: PetSex): MessageKey {
  switch (sex) {
    case 'Кобель':
      return 'pet_sexDogMale';
    case 'Сука':
      return 'pet_sexDogFemale';
    case 'Кот':
      return 'pet_sexCatMale';
    default:
      return 'pet_sexCatFemale';
  }
}
