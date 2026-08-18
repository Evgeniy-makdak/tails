import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TailioBlob } from '../../components/brand/TailioMark';
import { useActivePet } from '../../store/useAppStore';
import { colors, radius, spacing, type } from '../../theme';
import type { AppStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<AppStackParamList, 'Chat'>;

export function ChatScreen({ navigation }: Props) {
  const pet = useActivePet();
  const [menu, setMenu] = useState(false);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.back}>←</Text>
        </Pressable>
        <Text style={styles.title}>Tailio Чат</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={styles.feed}>
        <Text style={styles.day}>Сегодня</Text>
        <View style={styles.msg}>
          <TailioBlob size={36} />
          <View style={styles.bubble}>
            <Text style={styles.sender}>Tailio</Text>
            <Text style={styles.text}>
              Добро пожаловать в Tailio ✨ Теперь мы вместе будем следить за состоянием и безопасностью {pet.name}.
            </Text>
            <Text style={styles.text}>
              Я уже проверил его состояние 👀 Сейчас он <Text style={styles.ok}>спокоен</Text>, а показатели в пределах{' '}
              <Text style={styles.ok}>нормы</Text>.
            </Text>
          </View>
        </View>
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <Chip label="Есть ли повод для беспокойства?" />
        <Chip label={`Где сейчас ${pet.name}?`} />
      </ScrollView>
      {menu ? (
        <View style={styles.menu}>
          <Text style={styles.menuItem}>Камера</Text>
          <Text style={styles.menuItem}>Фото</Text>
          <Text style={styles.menuItem}>Файл</Text>
        </View>
      ) : null}
      <View style={styles.inputRow}>
        <Pressable style={styles.round} onPress={() => setMenu((value) => !value)}>
          <Ionicons name="attach" size={18} color={colors.white} />
        </Pressable>
        <TextInput placeholder={`Спросить про ${pet.name}`} placeholderTextColor={colors.muted} style={styles.input} />
        <View style={[styles.round, { backgroundColor: colors.purple }]}>
          <Ionicons name="mic" size={18} color={colors.white} />
        </View>
      </View>
    </SafeAreaView>
  );
}

function Chip({ label }: { label: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: 8,
  },
  back: {
    fontSize: 22,
    color: colors.ink,
  },
  title: {
    ...type.subtitle,
    color: colors.ink,
  },
  feed: {
    padding: spacing.xl,
    gap: 16,
  },
  day: {
    ...type.caption,
    color: colors.muted,
    textAlign: 'center',
  },
  msg: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  bubble: {
    flex: 1,
    gap: 8,
  },
  sender: {
    ...type.subtitle,
    color: colors.ink,
  },
  text: {
    ...type.body,
    color: colors.inkSoft,
  },
  ok: {
    color: colors.green,
    fontFamily: 'Inter_600SemiBold',
  },
  chips: {
    paddingHorizontal: spacing.xl,
    gap: 8,
    paddingBottom: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipText: {
    ...type.caption,
    color: colors.inkSoft,
  },
  menu: {
    marginHorizontal: spacing.xl,
    marginBottom: 8,
    backgroundColor: colors.paper,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 12,
    gap: 10,
  },
  menuItem: {
    ...type.body,
    color: colors.ink,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  round: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.inkSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F3F5',
    paddingHorizontal: 14,
    fontFamily: 'Inter_400Regular',
  },
});
