# Changelog

本项目遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/) 和 [Semantic Versioning](https://semver.org/lang/zh-CN/)。

## [1.0.0] - 2026-10-18

首个公开版本。

### Added

- **换算**：输入金额，同一页看「要攒多久」和「能买多少」，支持列表 / 宫格。
- **收支**：收入按日 / 月 / 年填，支出按项记、每项独立选周期，自动保存到本机。
- **我的**：主题（系统 / 浅色 / 深色）、换算页默认显示、清空收支、版本和价格参考月份。
- 本地存储：`ml_plan_v2` / `ml_settings_v1`，不上传、不注册、不联网。
- 安卓键盘弹起时自己接管滚动位置，不再把长表单弹回顶部。

### Engineering

- Expo SDK 57 + React Native 0.86 + TypeScript（strict）+ Expo Router。
- Vitest 覆盖 `src/core` 的判断逻辑；ESLint + GitHub Actions 做合并门槛。
- `app.config.js` 支持 `ML_APP_ID` / `ML_SCHEME`，方便 Fork 改包身份。
- MIT 许可、贡献指南、安全策略、行为准则、Issue / PR 模板、Dependabot。

### Notes

- 换算清单里的品牌和价格只用于说明规格，价格是 2026 年 10 月的常见零售参考值，不是实时报价。
- 目前只有 iOS / Android 原生包和 Expo Go 预览；网页版只用于开发验收。
