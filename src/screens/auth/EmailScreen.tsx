import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { DEMO_EMAIL } from '../../data/auth';
import { useI18n } from '../../i18n';
import { useAppStore } from '../../store/useAppStore';
import { colors, spacing, type } from '../../theme';

type Props = {
  mode: 'register' | 'login';
  onSubmit: (email: string) => void;
  onSwitch: () => void;
  onBack?: () => void;
};

export function EmailScreen({ mode, onSubmit, onSwitch, onBack }: Props) {
  const { t } = useI18n();
  const hasAccount = useAppStore((state) => state.hasAccount);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const valid = email.includes('@') && email.includes('.');

  const submit = () => {
    const value = email.trim();
    if (mode === 'register' && hasAccount(value)) {
      setError(t('auth_accountExists'));
      return;
    }
    if (mode === 'login' && !hasAccount(value)) {
      setError(t('auth_accountNotFound'));
      return;
    }
    setError('');
    onSubmit(value);
  };

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
        <Text style={styles.title}>{mode === 'register' ? t('auth_welcome') : t('auth_welcomeBack')}</Text>
        <Text style={styles.copy}>
          {mode === 'register' ? t('auth_registerPrompt') : t('auth_loginPrompt')}
        </Text>
        <TextField
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          placeholder={t('auth_emailPlaceholder')}
          value={email}
          error={Boolean(error)}
          onChangeText={(value) => {
            setEmail(value);
            if (error) {
              setError('');
            }
          }}
          style={{ backgroundColor: '#FAFAFA', borderWidth: error ? 1 : 0, borderRadius: 20 }}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {mode === 'login' ? (
          <Text style={styles.hint}>{t('auth_demoAccount', { email: DEMO_EMAIL })}</Text>
        ) : null}
      </View>
      <View style={styles.footer}>
        <Button
          label={mode === 'register' ? t('common_next') : t('auth_login')}
          disabled={!valid}
          onPress={submit}
        />
        <Pressable
          onPress={() => {
            setError('');
            onSwitch();
          }}
          style={styles.switch}
        >
          <Text style={styles.switchText}>
            {mode === 'register' ? t('auth_alreadyRegistered') : t('auth_createAccount')}
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
  error: {
    ...type.caption,
    color: colors.red,
    marginTop: -8,
  },
  hint: {
    ...type.caption,
    color: colors.purple,
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
