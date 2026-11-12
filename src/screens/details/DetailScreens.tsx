import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { scheduleEvents } from '../../data/mock';
import { useI18n, type MessageKey } from '../../i18n';
import { useActivePet, useAppStore } from '../../store/useAppStore';
import { colors, spacing, type } from '../../theme';
import type { AppStackParamList } from '../../types/navigation';
import type { MetricId, QuickActionKind } from '../../types/pet';

const LABELS: Record<QuickActionKind, MessageKey> = {
  walk: 'details_walk',
  toilet: 'details_toilet',
  training: 'details_training',
  other: 'details_other',
};

const METRIC_COPY: Record<MetricId, { title: MessageKey; unit: MessageKey }> = {
  pulse: { title: 'health_pulse', unit: 'details_unitPulse' },
  pressure: { title: 'details_pressure', unit: 'details_unitPressure' },
  temperature: { title: 'health_temperature', unit: 'details_unitTemperature' },
  sleep: { title: 'health_sleep', unit: 'details_unitSleep' },
  steps: { title: 'health_steps', unit: 'details_unitSteps' },
  running: { title: 'health_running', unit: 'details_unitRunning' },
  rest: { title: 'health_rest', unit: 'details_unitRest' },
};

export function NotificationsScreen({ navigation }: NativeStackScreenProps<AppStackParamList, 'Notifications'>) {
  const { t } = useI18n();
  const items = useAppStore((state) => state.notifications);
  const markNotificationsRead = useAppStore((state) => state.markNotificationsRead);
  const markNotificationsUnread = useAppStore((state) => state.markNotificationsUnread);
  const [selected, setSelected] = useState<string[]>([]);

  const selectedItems = items.filter((item) => selected.includes(item.id));
  const markUnreadMode = selectedItems.length > 0 && selectedItems.every((item) => item.read);
  const lockUnread = selectedItems.length > 0 && selectedItems.every((item) => !item.read);
  const lockRead = markUnreadMode;
  const canSubmit = selected.length > 0;

  const toggle = (id: string, unread: boolean) => {
    if ((lockUnread && !unread) || (lockRead && unread)) {
      return;
    }
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar style="dark" />
      <Header title={t('details_notifications')} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        {items.map((item) => {
          const unread = !item.read;
          const checked = selected.includes(item.id);
          const locked = (lockUnread && !unread) || (lockRead && unread);
          return (
            <Pressable
              key={item.id}
              onPress={() => toggle(item.id, unread)}
              style={[styles.notice, locked && styles.noticeLocked]}
            >
              <View style={[styles.radio, checked && styles.radioOn, locked && styles.radioLocked]}>
                {checked ? <View style={styles.radioDot} /> : null}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, unread ? styles.noticeTitleUnread : styles.noticeTitleRead]}>
                  {item.title}
                </Text>
                <Text style={[styles.copy, unread && styles.noticeCopyUnread]}>{item.body}</Text>
                <Text style={styles.meta}>{item.timeLabel}</Text>
              </View>
            </Pressable>
          );
        })}
        <Button
          label={markUnreadMode ? t('details_markUnread') : t('details_markRead')}
          disabled={!canSubmit}
          onPress={() => {
            if (markUnreadMode) {
              markNotificationsUnread(selected);
            } else {
              markNotificationsRead(selected);
            }
            setSelected([]);
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

export function AiSummaryScreen({ navigation }: NativeStackScreenProps<AppStackParamList, 'AiSummary'>) {
  const { t } = useI18n();
  const pet = useActivePet();
  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar style="dark" />
      <Header title={t('details_summary')} onBack={() => navigation.goBack()} />
      <View style={styles.content}>
        <Card>
          <Text style={styles.rowTitle}>{t('details_todayGood')}</Text>
          <Text style={styles.copy}>{pet.aiSummary}</Text>
        </Card>
        <Card>
          <Text style={styles.rowTitle}>{t('details_changed')}</Text>
          <Text style={styles.copy}>{t('details_changedCopy')}</Text>
        </Card>
      </View>
    </SafeAreaView>
  );
}

export function MetricDetailScreen({ navigation, route }: NativeStackScreenProps<AppStackParamList, 'MetricDetail'>) {
  const { t, locale } = useI18n();
  const pet = useActivePet();
  const metricId = route.params.metricId as MetricId;
  const copy = METRIC_COPY[metricId];
  const value =
    metricId === 'pulse'
      ? String(pet.pulse)
      : metricId === 'pressure'
        ? pet.pressure
        : metricId === 'temperature'
          ? String(pet.temperature)
          : metricId === 'sleep'
            ? pet.sleepLabel
            : metricId === 'steps'
              ? pet.steps.toLocaleString(locale === 'en' ? 'en-US' : 'ru-RU')
              : metricId === 'running'
                ? t('common_minutesShort', { value: pet.runningMinutes })
                : t('common_hoursShort', { value: pet.restHours });

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar style="dark" />
      <Header title={t(copy.title)} onBack={() => navigation.goBack()} />
      <View style={styles.content}>
        <Text style={styles.hero}>{value}</Text>
        <Text style={styles.copy}>{t(copy.unit)}</Text>
        <Card>
          <Text style={styles.rowTitle}>{t('details_period')}</Text>
          <Text style={styles.copy}>
            {t('details_chartPlaceholder', { name: pet.name })}
          </Text>
        </Card>
      </View>
    </SafeAreaView>
  );
}

