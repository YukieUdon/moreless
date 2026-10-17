import { describe, expect, it } from 'vitest';

import type { Item } from './types';
import {
  convert,
  convertAll,
  formatAmount,
  parseAmount,
  sanitizeAmountInput,
  sortEntries,
} from './worth';

const milk: Item = {
  id: 'milk',
  name: '牛奶',
  brand: '伊利',
  model: '纯牛奶 250ml × 24 盒',
  icon: 'cow',
  tint: '#EAF3FF',
  price: 60,
  unit: '箱',
  sub: { name: '盒', perUnit: 24 },
};

const pork: Item = {
  id: 'pork',
  name: '猪肉',
  brand: '冷鲜',
  model: '猪前腿肉',
  icon: 'food-steak',
  tint: '#FFEDEA',
  price: 16,
  unit: '斤',
};

describe('convert', () => {
  it('整箱时给整数', () => {
    expect(convert(300, milk)).toEqual({ value: 5, unit: '箱', belowOne: false });
  });

  it('不足一箱时换小单位，且不出现小数', () => {
    expect(convert(30, milk)).toEqual({ value: 12, unit: '盒', belowOne: false });
  });

  it('略低于一箱时换小单位', () => {
    // 59 / 60 = 0.983 箱 → 23.6 盒 → 23 盒
    expect(convert(59, milk)).toEqual({ value: 23, unit: '盒', belowOne: false });
  });

  it('连一个小单位都买不到', () => {
    expect(convert(1, milk)).toEqual({ value: 0, unit: '盒', belowOne: true });
  });

  it('没有小单位时退回主单位', () => {
    expect(convert(31, pork)).toEqual({ value: 1, unit: '斤', belowOne: false });
    expect(convert(5, pork)).toEqual({ value: 0, unit: '斤', belowOne: true });
  });

  it('金额无效返回 null', () => {
    expect(convert(0, milk)).toBeNull();
    expect(convert(-10, milk)).toBeNull();
    expect(convert(Number.NaN, milk)).toBeNull();
    expect(convert(Number.POSITIVE_INFINITY, milk)).toBeNull();
  });

  it('价格非法返回 null', () => {
    expect(convert(100, { ...milk, price: 0 })).toBeNull();
  });

  it('任何金额都不会返回小数', () => {
    for (const amount of [1, 7, 33, 99, 101, 299.9, 1234.56, 99999.99]) {
      const r = convert(amount, milk);
      expect(r).not.toBeNull();
      expect(Number.isInteger(r!.value)).toBe(true);
    }
  });
});

describe('convertAll', () => {
  it('金额无效时返回空数组', () => {
    expect(convertAll(0, [milk, pork])).toHaveLength(0);
  });

  it('逐项换算，顺序与输入一致', () => {
    const rows = convertAll(300, [milk, pork]);
    expect(rows.map((r) => r.item.id)).toEqual(['milk', 'pork']);
    expect(rows.map((r) => r.result.value)).toEqual([5, 18]);
  });
});

describe('sortEntries', () => {
  const rows = convertAll(300, [milk, pork]);

  it('默认保持不变', () => {
    expect(sortEntries(rows, 'default').map((r) => r.item.id)).toEqual(['milk', 'pork']);
  });

  it('价格从低到高', () => {
    expect(sortEntries(rows, 'price-asc').map((r) => r.item.id)).toEqual(['pork', 'milk']);
  });

  it('价格从高到低', () => {
    expect(sortEntries(rows, 'price-desc').map((r) => r.item.id)).toEqual(['milk', 'pork']);
  });

  it('不改动传入数组', () => {
    const ids = rows.map((r) => r.item.id);
    sortEntries(rows, 'price-asc');
    expect(rows.map((r) => r.item.id)).toEqual(ids);
  });

  it('同价时保持原顺序', () => {
    const same = convertAll(300, [
      { ...pork, id: 'a', price: 20 },
      { ...milk, id: 'b', price: 20 },
    ]);
    expect(sortEntries(same, 'price-desc').map((r) => r.item.id)).toEqual(['a', 'b']);
  });
});

describe('sanitizeAmountInput', () => {
  it('保留数字与一个小数点', () => {
    expect(sanitizeAmountInput('12a3')).toBe('123');
    expect(sanitizeAmountInput('1.2.3')).toBe('1.23');
  });

  it('小数最多两位', () => {
    expect(sanitizeAmountInput('9.999')).toBe('9.99');
  });

  it('整数部分最多五位', () => {
    expect(sanitizeAmountInput('1234567')).toBe('12345');
  });

  it('以点开头补 0', () => {
    expect(sanitizeAmountInput('.5')).toBe('0.5');
  });

  it('去掉多余前导零', () => {
    expect(sanitizeAmountInput('007')).toBe('7');
  });

  it('空输入保持为空', () => {
    expect(sanitizeAmountInput('')).toBe('');
  });
});

describe('parseAmount', () => {
  it('正常解析', () => {
    expect(parseAmount('300')).toBe(300);
    expect(parseAmount('12.5')).toBe(12.5);
  });

  it('非法或非正数归零', () => {
    expect(parseAmount('')).toBe(0);
    expect(parseAmount('abc')).toBe(0);
    expect(parseAmount('-5')).toBe(0);
  });

  it('超上限截断', () => {
    expect(parseAmount('999999')).toBe(99999.99);
  });
});

describe('formatAmount', () => {
  it('去掉无意义的 0', () => {
    expect(formatAmount(60)).toBe('60');
    expect(formatAmount(2.5)).toBe('2.5');
    expect(formatAmount(1.05)).toBe('1.05');
    expect(formatAmount(0)).toBe('0');
  });
});
