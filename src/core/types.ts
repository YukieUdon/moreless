export type SubUnit = {
  /** 小单位名称，如「盒」「枚」「包」 */
  name: string;
  /** 一个主单位里有多少个小单位 */
  perUnit: number;
};

export type Item = {
  id: string;
  /** 品类名，如「牛奶」 */
  name: string;
  /** 品牌，如「伊利」 */
  brand: string;
  /** 型号/规格，如「纯牛奶 250ml × 24 盒」 */
  model: string;
  /** 图标名（UI 层解析，core 不关心） */
  icon: string;
  /** 图标底色 */
  tint: string;
  /** 元 / 主单位 */
  price: number;
  /** 主单位，如「箱」 */
  unit: string;
  sub?: SubUnit;
};

export type ConvertResult = {
  /** 整数数量，向下取整 */
  value: number;
  unit: string;
  /** 连一个小单位都买不到 */
  belowOne: boolean;
};

/** 换算后的一行：物品 + 数量结果 */
export type ConvertedItem = {
  item: Item;
  result: ConvertResult;
};

/** 一笔钱的周期：按天、按月、按年 */
export type MoneyPeriod = 'day' | 'month' | 'year';

/** 一笔钱 + 它的周期；折成每月后参与结余计算 */
export type MoneyEntry = {
  /** 元；读取时拒绝负数与非数 */
  amount: number;
  period: MoneyPeriod;
};

/** 一项支出：名称可空，金额 + 周期 */
export type ExpenseItem = MoneyEntry & {
  /** 本地生成的稳定 id，列表 key 与删除用 */
  id: string;
  /** '' 表示没填名字 */
  name: string;
};

/**
 * 收支设置（全局、本地保存）。
 * 收入只有一项（可切日 / 月 / 年）；支出按项记，每项自带周期。
 */
export type MoneyPlan = {
  /** null 表示还没填收入 */
  income: MoneyEntry | null;
  expenses: ExpenseItem[];
  /** 周末是否也攒钱：关掉后只按工作日算 */
  holidayEarns: boolean;
};