export function ReminderDetailScreen({ navigation, route }: NativeStackScreenProps<AppStackParamList, 'ReminderDetail'>) {
  const { t } = useI18n();
  const reminder = useAppStore((state) => state.reminders.find((item) => item.id === route.params.reminderId));
  const toggleReminder = useAppStore((state) => state.toggleReminder);

  if (!reminder) {
    return null;
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar style="dark" />
      <Header title={t('details_reminder')} onBack={() => navigation.goBack()} />
      <View style={styles.content}>
        <Card>
          <Text style={styles.rowTitle}>{reminder.title}</Text>
          <Text style={styles.copy}>{reminder.timeLabel}</Text>
        </Card>
        <Button
          label={reminder.done ? t('details_returnToList') : t('details_markDone')}
          onPress={() => toggleReminder(reminder.id)}
        />
      </View>
    </SafeAreaView>
  );
}

export function EventDetailScreen({ navigation, route }: NativeStackScreenProps<AppStackParamList, 'EventDetail'>) {
  const { t } = useI18n();
  const event = scheduleEvents.find((item) => item.id === route.params.eventId);
  if (!event) return null;
  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar style="dark" />
      <Header title={t('details_event')} onBack={() => navigation.goBack()} />
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
  const { t } = useI18n();
  const addLog = useAppStore((state) => state.addLog);
  const pet = useActivePet();
  const kind = (route.params.kind ?? 'other') as QuickActionKind;
  const labelKey = LABELS[kind];

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar style="dark" />
      <Header title={t(labelKey)} onBack={() => navigation.goBack()} />
      <View style={styles.content}>
        <Card>
          <Text style={styles.copy}>
            {t('details_eventConfirm', { event: t(labelKey).toLowerCase(), name: pet.name })}
          </Text>
        </Card>
        <Button
          label={t('common_save')}
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
  const { t } = useI18n();
  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar style="dark" />
      <Header title={t('details_documents')} onBack={() => navigation.goBack()} />
      <View style={styles.content}>
        <Card>
          <Text style={styles.rowTitle}>{t('common_empty')}</Text>
          <Text style={styles.copy}>{t('details_documentsCopy')}</Text>
        </Card>
      </View>
    </SafeAreaView>
  );
}

function Header({ title, onBack }: { title: string; onBack: () => void }) {
  const { t } = useI18n();
  return (
    <View style={styles.header}>
      <Pressable onPress={onBack} hitSlop={10}>
        <Text style={styles.back}>{t('common_back')}</Text>
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
  noticeTitleUnread: {
    fontFamily: 'Inter_700Bold',
  },
  noticeTitleRead: {
    fontFamily: 'Inter_400Regular',
  },
  copy: {
    ...type.body,
    color: colors.inkSoft,
    marginTop: 6,
  },
  noticeCopyUnread: {
    fontFamily: 'Inter_500Medium',
    color: colors.ink,
  },
  meta: {
    ...type.caption,
    color: colors.muted,
    marginTop: 8,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: colors.paper,
    borderRadius: 22,
    padding: 16,
  },
  noticeLocked: {
    opacity: 0.42,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  radioOn: {
    borderColor: colors.purple,
  },
  radioLocked: {
    borderColor: colors.linenDeep,
    backgroundColor: colors.linen,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.purple,
  },
  hero: {
    fontSize: 40,
    fontFamily: 'Inter_700Bold',
    color: colors.ink,
  },
});
