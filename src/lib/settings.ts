import AsyncStorage from '@react-native-async-storage/async-storage';

import { migratePlanV1, parseMoneyPlan } from '@/core/plan';
import { DEFAULT_PREFERENCES, parsePreferences, type Preferences } from '@/core/preferences';
import type { MoneyPlan } from '@/core/types';

const PLAN_KEY = 'ml_plan_v2';
const LEGACY_PLAN_KEY = 'ml_plan_v1';
const PREFERENCES_KEY = 'ml_settings_v1';

/**
 * 读收支：
 * - 有 v2 就只认 v2（坏了也不回滚到 v1，避免把用户改过的数据盖掉）；
 * - 没有 v2 才尝试把 v1 迁过去，迁完顺手写一份 v2，旧 key 留着不删。
 */
export async function loadMoneyPlan(): Promise<MoneyPlan | null> {
  try {
    const raw = await AsyncStorage.getItem(PLAN_KEY);
    if (raw !== null) {
      try {
        return parseMoneyPlan(JSON.parse(raw));
      } catch {
        return null;
      }
    }

    const legacyRaw = await AsyncStorage.getItem(LEGACY_PLAN_KEY);
    if (!legacyRaw) return null;

    let legacy: unknown;
    try {
      legacy = JSON.parse(legacyRaw);
    } catch {
      return null;
    }

    const migrated = migratePlanV1(legacy);
    if (!migrated) return null;

    await saveMoneyPlan(migrated);
    return migrated;
  } catch {
    // 读不出来就当没设过，不打断界面
    return null;
  }
}

export async function saveMoneyPlan(plan: MoneyPlan): Promise<void> {
  try {
    await AsyncStorage.setItem(PLAN_KEY, JSON.stringify(plan));
  } catch {
    // 存不下也不拦着用：这一次的值还在内存里
  }
}

/**
 * 「清空收支」：v2 和 v1 一起删。
 * 只删 v2 的话，下次读盘会认为「没有 v2」，又把 v1 迁回来。
 */
export async function clearMoneyPlan(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([PLAN_KEY, LEGACY_PLAN_KEY]);
  } catch {
    // 删不掉也不拦着用：内存里已经清空
  }
}

/** 读设置偏好；坏数据退回默认值，不打断界面 */
export async function loadPreferences(): Promise<Preferences> {
  try {
    const raw = await AsyncStorage.getItem(PREFERENCES_KEY);
    if (raw === null) return DEFAULT_PREFERENCES;
    return parsePreferences(JSON.parse(raw));
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export async function savePreferences(preferences: Preferences): Promise<void> {
  try {
    await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
  } catch {
    // 存不下也不拦着用：这一次的选择还在内存里
  }
}
