import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { PERIOD_LABEL, PERIOD_UNIT, PERIODS } from '@/core/plan';
import type { MoneyPeriod } from '@/core/types';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  value: MoneyPeriod;
  onChange: (period: MoneyPeriod) => void;
};

/**
 * 日 / 月 / 年 三段胶囊。
 * 只在这里选口径，数字不动 —— 切周期不改金额，是收支页唯一需要理解的规则。
 */
export function PeriodSegment({ value, onChange }: Props) {
  const theme = useTheme();

  return (
    <View style={[styles.wrapper, { backgroundColor: theme.backgroundElement }]}>
      {PERIODS.map((period) => {
        const selected = period === value;

        return (
          <Pressable
            key={period}
            onPress={() => onChange(period)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={`按${PERIOD_LABEL[period]}计`}
            style={[styles.segment, selected && { backgroundColor: theme.backgroundSelected }]}>
            <ThemedText type="smallBold" themeColor={selected ? 'text' : 'textSecondary'}>
              {PERIOD_UNIT[period]}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 10,
    padding: Spacing.half,
    gap: Spacing.half,
  },
  segment: {
    minWidth: 52,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
