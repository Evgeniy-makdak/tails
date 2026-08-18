import { Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';

import { colors, radius, type } from '../../theme';

type ButtonVariant = 'primary' | 'ghost' | 'soft' | 'danger' | 'outline';

type Props = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  style?: ViewStyle;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
}: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && !disabled && styles.pressed,
        disabled && variant === 'primary' && styles.primaryDisabled,
        style,
      ]}
    >
      <Text
        style={[
          styles.label,
          variant === 'ghost' && styles.ghostLabel,
          variant === 'soft' && styles.softLabel,
          variant === 'danger' && styles.dangerLabel,
          variant === 'outline' && styles.outlineLabel,
          (variant === 'primary' || variant === 'soft') && !disabled && variant === 'primary'
            ? styles.solidLabel
            : null,
          variant === 'primary' && styles.solidLabel,
          disabled && variant === 'primary' && styles.disabledLabel,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 56,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  primary: {
    backgroundColor: colors.purple,
  },
  primaryDisabled: {
    backgroundColor: '#E4DFF8',
    opacity: 1,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  soft: {
    backgroundColor: colors.purpleSoft,
  },
  danger: {
    backgroundColor: colors.paper,
    borderWidth: 1.5,
    borderColor: colors.red,
  },
  outline: {
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
  },
  pressed: {
    opacity: 0.88,
  },
  label: {
    ...type.button,
  },
  solidLabel: {
    color: colors.white,
  },
  ghostLabel: {
    color: colors.muted,
  },
  softLabel: {
    color: colors.purple,
  },
  dangerLabel: {
    color: colors.red,
  },
  outlineLabel: {
    color: colors.ink,
  },
  disabledLabel: {
    color: colors.white,
  },
});
