import 'react-native-reanimated';
import { enableScreens } from 'react-native-screens';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_800ExtraBold,
} from '@expo-google-fonts/nunito';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Platform, StyleSheet, View } from 'react-native';

import { AppSafeArea } from './src/components/ui/AppSafeArea';
import { ErrorBoundary } from './src/components/ui/ErrorBoundary';
import { PhoneShell } from './src/components/ui/PhoneShell';
import { RootNavigator } from './src/navigation/RootNavigator';
import { colors } from './src/theme';

if (Platform.OS === 'web') {
  enableScreens(false);
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_800ExtraBold,
  });

  if (!fontsLoaded) {
    return <View style={styles.boot} />;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <PhoneShell>
        <AppSafeArea>
          <ErrorBoundary>
            <RootNavigator />
          </ErrorBoundary>
        </AppSafeArea>
      </PhoneShell>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.linenDeep,
  },
  boot: {
    flex: 1,
    backgroundColor: colors.bg,
  },
});
