/**
 * 设置偏好：只放「界面怎么长」的选择，不碰钱。
 * 和收支分开存（ml_settings_v1 / ml_plan_v2），清收支不会误伤偏好。
 */

/** 主题：跟随系统 / 固定浅色 / 固定深色 */
export type ThemePreference = 'system' | 'light' | 'dark';

/** 换算页默认用列表还是宫格 */
export type ConvertView = 'list' | 'grid';

export type Preferences = {
  theme: ThemePreference;
  convertView: ConvertView;
};

export const DEFAULT_PREFERENCES: Preferences = {
  theme: 'system',
  convertView: 'list',
};

/** 三段选择器上的字：系统 / 浅色 / 深色 */
export const THEME_OPTIONS: readonly { value: ThemePreference; label: string; accessibilityLabel: string }[] = [
  { value: 'system', label: '系统', accessibilityLabel: '跟随系统配色' },
  { value: 'light', label: '浅色', accessibilityLabel: '固定浅色' },
  { value: 'dark', label: '深色', accessibilityLabel: '固定深色' },
];

/** 两段选择器上的字：列表 / 宫格 */
export const CONVERT_VIEW_OPTIONS: readonly { value: ConvertView; label: string; accessibilityLabel: string }[] = [
  { value: 'list', label: '列表', accessibilityLabel: '换算页默认列表' },
  { value: 'grid', label: '宫格', accessibilityLabel: '换算页默认宫格' },
];

const THEMES: readonly ThemePreference[] = ['system', 'light', 'dark'];
const VIEWS: readonly ConvertView[] = ['list', 'grid'];

export function isThemePreference(value: unknown): value is ThemePreference {
  return typeof value === 'string' && (THEMES as readonly string[]).includes(value);
}

export function isConvertView(value: unknown): value is ConvertView {
  return typeof value === 'string' && (VIEWS as readonly string[]).includes(value);
}

/**
 * 读盘后的宽容校验：坏字段各自退回默认，不整份作废。
 * 和收支的 parseMoneyPlan 同一套态度：能救就救，不拦着用。
 */
export function parsePreferences(value: unknown): Preferences {
  if (typeof value !== 'object' || value === null) return DEFAULT_PREFERENCES;

  const raw = value as Record<string, unknown>;
  return {
    theme: isThemePreference(raw.theme) ? raw.theme : DEFAULT_PREFERENCES.theme,
    convertView: isConvertView(raw.convertView) ? raw.convertView : DEFAULT_PREFERENCES.convertView,
  };
}

export type ResolvedScheme = 'light' | 'dark';

/**
 * 偏好的主题 + 系统配色 → 实际用哪套色。
 * 系统值可能是 null（读不到），一律按浅色处理，和 use-color-scheme 的兜底一致。
 */
export function resolveScheme(
  theme: ThemePreference,
  systemScheme: string | null | undefined,
): ResolvedScheme {
  if (theme === 'light' || theme === 'dark') return theme;
  return systemScheme === 'dark' ? 'dark' : 'light';
}
