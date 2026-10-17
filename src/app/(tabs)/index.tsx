import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AmountInput } from '@/components/amount-input';
import { BalanceScale } from '@/components/balance-scale';
import { SortMenu } from '@/components/sort-menu';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { UnitGrid } from '@/components/unit-grid';
import { WorthCard } from '@/components/worth-card';
import { WorthRow } from '@/components/worth-row';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { hasIncome, monthlySave } from '@/core/plan';
import {
  estimateSave,
  formatCompactAmount,
  formatSaveDuration,
  parseMoney,
  sanitizeMoneyInput,
  targetDate,
} from '@/core/save';
import { convertAll, sortEntries, type SortMode } from '@/core/worth';
import { DEFAULT_ITEMS } from '@/data/items';
import { useMoneyPlan } from '@/hooks/use-money-plan';
import { usePreferences } from '@/hooks/use-preferences';
import { useTheme } from '@/hooks/use-theme';

/**
 * 换算页：一个金额，两块答案。
 * 先给「要攒多久」（代价），再给「能买多少」（实物）；
 * 收支没填时不挡路，退化成一张一句话的引导卡。
 */
export default function ConvertScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { plan, ready } = useMoneyPlan();
  const { preferences, setConvertView } = usePreferences();

  const [input, setInput] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('default');

  // 列表 / 宫格存在设置偏好里：在这里切、「我的」里切，都是同一份
  const viewMode = preferences.convertView;

  // 切到收支时收起键盘：输入框还挂着，不主动收的话键盘会跟过去挡半个屏幕
  useFocusEffect(
    useCallback(() => () => Keyboard.dismiss(), []),
  );

  // 金额不设 99999.99 上限，只限位数，和 formatSaveDuration 的百年级保护一套口径
  const amount = parseMoney(input);
  const empty = amount <= 0;

  // 排序 + 换算只在金额或排序方式变化时重算
  const rows = useMemo(
    () => sortEntries(convertAll(amount, DEFAULT_ITEMS), sortMode),
    [amount, sortMode],
  );

  const monthly = monthlySave(plan);
  const estimate = estimateSave(amount, monthly, plan.holidayEarns);
  const duration = estimate ? formatSaveDuration(estimate.calendarDays) : null;
  const target = estimate ? targetDate(estimate.calendarDays) : null;

  // 宫格按窗口宽度分 2 / 3 / 4 列，卡片宽度按内容宽度算，保证每行排满
  const contentWidth = Math.min(width, MaxContentWidth);
  const columns = width >= 700 ? 4 : width >= 500 ? 3 : 2;
  const cardWidth = Math.floor(
    (contentWidth - Spacing.four * 2 - Spacing.three * (columns - 1)) / columns,
  );

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}>
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.wordmark}>
            多少
          </ThemedText>

          <AmountInput
            value={input}
            onChange={setInput}
            sanitize={sanitizeMoneyInput}
            maxLength={18}
          />

          {empty ? (
            <View style={styles.empty}>
              <BalanceScale />
              <ThemedText type="small" themeColor="textSecondary" style={styles.emptyHint}>
                输入一个金额，看看它要攒多久、能买什么
              </ThemedText>
            </View>
          ) : (
            <>
              {/* 要攒多久：等读盘完成再渲染，避免先闪一下「还没填收支」 */}
              {ready && (
                <View style={styles.durationSection}>
                  {!hasIncome(plan) ? (
                    <GuidanceCard
                      title="填一下收支，才知道这笔钱要攒多久"
                      hint="收入多少、每月固定花多少 —— 填一次，以后都能用"
                      action="去填收支"
                      onPress={() => router.navigate('/plan')}
                    />
                  ) : monthly <= 0 ? (
                    <GuidanceCard
                      title="按现在的收支，每月攒不下钱"
                      hint="支出已经吃掉了全部收入 —— 去收支页看看哪几项可以松一松。"
                      action="看看收支"
                      onPress={() => router.navigate('/plan')}
                    />
                  ) : (
                    estimate &&
                    duration && (
                      <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
                        {/* 读屏把结论念成一句；账本要单独可点，所以不整卡合并 */}
                        <View
                          accessible
                          accessibilityLabel={`攒够 ${formatCompactAmount(amount)} 元需要 ${duration.headline}`}
                          style={styles.durationText}>
                          <ThemedText type="small" themeColor="textSecondary">
                            要攒多久
                          </ThemedText>
                          <ThemedText style={styles.headline}>{duration.headline}</ThemedText>
                          <ThemedText type="small" themeColor="textSecondary">
                            {`约 ${formatCompactAmount(estimate.workdays)} 个工作日${
                              target ? ` · 预计 ${target}` : ''
                            }`}
                          </ThemedText>
                          <UnitGrid parts={duration.parts} />
                        </View>

                        <Pressable
                          onPress={() => router.navigate('/plan')}
                          hitSlop={4}
                          accessibilityRole="button"
                          accessibilityLabel={`每月能攒 ${formatCompactAmount(
                            Math.round(monthly),
                          )} 元，去改收支`}
                          style={({ pressed }) => [
                            styles.ledger,
                            { borderTopColor: theme.border },
                            pressed && { backgroundColor: theme.backgroundSelected },
                          ]}>
                          <ThemedText type="small" themeColor="accent">
                            {`每月能攒 ¥${formatCompactAmount(
                              Math.round(monthly),
                            )} · 改收支 ›`}
                          </ThemedText>
                        </Pressable>
                      </View>
                    )
                  )}
                </View>
              )}

              {/* 能买多少 */}
              <View style={[styles.divider, { backgroundColor: theme.border }]} />

              <ThemedText style={styles.sectionTitle}>能买多少</ThemedText>

              <View style={styles.toolbar}>
                <View style={styles.sortWrap}>
                  <SortMenu value={sortMode} onChange={setSortMode} />
                </View>

                <View style={styles.toggleGroup}>
                  <ViewToggleButton
                    icon="view-list"
                    label="列表"
                    active={viewMode === 'list'}
                    onPress={() => setConvertView('list')}
                  />
                  <ViewToggleButton
                    icon="view-grid"
                    label="宫格"
                    active={viewMode === 'grid'}
                    onPress={() => setConvertView('grid')}
                  />
                </View>
              </View>

              {viewMode === 'list' ? (
                <View style={styles.list}>
                  {rows.map(({ item, result }) => (
                    <WorthRow key={item.id} item={item} result={result} />
                  ))}
                </View>
              ) : (
                <View style={styles.grid}>
                  {rows.map(({ item, result }) => (
                    <WorthCard key={item.id} item={item} result={result} width={cardWidth} />
                  ))}
                </View>
              )}

              <ThemedText type="small" themeColor="textSecondary" style={styles.footnote}>
                价格为 2026 年 10 月参考价 · 不接实时价格
              </ThemedText>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

type GuidanceCardProps = {
  title: string;
  hint: string;
  action: string;
  onPress: () => void;
};

/** 收支缺失 / 攒不下钱时的引导卡：一句话 + 一个按钮，不吓人、不用红字 */
function GuidanceCard({ title, hint, action, onPress }: GuidanceCardProps) {
  const theme = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
      <ThemedText type="small" themeColor="textSecondary">
        要攒多久
      </ThemedText>
      <ThemedText style={styles.guideTitle}>{title}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {hint}
      </ThemedText>

      <Pressable
        onPress={onPress}
        hitSlop={4}
        accessibilityRole="button"
        accessibilityLabel={action}
        style={({ pressed }) => [
          styles.guideButton,
          {
            borderColor: theme.accent,
            backgroundColor: pressed ? theme.backgroundSelected : theme.backgroundElement,
          },
        ]}>
        <ThemedText type="small" themeColor="accent">
          {action}
        </ThemedText>
      </Pressable>
    </View>
  );
}

type ViewToggleButtonProps = {
  icon: 'view-list' | 'view-grid';
  label: string;
  active: boolean;
  onPress: () => void;
};

/** 列表 / 宫格二选一的小圆按钮 */
function ViewToggleButton({ icon, label, active, onPress }: ViewToggleButtonProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [
        styles.toggle,
        {
          borderColor: active ? theme.accent : theme.border,
          backgroundColor:
            active || pressed ? theme.backgroundSelected : theme.backgroundElement,
        },
      ]}>
      <MaterialCommunityIcons
        name={icon}
        size={18}
        color={active ? theme.accent : theme.textSecondary}
      />
    </Pressable>
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
    // 底部安全区由 tab 栏吃，这里自己留一截，别让最后一行贴着 tab
    paddingBottom: Spacing.five,
  },
  wordmark: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.one,
  },
  empty: {
    alignItems: 'center',
    paddingTop: Spacing.four,
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  emptyHint: {
    textAlign: 'center',
  },
  durationSection: {
    paddingHorizontal: Spacing.four,
    marginTop: Spacing.three,
  },
  card: {
    borderRadius: 20,
    padding: Spacing.four,
  },
  durationText: {
    gap: Spacing.half,
  },
  headline: {
    fontSize: 38,
    lineHeight: 46,
    fontWeight: '600',
  },
  guideTitle: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '600',
    marginBottom: Spacing.one,
  },
  guideButton: {
    alignSelf: 'flex-start',
    height: 36,
    paddingHorizontal: Spacing.three,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.two,
  },
  ledger: {
    marginTop: Spacing.three,
    paddingTop: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: Spacing.four,
    marginTop: Spacing.five,
  },
  sectionTitle: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
    paddingHorizontal: Spacing.four,
    marginTop: Spacing.four,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    marginTop: Spacing.two,
  },
  sortWrap: {
    flexShrink: 1,
  },
  toggleGroup: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
  toggle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingHorizontal: Spacing.four,
    marginTop: Spacing.one,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    marginTop: Spacing.two,
  },
  footnote: {
    paddingTop: Spacing.three,
    paddingHorizontal: Spacing.four,
    textAlign: 'center',
  },
});
