import type { AppNotification, CareTask, Pet, PetKind, PetSex, QuickActionKind, Reminder } from '../types/pet';
import { keyFromSource, sourceFromKey } from './photos';
import { careTasks, deviceOff, notifications, pets, reminders } from './mock';

export const DEMO_EMAIL = 'demo@tailio.app';
export const DEMO_OTP = '111111';

export type GeoZone = {
  id: string;
  title: string;
  address: string;
  kind: 'safe' | 'danger';
};

export type WalkEntry = {
  id: string;
  when: string;
  km: string;
  minutes: string;
  steps: string;
};

export type LogEntry = {
  id: string;
  petId: string;
  kind: QuickActionKind;
  createdAt: string;
};

export type AccountSession = {
  ownerName: string;
  ownerCity: string;
  hasOnboarded: boolean;
  activePetId: string;
  pets: Pet[];
  reminders: Reminder[];
  careTasks: CareTask[];
  notifications: AppNotification[];
  logs: LogEntry[];
  geozones: GeoZone[];
  walks: WalkEntry[];
};

export type PersistedPet = Omit<Pet, 'photo' | 'heroPhoto' | 'gallery'> & {
  photo?: string;
  heroPhoto?: string;
  gallery: string[];
};

export type PersistedAccount = Omit<AccountSession, 'pets'> & {
  email: string;
  pets: PersistedPet[];
};

export type OnboardingDraft = {
  email: string;
  ownerName: string;
  ownerCity: string;
  petName: string;
  breed: string;
  birthDate: string;
  kind: PetKind;
  sex: PetSex;
  collarConnected: boolean;
};

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function emptyOnboarding(): OnboardingDraft {
  return {
    email: '',
    ownerName: '',
    ownerCity: '',
    petName: '',
    breed: '',
    birthDate: '',
    kind: 'dog',
    sex: 'Кобель',
    collarConnected: false,
  };
}

export function emptySession(): AccountSession {
  return {
    ownerName: '',
    ownerCity: '',
    hasOnboarded: false,
    activePetId: '',
    pets: [],
    reminders: [],
    careTasks: [],
    notifications: [],
    logs: [],
    geozones: [],
    walks: [],
  };
}

export function createEmptyPet(patch: Partial<Pet> = {}): Pet {
  return {
    id: `pet-${Date.now()}`,
    name: 'Новый питомец',
    kind: 'dog',
    breed: '—',
    ageLabel: '—',
    sex: 'Кобель',
    gallery: [],
    birthDate: '',
    weightKg: 0,
    heightCm: 0,
    ...deviceOff,
    online: false,
    healthScore: 0,
    wellbeing: 'Устройство не подключено',
    collarConnected: false,
    battery: 0,
    pulse: 0,
    pressure: '—',
    temperature: 0,
    sleepHours: 0,
    sleepLabel: '—',
    steps: 0,
    walksToday: 0,
    activeMinutes: 0,
    runningMinutes: 0,
    restHours: 0,
    aiSummary: 'Добавьте фото и подключите ошейник.',
    ...patch,
  };
}

export const PLACEHOLDER_PET: Pet = createEmptyPet({
  id: 'placeholder',
  name: 'Питомец',
});

export type PetProfileInput = {
  name: string;
  breed: string;
  birthDate: string;
  kind: PetKind;
  sex: PetSex;
};

export function emptyPetProfile(): PetProfileInput {
  return {
    name: '',
    breed: '',
    birthDate: '',
    kind: 'dog',
    sex: 'Кобель',
  };
}

export function profileFromPet(pet: Pet): PetProfileInput {
  return {
    name: pet.name,
    breed: pet.breed === '—' ? '' : pet.breed,
    birthDate: pet.birthDate,
    kind: pet.kind,
    sex: pet.sex,
  };
}

export function profilePatch(input: PetProfileInput): Partial<Pet> {
  const boy = input.sex === 'Кот' || input.sex === 'Кобель';
  const sex: PetSex = input.kind === 'cat' ? (boy ? 'Кот' : 'Кошка') : boy ? 'Кобель' : 'Сука';
  return {
    name: input.name.trim(),
    kind: input.kind,
    breed: input.breed.trim() || '—',
    birthDate: input.birthDate.trim(),
    ageLabel: ageLabelFromBirth(input.birthDate),
    sex,
  };
}

