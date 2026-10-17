/**
 * 主题取色：偏好（跟随系统 / 浅色 / 深色）解析后的那一套。
 * 调用方式和以前一样，组件不用改。
 */

import { Colors } from '@/constants/theme';
import { usePreferences } from '@/hooks/use-preferences';

export function useTheme() {
  const { scheme } = usePreferences();

  return Colors[scheme];
}
