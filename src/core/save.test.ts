import { describe, expect, it } from 'vitest';

import {
  estimateSave,
  formatCompactAmount,
  formatSaveDuration,
  parseMoney,
  sanitizeMoneyInput,
  targetDate,
} from './save';

const SAVE = 2000; // 每月能攒 ¥2,000
const NOW = new Date(2026, 9, 17); // 2026-10-17

describe('estimateSave', () => {
  it('假期照常进账：按月连续攒', () => {
    const result = estimateSave(599, SAVE, true);
    expect(result).not.toBeNull();
    expect(result!.mode).toBe('calendar');
    expect(result!.months).toBeCloseTo(0.2995, 3);
    expect(result!.calendarDays).toBeCloseTo(9.11, 1);
    expect(result!.workdays).toBe(7);
  });

  it('假期不赚钱：按工作日攒，再顺延到日历', () => {
    const result = estimateSave(599, SAVE, false);
    expect(result).not.toBeNull();
    expect(result!.mode).toBe('workdays');
    expect(result!.workdays).toBe(7);
    expect(result!.calendarDays).toBeCloseTo(9.8, 1);
  });

  it('金额无效返回 null', () => {
    expect(estimateSave(0, SAVE, true)).toBeNull();
    expect(estimateSave(-1, SAVE, true)).toBeNull();
    expect(estimateSave(Number.NaN, SAVE, true)).toBeNull();
  });

  it('攒不下钱返回 null', () => {
    expect(estimateSave(599, 0, true)).toBeNull();
    expect(estimateSave(599, -100, true)).toBeNull();
  });

  it('假期不赚钱时日历时间更长', () => {
    const earned = estimateSave(6000, SAVE, true)!;
    const worked = estimateSave(6000, SAVE, false)!;
    expect(worked.calendarDays).toBeGreaterThan(earned.calendarDays);
    expect(worked.workdays).toBeGreaterThan(earned.workdays);
  });
});

describe('formatSaveDuration', () => {
  it('无效返回 null', () => {
    expect(formatSaveDuration(0)).toBeNull();
    expect(formatSaveDuration(-1)).toBeNull();
    expect(formatSaveDuration(Number.NaN)).toBeNull();
  });

  it('不足一小时显示分钟，格子里算 1 格淡色', () => {
    expect(formatSaveDuration(0.02)).toEqual({
      headline: '29 分',
      parts: [{ unit: 'hour', count: 0, partial: true }],
      capped: false,
    });
    // 再小也给 1 分，不出现 0 分
    expect(formatSaveDuration(0.00001)?.headline).toBe('1 分');
  });

  it('不足一天显示时 + 分', () => {
    expect(formatSaveDuration(0.5)).toEqual({
      headline: '12 小时',
      parts: [{ unit: 'hour', count: 12, partial: false }],
      capped: false,
    });
    expect(formatSaveDuration(0.45)).toEqual({
      headline: '10 小时 48 分',
      parts: [{ unit: 'hour', count: 10, partial: true }],
      capped: false,
    });
  });

  it('一周以内显示天 + 时', () => {
    expect(formatSaveDuration(6.2)).toEqual({
      headline: '6 天 4 小时',
      parts: [
        { unit: 'day', count: 6 },
        { unit: 'hour', count: 4, partial: true },
      ],
      capped: false,
    });
    expect(formatSaveDuration(2)).toEqual({
      headline: '2 天',
      parts: [{ unit: 'day', count: 2 }],
      capped: false,
    });
  });

  it('整点时不给「时」行；不足一小时只画淡色格', () => {
    expect(formatSaveDuration(2 + 10 / 1440)).toEqual({
      headline: '2 天',
      parts: [
        { unit: 'day', count: 2 },
        { unit: 'hour', count: 0, partial: true },
      ],
      capped: false,
    });
  });

  it('一个月以内显示周 + 天 + 时', () => {
    expect(formatSaveDuration(9.11)).toEqual({
      headline: '1 周 2 天 2 小时',
      parts: [
        { unit: 'week', count: 1 },
        { unit: 'day', count: 2 },
        { unit: 'hour', count: 2, partial: true },
      ],
      capped: false,
    });
    expect(formatSaveDuration(15.2)?.headline).toBe('2 周 1 天 4 小时');
    expect(formatSaveDuration(30)).toEqual({
      headline: '4 周 2 天',
      parts: [
        { unit: 'week', count: 4 },
        { unit: 'day', count: 2 },
      ],
      capped: false,
    });
  });

  it('按分钟四舍五入，跨层时不出现 24 小时', () => {
    expect(formatSaveDuration(6.999)?.headline).toBe('6 天 23 小时');
    expect(formatSaveDuration(6.9999)?.headline).toBe('1 周');
    expect(formatSaveDuration(7)?.headline).toBe('1 周');
  });

  it('一个月以上显示月 + 天，不再往下拆', () => {
    expect(formatSaveDuration(31)?.headline).toBe('1 个月 1 天');
    expect(formatSaveDuration(91.25)?.headline).toBe('3 个月');
    expect(formatSaveDuration(92.4)?.headline).toBe('3 个月 1 天');
  });

  it('接近一年时进位成年，不出现 12 个月', () => {
    expect(formatSaveDuration(364.9)?.headline).toBe('1 年');
  });

  it('年级', () => {
    expect(formatSaveDuration(1095)?.headline).toBe('3 年');
    expect(formatSaveDuration(1200)?.headline).toBe('3 年 3 个月');
    expect(formatSaveDuration(400)?.headline).toBe('1 年 1 个月');
  });

  it('超过 100 年只给一句话', () => {
    expect(formatSaveDuration(36500)?.headline).toBe('100 年');
    expect(formatSaveDuration(36501)).toEqual({
      headline: '100 年以上',
      parts: [],
      capped: true,
    });
  });
});

describe('targetDate', () => {
  it('同年只写月日', () => {
    expect(targetDate(9.11, NOW)).toBe('10 月 26 日');
    expect(targetDate(30, NOW)).toBe('11 月 16 日');
  });

  it('跨年带年份，超过一年只到月', () => {
    expect(targetDate(120, NOW)).toBe('2027 年 2 月 14 日');
    expect(targetDate(400, NOW)).toBe('2027 年 11 月');
  });

  it('超过 100 年不显示', () => {
    expect(targetDate(36501, NOW)).toBeNull();
    expect(targetDate(0, NOW)).toBeNull();
  });
});

describe('formatCompactAmount', () => {
  it('一万以下照常', () => {
    expect(formatCompactAmount(599)).toBe('599');
    expect(formatCompactAmount(9999.99)).toBe('9999.99');
  });

  it('万 / 亿 / 万亿', () => {
    expect(formatCompactAmount(12345)).toBe('1.2万');
    expect(formatCompactAmount(1e8)).toBe('1亿');
    expect(formatCompactAmount(1.234e12)).toBe('1.2万亿');
  });

  it('无效显示 0', () => {
    expect(formatCompactAmount(Number.NaN)).toBe('0');
    expect(formatCompactAmount(-1)).toBe('0');
  });
});

describe('输入', () => {
  it('清洗金额：不卡整数位，两位小数', () => {
    expect(sanitizeMoneyInput('12.345')).toBe('12.34');
    expect(sanitizeMoneyInput('12345678901234567')).toBe('123456789012345');
    expect(sanitizeMoneyInput('')).toBe('');
  });

  it('解析金额：不再截断', () => {
    expect(parseMoney('8000')).toBe(8000);
    expect(parseMoney('')).toBe(0);
    expect(parseMoney('abc')).toBe(0);
  });
});
