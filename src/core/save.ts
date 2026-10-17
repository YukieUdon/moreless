import { parsePositiveNumber, sanitizeNumberInput } from './number-input';
import { formatAmount } from './worth';

/** 一年按 365 天算；假期只认周末，不算法定节假日 */
export const DAYS_PER_YEAR = 365;
/** 1 个月 = 365 ÷ 12 ≈ 30.42 天 */
export const DAYS_PER_MONTH = DAYS_PER_YEAR / 12;
/** 一周只上 5 天班 → 一年约 260.7 个工作日 */
export const WORKDAYS_PER_YEAR = (DAYS_PER_YEAR * 5) / 7;
/** 每月工作日 ≈ 21.73 */
export const WORKDAYS_PER_MONTH = WORKDAYS_PER_YEAR / 12;
/** 超过 100 年就不给具体数字了 */
export const MAX_YEARS = 100;

/** 金额输入：不设上限，只限位数 */
export const MONEY_INPUT = { intDigits: 15, decimals: 2 } as const;
const NO_MAX = Number.MAX_SAFE_INTEGER;

/** 时长分解到分钟：一格 = 1 小时，一天 1440 分、一周 10080 分 */
const MINUTES_PER_HOUR = 60;
const MINUTES_PER_DAY = MINUTES_PER_HOUR * 24;
const MINUTES_PER_WEEK = MINUTES_PER_DAY * 7;
/** 1 月 = 365/12 天 = 43800 分，正好是整数，换回天不漂 */
const MINUTES_PER_MONTH = (DAYS_PER_YEAR * MINUTES_PER_DAY) / 12;
const MINUTES_PER_YEAR = DAYS_PER_YEAR * MINUTES_PER_DAY;

export type DurationUnit = 'year' | 'month' | 'week' | 'day' | 'hour';

export type DurationPart = {
  unit: DurationUnit;
  count: number;
  /**
   * 只用在「时」这一行：末尾还有不足 1 小时的零头。
   * 分不进大数字（不足一小时除外）、也不单独成行，格子里在行尾补一个淡色格。
   */
  partial?: boolean;
};

export type SaveDuration = {
  /** 大数字，如「1 周 2 天」 */
  headline: string;
  /** 与 headline 完全对应的分层，给格子图用 */
  parts: DurationPart[];
  /** 超过 100 年，没有具体数字 */
  capped: boolean;
};

export type SaveEstimate = {
  /** 日历天数（含周末） */
  calendarDays: number;
  /** 实际要付出的工作日数 */
  workdays: number;
  /** 日历月数（连续攒钱口径） */
  months: number;
  mode: 'calendar' | 'workdays';
};

/**
 * 攒够这笔钱要多久。
 * - 假期照常进账：按月连续攒。
 * - 假期不赚钱：先算需要几个工作日，再按 7/5 顺延到日历。
 *
 * @param price 要攒的金额
 * @param save  每月能攒（来自 core/plan.ts 的 monthlySave）
 * @param holidayEarns 周末是否也攒钱
 */
export function estimateSave(
  price: number,
  save: number,
  holidayEarns: boolean,
): SaveEstimate | null {
  if (!Number.isFinite(price) || price <= 0) return null;
  if (!Number.isFinite(save) || save <= 0) return null;

  if (holidayEarns) {
    const months = price / save;
    return {
      calendarDays: months * DAYS_PER_MONTH,
      workdays: Math.max(1, Math.round(months * WORKDAYS_PER_MONTH)),
      months,
      mode: 'calendar',
    };
  }

  const perWorkday = save / WORKDAYS_PER_MONTH;
  const workdays = Math.max(1, Math.ceil(price / perWorkday));
  const calendarDays = (workdays * DAYS_PER_YEAR) / WORKDAYS_PER_YEAR;
  return { calendarDays, workdays, months: calendarDays / DAYS_PER_MONTH, mode: 'workdays' };
}

function yearParts(years: number, restMonths: number): SaveDuration {
  return {
    headline: restMonths === 0 ? `${years} 年` : `${years} 年 ${restMonths} 个月`,
    parts:
      restMonths === 0
        ? [{ unit: 'year', count: years }]
        : [
            { unit: 'year', count: years },
            { unit: 'month', count: restMonths },
          ],
    capped: false,
  };
}

/** 「时」这一行：小时数 + 是否有不足一小时的零头；0 小时 0 分就不给这一行 */
function fineParts(totalMinutes: number): DurationPart[] {
  const hours = Math.floor(totalMinutes / MINUTES_PER_HOUR);
  const minutes = totalMinutes % MINUTES_PER_HOUR;
  if (hours === 0 && minutes === 0) return [];
  return [{ unit: 'hour', count: hours, partial: minutes > 0 }];
}

/** 去掉为 0 的层级，连成「1 周 2 天 2 小时」 */
function joinUnits(units: readonly (readonly [number, string])[]): string {
  return units
    .filter(([count]) => count > 0)
    .map(([count, label]) => `${count} ${label}`)
    .join(' ');
}

/**
 * 日历天数 → 人话 + 格子分层。全部整数，按分钟四舍五入。
 *
 * 最多三层，最小到「时」：
 *   > 100 年 → 100 年以上
 *   ≥ 1 年   → 年 + 月
 *   ≥ 1 月   → 月 + 天
 *   ≥ 7 天   → 周 + 天 + 时
 *   ≥ 1 天   → 天 + 时
 *   < 1 天   → 时 + 分
 *   < 1 小时 → 分（格子里算 1 格，颜色比「时」淡）
 */
