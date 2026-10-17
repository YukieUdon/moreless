import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  label: string;
  hint?: string;
  /** 右侧只读值（版本号、价格月份） */
  value?: string;
  onPress?: () => void;
  disabled?: boolean;
  /** 破坏性操作：字用暗砖色，不用刺眼红 */
  destructive?: boolean;
  showChevron?: boolean;
  /** 第一行不画，其余行传 true */
  topDivider?: boolean;
  /** 行下方展开的内容（比如清空的二次确认） */
  children?: ReactNode;
  accessibilityLabel?: string;
};

/**
 * 设置页的一行：标签（可带说明）在左，右边是值 / 箭头。
 * 点击整行生效；禁用时只是变淡，不换成红色。
 */
export function SettingsRow({
  label,
  hint,
  value,
  onPress,
  disabled = false,
  destructive = false,
  showChevron,
  topDivider = false,
  children,
  accessibilityLabel,
}: Props) {
  const theme = useTheme();
  const chevron = showChevron ?? (onPress !== undefined && value === undefined && !disabled);

  const inner = (
    <>
      <View style={styles.texts}>
        <ThemedText
          type="default"
          style={[destructive && { color: theme.cellYear }, disabled && styles.dimmed]}>
          {label}
        </ThemedText>
        {hint ? (
          <ThemedText type="small" themeColor="textSecondary" style={disabled && styles.dimmed}>
            {hint}
          </ThemedText>
        ) : null}
      </View>

      {value !== undefined ? (
        <ThemedText type="default" themeColor="textSecondary" style={disabled && styles.dimmed}>
          {value}
        </ThemedText>
      ) : null}

      {chevron ? (
        <MaterialCommunityIcons name="chevron-right" size={20} color={theme.textSecondary} />
      ) : null}
    </>
  );

  return (
    <View
      style={[
        styles.wrapper,
        topDivider && { borderTopColor: theme.border, borderTopWidth: StyleSheet.hairlineWidth },
      ]}>
      {onPress ? (
        <Pressable
          onPress={onPress}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel ?? (hint ? `${label}，${hint}` : label)}
          accessibilityState={{ disabled }}
          style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
          {inner}
        </Pressable>
      ) : (
        <View style={styles.row}>{inner}</View>
      )}

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: 14,
  },
  pressed: {
    opacity: 0.6,
  },
  texts: {
    flex: 1,
    gap: 2,
  },
  dimmed: {
    opacity: 0.45,
  },
});
