export type PetKind = 'dog' | 'cat';
export type PetSex = 'Кобель' | 'Сука' | 'Кот' | 'Кошка';
export type HomeSegment = 'summary' | 'care' | 'schedule';
export type QuickActionKind = 'walk' | 'toilet' | 'training' | 'other';
export type MetricId = 'pulse' | 'pressure' | 'temperature' | 'sleep' | 'steps' | 'running' | 'rest';
export type ReminderKind = 'pill' | 'hygiene' | 'vaccine' | 'vet';

export type Pet = {
  id: string;
  name: string;
  kind: PetKind;
  breed: string;
  ageLabel: string;
  sex: PetSex;
  photo?: number;
  online: boolean;
  healthScore: number;
  wellbeing: string;
  collarConnected: boolean;
  battery: number;
  pulse: number;
  pressure: string;
  temperature: number;
  sleepHours: number;
  sleepLabel: string;
  steps: number;
  walksToday: number;
  activeMinutes: number;
  runningMinutes: number;
  restHours: number;
  aiSummary: string;
};

export type Reminder = {
  id: string;
  petId: string;
  title: string;
  timeLabel: string;
  kind: ReminderKind;
  badge?: string;
  done: boolean;
};

export type ScheduleEvent = {
  id: string;
  petId: string;
  title: string;
  time: string;
  dateKey: string;
  place?: string;
};

export type CareTask = {
  id: string;
  petId: string;
  title: string;
  hint: string;
  done: boolean;
};

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  timeLabel: string;
  read: boolean;
};

export type ActivityGoal = {
  id: string;
  title: string;
  value: string;
  progress: number;
};

export type SleepPhase = {
  id: string;
  label: string;
  color: string;
  flex: number;
};

export type WalkRecord = {
  id: string;
  petId: string;
  petName: string;
  seconds: number;
  endedAt: string;
};

export type HealthItem = {
  id: string;
  petName: string;
  title: string;
  dateLabel: string;
  kind: ReminderKind;
};