export function ageLabelFromBirth(birthDate: string): string {
  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(birthDate.trim());
  if (!match) {
    return '—';
  }
  const birth = new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
  if (Number.isNaN(birth.getTime())) {
    return '—';
  }
  const now = new Date();
  let months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  if (now.getDate() < birth.getDate()) {
    months -= 1;
  }
  if (months < 0) {
    return '—';
  }
  if (months < 12) {
    return months <= 0 ? 'меньше месяца' : `${months} мес`;
  }
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const yearWord = years === 1 ? 'год' : years < 5 ? 'года' : 'лет';
  return rest === 0 ? `${years} ${yearWord}` : `${years} ${yearWord} ${rest} мес`;
}

export function petFromOnboarding(draft: OnboardingDraft): Pet {
  const kind = draft.kind;
  const boy = draft.sex === 'Кот' || draft.sex === 'Кобель';
  const sex: PetSex = kind === 'cat' ? (boy ? 'Кот' : 'Кошка') : boy ? 'Кобель' : 'Сука';
  return createEmptyPet({
    name: draft.petName.trim(),
    kind,
    breed: draft.breed.trim() || '—',
    birthDate: draft.birthDate.trim(),
    ageLabel: ageLabelFromBirth(draft.birthDate),
    sex,
    collarConnected: draft.collarConnected,
    bluetoothOn: draft.collarConnected,
    gpsOn: draft.collarConnected,
    online: draft.collarConnected,
    battery: draft.collarConnected ? 100 : 0,
    wellbeing: draft.collarConnected ? 'Ошейник подключён' : 'Устройство не подключено',
    aiSummary: draft.collarConnected
      ? `${draft.petName.trim()} подключён. Показатели появятся после первых прогулок.`
      : 'Добавьте фото и подключите ошейник.',
  });
}

export function serializePet(pet: Pet): PersistedPet {
  return {
    ...pet,
    photo: keyFromSource(pet.photo),
    heroPhoto: keyFromSource(pet.heroPhoto),
    gallery: (pet.gallery ?? []).map(keyFromSource).filter((item): item is NonNullable<typeof item> => item != null),
  };
}

export function hydratePet(pet: PersistedPet): Pet {
  return {
    ...pet,
    photo: sourceFromKey(pet.photo),
    heroPhoto: sourceFromKey(pet.heroPhoto),
    gallery: (pet.gallery ?? []).map(sourceFromKey).filter((item): item is number => item != null),
  };
}

export function serializeAccount(email: string, session: AccountSession): PersistedAccount {
  return {
    ...session,
    email,
    pets: session.pets.map(serializePet),
  };
}

export function hydrateAccount(account: PersistedAccount): AccountSession {
  return {
    ownerName: account.ownerName,
    ownerCity: account.ownerCity,
    hasOnboarded: account.hasOnboarded,
    activePetId: account.activePetId,
    pets: (account.pets ?? []).map(hydratePet),
    reminders: account.reminders ?? [],
    careTasks: account.careTasks ?? [],
    notifications: account.notifications ?? [],
    logs: account.logs ?? [],
    geozones: account.geozones ?? [],
    walks: account.walks ?? [],
  };
}

export function demoAccount(): PersistedAccount {
  const persik = pets[0]!;
  return serializeAccount(DEMO_EMAIL, {
    ownerName: 'Александра',
    ownerCity: 'Санкт-Петербург',
    hasOnboarded: true,
    activePetId: persik.id,
    pets: [persik],
    reminders,
    careTasks,
    notifications,
    logs: [],
    geozones: [],
    walks: [],
  });
}

export function seedAccounts(accounts?: Record<string, PersistedAccount>): Record<string, PersistedAccount> {
  const next = { ...(accounts ?? {}) };
  if (!next[DEMO_EMAIL]) {
    next[DEMO_EMAIL] = demoAccount();
  }
  return next;
}
