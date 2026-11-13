import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useI18n } from '../../i18n';
import type { Locale } from '../../i18n';
import { colors, radius } from '../../theme';

type Props = {
  style?: StyleProp<ViewStyle>;
  respectSafeArea?: boolean;
};

const OPTIONS: Locale[] = ['ru', 'en'];

export function LanguageSwitcher({ style, respectSafeArea = true }: Props) {
  const insets = useSafeAreaInsets();
  const { locale, setLocale } = useI18n();

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.wrap,
        respectSafeArea ? { top: Math.max(insets.top, 8) + 4 } : { top: 8 },
        style,
      ]}
    >
      <View style={styles.pill}>
        {OPTIONS.map((code) => {
          const active = locale === code;
          return (
            <Pressable
              key={code}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={code === 'ru' ? 'Русский' : 'English'}
              onPress={() => setLocale(code)}
              style={[styles.option, active && styles.optionActive]}
              hitSlop={4}
            >
              <Text style={[styles.label, active && styles.labelActive]}>{code.toUpperCase()}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    right: 12,
    zIndex: 50,
    elevation: 50,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.paper,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 2,
    gap: 2,
    shadowColor: colors.ink,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  option: {
    minWidth: 36,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  optionActive: {
    backgroundColor: colors.purple,
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.4,
    color: colors.muted,
  },
  labelActive: {
    color: colors.white,
  },
});
