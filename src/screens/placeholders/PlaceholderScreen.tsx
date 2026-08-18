import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing, type } from '../../theme';

type Props = {
  title: string;
  hint: string;
};

export function PlaceholderScreen({ title, hint }: Props) {
  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.body}>
        <Text style={styles.kicker}>Следующий этап</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.copy}>{hint}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.linen,
  },
  body: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'center',
  },
  kicker: {
    ...type.caption,
    color: colors.terracotta,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  title: {
    ...type.title,
    color: colors.ink,
    marginTop: 8,
  },
  copy: {
    ...type.body,
    color: colors.inkSoft,
    marginTop: 12,
    maxWidth: 320,
  },
});
