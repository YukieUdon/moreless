import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import {
  DEFAULT_PREFERENCES,
  resolveScheme,
  type ConvertView,
  type Preferences,
  type ResolvedScheme,
  type ThemePreference,
} from '@/core/preferences';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { loadPreferences, savePreferences } from '@/lib/settings';

type PreferencesContextValue = {
  preferences: Preferences;
  /** 读盘完成前是 false：根布局拿它决定什么时候收启动图 */
  ready: boolean;
  /** 偏好 + 系统配色解析后的实际配色 */
  scheme: ResolvedScheme;
  setTheme: (theme: ThemePreference) => void;
  setConvertView: (view: ConvertView) => void;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

/**
 * 设置偏好（主题 / 换算页默认视图）。
 * 挂在根布局：导航主题、安卓窗口底色、所有 useTheme() 都从这一份取。
 */
export function PreferencesProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [ready, setReady] = useState(false);
  const preferencesRef = useRef<Preferences | null>(null);

  useEffect(() => {
    let alive = true;

    loadPreferences().then((stored) => {
      if (!alive) return;
      // 读盘比用户手快时，以已经点过的选择为准
      if (preferencesRef.current === null) {
        preferencesRef.current = stored;
        setPreferences(stored);
      }
      setReady(true);
    });

    return () => {
      alive = false;
    };
  }, []);

  const update = useCallback((change: (current: Preferences) => Preferences) => {
    const current = preferencesRef.current ?? DEFAULT_PREFERENCES;
    const next = change(current);
    if (next === current) return;

    preferencesRef.current = next;
    setPreferences(next);
    // 设置是一次次点出来的，不是打字，直接落盘，不用防抖
    void savePreferences(next);
  }, []);

  const setTheme = useCallback(
    (theme: ThemePreference) => {
      update((current) => (current.theme === theme ? current : { ...current, theme }));
    },
    [update],
  );

  const setConvertView = useCallback(
    (convertView: ConvertView) => {
      update((current) =>
        current.convertView === convertView ? current : { ...current, convertView },
      );
    },
    [update],
  );

  const value = useMemo<PreferencesContextValue>(() => {
    const effective = preferences ?? DEFAULT_PREFERENCES;
    return {
      preferences: effective,
      ready,
      scheme: resolveScheme(effective.theme, systemScheme),
      setTheme,
      setConvertView,
    };
  }, [preferences, ready, systemScheme, setTheme, setConvertView]);

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences(): PreferencesContextValue {
  const value = useContext(PreferencesContext);
  if (!value) {
    throw new Error('usePreferences 必须放在 PreferencesProvider 里');
  }
  return value;
}
