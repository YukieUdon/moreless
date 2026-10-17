/**
 * 配色：纸感暖白 + 墨绿。
 * 改这里的 token，全 App 跟着变；不要在组件里写死颜色。
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#1F1E1A',
    background: '#FAF8F2',
    backgroundElement: '#F0EDE4',
    backgroundSelected: '#E4DFD2',
    textSecondary: '#6B665C',
    accent: '#3E5C4B',
    border: '#E3DED2',
    // 工时格子：单位越大，颜色越沉
    cellHour: '#3E5C4B',
    // 不足一小时的零头：比「时」淡一档
    cellHourPartial: '#9BAD9E',
    cellDay: '#4C7383',
    cellWeek: '#9C7A45',
    cellMonth: '#75668F',
    cellYear: '#8A5F52',
  },
  dark: {
    text: '#F3F0E7',
    background: '#14140F',
    backgroundElement: '#1F1F18',
    backgroundSelected: '#2A2A21',
    textSecondary: '#A5A093',
    accent: '#8FB49C',
    border: '#2A2A21',
    cellHour: '#8FB49C',
    cellHourPartial: '#627867',
    cellDay: '#8FB6C7',
    cellWeek: '#CFAC74',
    cellMonth: '#AE9FC8',
    cellYear: '#C79C8F',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const MaxContentWidth = 800;
