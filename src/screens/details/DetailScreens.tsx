import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { scheduleEvents } from '../../data/mock';
import { useActivePet, useAppStore } from '../../store/useAppStore';
import { colors, spacing, type } from '../../theme';
import type { AppStackParamList } from '../../types/navigation';
import type { MetricId, QuickActionKind } from '../../types/pet';

const LABELS: Record<QuickActionKind, string> = {
  walk: 'Прогулка',
  toilet: 'Туалет',
  training: 'Тренировка',
  other: 'Другое событие',
};

const METRIC_COPY: Record<MetricId, { title: string; unit: (petName: string) => string }> = {
  pulse: { title: 'Пульс', unit: () => 'уд/мин за день' },
  pressure: { title: 'Давление', unit: () => 'мм рт. ст.' },
  temperature: { title: 'Температура', unit: () => '°C' },
  sleep: { title: 'Сон', unit: () => 'за прошлую ночь' },
  steps: { title: 'Шаги', unit: () => 'шагов сегодня' },
  running: { title: 'Бег', unit: () => 'минут активности' },
  rest: { title: 'Отдых', unit: () => 'часов спокойствия' },
};

export function NotificationsScreen({ navigation }: NativeStackScreenProps<AppStackParamList, 'Notifications'>) {
  const items = useAppStore((state) => state.notifications);
  const markNotificationsRead = useAppStore((state) => state.markNotificationsRead);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar style="dark" />
      <Header title="Уведомления" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        {items.map((item) => (
          <Card key={item.id}>
            <Text style={styles.rowTitle}>{item.title}</Text>
            <Text style={styles.copy}>{item.body}</Text>
            <Text style={styles.meta}>{item.timeLabel}</Text>
          </Card>
        ))}
        <Button label="Отметить прочитанными" onPress={markNotificationsRead} />
      </ScrollView>
    </SafeAreaView>
  );
}

export function AiSummaryScreen({ navigation }: NativeStackScreenProps<AppStackParamList, 'AiSummary'>) {
  const pet = useActivePet();
  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar style="dark" />
      <Header title="Сводка Tailio" onBack={() => navigation.goBack()} />
      <View style={styles.content}>
        <Card>
          <Text style={styles.rowTitle}>Сегодня всё хорошо</Text>
          <Text style={styles.copy}>{pet.aiSummary}</Text>
        </Card>
        <Card>
          <Text style={styles.rowTitle}>Что изменилось</Text>
          <Text style={styles.copy}>Активность −12% · Сон +15 мин · Пульс в норме · Спокойствие в норме</Text>
        </Card>
      </View>
    </SafeAreaView>
  );
}

export function MetricDetailScreen({ navigation, route }: NativeStackScreenProps<AppStackParamList, 'MetricDetail'>) {
  const pet = useActivePet();
  const copy = METRIC_COPY[route.params.metricId];
  const value =
    route.params.metricId === 'pulse'
      ? String(pet.pulse)
      : route.params.metricId === 'pressure'
        ? pet.pressure
        : route.params.metricId === 'temperature'
          ? String(pet.temperature)
          : route.params.metricId === 'sleep'
            ? pet.sleepLabel
            : route.params.metricId === 'steps'
              ? pet.steps.toLocaleString('ru-RU')
              : route.params.metricId === 'running'
                ? `${pet.runningMinutes} мин`
                : `${pet.restHours} ч`;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar style="dark" />
      <Header title={copy.title} onBack={() => navigation.goBack()} />
      <View style={styles.content}>
        <Text style={styles.hero}>{value}</Text>
        <Text style={styles.copy}>{copy.unit(pet.name)}</Text>
        <Card>
          <Text style={styles.rowTitle}>День / Неделя / Месяц</Text>
          <Text style={styles.copy}>
            График по макету подключим на следующем шаге. Сейчас это карточка показателя {pet.name}.
          </Text>
        </Card>
      </View>
    </SafeAreaView>
  );
}

export function ReminderDetailScreen({ navigation, route }: NativeStackScreenProps<AppStackParamList, 'ReminderDetail'>) {
  const reminder = useAppStore((state) => state.reminders.find((item) => item.id === route.params.reminderId));
  const toggleReminder = useAppStore((state) => state.toggleReminder);

  if (!reminder) {
    return null;
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar style="dark" />
      <Header title="Напоминание" onBack={() => navigation.goBack()} />
      <View style={styles.content}>
        <Card>
          <Text style={styles.rowTitle}>{reminder.title}</Text>
          <Text style={styles.copy}>{reminder.timeLabel}</Text>
        </Card>
        <Button
          label={reminder.done ? 'Вернуть в список' : 'Отметить выполненным'}
          onPress={() => toggleReminder(reminder.id)}
        />
      </View>
    </SafeAreaView>
  );
}

export function EventDetailScreen({ navigation, route }: NativeStackScreenProps<AppStackParamList, 'EventDetail'>) {
  const event = scheduleEvents.find((item) => item.id === route.params.eventId);
  if (!event) return null;
  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar style="dark" />
      <Header title="Событие" onBack={() => navigation.goBack()} />
      <View style={styles.content}>
        <Card>
          <Text style={styles.rowTitle}>{event.title}</Text>
          <Text style={styles.copy}>
            {event.time}
            {event.place ? ` · ${event.place}` : ''}
          </Text>
        </Card>
      </View>
    </SafeAreaView>
  );
}

export function AddLogScreen({ navigation, route }: NativeStackScreenProps<AppStackParamList, 'AddLog'>) {
  const addLog = useAppStore((state) => state.addLog);
  const pet = useActivePet();
  const kind = route.params.kind ?? 'other';

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar style="dark" />
      <Header title={LABELS[kind]} onBack={() => navigation.goBack()} />
      <View style={styles.content}>
        <Card>
          <Text style={styles.copy}>
            Записать «{LABELS[kind].toLowerCase()}» для {pet.name}? Событие появится в ленте дня.
          </Text>
        </Card>
        <Button
          label="Сохранить"
          onPress={() => {
            addLog(kind);
            navigation.goBack();
          }}
        />
      </View>
    </SafeAreaView>
  );
}

export function DocumentsScreen({ navigation }: NativeStackScreenProps<AppStackParamList, 'Documents'>) {
  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar style="dark" />
      <Header title="Документы" onBack={() => navigation.goBack()} />
      <View style={styles.content}>
        <Card>
          <Text style={styles.rowTitle}>Пока пусто</Text>
          <Text style={styles.copy}>Сюда добавим паспорт, прививки и анализы — как в блоке Figma «Добавьте документы».</Text>
        </Card>
      </View>
    </SafeAreaView>
  );
}

function Header({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View style={styles.header}>
      <Pressable onPress={onBack} hitSlop={10}>
        <Text style={styles.back}>Назад</Text>
      </Pressable>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={{ width: 48 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: 8,
  },
  back: {
    ...type.caption,
    color: colors.purple,
    width: 48,
  },
  headerTitle: {
    ...type.subtitle,
    color: colors.ink,
  },
  content: {
    padding: spacing.xl,
    gap: 12,
  },
  rowTitle: {
    ...type.subtitle,
    color: colors.ink,
  },
  copy: {
    ...type.body,
    color: colors.inkSoft,
    marginTop: 6,
  },
  meta: {
    ...type.caption,
    color: colors.muted,
    marginTop: 8,
  },
  hero: {
    fontSize: 40,
    fontFamily: 'Inter_700Bold',
    color: colors.ink,
  },
});
