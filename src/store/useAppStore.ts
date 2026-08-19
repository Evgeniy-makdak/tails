import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { careTasks, notifications, pets, reminders } from '../data/mock';
import { keyFromSource, sourceFromKey } from '../data/photos';
import type { AppNotification, CareTask, HomeSegment, Pet, QuickActionKind, Reminder } from '../types/pet';

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

type LogEntry = {
  id: string;
  petId: string;
  kind: QuickActionKind;
  createdAt: string;
};

type HomeOverlay = 'pets' | 'photos' | null;

type AppState = {
  hasOnboarded: boolean;
  isAuthenticated: boolean;
  ownerName: string;
  activePetId: string;
  homeSegment: HomeSegment;
  selectedDayOffset: number;
  homeOverlay: HomeOverlay;
  pets: Pet[];
  reminders: Reminder[];
  careTasks: CareTask[];
  notifications: AppNotification[];
  logs: LogEntry[];
  geozones: GeoZone[];
  walks: WalkEntry[];
  completeOnboarding: () => void;
  login: () => void;
  logout: () => void;
  replayIntro: () => void;
  setOwnerName: (name: string) => void;
  setActivePet: (petId: string) => void;
  setHomeSegment: (segment: HomeSegment) => void;
  setSelectedDayOffset: (offset: number) => void;
  setHomeOverlay: (overlay: HomeOverlay) => void;
  addPet: () => void;
  updatePet: (petId: string, patch: Partial<Pet>) => void;
  removePet: (petId: string) => void;
  addPetPhoto: (petId: string, photo: number) => void;
  toggleCareTask: (id: string) => void;
  toggleReminder: (id: string) => void;
  markNotificationsRead: (ids: string[]) => void;
  markNotificationsUnread: (ids: string[]) => void;
  addLog: (kind: QuickActionKind) => void;
  addGeozone: (zone: Omit<GeoZone, 'id'>) => void;
  addWalk: () => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      hasOnboarded: false,
      isAuthenticated: false,
      ownerName: 'Александра',
      activePetId: 'persik',
      homeSegment: 'summary',
      selectedDayOffset: 0,
      homeOverlay: null,
      pets,
      reminders,
      careTasks,
      notifications,
      logs: [],
      geozones: [],
      walks: [],
      completeOnboarding: () => set({ hasOnboarded: true }),
      login: () => set({ isAuthenticated: true, hasOnboarded: true }),
      logout: () => set({ isAuthenticated: false }),
      replayIntro: () => set({ isAuthenticated: false, hasOnboarded: false }),
      setOwnerName: (name) => set({ ownerName: name }),
      setActivePet: (petId) => set({ activePetId: petId }),
      setHomeSegment: (segment) => set({ homeSegment: segment }),
      setSelectedDayOffset: (offset) => set({ selectedDayOffset: offset }),
      setHomeOverlay: (overlay) => set({ homeOverlay: overlay }),
      addPet: () =>
        set({
          pets: [
            ...get().pets,
            {
              id: `pet-${Date.now()}`,
              name: 'Новый питомец',
              kind: 'dog',
              breed: '—',
              ageLabel: '—',
              sex: 'Кобель',
              gallery: [],
              birthDate: '01.01.2026',
              weightKg: 5,
              heightCm: 25,
              bluetoothOn: false,
              gpsOn: false,
              healthAlertsOn: false,
              vibrationOn: false,
              ledOn: false,
              sensitivity: 50,
              pulseMin: 60,
              pulseMax: 120,
              tempMin: 37.5,
              tempMax: 39,
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
            },
          ],
        }),
      addPetPhoto: (petId, photo) =>
        set({
          pets: get().pets.map((item) => {
            if (item.id !== petId) {
              return item;
            }
            const gallery = (item.gallery ?? []).includes(photo) ? item.gallery ?? [] : [...(item.gallery ?? []), photo];
            return {
              ...item,
              photo,
              heroPhoto: photo,
              gallery,
            };
          }),
        }),
      updatePet: (petId, patch) =>
        set({
          pets: get().pets.map((item) => (item.id === petId ? { ...item, ...patch } : item)),
        }),
      removePet: (petId) => {
        const next = get().pets.filter((item) => item.id !== petId);
        if (!next.length) {
          return;
        }
        set({
          pets: next,
          activePetId: get().activePetId === petId ? next[0]!.id : get().activePetId,
        });
      },
      toggleCareTask: (id) =>
        set({
          careTasks: get().careTasks.map((task) =>
            task.id === id ? { ...task, done: !task.done } : task,
          ),
        }),
      toggleReminder: (id) =>
        set({
          reminders: get().reminders.map((item) =>
            item.id === id ? { ...item, done: !item.done } : item,
          ),
        }),
      markNotificationsRead: (ids) =>
        set({
          notifications: get().notifications.map((item) =>
            ids.includes(item.id) ? { ...item, read: true } : item,
          ),
        }),
      markNotificationsUnread: (ids) =>
        set({
          notifications: get().notifications.map((item) =>
            ids.includes(item.id) ? { ...item, read: false } : item,
          ),
        }),
      addLog: (kind) => {
        const petId = get().activePetId;
        set({
          logs: [
            {
              id: `${kind}-${Date.now()}`,
              petId,
              kind,
              createdAt: new Date().toISOString(),
            },
            ...get().logs,
          ].slice(0, 30),
        });
      },
      addGeozone: (zone) =>
        set({
          geozones: [{ ...zone, id: `zone-${Date.now()}` }, ...get().geozones],
        }),
      addWalk: () =>
        set({
          walks: [
            { id: `walk-${Date.now()}`, when: 'Сегодня 17:45', km: '2.9 км', minutes: '38 мин', steps: '3780' },
            { id: 'w2', when: 'Сегодня 07:30', km: '2.4 км', minutes: '32 мин', steps: '3180' },
            { id: 'w3', when: 'Вчера 18:15', km: '3.1 км', minutes: '41 мин', steps: '4050' },
          ],
        }),
    }),
    {
      name: 'hvostik-app-v4',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        hasOnboarded: state.hasOnboarded,
        isAuthenticated: state.isAuthenticated,
        activePetId: state.activePetId,
        logs: state.logs,
        petMedia: Object.fromEntries(
          state.pets.map((pet) => [
            pet.id,
            {
              photo: keyFromSource(pet.photo),
              heroPhoto: keyFromSource(pet.heroPhoto),
              gallery: (pet.gallery ?? []).map(keyFromSource).filter((item): item is NonNullable<typeof item> => item != null),
            },
          ]),
        ),
      }),
      merge: (persistedState, currentState) => {
        const persisted = (persistedState ?? {}) as Record<string, unknown>;
        const media = (persisted.petMedia ?? {}) as Record<
          string,
          { photo?: string; heroPhoto?: string; gallery?: string[] }
        >;
        const rest = { ...persisted };
        delete rest.petMedia;
        return {
          ...currentState,
          ...rest,
          pets: currentState.pets.map((pet) => {
            const saved = media[pet.id];
            if (!saved) {
              return pet;
            }
            return {
              ...pet,
              photo: sourceFromKey(saved.photo) ?? pet.photo,
              heroPhoto: sourceFromKey(saved.heroPhoto) ?? pet.heroPhoto,
              gallery: (saved.gallery ?? []).map(sourceFromKey).filter((item): item is number => item != null),
            };
          }),
        };
      },
    },
  ),
);

export function useActivePet(): Pet {
  const pet = useAppStore((state) => state.pets.find((item) => item.id === state.activePetId) ?? state.pets[0]!);
  return { ...pet, gallery: pet.gallery ?? [] };
}
