import { StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { sanitizeAmountInput } from '@/core/worth';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  value: string;
  onChange: (next: string) => void;
  /** 自定义清洗规则；默认按金额（五位整数 + 两位小数） */
  sanitize?: (raw: string) => string;
  /** 默认 8 位，对应五位整数 + 小数点 + 两位小数 */
  maxLength?: number;
  /** 读屏念的名字，默认「金额」 */
  accessibilityLabel?: string;
};

export function AmountInput({
  value,
  onChange,
  sanitize = sanitizeAmountInput,
  maxLength = 8,
  accessibilityLabel = '金额',
}: Props) {
  const theme = useTheme();

  return (
    <View style={styles.wrapper}>
      <ThemedText type="subtitle" themeColor="textSecondary" style={styles.yuan}>
        ¥
      </ThemedText>
      <TextInput
        value={value}
        onChangeText={(next) => onChange(sanitize(next))}
        placeholder="0"
        placeholderTextColor={theme.textSecondary}
        keyboardType="decimal-pad"
        inputMode="decimal"
        autoFocus
        maxLength={maxLength}
        selectionColor={theme.accent}
        accessibilityLabel={accessibilityLabel}
        style={[styles.input, { color: theme.text }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    gap: Spacing.one,
  },
  yuan: {
    fontSize: 28,
    lineHeight: 34,
  },
  input: {
    flex: 1,
    // Web 上 input 自带最小宽度，不加这行会把整页撑出横向滚动条
    minWidth: 0,
    fontSize: 48,
    lineHeight: 56,
    fontWeight: '600',
    padding: 0,
    includeFontPadding: false,
  },
});
