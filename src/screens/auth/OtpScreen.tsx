import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import {
  InputAccessoryView,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../components/ui/Button';
import { DEMO_OTP } from '../../data/auth';
import { colors, radius, spacing, type } from '../../theme';

type Props = {
  email: string;
  onNext: () => void;
  onBack: () => void;
};

const ACCESSORY_ID = 'otp-done';

export function OtpScreen({ email, onNext, onBack }: Props) {
  const inputRef = useRef<TextInput>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  const digits = code.replace(/\D/g, '').slice(0, 6);
  const ready = digits.length === 6;

  const hideKeyboard = () => Keyboard.dismiss();

  const submit = () => {
    hideKeyboard();
    if (digits !== DEMO_OTP) {
      setCode('');
      setError(true);
      requestAnimationFrame(() => inputRef.current?.focus());
      return;
    }
    setError(false);
    onNext();
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable onPress={onBack} style={styles.back}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <Pressable style={styles.body} onPress={hideKeyboard}>
          <Text style={styles.title}>Подтвердите почту</Text>
          <Text style={styles.copy}>
            Отправили код вам на почту{email ? `\n${email}` : ''}
          </Text>
          <Text style={styles.hint}>Пока письма не уходят. Введите код {DEMO_OTP} вручную</Text>

          <Pressable onPress={() => inputRef.current?.focus()} style={styles.row}>
            {Array.from({ length: 6 }).map((_, index) => (
              <View
                key={index}
                style={[
                  styles.box,
                  digits[index] ? styles.boxFilled : null,
                  error ? styles.boxError : null,
                ]}
              >
                <Text style={[styles.digit, error && styles.digitError]}>{digits[index] ?? ''}</Text>
              </View>
            ))}
            <TextInput
              ref={inputRef}
              autoFocus
              keyboardType="number-pad"
              inputAccessoryViewID={Platform.OS === 'ios' ? ACCESSORY_ID : undefined}
              maxLength={6}
              value={digits}
              onChangeText={(value) => {
                const next = value.replace(/\D/g, '').slice(0, 6);
                setCode(next);
                if (error) {
                  setError(false);
                }
                if (next.length === 6) {
                  hideKeyboard();
                }
              }}
              style={styles.overlay}
              caretHidden
              selectionColor="transparent"
              underlineColorAndroid="transparent"
              importantForAccessibility="no"
            />
          </Pressable>
          {error ? <Text style={styles.error}>Неверный код. Введите код повторно</Text> : null}
        </Pressable>
        <View style={styles.footer}>
          <Button label="Далее" disabled={!ready} onPress={submit} />
        </View>
      </KeyboardAvoidingView>
      {Platform.OS === 'ios' ? (
        <InputAccessoryView nativeID={ACCESSORY_ID}>
          <View style={styles.accessory}>
            <Pressable onPress={hideKeyboard} hitSlop={8}>
              <Text style={styles.accessoryText}>Готово</Text>
            </Pressable>
          </View>
        </InputAccessoryView>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  flex: {
    flex: 1,
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
  boxError: {
    borderColor: colors.red,
  },
  digit: {
    ...type.title,
    fontSize: 22,
  },
  digitError: {
    color: colors.red,
  },
  error: {
    ...type.body,
    color: colors.red,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.01,
    color: 'transparent',
    // Hide browser focus ring around the invisible OTP field on web / PWA
    ...(Platform.OS === 'web'
      ? ({
          outlineStyle: 'none',
          outlineWidth: 0,
          outlineColor: 'transparent',
          boxShadow: 'none',
          caretColor: 'transparent',
        } as object)
      : null),
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  accessory: {
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F2F2F7',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
  accessoryText: {
    ...type.subtitle,
    color: colors.purple,
  },
});
