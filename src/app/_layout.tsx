import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect, useMemo } from 'react';

import { Colors } from '@/constants/theme';
import { PreferencesProvider, usePreferences } from '@/hooks/use-preferences';

// 读偏好之前先留着启动图：否则选了浅色的人会先看到一帧系统深色。
// Web / SSR 上这是 no-op，不会挡着出首屏。
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  return (
    <PreferencesProvider>
      <RootNavigator />
    </PreferencesProvider>
  );
}

function RootNavigator() {
  const { scheme, ready } = usePreferences();
  const isDark = scheme === 'dark';
  const palette = isDark ? Colors.dark : Colors.light;

  // 导航层也用 App 的纸色，别用 React Navigation 默认的白底：
  // 安卓返回时退场动画会露出这一层，默认白底就会闪白。
  const navigationTheme = useMemo(() => {
    const base = isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: palette.accent,
        background: palette.background,
        card: palette.background,
        text: palette.text,
        border: palette.border,
      },
    };
  }, [isDark, palette]);

  useEffect(() => {
    // 安卓窗口（decorView）的底色也跟上，避免动画间隙露出系统白底
    SystemUI.setBackgroundColorAsync(palette.background).catch(() => {});
  }, [palette.background]);

  // 偏好读完（主题已按用户选择定下来）再收启动图，避免闪一下错误的配色
  useEffect(() => {
    if (!ready) return;
    SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  // 兜底：读盘异常但 promise 一直不 resolve 时也要能进 App
  useEffect(() => {
    const timer = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <ThemeProvider value={navigationTheme}>
      {/* 手动切主题时系统不一定跟着变：状态栏文字得自己定，深底用浅字 */}
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: palette.background },
        }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </ThemeProvider>
  );
}
