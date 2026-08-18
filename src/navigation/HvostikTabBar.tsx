import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, type } from '../theme';
import type { MainTabParamList } from '../types/navigation';

const ICONS: Record<keyof MainTabParamList, keyof typeof Ionicons.glyphMap> = {
  Home: 'home-outline',
  Map: 'map-outline',
  Health: 'heart-outline',
  Profile: 'person-outline',
};

const ACTIVE_ICONS: Record<keyof MainTabParamList, keyof typeof Ionicons.glyphMap> = {
  Home: 'home',
  Map: 'map',
  Health: 'heart',
  Profile: 'person',
};

export function HvostikTabBar({ state, navigation }: BottomTabBarProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const name = route.name as keyof MainTabParamList;
          const color = focused ? colors.purple : colors.tabInactive;
          const labels: Record<keyof MainTabParamList, string> = {
            Home: 'Главная',
            Map: 'Карта',
            Health: 'Здоровье',
            Profile: 'Профиль',
          };

          return (
            <Pressable key={route.key} onPress={() => navigation.navigate(route.name)} style={styles.item}>
              <Ionicons name={focused ? ACTIVE_ICONS[name] : ICONS[name]} size={22} color={color} />
              <Text style={[styles.label, { color }]}>{labels[name]}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.paper,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingBottom: 10,
  },
  bar: {
    flexDirection: 'row',
    paddingTop: 10,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
  },
  label: {
    ...type.caption,
    fontSize: 11,
  },
});
