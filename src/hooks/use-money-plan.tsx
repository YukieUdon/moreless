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

import { EMPTY_PLAN } from '@/core/plan';
import type { MoneyPlan } from '@/core/types';
import { clearMoneyPlan, loadMoneyPlan, saveMoneyPlan } from '@/lib/settings';

/** 打字时不必每敲一下就写盘，停顿 400ms 再落盘 */
const SAVE_DELAY = 400;

type MoneyPlanContextValue = {
  /** 读盘完成前是空值（ready 为 false），界面别急着渲染表单 */
  plan: MoneyPlan;
  ready: boolean;
  /** 每次「清空收支」+1：收支页的本地草稿靠它跟着归零 */
  revision: number;
  /** 改一笔：传「当前值 → 新值」，内存立即生效，落盘防抖 */
  update: (change: (current: MoneyPlan) => MoneyPlan) => void;
  /** 清空收支（含 v1 旧 key），内存与本地一起清 */
  reset: () => Promise<void>;
};

const MoneyPlanContext = createContext<MoneyPlanContextValue | null>(null);

/**
 * 三个 tab 共用同一份收支：
 * 换算页读它算「每月能攒」，收支页写它，「我的」清空它 —— 不再靠切回页面时重新读盘，
 * 也就没有「切回来还是旧值」和那一下闪动。
 */
export function MoneyPlanProvider({ children }: { children: ReactNode }) {
  const [plan, setPlan] = useState<MoneyPlan | null>(null);
  const [revision, setRevision] = useState(0);
  const planRef = useRef<MoneyPlan | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<MoneyPlan | null>(null);

  const flush = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const pending = pendingRef.current;
    pendingRef.current = null;
    if (pending) void saveMoneyPlan(pending);
  }, []);

  useEffect(() => {
    let alive = true;

    loadMoneyPlan().then((stored) => {
      if (!alive) return;
      const next = stored ?? EMPTY_PLAN;
      planRef.current = next;
      setPlan(next);
    });

    return () => {
      alive = false;
      // 卸载前把防抖里的最后一笔写掉，别丢刚输入的收支
      flush();
    };
  }, [flush]);

  const update = useCallback((change: (current: MoneyPlan) => MoneyPlan) => {
    const next = change(planRef.current ?? EMPTY_PLAN);
    planRef.current = next;
    setPlan(next);

    pendingRef.current = next;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      const pending = pendingRef.current;
      pendingRef.current = null;
      if (pending) void saveMoneyPlan(pending);
    }, SAVE_DELAY);
  }, []);

  const reset = useCallback(async () => {
    // 先把防抖里还没落盘的那一笔丢掉，否则它会在清空之后又写回去
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    pendingRef.current = null;

    planRef.current = EMPTY_PLAN;
    setPlan(EMPTY_PLAN);
    // 收支页是常驻页面，靠它知道「本地草稿也得清」
    setRevision((value) => value + 1);

    await clearMoneyPlan();
  }, []);

  const value = useMemo<MoneyPlanContextValue>(
    () => ({ plan: plan ?? EMPTY_PLAN, ready: plan !== null, revision, update, reset }),
    [plan, revision, update, reset],
  );

  return <MoneyPlanContext.Provider value={value}>{children}</MoneyPlanContext.Provider>;
}

export function useMoneyPlan(): MoneyPlanContextValue {
  const value = useContext(MoneyPlanContext);
  if (!value) {
    throw new Error('useMoneyPlan 必须放在 MoneyPlanProvider 里');
  }
  return value;
}
