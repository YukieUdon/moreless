import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ExpenseRow } from '@/components/expense-row';
import { PeriodSegment } from '@/components/period-segment';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { revealScrollOffset } from '@/core/keyboard-scroll';
import {
  MAX_EXPENSE_NAME,
  MAX_EXPENSES,
  PERIOD_LABEL,
  PERIOD_UNIT,
  createExpenseId,
  monthlyExpense,
  monthlyIncome,
  monthlySave,
} from '@/core/plan';
import { formatCompactAmount, parseMoney, sanitizeMoneyInput } from '@/core/save';
import type { ExpenseItem, MoneyPeriod } from '@/core/types';
import { formatAmount } from '@/core/worth';
import { useMoneyPlan } from '@/hooks/use-money-plan';
import { useTheme } from '@/hooks/use-theme';

/** 本地只存输入框文本，plan 才是唯一数据源 */
type Row = { id: string; name: string; amount: string; period: MoneyPeriod };

/** 支出分组顺序固定：先每月、再每年、最后每天（不是 PERIODS 的顺序） */
const GROUPS: readonly MoneyPeriod[] = ['month', 'year', 'day'];

/** 撤销提示停留多久 */
const UNDO_MS = 5000;

/**
 * 键盘弹起后多久把编辑中的那一行挪到键盘上方（毫秒）。
 * 安卓的 adjustResize 有一段动画，太早量到的可视高度还没压到位。
 */
const REVEAL_DELAY_MS = 200;

function toExpenseItem(row: Row): ExpenseItem {
  return { id: row.id, name: row.name, amount: parseMoney(row.amount), period: row.period };
}

/** 收入是否真的填了（0 和空都算没填） */
function hasIncome(amount: number): boolean {
  return amount > 0;
}

