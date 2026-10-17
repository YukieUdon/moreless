import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import {
  formatCompactAmount,
  type DurationPart,
  type DurationUnit,
} from '@/core/save';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  /** 与结果大数字完全对应的分层，从大到小 */
  parts: DurationPart[];
};

const LABEL: Record<DurationUnit, string> = {
  year: '年',
  month: '月',
  week: '周',
  day: '天',
  hour: '时',
};

/** 一行最多画多少格；再多就写 +N，避免极端金额把页面拉成一堵墙 */
const MAX_CELLS = 24;

/**
 * 时间格：按 年 / 月 / 周 / 天 / 小时 分层，每层一种颜色，一格 = 1 个单位。
 * 分不单独成行：不足一小时的零头在「时」行末尾画 1 个更淡的格。
 * 只负责「像」，数字由上面的结果卡负责。
 */
export function UnitGrid({ parts }: Props) {
  const theme = useTheme();
  const colorOf: Record<DurationUnit, string> = {
    year: theme.cellYear,
    month: theme.cellMonth,
    week: theme.cellWeek,
    day: theme.cellDay,
    hour: theme.cellHour,
  };

  if (parts.length === 0) return null;

  return (
    <View
      style={styles.grid}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      {parts.map((part) => {
        const color = colorOf[part.unit];
        const shown = Math.min(part.count, MAX_CELLS);

        return (
          <View key={part.unit} style={styles.row}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.label}>
              {LABEL[part.unit]}
            </ThemedText>

            <View style={styles.cells}>
              {Array.from({ length: shown }, (_, index) => (
                <View key={index} style={[styles.cell, { backgroundColor: color }]} />
              ))}

              {part.partial && (
                <View style={[styles.cell, { backgroundColor: theme.cellHourPartial }]} />
              )}

              {part.count > MAX_CELLS && (
                <ThemedText type="small" themeColor="textSecondary">
                  +{formatCompactAmount(part.count - MAX_CELLS)}
                </ThemedText>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    marginTop: 20,
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  label: {
    width: 16,
    textAlign: 'center',
  },
  cells: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 4,
  },
  cell: {
    width: 15,
    height: 15,
    borderRadius: 5,
  },
});
