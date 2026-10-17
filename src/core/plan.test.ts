import { describe, expect, it } from 'vitest';

import {
  EMPTY_PLAN,
  hasIncome,
  MAX_EXPENSES,
  migratePlanV1,
  monthlyExpense,
  monthlyIncome,
  monthlyOf,
  monthlySave,
  parseMoneyPlan,
  PERIODS,
  toMonthly,
} from './plan';
import { estimateSave, formatSaveDuration } from './save';
import type { MoneyPlan } from './types';

const plan: MoneyPlan = {
  income: { amount: 8000, period: 'month' },
  expenses: [
    { id: 'rent', name: '房租', amount: 3000, period: 'month' },
    { id: 'food', name: '吃饭', amount: 2000, period: 'month' },
    { id: 'travel', name: '旅行', amount: 6000, period: 'year' },
    { id: 'commute', name: '通勤', amount: 10, period: 'day' },
  ],
  holidayEarns: true,
};

describe('toMonthly', () => {
  it('月不变', () => {
    expect(toMonthly({ amount: 123.45, period: 'month' })).toBe(123.45);
  });

  it('年 ÷ 12', () => {
    expect(toMonthly({ amount: 6000, period: 'year' })).toBe(500);
  });

  it('日 × 365/12', () => {
    expect(toMonthly({ amount: 10, period: 'day' })).toBeCloseTo(304.1667, 3);
    expect(toMonthly({ amount: 30, period: 'day' })).toBeCloseTo(912.5, 3);
  });

  it('坏金额按 0 处理', () => {
    expect(toMonthly({ amount: Number.NaN, period: 'day' })).toBe(0);
    expect(toMonthly({ amount: -1, period: 'month' })).toBe(0);
  });
});

describe('合计', () => {
  it('三项周期一起折成月', () => {
    expect(monthlyExpense(plan)).toBe(5804.17);
    expect(monthlyIncome(plan)).toBe(8000);
    expect(monthlySave(plan)).toBe(2195.83);
  });

  it('没有年固定时只减月固定', () => {
    const simple: MoneyPlan = {
      income: { amount: 8000, period: 'month' },
      expenses: [{ id: 'rent', name: '房租', amount: 5500, period: 'month' }],
      holidayEarns: true,
    };
    expect(monthlySave(simple)).toBe(2500);
  });

  it('支出超过收入为负', () => {
    const over: MoneyPlan = {
      income: { amount: 1000, period: 'month' },
      expenses: [{ id: 'rent', name: '房租', amount: 3000, period: 'month' }],
      holidayEarns: true,
    };
    expect(monthlySave(over)).toBe(-2000);
  });

  it('没填收入时收入为 0，结余是负的支出', () => {
    expect(monthlyIncome(EMPTY_PLAN)).toBe(0);
    expect(monthlySave(EMPTY_PLAN)).toBe(0);
    const noIncome: MoneyPlan = { ...plan, income: null };
    expect(monthlySave(noIncome)).toBe(-5804.17);
  });

  it('收入按日时折成月', () => {
    const daily: MoneyPlan = { ...EMPTY_PLAN, income: { amount: 200, period: 'day' } };
    expect(monthlyIncome(daily)).toBe(6083.33);
  });

  it('月度合计按组算', () => {
    expect(monthlyOf([{ amount: 10, period: 'day' }, { amount: 20, period: 'day' }])).toBe(912.5);
  });

  it('hasIncome：null / 0 / 正数', () => {
    expect(hasIncome(EMPTY_PLAN)).toBe(false);
    expect(hasIncome({ ...EMPTY_PLAN, income: { amount: 0, period: 'month' } })).toBe(false);
    expect(hasIncome(plan)).toBe(true);
  });
});

describe('日口径与攒多久能对上', () => {
  it('日收入 200、日支出 100：200 元约等于 2 天', () => {
    const daily: MoneyPlan = {
      income: { amount: 200, period: 'day' },
      expenses: [{ id: 'x', name: '日支出', amount: 100, period: 'day' }],
      holidayEarns: true,
    };
    const result = estimateSave(200, monthlySave(daily), true)!;
    expect(result.calendarDays).toBeCloseTo(2, 1);
    expect(formatSaveDuration(result.calendarDays)?.headline).toBe('2 天');
  });
});