export default function PlanScreen() {
  const theme = useTheme();
  const { plan, ready, revision, update } = useMoneyPlan();

  const [incomeText, setIncomeText] = useState('');
  const [incomePeriod, setIncomePeriod] = useState<MoneyPeriod>('month');
  const [rows, setRows] = useState<Row[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [newRowId, setNewRowId] = useState<string | null>(null);
  const [undo, setUndo] = useState<{ item: ExpenseItem; index: number } | null>(null);

  /** 同一帧里连着改两次时，以最新草稿为准（不依赖还没刷新的 render 闭包） */
  const rowsRef = useRef<Row[]>([]);

  /** 记住上一次看到的 revision，用来分辨「清空收支」 */
  const revisionRef = useRef(revision);

  /** 滚动位置：安卓弹键盘时有的机型会把它清零，得自己把握把位置守住 */
  const scrollRef = useRef<ScrollView>(null);
  const offsetRef = useRef(0);
  const offsetBeforeEditRef = useRef(0);
  const viewportHeightRef = useRef(0);
  const contentHeightRef = useRef(0);
  /** 每一行、每一组在内容坐标系里的位置：聚焦时用它算「要滚多少」 */
  const rowLayoutsRef = useRef<Record<string, { y: number; height: number }>>({});
  const groupTopsRef = useRef<Record<string, number>>({});
  /** 正在编辑的行；null 表示焦点在收入金额上（它在页面最上面，不用挪） */
  const focusedRowRef = useRef<string | null>(null);
  const keyboardVisibleRef = useRef(false);
  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * 把正在编辑的那一行挪到键盘上方。
   *
   * 安卓弹键盘时窗口会整体压短（adjustResize），有的机型顺手把 ScrollView 的滚动
   * 位置清零 —— 页面上下一跳，本来在改的那一行被顶到屏幕外，得重新往下滑才找得到。
   * 所以不再指望系统的自动滚动（ScrollView 上 `scrollsChildToFocus={false}`），
   * 弹键盘后自己算一次：位置没变就不动，只补「这一行被键盘压住」的那点距离。
   */
  const revealFocusedRow = useCallback(() => {
    if (Platform.OS !== 'android') return;

    const scroll = scrollRef.current;
    const rowId = focusedRowRef.current;
    const layout = rowId ? rowLayoutsRef.current[rowId] : undefined;
    const viewport = viewportHeightRef.current;
    if (!scroll || !layout || viewport <= 0) return;

    const period = rowsRef.current.find((row) => row.id === rowId)?.period;
    if (!period) return;

    const groupTop = groupTopsRef.current[period] ?? 0;
    const target = revealScrollOffset({
      top: groupTop + layout.y,
      bottom: groupTop + layout.y + layout.height,
      // 以点输入框那一刻的位置为准：被系统清零了也只是「差多少补多少」
      anchor: offsetBeforeEditRef.current,
      current: offsetRef.current,
      viewport,
      contentHeight: contentHeightRef.current,
      margin: Spacing.three,
    });
    if (target === null) return;

    offsetRef.current = target;
    scroll.scrollTo({ y: target, animated: false });
  }, []);

  const scheduleReveal = useCallback(() => {
    if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
    revealTimerRef.current = setTimeout(() => {
      revealTimerRef.current = null;
      revealFocusedRow();
    }, REVEAL_DELAY_MS);
  }, [revealFocusedRow]);

  useEffect(() => {
    return () => {
      if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
    };
  }, []);

  function handleRowFocus(id: string) {
    focusedRowRef.current = id;
    offsetBeforeEditRef.current = offsetRef.current;
    // 键盘已经开着时再点另一行，不会有 didShow，自己补一次
    if (keyboardVisibleRef.current) scheduleReveal();
  }

  function handleIncomeFocus() {
    focusedRowRef.current = null;
    offsetBeforeEditRef.current = offsetRef.current;
  }

  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    offsetRef.current = event.nativeEvent.contentOffset.y;
  }

  // 键盘一弹窗口就变矮，可视高度得跟着记，不然算不准这一行有没有被压住
  function handleScrollLayout(event: LayoutChangeEvent) {
    viewportHeightRef.current = event.nativeEvent.layout.height;
  }

  // 切走 tab 时收起键盘，别让它跟到另一页挡内容
  useFocusEffect(
    useCallback(() => () => Keyboard.dismiss(), []),
  );

  // 读盘完成后初始化一次：金额数字转成输入框文本
  useEffect(() => {
    if (!ready || initialized) return;

    const initialRows = plan.expenses.map((item) => ({
      id: item.id,
      name: item.name,
      amount: item.amount > 0 ? formatAmount(item.amount) : '',
      period: item.period,
    }));
    rowsRef.current = initialRows;
    // 只在读盘完成后把「数据」灌进「表单」一次，这是必要的初始化，不是渲染期派生状态
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRows(initialRows);

    if (plan.income && hasIncome(plan.income.amount)) {
      setIncomeText(formatAmount(plan.income.amount));
      setIncomePeriod(plan.income.period);
    }
    setInitialized(true);
  }, [ready, initialized, plan]);

  // 「我的」里清空收支后，常驻的收支页得把本地草稿也归零，不然还显示旧表单
  useEffect(() => {
    if (!ready || revision === revisionRef.current) return;
    revisionRef.current = revision;

    rowsRef.current = [];
    setRows([]);
    setIncomeText('');
    setIncomePeriod('month');
    setNewRowId(null);
    setUndo(null);
    setInitialized(true);
  }, [revision, ready]);

  // 撤销提示：换一条就重新计时，5 秒后自己消失
  useEffect(() => {
    if (!undo) return;
    const timer = setTimeout(() => setUndo(null), UNDO_MS);
    return () => clearTimeout(timer);
  }, [undo]);

  // iOS 键盘不改变布局，撤销条得自己抬到键盘上方；Android 的 resize 已经抬过了
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (event) => {
      setKeyboardHeight(Platform.OS === 'ios' ? event.endCoordinates.height : 0);
      keyboardVisibleRef.current = true;
      // 键盘弹起后把正在编辑的那一行放回键盘上方（见 revealFocusedRow）
      scheduleReveal();
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
      keyboardVisibleRef.current = false;
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, [scheduleReveal]);

  // 吸底合计条的真实高度，撤销条要浮在它上面
  const [summaryBarHeight, setSummaryBarHeight] = useState(0);

  /** 把这份草稿整份写回 plan（内存立即生效，落盘由 Provider 防抖） */
  function applyRows(next: Row[]) {
    rowsRef.current = next;
    setRows(next);
    update((current) => ({ ...current, expenses: next.map(toExpenseItem) }));
  }

  function handleIncomeChange(raw: string) {
    const text = sanitizeMoneyInput(raw);
    setIncomeText(text);

    const amount = parseMoney(text);
    // 清空 / 为 0 都算没填收入
    update((current) => ({
      ...current,
      income: hasIncome(amount) ? { amount, period: incomePeriod } : null,
    }));
  }

  function handleIncomePeriodChange(period: MoneyPeriod) {
    setIncomePeriod(period);

    // 切周期不改数字，只换口径：同一个金额配上新周期
    const amount = parseMoney(incomeText);
    update((current) => ({
      ...current,
      income: hasIncome(amount) ? { amount, period } : null,
    }));
  }

  function handleNameChange(id: string, value: string) {
    const name = value.slice(0, MAX_EXPENSE_NAME);
    applyRows(rowsRef.current.map((row) => (row.id === id ? { ...row, name } : row)));
  }

  function handleAmountChange(id: string, value: string) {
    const amount = sanitizeMoneyInput(value);
    applyRows(rowsRef.current.map((row) => (row.id === id ? { ...row, amount } : row)));
  }

  function handleAdd(period: MoneyPeriod) {
    if (rowsRef.current.length >= MAX_EXPENSES) return;

    const row: Row = { id: createExpenseId(), name: '', amount: '', period };
    // 追加到数组末尾；各组按原顺序过滤，所以视觉上正好落在该组组尾
    applyRows([...rowsRef.current, row]);
    // 新行挂载后自动聚焦名称
    setNewRowId(row.id);
  }

  function handleRemove(id: string) {
    const current = rowsRef.current;
    const index = current.findIndex((row) => row.id === id);
    if (index < 0) return;

    const target = current[index];
    applyRows(current.filter((row) => row.id !== id));
    if (newRowId === id) setNewRowId(null);
    // 记下原位置，撤销时插回原处
    setUndo({ item: toExpenseItem(target), index });
  }

  function handleUndo() {
    if (!undo) return;

    const restored: Row = {
      id: undo.item.id,
      name: undo.item.name,
      amount: undo.item.amount > 0 ? formatAmount(undo.item.amount) : '',
      period: undo.item.period,
    };
    const next = [...rowsRef.current];
    next.splice(Math.min(undo.index, next.length), 0, restored);

    applyRows(next);
    setUndo(null);
  }

  function handleHolidayEarnsChange(value: boolean) {
    update((current) => ({ ...current, holidayEarns: value }));
  }

  // 读盘完成前不渲染表单，避免闪一下空表单
  if (!ready || !initialized) {
    return <ThemedView style={styles.screen} />;
  }

  const incomeMonthly = monthlyIncome(plan);
  const expenseMonthly = monthlyExpense(plan);
  const saveMonthly = monthlySave(plan);
  const hasIncomeValue = hasIncome(incomeMonthly);

  // 撤销条：有键盘时贴键盘上沿，否则浮在吸底合计条上面
  const toastBottom =
    keyboardHeight > 0
      ? keyboardHeight + Spacing.two
      : hasIncomeValue && summaryBarHeight > 0
        ? summaryBarHeight + Spacing.two
        : Spacing.four;

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
          keyboardDismissMode="on-drag"
          // 安卓默认会在子输入框聚焦时自己滚一下，弹键盘那一下还会把位置清零；
          // 关掉它，改由 revealFocusedRow 掌控，页面的位置才不会被抢走
          scrollsChildToFocus={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onLayout={handleScrollLayout}
          onContentSizeChange={(_width, height) => {
            contentHeightRef.current = height;
          }}
          showsVerticalScrollIndicator={false}>
          <ThemedText type="subtitle">收支</ThemedText>

          {/* 收入：日 / 月 / 年口径挂在「收入」标题这一行，别让它夹在收入和支出中间 */}
          <View style={styles.income}>
            <View style={styles.incomeHeader}>
              <ThemedText type="smallBold">收入</ThemedText>
              <PeriodSegment value={incomePeriod} onChange={handleIncomePeriodChange} />
            </View>

            <ThemedText type="small" themeColor="textSecondary">
              税后到手，填实际能拿到的那笔
            </ThemedText>

            <View style={styles.moneyRow}>
              <ThemedText type="subtitle" themeColor="textSecondary" style={styles.yuan}>
                ¥
              </ThemedText>
              <TextInput
                value={incomeText}
                onChangeText={handleIncomeChange}
                onFocus={handleIncomeFocus}
                placeholder="0"
                placeholderTextColor={theme.textSecondary}
                keyboardType="decimal-pad"
                inputMode="decimal"
                maxLength={18}
                selectionColor={theme.accent}
                accessibilityLabel="收入金额"
                style={[styles.moneyInput, { color: theme.text }]}
              />
            </View>

            {!hasIncomeValue ? (
              <ThemedText type="small" themeColor="textSecondary">
                先填收入，才能算每月能攒
              </ThemedText>
            ) : plan.income && plan.income.period !== 'month' ? (
              // 按月填的时候不用再折一次，省一行；按日/年填才给「≈ 每月」
              <ThemedText type="small" themeColor="textSecondary">
                ≈ 每月 ¥{formatCompactAmount(incomeMonthly)}
              </ThemedText>
            ) : null}
          </View>

          {/* 收入 / 支出的分界：一条线 + 一个「支出」标题，避免年月日跟支出组贴在一起 */}
          <View style={styles.expenseHead}>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <ThemedText style={styles.expenseTitle}>支出</ThemedText>
          </View>

          {/* 支出：按周期分三组，组内直接相加，不做换算 */}
          {GROUPS.map((period) => {
            const groupRows = rows.filter((row) => row.period === period);
            const groupTotal = groupRows.reduce((sum, row) => sum + parseMoney(row.amount), 0);

            return (
              <View
                key={period}
                style={styles.group}
                onLayout={(event) => {
                  // 组是内容容器的直接子视图，y 就是它在内容里的位置
                  groupTopsRef.current[period] = event.nativeEvent.layout.y;
                }}>
                <View style={styles.groupHeader}>
                  <ThemedText type="smallBold">{PERIOD_LABEL[period]}支出</ThemedText>
                  {groupRows.length > 0 && (
                    <ThemedText type="small" themeColor="textSecondary">
                      ¥{formatCompactAmount(groupTotal)}/{PERIOD_UNIT[period]}
                    </ThemedText>
                  )}
                </View>

                {groupRows.map((row) => (
                  <ExpenseRow
                    key={row.id}
                    name={row.name}
                    amount={row.amount}
                    autoFocusName={row.id === newRowId}
                    onLayout={(event) => {
                      const { y, height } = event.nativeEvent.layout;
                      rowLayoutsRef.current[row.id] = { y, height };
                    }}
                    onFocus={() => handleRowFocus(row.id)}
                    onChangeName={(next) => handleNameChange(row.id, next)}
                    onChangeAmount={(next) => handleAmountChange(row.id, next)}
                    onRemove={() => handleRemove(row.id)}
                    removeLabel={`删除 ${row.name || '未命名'}`}
                  />
                ))}

                <Pressable
                  onPress={() => handleAdd(period)}
                  accessibilityRole="button"
                  accessibilityLabel={`添加${PERIOD_LABEL[period]}支出`}
                  style={({ pressed }) => [
                    styles.addButton,
                    {
                      borderColor: theme.border,
                      backgroundColor: pressed ? theme.backgroundElement : 'transparent',
                    },
                  ]}>
                  <ThemedText type="small" themeColor="textSecondary">
                    ＋ 添加{PERIOD_LABEL[period]}支出
                  </ThemedText>
                </Pressable>
              </View>
            );
          })}

          {/* 口径开关：它是算法口径，不是收支，所以放在支出清单后面 */}
          <View style={styles.switchBlock}>
            <View style={styles.switchRow}>
              <ThemedText type="default">周末也攒钱</ThemedText>
              <Switch
                value={plan.holidayEarns}
                onValueChange={handleHolidayEarnsChange}
                trackColor={{ false: theme.backgroundSelected, true: theme.accent }}
                ios_backgroundColor={theme.backgroundSelected}
                accessibilityLabel="周末也攒钱"
              />
            </View>
            <ThemedText type="small" themeColor="textSecondary">
              关掉后只按工作日算，时间会往后顺延
            </ThemedText>
          </View>

          <View style={styles.footnotes}>
            <ThemedText type="small" themeColor="textSecondary">
              日 / 年金额按 365 天 / 年折算成月
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              改完自动保存，只存在这台手机
            </ThemedText>
          </View>
        </ScrollView>

        {/* 吸底合计：改任何一项都立刻变，不用滚到页面底部去看 */}
        {hasIncomeValue && (
          <View
            onLayout={(event) => setSummaryBarHeight(event.nativeEvent.layout.height)}
            accessible
            accessibilityLabel={`每月${saveMonthly < 0 ? '还差' : '能攒'} ${formatCompactAmount(
              Math.round(Math.abs(saveMonthly)),
            )} 元，收入 ${formatCompactAmount(Math.round(incomeMonthly))} 元，支出 ${formatCompactAmount(
              Math.round(expenseMonthly),
            )} 元`}
            style={[
              styles.summaryBar,
              { backgroundColor: theme.background, borderTopColor: theme.border },
            ]}>
            <View style={styles.summaryInner}>
              <View style={styles.summaryRow}>
                <ThemedText type="small" themeColor="textSecondary">
                  {saveMonthly < 0 ? '每月还差' : '每月能攒'}
                </ThemedText>
                <ThemedText style={styles.summaryValue}>
                  ¥{formatCompactAmount(Math.round(Math.abs(saveMonthly)))}
                </ThemedText>
              </View>
              <ThemedText type="small" themeColor="textSecondary">
                {`收入 ¥${formatCompactAmount(Math.round(incomeMonthly))} · 支出 ¥${formatCompactAmount(
                  Math.round(expenseMonthly),
                )}`}
              </ThemedText>
            </View>
          </View>
        )}

        {/* 删除后底部浮一条，5 秒内可撤销；不弹确认框、不用红色 */}
        {undo && (
          <View style={[styles.toastWrap, { bottom: toastBottom }]} pointerEvents="box-none">
            <View
              style={[styles.toast, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
              accessibilityLiveRegion="polite">
              <ThemedText type="small" numberOfLines={1} style={styles.toastText}>
                {`已删除「${undo.item.name || '未命名'}」`}
              </ThemedText>
              <Pressable
                onPress={handleUndo}
                hitSlop={Spacing.two}
                accessibilityRole="button"
                accessibilityLabel="撤销删除">
                <ThemedText type="smallBold" themeColor="accent">
                  撤销
                </ThemedText>
              </Pressable>
            </View>
          </View>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.five,
    gap: Spacing.four,
  },
  income: {
    gap: Spacing.two,
  },
  incomeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  expenseHead: {
    gap: Spacing.two,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  expenseTitle: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  moneyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  yuan: {
    fontSize: 32,
    lineHeight: 44,
  },
  moneyInput: {
    flex: 1,
    // Web 上 input 自带最小宽度，不加这行会把整页撑出横向滚动条
    minWidth: 0,
    fontSize: 32,
    lineHeight: 44,
    fontWeight: '600',
    padding: 0,
    includeFontPadding: false,
  },
  group: {
    gap: Spacing.two,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addButton: {
    marginTop: Spacing.two,
    paddingVertical: Spacing.two,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  summaryBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  summaryInner: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    gap: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.two,
  },
  summaryValue: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '600',
  },
  switchBlock: {
    gap: Spacing.one,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footnotes: {
    gap: Spacing.one,
  },
  toastWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
  },
  toast: {
    width: '100%',
    maxWidth: MaxContentWidth,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  toastText: {
    flex: 1,
  },
});
