import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../components/ui/Button';
import { useI18n } from '../../i18n';
import { colors, radius, spacing, type } from '../../theme';

type Props = {
  onNext: () => void;
  onBack: () => void;
};

export function TermsScreen({ onNext, onBack }: Props) {
  const { t } = useI18n();
  const [terms, setTerms] = useState(false);
  const [tips, setTips] = useState(false);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <Pressable onPress={onBack} style={styles.back}>
        <Text style={styles.backText}>←</Text>
      </Pressable>
      <View style={styles.body}>
        <Text style={styles.title}>{t('auth_termsTitle')}</Text>
        <Text style={styles.copy}>{t('auth_termsIntro')}</Text>
        <Pressable style={styles.checkRow} onPress={() => setTerms((value) => !value)}>
          <View style={[styles.box, terms && styles.boxOn]} />
          <Text style={styles.checkText}>{t('auth_termsAccept')}</Text>
        </Pressable>
        <Pressable style={styles.checkRow} onPress={() => setTips((value) => !value)}>
          <View style={[styles.box, tips && styles.boxOn]} />
          <Text style={styles.checkText}>{t('auth_termsMarketing')}</Text>
        </Pressable>
      </View>
      <View style={styles.footer}>
        <Button label={t('common_continue')} disabled={!terms} onPress={onNext} />
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
  checkRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.line,
    marginTop: 2,
  },
  boxOn: {
    backgroundColor: colors.purple,
    borderColor: colors.purple,
  },
  checkText: {
    ...type.body,
    flex: 1,
    color: colors.inkSoft,
  },
  link: {
    color: '#3B82F6',
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
});
