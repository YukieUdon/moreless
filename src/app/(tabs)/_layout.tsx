import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router/js-tabs';
import { StyleSheet } from 'react-native';

import { MoneyPlanProvider } from '@/hooks/use-money-plan';
import { useTheme } from '@/hooks/use-theme';

/**
 * 底部三个 tab：换算（/）、收支（/plan）、我的（/me）。
 * 用 JS tabs 而不是原生 tabs：原生 tab 在两端长得不一样，很难贴合纸色 + 墨绿。
 */
export default function TabsLayout() {
  const theme = useTheme();

  return (
    <MoneyPlanProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: theme.accent,
          tabBarInactiveTintColor: theme.textSecondary,
          tabBarStyle: {
            backgroundColor: theme.background,
            borderTopColor: theme.border,
            borderTopWidth: StyleSheet.hairlineWidth,
            elevation: 0,
            shadowOpacity: 0,
          },
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: '换算',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="scale-balance" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="plan"
          options={{
            title: '收支',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="wallet-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="me"
          options={{
            title: '我的',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="account-circle-outline" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </MoneyPlanProvider>
  );
}
