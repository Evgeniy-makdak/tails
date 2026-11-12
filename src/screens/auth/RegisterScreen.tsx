import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../components/ui/Button';
import { useI18n } from '../../i18n';
import { colors, radius, spacing, type } from '../../theme';

type Props = {
  onRegister: () => void;
  onBack: () => void;
};

export function RegisterScreen({ onRegister, onBack }: Props) {
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <Text style={styles.title}>{t('auth_registerTitle')}</Text>
      <Text style={styles.copy}>{t('auth_registerCopy')}</Text>
      <View style={styles.form}>
        <TextInput
          placeholder={t('auth_namePlaceholder')}
          placeholderTextColor={colors.muted}
          style={styles.input}
          value={name}
          onChangeText={setName}
        />
        <TextInput
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder={t('auth_email')}
          placeholderTextColor={colors.muted}
          style={styles.input}
          value={email}
          onChangeText={setEmail}
        />
        <Button label={t('auth_register')} onPress={onRegister} />
        <Button label={t('auth_haveLogin')} variant="ghost" onPress={onBack} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.linen,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
  },
  title: {
    ...type.title,
    color: colors.ink,
  },
  copy: {
    ...type.body,
    color: colors.inkSoft,
    marginTop: spacing.md,
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