describe('parseMoneyPlan', () => {
  it('正常数据原样读回', () => {
    const parsed = parseMoneyPlan(plan)!;
    expect(parsed.income).toEqual({ amount: 8000, period: 'month' });
    expect(parsed.expenses).toHaveLength(4);
    expect(parsed.holidayEarns).toBe(true);
  });

  it('坏项丢掉，不整份作废', () => {
    const parsed = parseMoneyPlan({
      income: { amount: 8000, period: 'month' },
      expenses: [
        { id: 'a', name: '房租', amount: 3000, period: 'month' },
        { id: 'b', name: ' 旅行 ', amount: 6000, period: 'year' },
        { id: 'c', name: '坏金额', amount: -1, period: 'month' },
        { id: 'd', name: '坏周期', amount: 10, period: 'week' },
        { name: '没 id', amount: 10, period: 'day' },
      ],
      holidayEarns: false,
    })!;
    expect(parsed.expenses).toHaveLength(3);
    expect(parsed.expenses[1].name).toBe('旅行');
    expect(parsed.expenses[2].id).toBe('ml_exp_4');
    expect(parsed.holidayEarns).toBe(false);
  });

  it('缺字段用安全默认值', () => {
    const parsed = parseMoneyPlan({})!;
    expect(parsed.income).toBeNull();
    expect(parsed.expenses).toEqual([]);
    expect(parsed.holidayEarns).toBe(true);
  });

  it('收入的周期不合法当没填', () => {
    expect(parseMoneyPlan({ income: { amount: 100, period: 'week' } })!.income).toBeNull();
    expect(parseMoneyPlan({ income: { amount: -100, period: 'month' } })!.income).toBeNull();
  });

  it('非对象返回 null', () => {
    expect(parseMoneyPlan(null)).toBeNull();
    expect(parseMoneyPlan('8000')).toBeNull();
    expect(parseMoneyPlan(undefined)).toBeNull();
  });

  it('最多保留 50 项', () => {
    const many = Array.from({ length: 60 }, (_, index) => ({
      id: `e${index}`,
      name: '',
      amount: 1,
      period: 'month',
    }));
    expect(parseMoneyPlan({ expenses: many })!.expenses).toHaveLength(MAX_EXPENSES);
  });

  it('名称去空格并截到 20 字', () => {
    const parsed = parseMoneyPlan({
      expenses: [{ id: 'a', name: ` ${'一'.repeat(30)} `, amount: 1, period: 'month' }],
    })!;
    expect(parsed.expenses[0].name).toHaveLength(20);
  });
});

describe('migratePlanV1', () => {
  it('月收入 + 月固定 + 年固定 → 三项', () => {
    const migrated = migratePlanV1({
      income: 8000,
      monthlyFixed: 5500,
      annualFixed: 6000,
      holidayEarns: true,
    })!;
    expect(migrated.income).toEqual({ amount: 8000, period: 'month' });
    expect(migrated.expenses).toEqual([
      { id: 'ml_legacy_monthly', name: '每月固定', amount: 5500, period: 'month' },
      { id: 'ml_legacy_annual', name: '每年固定', amount: 6000, period: 'year' },
    ]);
    expect(monthlySave(migrated)).toBe(2000);
  });

  it('为 0 的固定开销不建项，收入 0 当没填', () => {
    const migrated = migratePlanV1({
      income: 0,
      monthlyFixed: 0,
      annualFixed: 0,
      holidayEarns: false,
    })!;
    expect(migrated.income).toBeNull();
    expect(migrated.expenses).toEqual([]);
    expect(migrated.holidayEarns).toBe(false);
  });

  it('旧数据不合法返回 null', () => {
    expect(migratePlanV1({ income: '8000' })).toBeNull();
    expect(migratePlanV1({ income: 8000, monthlyFixed: 0, annualFixed: 0 })).toBeNull();
    expect(migratePlanV1(null)).toBeNull();
  });
});

describe('PERIODS', () => {
  it('三档顺序固定：日 / 月 / 年', () => {
    expect(PERIODS).toEqual(['day', 'month', 'year']);
  });
});
