import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { ConvertResult, Item } from '@/core/types';
import { formatAmount } from '@/core/worth';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  item: Item;
  result: ConvertResult;
  /** 卡片宽度由外层按列数算好，保证每行排满 */
  width: number;
};

/** 宫格视图里的一格：物品信息在上，换算数量在下 */
export function WorthCard({ item, result, width }: Props) {
  const theme = useTheme();
  const iconName = item.icon as keyof typeof MaterialCommunityIcons.glyphMap;
  const value = result.belowOne ? '不到 1' : String(result.value);

  return (
    <View
      accessible
      accessibilityLabel={`${item.brand}${item.name}，${value} ${result.unit}`}
      style={[styles.card, { width, backgroundColor: theme.backgroundElement }]}>
      <View style={styles.top}>
        <View style={[styles.iconTile, { backgroundColor: item.tint }]}>
          <MaterialCommunityIcons name={iconName} size={18} color="#2B2A24" />
        </View>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1} style={styles.price}>
          ¥{formatAmount(item.price)}/{item.unit}
        </ThemedText>
      </View>

      <View style={styles.info}>
        <ThemedText type="smallBold" numberOfLines={1}>
          {item.brand} {item.name}
        </ThemedText>
        <ThemedText themeColor="textSecondary" numberOfLines={1} style={styles.model}>
          {item.model}
        </ThemedText>
      </View>

      <View style={styles.qty}>
        <ThemedText style={[styles.qtyValue, result.belowOne && styles.qtyValueSmall]}>
          {value}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.qtyUnit}>
          {result.unit}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 172,
    borderRadius: 20,
    padding: Spacing.three,
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  iconTile: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  price: {
    flexShrink: 1,
    textAlign: 'right',
    fontSize: 12,
    lineHeight: 16,
  },
  info: {
    gap: 2,
  },
  model: {
    fontSize: 12,
    lineHeight: 16,
  },
  qty: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.one,
  },
  qtyValue: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '600',
  },
  qtyValueSmall: {
    fontSize: 20,
    lineHeight: 28,
  },
  qtyUnit: {
    paddingBottom: 3,
  },
});
