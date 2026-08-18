import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { careTasks, notifications, pets, reminders } from '../data/mock';
import type { AppNotification, CareTask, HomeSegment, Pet, QuickActionKind, Reminder } from '../types/pet';

type LogEntry = {
  id: string;
  petId: string;
  kind: QuickActionKind;
  createdAt: string;
};

type AppState = {
  hasOnboarded: boolean;
  isAuthenticated: boolean;
  ownerName: string;
  activePetId: string;
  homeSegment: HomeSegment;
  selectedDayOffset: number;
  pets: Pet[];
  reminders: Reminder[];
  careTasks: CareTask[];
  notifications: AppNotification[];
  logs: LogEntry[];
  completeOnboarding: () => void;
  login: () => void;
  logout: () => void;
  replayIntro: () => void;
  setOwnerName: (name: string) => void;
  setActivePet: (petId: string) => void;
  setHomeSegment: (segment: HomeSegment) => void;
  setSelectedDayOffset: (offset: number) => void;
  toggleCareTask: (id: string) => void;
  toggleReminder: (id: string) => void;
  markNotificationsRead: () => void;
  addLog: (kind: QuickActionKind) => void;
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
      pets,
      reminders,
      careTasks,
      notifications,
      logs: [],
      completeOnboarding: () => set({ hasOnboarded: true }),
      login: () => set({ isAuthenticated: true, hasOnboarded: true }),
      logout: () => set({ isAuthenticated: false }),
      replayIntro: () => set({ isAuthenticated: false, hasOnboarded: false }),
      setOwnerName: (name) => set({ ownerName: name }),
      setActivePet: (petId) => set({ activePetId: petId }),
      setHomeSegment: (segment) => set({ homeSegment: segment }),
      setSelectedDayOffset: (offset) => set({ selectedDayOffset: offset }),
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
      markNotificationsRead: () =>
        set({
          notifications: get().notifications.map((item) => ({ ...item, read: true })),
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
    }),
    {
      name: 'hvostik-app-v3',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        hasOnboarded: state.hasOnboarded,
        isAuthenticated: state.isAuthenticated,
        activePetId: state.activePetId,
        logs: state.logs,
      }),
    },
  ),
);

export function useActivePet(): Pet {
  return useAppStore((state) => state.pets.find((pet) => pet.id === state.activePetId) ?? state.pets[0]!);
}
