import type { Locale } from '../i18n/types';
import type { PetKind } from '../types/pet';

export type BreedEntry = {
  id: string;
  kind: PetKind;
  ru: string;
  en: string;
};

export const BREED_CATALOG: BreedEntry[] = [
  // Dogs
  { id: 'labrador', kind: 'dog', ru: 'Лабрадор', en: 'Labrador Retriever' },
  { id: 'golden_retriever', kind: 'dog', ru: 'Золотистый ретривер', en: 'Golden Retriever' },
  { id: 'german_shepherd', kind: 'dog', ru: 'Немецкая овчарка', en: 'German Shepherd' },
  { id: 'husky', kind: 'dog', ru: 'Хаски', en: 'Siberian Husky' },
  { id: 'corgi', kind: 'dog', ru: 'Корги', en: 'Welsh Corgi' },
  { id: 'pug', kind: 'dog', ru: 'Мопс', en: 'Pug' },
  { id: 'dachshund', kind: 'dog', ru: 'Такса', en: 'Dachshund' },
  { id: 'yorkshire_terrier', kind: 'dog', ru: 'Йоркширский терьер', en: 'Yorkshire Terrier' },
  { id: 'akita', kind: 'dog', ru: 'Акита', en: 'Akita' },
  { id: 'spitz', kind: 'dog', ru: 'Шпиц', en: 'Spitz' },
  { id: 'pomeranian', kind: 'dog', ru: 'Померанский шпиц', en: 'Pomeranian' },
  { id: 'poodle', kind: 'dog', ru: 'Пудель', en: 'Poodle' },
  { id: 'chihuahua', kind: 'dog', ru: 'Чихуахуа', en: 'Chihuahua' },
  { id: 'french_bulldog', kind: 'dog', ru: 'Французский бульдог', en: 'French Bulldog' },
  { id: 'english_bulldog', kind: 'dog', ru: 'Английский бульдог', en: 'English Bulldog' },
  { id: 'beagle', kind: 'dog', ru: 'Бигль', en: 'Beagle' },
  { id: 'boxer', kind: 'dog', ru: 'Боксёр', en: 'Boxer' },
  { id: 'rottweiler', kind: 'dog', ru: 'Ротвейлер', en: 'Rottweiler' },
  { id: 'doberman', kind: 'dog', ru: 'Доберман', en: 'Doberman' },
  { id: 'shiba_inu', kind: 'dog', ru: 'Сиба-ину', en: 'Shiba Inu' },
  { id: 'jack_russell', kind: 'dog', ru: 'Джек-рассел-терьер', en: 'Jack Russell Terrier' },
  { id: 'border_collie', kind: 'dog', ru: 'Бордер-колли', en: 'Border Collie' },
  { id: 'australian_shepherd', kind: 'dog', ru: 'Австралийская овчарка', en: 'Australian Shepherd' },
  { id: 'maltese', kind: 'dog', ru: 'Мальтийская болонка', en: 'Maltese' },
  { id: 'shih_tzu', kind: 'dog', ru: 'Ши-тцу', en: 'Shih Tzu' },
  { id: 'samoyed', kind: 'dog', ru: 'Самоед', en: 'Samoyed' },
  { id: 'cane_corso', kind: 'dog', ru: 'Кане-корсо', en: 'Cane Corso' },
  { id: 'bernese', kind: 'dog', ru: 'Бернский зенненхунд', en: 'Bernese Mountain Dog' },
  { id: 'great_dane', kind: 'dog', ru: 'Немецкий дог', en: 'Great Dane' },
  { id: 'cocker_spaniel', kind: 'dog', ru: 'Кокер-спаниель', en: 'Cocker Spaniel' },
  { id: 'setter', kind: 'dog', ru: 'Сеттер', en: 'Setter' },
  { id: 'whippet', kind: 'dog', ru: 'Уиппет', en: 'Whippet' },
  { id: 'greyhound', kind: 'dog', ru: 'Грейхаунд', en: 'Greyhound' },
  { id: 'mastiff', kind: 'dog', ru: 'Мастиф', en: 'Mastiff' },
  { id: 'shar_pei', kind: 'dog', ru: 'Шарпей', en: 'Shar Pei' },
  { id: 'chow_chow', kind: 'dog', ru: 'Чао-чао', en: 'Chow Chow' },
  { id: 'newfoundland', kind: 'dog', ru: 'Ньюфаундленд', en: 'Newfoundland' },
  { id: 'basenji', kind: 'dog', ru: 'Басенджи', en: 'Basenji' },
  { id: 'shepherd', kind: 'dog', ru: 'Овчарка', en: 'Shepherd' },
  { id: 'mixed_dog', kind: 'dog', ru: 'Метис', en: 'Mixed breed' },
  { id: 'other_dog', kind: 'dog', ru: 'Другая порода', en: 'Other' },

  // Cats
  { id: 'british_shorthair', kind: 'cat', ru: 'Британская короткошёрстная', en: 'British Shorthair' },
  { id: 'british_longhair', kind: 'cat', ru: 'Британская длинношёрстная', en: 'British Longhair' },
  { id: 'scottish_fold', kind: 'cat', ru: 'Шотландская вислоухая', en: 'Scottish Fold' },
  { id: 'maine_coon', kind: 'cat', ru: 'Мейн-кун', en: 'Maine Coon' },
  { id: 'sphynx', kind: 'cat', ru: 'Сфинкс', en: 'Sphynx' },
  { id: 'siamese', kind: 'cat', ru: 'Сиамская', en: 'Siamese' },
  { id: 'persian', kind: 'cat', ru: 'Персидская', en: 'Persian' },
  { id: 'ragdoll', kind: 'cat', ru: 'Рэгдолл', en: 'Ragdoll' },
  { id: 'bengal', kind: 'cat', ru: 'Бенгальская', en: 'Bengal' },
  { id: 'abyssinian', kind: 'cat', ru: 'Абиссинская', en: 'Abyssinian' },
  { id: 'russian_blue', kind: 'cat', ru: 'Русская голубая', en: 'Russian Blue' },
  { id: 'exotic_shorthair', kind: 'cat', ru: 'Экзотическая короткошёрстная', en: 'Exotic Shorthair' },
  { id: 'norwegian_forest', kind: 'cat', ru: 'Норвежская лесная', en: 'Norwegian Forest' },
  { id: 'siberian', kind: 'cat', ru: 'Сибирская', en: 'Siberian' },
  { id: 'burmese', kind: 'cat', ru: 'Бурманская', en: 'Burmese' },
  { id: 'oriental', kind: 'cat', ru: 'Ориентальная', en: 'Oriental' },
  { id: 'devon_rex', kind: 'cat', ru: 'Девон-рекс', en: 'Devon Rex' },
  { id: 'cornish_rex', kind: 'cat', ru: 'Корниш-рекс', en: 'Cornish Rex' },
  { id: 'manx', kind: 'cat', ru: 'Мэнкс', en: 'Manx' },
  { id: 'american_shorthair', kind: 'cat', ru: 'Американская короткошёрстная', en: 'American Shorthair' },
  { id: 'turkish_angora', kind: 'cat', ru: 'Турецкая ангора', en: 'Turkish Angora' },
  { id: 'turkish_van', kind: 'cat', ru: 'Турецкий ван', en: 'Turkish Van' },
  { id: 'himalayan', kind: 'cat', ru: 'Гималайская', en: 'Himalayan' },
  { id: 'tonkinese', kind: 'cat', ru: 'Тонкинская', en: 'Tonkinese' },
  { id: 'chartreux', kind: 'cat', ru: 'Картезианская', en: 'Chartreux' },
  { id: 'british', kind: 'cat', ru: 'Британская', en: 'British' },
  { id: 'mixed_cat', kind: 'cat', ru: 'Метис', en: 'Mixed breed' },
  { id: 'other_cat', kind: 'cat', ru: 'Другая порода', en: 'Other' },
];

