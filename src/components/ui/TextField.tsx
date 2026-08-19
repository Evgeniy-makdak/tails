import { StyleSheet, Text, TextInput, type TextInputProps, View } from 'react-native';

import { colors, radius, type } from '../../theme';

type Props = TextInputProps & {
  label?: string;
  error?: boolean;
};

export function TextField({ label, style, error, ...rest }: Props) {
  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.muted}
        style={[styles.input, error && styles.inputError, style]}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  label: {
    ...type.caption,
    color: colors.inkSoft,
  },
  input: {
    height: 56,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
    paddingHorizontal: 16,
    color: colors.ink,
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
  },
  inputError: {
    borderColor: colors.red,
  },
});
