import { describe, expect, it } from 'vitest';

import { parsePositiveNumber, sanitizeNumberInput } from './number-input';

describe('sanitizeNumberInput', () => {
  it('只留数字和一个小数点', () => {
    expect(sanitizeNumberInput('12a3', { intDigits: 5, decimals: 2 })).toBe('123');
    expect(sanitizeNumberInput('1.2.3', { intDigits: 5, decimals: 2 })).toBe('1.23');
  });

  it('按配置限制整数位和小数位', () => {
    expect(sanitizeNumberInput('1234567', { intDigits: 3, decimals: 2 })).toBe('123');
    expect(sanitizeNumberInput('9.999', { intDigits: 5, decimals: 1 })).toBe('9.9');
  });

  it('小数位为 0 时丢掉小数部分，而不是拼成整数', () => {
    expect(sanitizeNumberInput('80.5', { intDigits: 6, decimals: 0 })).toBe('80');
    expect(sanitizeNumberInput('80.5.6', { intDigits: 6, decimals: 0 })).toBe('80');
  });

  it('以点开头补 0，去掉多余前导零', () => {
    expect(sanitizeNumberInput('.5', { intDigits: 5, decimals: 2 })).toBe('0.5');
    expect(sanitizeNumberInput('007', { intDigits: 5, decimals: 2 })).toBe('7');
  });

  it('空输入保持为空', () => {
    expect(sanitizeNumberInput('', { intDigits: 5, decimals: 2 })).toBe('');
    expect(sanitizeNumberInput('.', { intDigits: 5, decimals: 2 })).toBe('0.');
  });
});

describe('parsePositiveNumber', () => {
  it('正常解析并截断上限', () => {
    expect(parsePositiveNumber('12.5', 100)).toBe(12.5);
    expect(parsePositiveNumber('200', 100)).toBe(100);
  });

  it('非法或非正数归零', () => {
    expect(parsePositiveNumber('', 100)).toBe(0);
    expect(parsePositiveNumber('abc', 100)).toBe(0);
    expect(parsePositiveNumber('-5', 100)).toBe(0);
    expect(parsePositiveNumber('0', 100)).toBe(0);
  });
});