export function formatSaveDuration(calendarDays: number): SaveDuration | null {
  if (!Number.isFinite(calendarDays) || calendarDays <= 0) return null;

  if (calendarDays > MAX_YEARS * DAYS_PER_YEAR) {
    return { headline: '100 年以上', parts: [], capped: true };
  }

  // 先折成整分钟：0.1 天 = 2 小时 24 分，浮点换算不会抖出 1:59
  const totalMinutes = Math.max(1, Math.round(calendarDays * MINUTES_PER_DAY));

  if (totalMinutes < MINUTES_PER_DAY) {
    const hours = Math.floor(totalMinutes / MINUTES_PER_HOUR);
    const minutes = totalMinutes % MINUTES_PER_HOUR;
    return {
      headline: hours === 0 ? `${minutes} 分` : joinUnits([[hours, '小时'], [minutes, '分']]),
      parts: fineParts(totalMinutes),
      capped: false,
    };
  }

  if (totalMinutes < MINUTES_PER_WEEK) {
    const days = Math.floor(totalMinutes / MINUTES_PER_DAY);
    const rest = totalMinutes % MINUTES_PER_DAY;
    const hours = Math.floor(rest / MINUTES_PER_HOUR);
    return {
      headline: joinUnits([[days, '天'], [hours, '小时']]),
      parts: [{ unit: 'day', count: days }, ...fineParts(rest)],
      capped: false,
    };
  }

  if (totalMinutes < MINUTES_PER_MONTH) {
    const weeks = Math.floor(totalMinutes / MINUTES_PER_WEEK);
    const afterWeeks = totalMinutes % MINUTES_PER_WEEK;
    const days = Math.floor(afterWeeks / MINUTES_PER_DAY);
    const hours = Math.floor((afterWeeks % MINUTES_PER_DAY) / MINUTES_PER_HOUR);
    const dayPart: DurationPart | null = days > 0 ? { unit: 'day', count: days } : null;
    return {
      headline: joinUnits([[weeks, '周'], [days, '天'], [hours, '小时']]),
      parts: [
        { unit: 'week', count: weeks },
        ...(dayPart ? [dayPart] : []),
        ...fineParts(afterWeeks % MINUTES_PER_DAY),
      ],
      capped: false,
    };
  }

  if (totalMinutes < MINUTES_PER_YEAR) {
    let months = Math.floor(totalMinutes / MINUTES_PER_MONTH);
    let restDays = Math.round((totalMinutes - months * MINUTES_PER_MONTH) / MINUTES_PER_DAY);
    // 余数接近一整个月时进位，避免出现「11 个月 30 天」
    if (restDays >= 30) {
      months += 1;
      restDays = 0;
    }
    if (months >= 12) {
      return yearParts(1, 0);
    }
    return {
      headline: joinUnits([[months, '个月'], [restDays, '天']]),
      parts:
        restDays === 0
          ? [{ unit: 'month', count: months }]
          : [
              { unit: 'month', count: months },
              { unit: 'day', count: restDays },
            ],
      capped: false,
    };
  }

  let years = Math.floor(totalMinutes / MINUTES_PER_YEAR);
  let restMonths = Math.round((totalMinutes - years * MINUTES_PER_YEAR) / MINUTES_PER_MONTH);
  if (restMonths >= 12) {
    years += 1;
    restMonths = 0;
  }
  return yearParts(years, restMonths);
}

/**
 * 预计日期。同年写「10 月 26 日」，跨年写「2027 年 2 月 14 日」，
 * 超过一年只说到月；超过 100 年不显示。
 */
export function targetDate(calendarDays: number, now: Date = new Date()): string | null {
  if (!Number.isFinite(calendarDays) || calendarDays <= 0) return null;
  if (calendarDays > MAX_YEARS * DAYS_PER_YEAR) return null;

  const target = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  target.setDate(target.getDate() + Math.max(1, Math.round(calendarDays)));

  const year = target.getFullYear();
  const month = target.getMonth() + 1;
  const day = target.getDate();

  if (calendarDays >= DAYS_PER_YEAR) return `${year} 年 ${month} 月`;
  if (year === now.getFullYear()) return `${month} 月 ${day} 日`;
  return `${year} 年 ${month} 月 ${day} 日`;
}

function trimOneDecimal(value: number): string {
  return value.toFixed(1).replace(/\.0$/, '');
}

/** 金额的人数写法：一万以下照常，往上换成「万 / 亿 / 万亿」 */
export function formatCompactAmount(value: number): string {
  if (!Number.isFinite(value) || value < 0) return '0';
  if (value < 1e4) return formatAmount(value);
  if (value < 1e8) return `${trimOneDecimal(value / 1e4)}万`;
  if (value < 1e12) return `${trimOneDecimal(value / 1e8)}亿`;
  return `${trimOneDecimal(value / 1e12)}万亿`;
}

export function sanitizeMoneyInput(raw: string): string {
  return sanitizeNumberInput(raw, MONEY_INPUT);
}

export function parseMoney(raw: string): number {
  return parsePositiveNumber(raw, NO_MAX);
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
