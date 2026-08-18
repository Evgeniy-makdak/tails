import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, type } from '../../theme';

type Day = {
  offset: number;
  label: string;
  date: number;
};

function buildWeek(): Day[] {
  const labels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const today = new Date();
  const mondayOffset = (today.getDay() + 6) % 7;
  return labels.map((label, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - mondayOffset + index);
    return { offset: index - mondayOffset, label, date: date.getDate() };
  });
}

type Props = {
  value: number;
  onChange: (offset: number) => void;
};

export function WeekStrip({ value, onChange }: Props) {
  const days = buildWeek();

  return (
    <View style={styles.row}>
      {days.map((day) => {
        const active = day.offset === value;
        return (
          <Pressable key={day.label} onPress={() => onChange(day.offset)} style={styles.item}>
            <Text style={styles.label}>{day.label}</Text>
            <View style={[styles.bubble, active && styles.bubbleActive]}>
              <Text style={[styles.date, active && styles.dateActive]}>{day.date}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  item: {
    alignItems: 'center',
    gap: 6,
    width: 40,
  },
  label: {
    ...type.caption,
    color: colors.muted,
  },
  bubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleActive: {
    backgroundColor: colors.purple,
  },
  date: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: colors.ink,
  },
  dateActive: {
    color: colors.white,
  },
});
