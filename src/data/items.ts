import { MaterialCommunityIcons } from '@expo/vector-icons';

import type { Item } from '@/core/types';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

type SeedItem = Item & { icon: IconName };

/**
 * 默认清单：品牌与型号只用来说明规格，价格取 2026-10 的常见零售价。
 * 这些价格是参考值，不是实时报价；品牌名也不代表任何合作或背书。
 * 暂不支持在 App 里改价。
 */
const SEED: SeedItem[] = [
  {
    id: 'milk',
    name: '牛奶',
    brand: '伊利',
    model: '纯牛奶 250ml × 24 盒',
    icon: 'cow',
    tint: '#E8F2FF',
    price: 60,
    unit: '箱',
    sub: { name: '盒', perUnit: 24 },
  },
  {
    id: 'oil',
    name: '食用油',
    brand: '金龙鱼',
    model: '精炼大豆油 5L',
    icon: 'oil',
    tint: '#FFF3DF',
    price: 70,
    unit: '桶',
  },
  {
    id: 'rice',
    name: '大米',
    brand: '十月稻田',
    model: '东北大米 5kg',
    icon: 'rice',
    tint: '#F3EFE3',
    price: 40,
    unit: '袋',
  },
  {
    id: 'pork',
    name: '猪肉',
    brand: '双汇',
    model: '冷鲜猪前腿肉',
    icon: 'food-steak',
    tint: '#FFE9E6',
    price: 16,
    unit: '斤',
  },
  {
    id: 'egg',
    name: '鸡蛋',
    brand: '正大',
    model: '鲜鸡蛋 30 枚',
    icon: 'egg',
    tint: '#FFF6DC',
    price: 22,
    unit: '盒',
    sub: { name: '枚', perUnit: 30 },
  },
  {
    id: 'noodle',
    name: '挂面',
    brand: '陈克明',
    model: '龙须挂面 1kg',
    icon: 'noodles',
    tint: '#FBEFE3',
    price: 10,
    unit: '袋',
  },
  {
    id: 'tissue',
    name: '抽纸',
    brand: '维达',
    model: '超韧 3 层 100 抽 × 24 包',
    icon: 'paper-roll',
    tint: '#EFEAFB',
    price: 55,
    unit: '箱',
    sub: { name: '包', perUnit: 24 },
  },
  {
    id: 'detergent',
    name: '洗衣液',
    brand: '蓝月亮',
    model: '深层洁净 3kg',
    icon: 'washing-machine',
    tint: '#E6F6F2',
    price: 40,
    unit: '桶',
  },
  {
    id: 'toothpaste',
    name: '牙膏',
    brand: '云南白药',
    model: '牙膏 120g',
    icon: 'toothbrush',
    tint: '#EAF4FF',
    price: 30,
    unit: '支',
  },
  {
    id: 'shampoo',
    name: '洗发水',
    brand: '海飞丝',
    model: '去屑洗发水 500ml',
    icon: 'bottle-tonic',
    tint: '#EAF0FF',
    price: 50,
    unit: '瓶',
  },
];

export const DEFAULT_ITEMS: Item[] = SEED;
