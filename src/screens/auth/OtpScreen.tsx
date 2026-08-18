import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../components/ui/Button';
import { colors, radius, spacing, type } from '../../theme';

type Props = {
  email: string;
  onNext: () => void;
  onBack: () => void;
};

const DEMO_CODE = '111111';

export function OtpScreen({ email, onNext, onBack }: Props) {
  const inputRef = useRef<TextInput>(null);
  const [code, setCode] = useState(DEMO_CODE);
  const digits = code.replace(/\D/g, '').slice(0, 6);
  const ready = digits.length === 6;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <Pressable onPress={onBack} style={styles.back}>
        <Text style={styles.backText}>←</Text>
      </Pressable>
      <View style={styles.body}>
        <Text style={styles.title}>Подтвердите почту</Text>
        <Text style={styles.copy}>
          Отправили код вам на почту{email ? `\n${email}` : ''}
        </Text>
        <Text style={styles.hint}>Пока письма не уходят. Демо-код уже подставлен: {DEMO_CODE}</Text>

        <Pressable onPress={() => inputRef.current?.focus()} style={styles.row}>
          {Array.from({ length: 6 }).map((_, index) => (
            <View key={index} style={[styles.box, digits[index] ? styles.boxFilled : null]}>
              <Text style={styles.digit}>{digits[index] ?? ''}</Text>
            </View>
          ))}
          <TextInput
            ref={inputRef}
            autoFocus
            keyboardType="number-pad"
            maxLength={6}
            value={digits}
            onChangeText={(value) => setCode(value.replace(/\D/g, '').slice(0, 6))}
            style={styles.overlay}
            caretHidden
          />
        </Pressable>
      </View>
      <View style={styles.footer}>
        <Button label="Далее" disabled={!ready} onPress={onNext} />
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
  hint: {
    ...type.caption,
    color: colors.purple,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    position: 'relative',
  },
  box: {
    width: 48,
    height: 56,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxFilled: {
    borderColor: colors.purple,
  },
  digit: {
    ...type.title,
    fontSize: 22,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.02,
    color: colors.ink,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
});
