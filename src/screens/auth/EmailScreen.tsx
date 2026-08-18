import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { colors, spacing, type } from '../../theme';

type Props = {
  mode: 'register' | 'login';
  onSubmit: (email: string) => void;
  onSwitch: () => void;
  onBack?: () => void;
};

export function EmailScreen({ mode, onSubmit, onSwitch, onBack }: Props) {
  const [email, setEmail] = useState('');
  const valid = email.includes('@') && email.includes('.');

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      {onBack ? (
        <Pressable onPress={onBack} style={styles.back}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
      ) : (
        <View style={styles.back} />
      )}
      <View style={styles.body}>
        <Text style={styles.title}>{mode === 'register' ? 'Добро пожаловать!' : 'С возвращением'}</Text>
        <Text style={styles.copy}>
          {mode === 'register' ? 'Введите почту, чтобы создать аккаунт Tailio' : 'Войдите по почте, чтобы продолжить'}
        </Text>
        <TextField
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="Введите почту"
          value={email}
          onChangeText={setEmail}
        />
      </View>
      <View style={styles.footer}>
        <Button
          label={mode === 'register' ? 'Зарегистрироваться' : 'Войти'}
          disabled={!valid}
          onPress={() => onSubmit(email.trim())}
        />
        <Pressable onPress={onSwitch} style={styles.switch}>
          <Text style={styles.switchText}>
            {mode === 'register' ? 'Уже есть аккаунт' : 'Создать аккаунт'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  back: {
    height: 44,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
  },
  backText: {
    fontSize: 22,
    color: colors.ink,
  },
  body: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    gap: 16,
  },
  title: {
    ...type.title,
    color: colors.ink,
  },
  copy: {
    ...type.body,
    color: colors.muted,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  switch: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  switchText: {
    ...type.subtitle,
    color: colors.purple,
  },
});
