import { describe, expect, it } from 'vitest';

import {
  CONVERT_VIEW_OPTIONS,
  DEFAULT_PREFERENCES,
  isConvertView,
  isThemePreference,
  parsePreferences,
  resolveScheme,
  THEME_OPTIONS,
} from './preferences';

describe('parsePreferences', () => {
  it('不是对象时用默认值', () => {
    expect(parsePreferences(null)).toEqual(DEFAULT_PREFERENCES);
    expect(parsePreferences('dark')).toEqual(DEFAULT_PREFERENCES);
    expect(parsePreferences(42)).toEqual(DEFAULT_PREFERENCES);
  });

  it('缺字段时各自补默认值', () => {
    expect(parsePreferences({})).toEqual(DEFAULT_PREFERENCES);
    expect(parsePreferences({ theme: 'dark' })).toEqual({
      theme: 'dark',
      convertView: 'list',
    });
    expect(parsePreferences({ convertView: 'grid' })).toEqual({
      theme: 'system',
      convertView: 'grid',
    });
  });

  it('坏字段只丢那一项，不整份作废', () => {
    expect(parsePreferences({ theme: 'blue', convertView: 'grid' })).toEqual({
      theme: 'system',
      convertView: 'grid',
    });
    expect(parsePreferences({ theme: 'light', convertView: 'table' })).toEqual({
      theme: 'light',
      convertView: 'list',
    });
  });

  it('多余字段忽略', () => {
    expect(parsePreferences({ theme: 'dark', convertView: 'grid', nope: true })).toEqual({
      theme: 'dark',
      convertView: 'grid',
    });
  });
});

describe('isThemePreference / isConvertView', () => {
  it('只认这三种主题、两种视图', () => {
    expect(isThemePreference('system')).toBe(true);
    expect(isThemePreference('light')).toBe(true);
    expect(isThemePreference('dark')).toBe(true);
    expect(isThemePreference('auto')).toBe(false);
    expect(isThemePreference(null)).toBe(false);

    expect(isConvertView('list')).toBe(true);
    expect(isConvertView('grid')).toBe(true);
    expect(isConvertView('card')).toBe(false);
  });
});

describe('resolveScheme', () => {
  it('固定浅色 / 深色时不看系统', () => {
    expect(resolveScheme('light', 'dark')).toBe('light');
    expect(resolveScheme('dark', 'light')).toBe('dark');
  });

  it('跟随系统时按系统的值走', () => {
    expect(resolveScheme('system', 'dark')).toBe('dark');
    expect(resolveScheme('system', 'light')).toBe('light');
  });

  it('系统值读不到时按浅色兜底', () => {
    expect(resolveScheme('system', null)).toBe('light');
    expect(resolveScheme('system', undefined)).toBe('light');
  });
});

describe('选项表', () => {
  it('主题三段、视图两段，值不重复', () => {
    expect(THEME_OPTIONS.map((option) => option.value)).toEqual(['system', 'light', 'dark']);
    expect(CONVERT_VIEW_OPTIONS.map((option) => option.value)).toEqual(['list', 'grid']);
  });
});
