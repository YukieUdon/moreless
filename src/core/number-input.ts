/**
 * 数字输入的通用清洗：只留数字和一个小数点，限制整数位与小数位。
 * 只管"能继续输入的字符串"，不管语义（金额 / 时薪 / 月薪都由调用方决定上限）。
 */

export type NumberInputOptions = {
  /** 整数部分最多几位 */
  intDigits: number;
  /** 小数部分最多几位；0 表示只能输整数（小数点直接丢掉） */
  decimals: number;
};

export function sanitizeNumberInput(
  raw: string,
  { intDigits, decimals }: NumberInputOptions,
): string {
  let s = raw.replace(/[^\d.]/g, '');

  if (decimals <= 0) {
    // 只能输整数时，小数点后面的部分整段丢弃，不能把 "80.5" 拼成 "805"
    s = s.split('.')[0] ?? '';
  } else {
    const firstDot = s.indexOf('.');
    if (firstDot !== -1) {
      s = s.slice(0, firstDot + 1) + s.slice(firstDot + 1).replace(/\./g, '').slice(0, decimals);
    }
  }

  const [intRaw = '', dec] = s.split('.');
  const int = intRaw.slice(0, intDigits).replace(/^0+(?=\d)/, '');

  if (dec === undefined) return int;
  return int === '' ? `0.${dec}` : `${int}.${dec}`;
}

/** 字符串 → 数字；无效或非正数归 0，超过上限截断 */
export function parsePositiveNumber(raw: string, max: number): number {
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.min(value, max);
}
