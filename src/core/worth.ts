import { parsePositiveNumber, sanitizeNumberInput } from './number-input';
import type { ConvertedItem, ConvertResult, Item } from './types';

/** 金额上限：五位数加两位小数 */
export const MAX_AMOUNT = 99999.99;

/**
 * 把金额换算成某个品类的数量。
 * 规则：一律整数、向下取整；主单位不足 1 时才换小单位。
 */
export function convert(amount: number, item: Item): ConvertResult | null {
  if (!Number.isFinite(amount) || amount <= 0) return null;
  if (!Number.isFinite(item.price) || item.price <= 0) return null;

  const main = Math.floor(amount / item.price);
  if (main >= 1) {
    return { value: main, unit: item.unit, belowOne: false };
  }

  if (item.sub && item.sub.perUnit > 0) {
    // 用比例算，避免 price / perUnit 的浮点误差再乘回来
    const subQty = Math.floor((amount / item.price) * item.sub.perUnit);
    if (subQty >= 1) {
      return { value: subQty, unit: item.sub.name, belowOne: false };
    }
    return { value: 0, unit: item.sub.name, belowOne: true };
  }

  return { value: 0, unit: item.unit, belowOne: true };
}

/** 一次性换算整个清单；金额无效时返回空数组 */
export function convertAll(amount: number, items: Item[]): ConvertedItem[] {
  const rows: ConvertedItem[] = [];
  for (const item of items) {
    const result = convert(amount, item);
    if (result) rows.push({ item, result });
  }
  return rows;
}

/** 排序方式：清单原序 / 单价升序 / 单价降序 */
export type SortMode = 'default' | 'price-asc' | 'price-desc';

export type SortOption = {
  id: SortMode;
  label: string;
};

export const SORT_OPTIONS: readonly SortOption[] = [
  { id: 'default', label: '清单顺序' },
  { id: 'price-asc', label: '价格从低到高' },
  { id: 'price-desc', label: '价格从高到低' },
];

/** 按单价排序；不改动传入数组，同价时保持原顺序 */
export function sortEntries(entries: ConvertedItem[], mode: SortMode): ConvertedItem[] {
  if (mode === 'default') return entries;
  const direction = mode === 'price-asc' ? 1 : -1;
  return [...entries].sort((a, b) => (a.item.price - b.item.price) * direction);
}

/**
 * 清洗金额输入：只留数字和一个小数点，最多两位小数、整数部分最多五位。
 * 返回的是"可以继续输入的字符串"，不是数字。
 */
export function sanitizeAmountInput(raw: string): string {
  return sanitizeNumberInput(raw, { intDigits: 5, decimals: 2 });
}

/** 字符串金额 → 数字；无效返回 0 */
export function parseAmount(raw: string): number {
  return parsePositiveNumber(raw, MAX_AMOUNT);
}

/** 60 → "60"，2.5 → "2.5"，1.05 → "1.05" */
export function formatAmount(value: number): string {
  if (value === 0) return '0';
  return value.toFixed(2).replace(/\.?0+$/, '');
}
