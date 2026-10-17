import { DAYS_PER_YEAR, roundMoney } from './save';
import type { ExpenseItem, MoneyEntry, MoneyPeriod, MoneyPlan } from './types';

/** 一年 12 个月 */
export const MONTHS_PER_YEAR = 12;
/** 支出项上限：防手改文件把界面拖垮，正常用不到 */
export const MAX_EXPENSES = 50;
/** 支出名称最多几个字 */
export const MAX_EXPENSE_NAME = 20;

/** 固定三档，顺序就是界面上从左到右的顺序 */
export const PERIODS: readonly MoneyPeriod[] = ['day', 'month', 'year'];

/** 界面上表示周期：每天 / 每月 / 每年 */
export const PERIOD_LABEL: Record<MoneyPeriod, string> = {
  day: '每天',
  month: '每月',
  year: '每年',
};

/** 三段选择器上的字：日 / 月 / 年 */
export const PERIOD_UNIT: Record<MoneyPeriod, string> = {
  day: '日',
  month: '月',
  year: '年',
};

/** 没设置收支时的空值；Provider 读盘前也用它 */
export const EMPTY_PLAN: MoneyPlan = {
  income: null,
  expenses: [],
  holidayEarns: true,
};

export function isMoneyPeriod(value: unknown): value is MoneyPeriod {
  return value === 'day' || value === 'month' || value === 'year';
}

function isValidAmount(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

/**
 * 任意周期的钱折成每月：
 *   日 × 365/12（≈30.42）、年 ÷ 12、月不变。
 * 和「攒多久」里的 1 月 = 30.42 天是同一把尺子，来回换算不漂。
 */
export function toMonthly(entry: MoneyEntry): number {
  if (!isValidAmount(entry.amount)) return 0;

  switch (entry.period) {
    case 'day':
      return (entry.amount * DAYS_PER_YEAR) / MONTHS_PER_YEAR;
    case 'year':
      return entry.amount / MONTHS_PER_YEAR;
    default:
      return entry.amount;
  }
}

/** 填了收入（且大于 0）才算设置过 */
export function hasIncome(plan: MoneyPlan): boolean {
  return plan.income !== null && plan.income.amount > 0;
}

/** 每月收入（元，两位小数） */
export function monthlyIncome(plan: MoneyPlan): number {
  return roundMoney(plan.income ? toMonthly(plan.income) : 0);
}

/** 每月支出合计（元，两位小数） */
export function monthlyExpense(plan: MoneyPlan): number {
  return roundMoney(plan.expenses.reduce((sum, item) => sum + toMonthly(item), 0));
}

/** 每月能攒；可能是负数，界面自己决定怎么措辞 */
export function monthlySave(plan: MoneyPlan): number {
  return roundMoney(monthlyIncome(plan) - monthlyExpense(plan));
}

/** 某一组支出的每月摊销合计（给组头显示用） */
export function monthlyOf(items: MoneyEntry[]): number {
  return roundMoney(items.reduce((sum, item) => sum + toMonthly(item), 0));
}

function parseEntry(value: unknown): MoneyEntry | null {
  if (typeof value !== 'object' || value === null) return null;
  const raw = value as Record<string, unknown>;
  if (!isValidAmount(raw.amount) || !isMoneyPeriod(raw.period)) return null;
  return { amount: raw.amount, period: raw.period };
}

function parseExpense(value: unknown, index: number): ExpenseItem | null {
  const entry = parseEntry(value);
  if (!entry) return null;

  const raw = value as Record<string, unknown>;
  const id = typeof raw.id === 'string' && raw.id.trim() !== '' ? raw.id : `ml_exp_${index}`;
  const name = typeof raw.name === 'string' ? raw.name.trim().slice(0, MAX_EXPENSE_NAME) : '';

  return { ...entry, id, name };
}

/**
 * 读盘后的宽容校验：坏字段能修就修，修不了就丢那一项，不整份作废。
 * 只有连对象都不是时才返回 null。
 */
export function parseMoneyPlan(value: unknown): MoneyPlan | null {
  if (typeof value !== 'object' || value === null) return null;

  const raw = value as Record<string, unknown>;
  const income = raw.income == null ? null : parseEntry(raw.income);
  const expenses = Array.isArray(raw.expenses)
    ? raw.expenses
        .map(parseExpense)
        .filter((item): item is ExpenseItem => item !== null)
        .slice(0, MAX_EXPENSES)
    : [];
  const holidayEarns = typeof raw.holidayEarns === 'boolean' ? raw.holidayEarns : true;

  return { income, expenses, holidayEarns };
}

/** 旧版（ml_plan_v1）的收支 */
export type LegacyMoneyPlan = {
  income: number;
  monthlyFixed: number;
  annualFixed: number;
  holidayEarns: boolean;
};

/**
 * v1 → v2：
 *   月收入 → 一项按月收入
 *   月固定 → 支出「每月固定」，为 0 不建
 *   年固定 → 支出「每年固定」，为 0 不建
 * 旧字段不合法就返回 null，让上层当作没设置。
 */
export function migratePlanV1(value: unknown): MoneyPlan | null {
  if (typeof value !== 'object' || value === null) return null;

  const raw = value as Record<string, unknown>;
  if (
    !isValidAmount(raw.income) ||
    !isValidAmount(raw.monthlyFixed) ||
    !isValidAmount(raw.annualFixed) ||
    typeof raw.holidayEarns !== 'boolean'
  ) {
    return null;
  }

  const expenses: ExpenseItem[] = [];
  if (raw.monthlyFixed > 0) {
    expenses.push({
      id: 'ml_legacy_monthly',
      name: '每月固定',
      amount: raw.monthlyFixed,
      period: 'month',
    });
  }
  if (raw.annualFixed > 0) {
    expenses.push({
      id: 'ml_legacy_annual',
      name: '每年固定',
      amount: raw.annualFixed,
      period: 'year',
    });
  }

  return {
    income: raw.income > 0 ? { amount: raw.income, period: 'month' } : null,
    expenses,
    holidayEarns: raw.holidayEarns,
  };
}

/** 新建支出行的 id；本地用，不要求可预测 */
export function createExpenseId(now: number = Date.now()): string {
  return `ml_${now.toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}
