import type { PetSex } from '../types/pet';

import type { MessageKey } from './locales';

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
