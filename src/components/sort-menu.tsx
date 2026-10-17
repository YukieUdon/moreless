import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import {
  Dimensions,
  Keyboard,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { SORT_OPTIONS, type SortMode } from '@/core/worth';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  value: SortMode;
  onChange: (mode: SortMode) => void;
};

type Anchor = {
  top: number;
  left: number;
};

const MENU_WIDTH = 176;
const ITEM_HEIGHT = 44;
const MENU_PADDING = 6;

/**
 * 排序下拉框：点开后在按钮正下方弹出一张小菜单。
 * 不引第三方 Picker，用 Modal + measureInWindow 自己定位。
 */
export function SortMenu({ value, onChange }: Props) {
  const theme = useTheme();
  const triggerRef = useRef<View>(null);
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<Anchor>({ top: 0, left: Spacing.three });

  const current = SORT_OPTIONS.find((option) => option.id === value) ?? SORT_OPTIONS[0];

  function handleOpen() {
    Keyboard.dismiss();
    const trigger = triggerRef.current;
    if (!trigger) {
      setOpen(true);
      return;
    }

    trigger.measureInWindow((x, y, width, height) => {
      const window = Dimensions.get('window');
      const menuHeight = SORT_OPTIONS.length * ITEM_HEIGHT + MENU_PADDING * 2;
      const below = y + height + Spacing.one;
      const top = below + menuHeight > window.height - Spacing.three ? y - menuHeight - Spacing.one : below;
      // 左对齐按钮，再收进屏幕内，避免靠边的按钮把菜单顶出去
      const left = Math.min(Math.max(Spacing.three, x), window.width - MENU_WIDTH - Spacing.three);

      setAnchor({ top, left });
      setOpen(true);
    });
  }

  function select(mode: SortMode) {
    onChange(mode);
    setOpen(false);
  }

  return (
    <>
      <Pressable
        ref={triggerRef}
        onPress={handleOpen}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel={`排序方式：${current.label}`}
        accessibilityState={{ expanded: open }}
        style={[styles.trigger, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}>
        <MaterialCommunityIcons name="sort-variant" size={16} color={theme.textSecondary} />
        <ThemedText type="small" numberOfLines={1} style={styles.triggerLabel}>
          {current.label}
        </ThemedText>
        <MaterialCommunityIcons name="chevron-down" size={16} color={theme.textSecondary} />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setOpen(false)}>
        <View style={styles.overlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setOpen(false)}
            accessibilityLabel="关闭排序菜单"
          />

          <View
            accessibilityRole="menu"
            accessibilityLabel="排序方式"
            style={[
              styles.menu,
              { top: anchor.top, left: anchor.left, backgroundColor: theme.background, borderColor: theme.border },
            ]}>
            {SORT_OPTIONS.map((option) => {
              const active = option.id === value;
              return (
                <Pressable
                  key={option.id}
                  onPress={() => select(option.id)}
                  accessibilityRole="menuitem"
                  accessibilityState={{ selected: active }}
                  style={({ pressed }) => [
                    styles.option,
                    pressed && { backgroundColor: theme.backgroundSelected },
                  ]}>
                  <ThemedText type="small" themeColor={active ? 'accent' : 'text'}>
                    {option.label}
                  </ThemedText>
                  {active && (
                    <MaterialCommunityIcons name="check" size={16} color={theme.accent} />
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    height: 34,
    paddingHorizontal: Spacing.two,
    borderRadius: 17,
    borderWidth: 1,
    maxWidth: 200,
  },
  triggerLabel: {
    flexShrink: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(20, 20, 15, 0.18)',
  },
  menu: {
    position: 'absolute',
    width: MENU_WIDTH,
    paddingVertical: MENU_PADDING,
    borderRadius: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  option: {
    height: ITEM_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
  },
});
