import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SegmentedControl } from '@/components/segmented-control';
import { SettingsRow } from '@/components/settings-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { hasIncome } from '@/core/plan';
import { CONVERT_VIEW_OPTIONS, THEME_OPTIONS } from '@/core/preferences';
import { useMoneyPlan } from '@/hooks/use-money-plan';
import { usePreferences } from '@/hooks/use-preferences';
import { useTheme } from '@/hooks/use-theme';

/** 清空的二次确认停留多久 */
const CONFIRM_MS = 5000;

/** 开源仓库地址 */
const REPO_URL = 'https://github.com/YukieUdon/moreless';

/**
 * 我的 = 设置页。
 * 不放头像 / 账号：这一页只回答「能改什么」和「东西在哪」。
 */
export default function MeScreen() {
  const theme = useTheme();
  const { preferences, setTheme, setConvertView } = usePreferences();
  const { plan, ready, reset } = useMoneyPlan();
  const [confirming, setConfirming] = useState(false);

  const hasPlanData = hasIncome(plan) || plan.expenses.length > 0;
  const version = Constants.expoConfig?.version ?? '1.0.0';

  // 展开确认后 5 秒自己收起，和收支页的撤销条一套节奏
  useEffect(() => {
    if (!confirming) return;
    const timer = setTimeout(() => setConfirming(false), CONFIRM_MS);
    return () => clearTimeout(timer);
  }, [confirming]);

  function handleClear() {
    setConfirming(false);
    void reset();
  }

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>
          <ThemedText type="subtitle">我的</ThemedText>

          <Section title="外观">
            <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
              <SettingBlock label="主题" hint="「系统」跟着手机的深色模式走">
                <SegmentedControl
                  options={THEME_OPTIONS}
                  value={preferences.theme}
                  onChange={setTheme}
                />
              </SettingBlock>
            </View>
          </Section>

          <Section title="换算">
            <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
              <SettingBlock label="默认显示" hint="在换算页切换也会记住">
                <SegmentedControl
                  options={CONVERT_VIEW_OPTIONS}
                  value={preferences.convertView}
                  onChange={setConvertView}
                />
              </SettingBlock>
            </View>
          </Section>

          <Section title="数据">
            <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
              <SettingsRow
                label="清空收支数据"
                hint={
                  !ready
                    ? '读取中…'
                    : hasPlanData
                      ? '收支和开关都会回到初始状态'
                      : '现在还没有收支数据'
                }
                onPress={() => setConfirming(true)}
                disabled={!ready || !hasPlanData || confirming}
                destructive
                accessibilityLabel="清空收支数据"
              />

              {confirming && (
                <View
                  style={[styles.confirm, { borderTopColor: theme.border }]}
                  accessibilityLiveRegion="polite">
                  <ThemedText type="small">确定清空？</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    清空后不能恢复，收支页会回到空表单。
                  </ThemedText>

                  <View style={styles.confirmActions}>
                    <Pressable
                      onPress={() => setConfirming(false)}
                      accessibilityRole="button"
                      accessibilityLabel="取消清空"
                      style={({ pressed }) => [
                        styles.confirmButton,
                        {
                          borderColor: theme.border,
                          backgroundColor: pressed ? theme.backgroundSelected : 'transparent',
                        },
                      ]}>
                      <ThemedText type="small" themeColor="textSecondary">
                        取消
                      </ThemedText>
                    </Pressable>

                    <Pressable
                      onPress={handleClear}
                      accessibilityRole="button"
                      accessibilityLabel="确认清空收支数据"
                      style={({ pressed }) => [
                        styles.confirmButton,
                        {
                          borderColor: theme.cellYear,
                          backgroundColor: pressed ? theme.backgroundSelected : 'transparent',
                        },
                      ]}>
                      <ThemedText type="small" style={{ color: theme.cellYear }}>
                        清空
                      </ThemedText>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
          </Section>

          <Section title="关于">
            <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
              <SettingsRow label="版本" value={`v${version}`} />
              <SettingsRow label="价格参考" value="2026 年 10 月" topDivider />
              <SettingsRow
                label="源代码"
                hint="MIT 许可 · 欢迎 Star / Issue / PR"
                onPress={() => void Linking.openURL(REPO_URL)}
                topDivider
                accessibilityLabel="在浏览器打开源代码仓库"
              />
            </View>

            <ThemedText type="small" themeColor="textSecondary" style={styles.privacy}>
              不联网 · 不推送 · 不注册。收支只存在这台手机，卸载或清空即删除。
            </ThemedText>
          </Section>

          <View style={styles.signature}>
            <ThemedText style={[styles.wordmark, { color: theme.textSecondary }]}>
              more.less
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.slogan}>
              {"More of what matters. Less of what doesn't."}
            </ThemedText>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionTitle}>
        {title}
      </ThemedText>
      {children}
    </View>
  );
}

type SettingBlockProps = {
  label: string;
  hint: string;
  topDivider?: boolean;
  children: ReactNode;
};

/**
 * 竖排的设置块：标签、控件、说明各占一行。
 * 主题三段加标签横着排放不下（小屏会挤成一团），所以统一用竖排。
 */
function SettingBlock({ label, hint, topDivider = false, children }: SettingBlockProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.block,
        topDivider && { borderTopColor: theme.border, borderTopWidth: StyleSheet.hairlineWidth },
      ]}>
      <ThemedText type="default">{label}</ThemedText>
      {children}
      <ThemedText type="small" themeColor="textSecondary">
        {hint}
      </ThemedText>
    </View>
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
  section: {
    gap: Spacing.two,
  },
  sectionTitle: {
    paddingHorizontal: Spacing.one,
  },
  card: {
    borderRadius: 16,
    paddingHorizontal: Spacing.three,
  },
  block: {
    paddingVertical: 14,
    gap: Spacing.two,
  },
  confirm: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.three,
    gap: Spacing.one,
  },
  confirmActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  confirmButton: {
    height: 36,
    paddingHorizontal: Spacing.three,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  privacy: {
    paddingHorizontal: Spacing.one,
  },
  signature: {
    alignItems: 'center',
    gap: Spacing.one,
    paddingTop: Spacing.four,
  },
  wordmark: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  slogan: {
    textAlign: 'center',
  },
});
