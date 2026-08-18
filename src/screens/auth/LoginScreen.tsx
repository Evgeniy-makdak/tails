import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TailMark } from '../../components/illustrations/TailMark';
import { Button } from '../../components/ui/Button';
import { colors, radius, spacing, type } from '../../theme';

type Props = {
  onLogin: () => void;
  onRegister: () => void;
};

export function LoginScreen({ onLogin, onRegister }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TailMark size={56} />
        <Text style={styles.title}>С возвращением</Text>
        <Text style={styles.copy}>Войдите, чтобы увидеть дневник своих хвостов.</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="Почта"
          placeholderTextColor={colors.muted}
          style={styles.input}
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          placeholder="Пароль"
          placeholderTextColor={colors.muted}
          secureTextEntry
          style={styles.input}
          value={password}
          onChangeText={setPassword}
        />
        <Button label="Войти" onPress={onLogin} />
        <Button label="Создать аккаунт" variant="soft" onPress={onRegister} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.linen,
    paddingHorizontal: spacing.xl,
  },
  header: {
    paddingTop: spacing.xxl,
    gap: spacing.md,
  },
  title: {
    ...type.title,
    color: colors.ink,
  },
  copy: {
    ...type.body,
    color: colors.inkSoft,
  },
  form: {
    marginTop: spacing.xxl,
    gap: spacing.md,
  },
  input: {
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 16,
    color: colors.ink,
    fontFamily: 'Nunito_400Regular',
    fontSize: 16,
  },
});
