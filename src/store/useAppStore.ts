import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  PLACEHOLDER_PET,
  createEmptyPet,
  emptyOnboarding,
  emptySession,
  hydrateAccount,
  normalizeEmail,
  petFromOnboarding,
  profilePatch,
  seedAccounts,
  serializeAccount,
  type AccountSession,
  type GeoZone,
  type LogEntry,
  type OnboardingDraft,
  type PersistedAccount,
  type PetProfileInput,
  type WalkEntry,
} from '../data/auth';
import type { HomeSegment, Pet, PetKind, PetSex, QuickActionKind } from '../types/pet';

export type { GeoZone, WalkEntry };

type HomeOverlay = 'pets' | 'photos' | null;

type AppState = AccountSession & {
  isAuthenticated: boolean;
  currentEmail: string | null;
  accounts: Record<string, PersistedAccount>;
  onboarding: OnboardingDraft;
  homeSegment: HomeSegment;
  selectedDayOffset: number;
  homeOverlay: HomeOverlay;
  hasAccount: (email: string) => boolean;
  startRegistration: (email: string) => void;
  patchOnboarding: (patch: Partial<OnboardingDraft>) => void;
  setOnboardingSex: (kind: PetKind, boy: boolean) => void;
  finishOnboarding: (collarConnected: boolean) => void;
  loginWithEmail: (email: string) => boolean;
  logout: () => void;
  replayIntro: () => void;
  setOwnerName: (name: string) => void;
  setOwnerCity: (city: string) => void;
  setActivePet: (petId: string) => void;
  setHomeSegment: (segment: HomeSegment) => void;
  setSelectedDayOffset: (offset: number) => void;
  setHomeOverlay: (overlay: HomeOverlay) => void;
  addPet: (input: PetProfileInput) => string;
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

function snapshot(state: AppState): AccountSession {
  return {
    ownerName: state.ownerName,
    ownerCity: state.ownerCity,
    hasOnboarded: state.hasOnboarded,
    activePetId: state.activePetId,
    pets: state.pets,
    reminders: state.reminders,
    careTasks: state.careTasks,
    notifications: state.notifications,
    logs: state.logs,
    geozones: state.geozones,
    walks: state.walks,
  };
}

function applySession(session: AccountSession) {
  return {
    ownerName: session.ownerName,
    ownerCity: session.ownerCity,
    hasOnboarded: session.hasOnboarded,
    activePetId: session.activePetId,
    pets: session.pets,
    reminders: session.reminders,
    careTasks: session.careTasks,
    notifications: session.notifications,
    logs: session.logs,
    geozones: session.geozones,
    walks: session.walks,
  };
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => {
      const commit = (patch: Partial<AppState>) => {
        set(patch);
        const state = get();
        if (!state.currentEmail || !state.isAuthenticated) {
          return;
        }
        set({
          accounts: {
            ...state.accounts,
            [state.currentEmail]: serializeAccount(state.currentEmail, snapshot(get())),
          },
        });
      };

      return {
        ...emptySession(),
        isAuthenticated: false,
        currentEmail: null,
        accounts: seedAccounts(),
        onboarding: emptyOnboarding(),
        homeSegment: 'summary',
        selectedDayOffset: 0,
        homeOverlay: null,
        hasAccount: (email) => Boolean(get().accounts[normalizeEmail(email)]),
        startRegistration: (email) => {
          const normalized = normalizeEmail(email);
          set({
            onboarding: { ...emptyOnboarding(), email: normalized },
            currentEmail: normalized,
            isAuthenticated: false,
            ...emptySession(),
          });
        },
        patchOnboarding: (patch) =>
          set({
            onboarding: { ...get().onboarding, ...patch },
          }),
        setOnboardingSex: (kind, boy) => {
          const sex: PetSex = kind === 'cat' ? (boy ? 'Кот' : 'Кошка') : boy ? 'Кобель' : 'Сука';
          set({
            onboarding: { ...get().onboarding, kind, sex },
          });
        },
        finishOnboarding: (collarConnected) => {
          const draft = { ...get().onboarding, collarConnected };
          const email = normalizeEmail(draft.email);
          if (!email) {
            return;
          }
          const pets = draft.petName.trim() ? [petFromOnboarding(draft)] : [];
          const session: AccountSession = {
            ownerName: draft.ownerName.trim(),
            ownerCity: draft.ownerCity.trim(),
            hasOnboarded: true,
            activePetId: pets[0]?.id ?? '',
            pets,
            reminders: [],
            careTasks: [],
            notifications: [],
            logs: [],
            geozones: [],
            walks: [],
          };
          set({
            accounts: {
              ...get().accounts,
              [email]: serializeAccount(email, session),
            },
            currentEmail: email,
            isAuthenticated: true,
            onboarding: emptyOnboarding(),
            homeOverlay: null,
            ...applySession(session),
          });
        },
        loginWithEmail: (email) => {
          const normalized = normalizeEmail(email);
          const saved = get().accounts[normalized];
          if (!saved?.hasOnboarded) {
            return false;
          }
          set({
            currentEmail: normalized,
            isAuthenticated: true,
            onboarding: emptyOnboarding(),
            homeOverlay: null,
            ...applySession(hydrateAccount(saved)),
          });
          return true;
        },
        logout: () => {
          const state = get();
          const accounts = { ...state.accounts };
          if (state.currentEmail && state.isAuthenticated) {
            accounts[state.currentEmail] = serializeAccount(state.currentEmail, snapshot(state));
          }
          set({
            accounts,
            isAuthenticated: false,
            currentEmail: null,
            onboarding: emptyOnboarding(),
            homeOverlay: null,
            ...emptySession(),
          });
        },
        replayIntro: () => get().logout(),
        setOwnerName: (name) => commit({ ownerName: name }),
        setOwnerCity: (city) => commit({ ownerCity: city }),
        setActivePet: (petId) => commit({ activePetId: petId }),
        setHomeSegment: (segment) => set({ homeSegment: segment }),
        setSelectedDayOffset: (offset) => set({ selectedDayOffset: offset }),
        setHomeOverlay: (overlay) => set({ homeOverlay: overlay }),
        addPet: (input) => {
          const pet = createEmptyPet(profilePatch(input));
          commit({
            pets: [...get().pets, pet],
            activePetId: pet.id,
          });
          return pet.id;
        },
        updatePet: (petId, patch) =>
          commit({
            pets: get().pets.map((item) => {
              if (item.id !== petId) {
                return item;
              }
              const next = { ...item, ...patch };
              if (patch.birthDate != null) {
                next.ageLabel = profilePatch({
                  name: next.name,
                  breed: next.breed,
                  birthDate: next.birthDate,
                  kind: next.kind,
                  sex: next.sex,
                }).ageLabel ?? next.ageLabel;
              }
              return next;
            }),
          }),
        addPetPhoto: (petId, photo) =>
          commit({
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
        removePet: (petId) => {
          const next = get().pets.filter((item) => item.id !== petId);
          commit({
            pets: next,
            activePetId: get().activePetId === petId ? (next[0]?.id ?? '') : get().activePetId,
          });
        },
        toggleCareTask: (id) =>
          commit({
            careTasks: get().careTasks.map((task) => (task.id === id ? { ...task, done: !task.done } : task)),
          }),
        toggleReminder: (id) =>
          commit({
            reminders: get().reminders.map((item) => (item.id === id ? { ...item, done: !item.done } : item)),
          }),
        markNotificationsRead: (ids) =>
          commit({
            notifications: get().notifications.map((item) => (ids.includes(item.id) ? { ...item, read: true } : item)),
          }),
        markNotificationsUnread: (ids) =>
          commit({
            notifications: get().notifications.map((item) => (ids.includes(item.id) ? { ...item, read: false } : item)),
          }),
        addLog: (kind) => {
          const petId = get().activePetId;
          commit({
            logs: [
              {
                id: `${kind}-${Date.now()}`,
                petId,
                kind,
                createdAt: new Date().toISOString(),
              },
              ...get().logs,
            ].slice(0, 30) as LogEntry[],
          });
        },
        addGeozone: (zone) =>
          commit({
            geozones: [{ ...zone, id: `zone-${Date.now()}` }, ...get().geozones],
          }),
        addWalk: () =>
          commit({
            walks: [
              { id: `walk-${Date.now()}`, when: 'Сегодня 17:45', km: '2.9 км', minutes: '38 мин', steps: '3780' },
              { id: 'w2', when: 'Сегодня 07:30', km: '2.4 км', minutes: '32 мин', steps: '3180' },
              { id: 'w3', when: 'Вчера 18:15', km: '3.1 км', minutes: '41 мин', steps: '4050' },
            ],
          }),
      };
    },
    {
      name: 'hvostik-app-v5',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        accounts: state.accounts,
        currentEmail: state.currentEmail,
        isAuthenticated: state.isAuthenticated,
        onboarding: state.onboarding,
      }),
      merge: (persistedState, currentState) => {
        const persisted = (persistedState ?? {}) as Partial<
          Pick<AppState, 'accounts' | 'currentEmail' | 'isAuthenticated' | 'onboarding'>
        >;
        const accounts = seedAccounts(persisted.accounts);
        const email = persisted.currentEmail ? normalizeEmail(persisted.currentEmail) : null;
        const saved = email ? accounts[email] : undefined;
        const isAuthenticated = Boolean(persisted.isAuthenticated && saved?.hasOnboarded);
        const session = isAuthenticated && saved ? hydrateAccount(saved) : emptySession();
        return {
          ...currentState,
          accounts,
          currentEmail: isAuthenticated ? email : null,
          isAuthenticated,
          onboarding: persisted.onboarding ?? emptyOnboarding(),
          ...session,
        };
      },
    },
  ),
);

export function useActivePet(): Pet {
  const pet = useAppStore((state) => state.pets.find((item) => item.id === state.activePetId) ?? state.pets[0]);
  if (!pet) {
    return { ...PLACEHOLDER_PET, gallery: [] };
  }
  return { ...pet, gallery: pet.gallery ?? [] };
}
