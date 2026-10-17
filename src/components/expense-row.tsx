import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type LayoutChangeEvent,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { MAX_EXPENSE_NAME } from '@/core/plan';
import { sanitizeMoneyInput } from '@/core/save';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  name: string;
  amount: string;
  autoFocusName?: boolean;
  /** 上层要记这一行在列表里的位置，弹键盘时好把它挪到键盘上方 */
  onLayout?: (event: LayoutChangeEvent) => void;
  /** 名称或金额拿到焦点；两层都通知，改名和改金额都要跟着挪 */
  onFocus?: () => void;
  onChangeName: (next: string) => void;
  onChangeAmount: (next: string) => void;
  onRemove: () => void;
  /** 给读屏用，如「删除 房租」 */
  removeLabel: string;
};

/**
 * 一项支出的编辑行：名称 + ¥金额 + 删除。
 * 金额是「输入框文本」，清洗和存盘由上层做；这里只保证输进来的是合法金额字符。
 */
export function ExpenseRow({
  name,
  amount,
  autoFocusName,
  onLayout,
  onFocus,
  onChangeName,
  onChangeAmount,
  onRemove,
  removeLabel,
}: Props) {
  const theme = useTheme();

  return (
    <View style={[styles.row, { borderBottomColor: theme.border }]} onLayout={onLayout}>
      <TextInput
        value={name}
        onChangeText={onChangeName}
        onFocus={onFocus}
        placeholder="名称"
        placeholderTextColor={theme.textSecondary}
        autoFocus={autoFocusName}
        maxLength={MAX_EXPENSE_NAME}
        selectionColor={theme.accent}
        style={[styles.name, { color: theme.text }]}
      />

      <ThemedText type="small" themeColor="textSecondary">
        ¥
      </ThemedText>

      <TextInput
        value={amount}
        onChangeText={(next) => onChangeAmount(sanitizeMoneyInput(next))}
        onFocus={onFocus}
        placeholder="0"
        placeholderTextColor={theme.textSecondary}
        keyboardType="decimal-pad"
        inputMode="decimal"
        maxLength={18}
        selectionColor={theme.accent}
        style={[styles.amount, { color: theme.text }]}
      />

      <Pressable
        onPress={onRemove}
        hitSlop={Spacing.two}
        accessibilityRole="button"
        accessibilityLabel={removeLabel}
        style={styles.remove}>
        <MaterialCommunityIcons name="close" size={18} color={theme.textSecondary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    width: '100%',
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  name: {
    flex: 1,
    // Web 上 input 自带最小宽度，不加这行会把整行撑出横向滚动条
    minWidth: 0,
    fontSize: 16,
    lineHeight: 24,
    padding: 0,
    includeFontPadding: false,
  },
  amount: {
    width: 96,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'right',
    padding: 0,
    includeFontPadding: false,
  },
  remove: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
