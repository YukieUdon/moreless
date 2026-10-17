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
};

export function WorthRow({ item, result }: Props) {
  const theme = useTheme();
  const iconName = item.icon as keyof typeof MaterialCommunityIcons.glyphMap;

  return (
    <View style={[styles.row, { borderBottomColor: theme.border }]}>
      <View style={[styles.iconTile, { backgroundColor: item.tint }]}>
        <MaterialCommunityIcons name={iconName} size={20} color="#2B2A24" />
      </View>

      <View style={styles.info}>
        <ThemedText type="smallBold" numberOfLines={1}>
          {item.brand} {item.name}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
          {item.model} · ¥{formatAmount(item.price)}/{item.unit}
        </ThemedText>
      </View>

      <View style={styles.qty}>
        <ThemedText style={styles.qtyValue}>
          {result.belowOne ? '不到 1' : result.value}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {result.unit}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconTile: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  qty: {
    alignItems: 'flex-end',
    gap: 0,
  },
  qtyValue: {
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '600',
  },
});