const byId = new Map(BREED_CATALOG.map((b) => [b.id, b]));

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export function findBreed(value: string): BreedEntry | undefined {
  const raw = value.trim();
  if (!raw || raw === '—') return undefined;
  const direct = byId.get(raw);
  if (direct) return direct;
  const key = normalize(raw);
  return BREED_CATALOG.find(
    (b) => b.id === key || normalize(b.ru) === key || normalize(b.en) === key,
  );
}

export function breedLabel(entry: BreedEntry, locale: Locale): string {
  return locale === 'en' ? entry.en : entry.ru;
}

export function breedDisplayName(value: string, locale: Locale): string {
  const found = findBreed(value);
  if (found) return breedLabel(found, locale);
  return value.trim() || '—';
}

export function breedsForKind(kind: PetKind): BreedEntry[] {
  return BREED_CATALOG.filter((b) => b.kind === kind);
}

export function filterBreeds(kind: PetKind, locale: Locale, query: string): BreedEntry[] {
  const q = normalize(query);
  const list = breedsForKind(kind);
  if (!q) return list;
  return list.filter((b) => {
    const label = normalize(breedLabel(b, locale));
    return label.includes(q) || normalize(b.ru).includes(q) || normalize(b.en).includes(q) || b.id.includes(q);
  });
}

export function breedMatchesKind(value: string, kind: PetKind): boolean {
  const found = findBreed(value);
  if (!found) return !value.trim() || value.trim() === '—';
  return found.kind === kind;
}
