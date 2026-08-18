import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';

import { ChatScreen } from '../screens/chat/ChatScreen';
import { CreatePlaceScreen } from '../screens/map/CreatePlaceScreen';
import { DrawZoneScreen } from '../screens/map/DrawZoneScreen';
import { GeozonesScreen } from '../screens/map/GeozonesScreen';
import { WalkHistoryScreen } from '../screens/map/WalkHistoryScreen';
import {
  AddLogScreen,
  AiSummaryScreen,
  DocumentsScreen,
  EventDetailScreen,
  MetricDetailScreen,
  NotificationsScreen,
  ReminderDetailScreen,
} from '../screens/details/DetailScreens';
import { useAppStore } from '../store/useAppStore';
import { colors } from '../theme';
import type { RootStackParamList } from '../types/navigation';
import { AuthNavigator } from './AuthNavigator';
import { MainTabNavigator } from './MainTabNavigator';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
    card: colors.paper,
    text: colors.ink,
    border: colors.line,
    primary: colors.purple,
  },
};

export function RootNavigator() {
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const [hydrated, setHydrated] = useState(() => useAppStore.persist.hasHydrated());

  useEffect(() => {
    if (useAppStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    return useAppStore.persist.onFinishHydration(() => setHydrated(true));
  }, []);

  if (!hydrated) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  }

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: Platform.OS === 'web' ? 'none' : 'fade',
        }}
      >
        {isAuthenticated ? (
          <Stack.Group>
            <Stack.Screen name="Main" component={MainTabNavigator} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="AiSummary" component={AiSummaryScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="MetricDetail" component={MetricDetailScreen} />
            <Stack.Screen name="ReminderDetail" component={ReminderDetailScreen} />
            <Stack.Screen name="EventDetail" component={EventDetailScreen} />
            <Stack.Screen name="AddLog" component={AddLogScreen} />
            <Stack.Screen name="Documents" component={DocumentsScreen} />
            <Stack.Screen name="Geozones" component={GeozonesScreen} />
            <Stack.Screen name="DrawZone" component={DrawZoneScreen} />
            <Stack.Screen name="CreatePlace" component={CreatePlaceScreen} />
            <Stack.Screen name="WalkHistory" component={WalkHistoryScreen} />
          </Stack.Group>
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
