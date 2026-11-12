import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { translate, useLocaleStore } from '../../i18n';
import { colors, spacing, type } from '../../theme';

type Props = {
  children: ReactNode;
};

type State = {
  error: Error | null;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Hvostik render error', error, info.componentStack);
  }

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    const locale = useLocaleStore.getState().locale;

    return (
      <View style={styles.box}>
        <Text style={styles.title}>{translate(locale, 'error_screen')}</Text>
        <Text style={styles.copy}>{this.state.error.message}</Text>
        <Pressable onPress={() => this.setState({ error: null })} style={styles.btn}>
          <Text style={styles.btnText}>{translate(locale, 'error_retry')}</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  box: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.bg,
    gap: 12,
  },
  title: {
    ...type.title,
    color: colors.ink,
  },
  copy: {
    ...type.body,
    color: colors.inkSoft,
  },
  btn: {
    alignSelf: 'flex-start',
    backgroundColor: colors.purple,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  btnText: {
    ...type.button,
    color: colors.white,
  },
});
