import type { NavigatorScreenParams } from '@react-navigation/native';

import type { MetricId, QuickActionKind } from './pet';

export type AuthStackParamList = {
  Splash: undefined;
  Welcome: undefined;
  Email: { mode: 'register' | 'login' };
  Otp: { email: string; mode: 'register' | 'login' };
  Terms: undefined;
  Features: undefined;
  Owner: undefined;
  PetSetup: undefined;
  Breed: undefined;
  Collar: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Map: undefined;
  Health: undefined;
  Profile: undefined;
};

export type AppStackParamList = {
  Main: NavigatorScreenParams<MainTabParamList>;
  Notifications: undefined;
  AiSummary: undefined;
  Chat: undefined;
  MetricDetail: { metricId: MetricId };
  ReminderDetail: { reminderId: string };
  EventDetail: { eventId: string };
  AddLog: { kind?: QuickActionKind };
  Documents: undefined;
  Geozones: undefined;
  DrawZone: { kind?: 'safe' | 'danger' };
  CreatePlace: { kind?: 'safe' | 'danger' };
  WalkHistory: undefined;
  PetCard: { petId: string };
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
} & AppStackParamList;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
