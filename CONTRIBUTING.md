# 参与贡献

谢谢你看这个项目。它是一个「不内耗」的小工具，代码和产品取向都尽量保持简单、可验证。

## 先读什么

1. [`README.md`](README.md) —— 项目是什么、怎么跑。
2. [`AGENTS.md`](AGENTS.md) —— 产品红线、工程结构、质量门槛、Expo 版本纪律。
3. [`docs/隐私.md`](docs/隐私.md) —— 数据只在本机，以及为什么。

## 环境

- Node.js **22**（见 `.nvmrc`；React Native 0.86 也支持 20.19.4+ / 24+）
- npm（项目固定用 npm，不用 pnpm / yarn）
- 手机预览需要 Expo Go，且版本要匹配 **Expo SDK 57**

```bash
git clone https://github.com/YukieUdon/moreless.git
cd moreless
npm install
npx expo start          # 手机 Expo Go 扫码；按 w 开浏览器
```

> 在中国大陆直连 npm 官方源很慢时，可以把 `.npmrc.example` 复制成 `.npmrc`（已被 gitignore），取消里面镜像那一行的注释。不要把 `.npmrc` 提交上来。

## 启动与预览

### 手机

手机和电脑连同一个 Wi-Fi，用 Expo Go 扫终端里的二维码。之后改代码保存，手机会自动刷新。

### 浏览器

```bash
npm run web
```

同一个 Metro 服务器既喂手机也出网页版。平时布局、文案、颜色、算法结果在浏览器里看；点击手感、滑动、键盘弹起再上手机兜底。

### Windows 快捷方式

双击根目录的 `预览.bat`：服务器没在跑就先起一个，然后打开 <http://localhost:8081>。`启动.bat` 会在首次运行时自动装依赖。

### 什么时候需要重启

Fast Refresh 是常开的，改 JS/TS 保存后 1 秒内就能看到。只有这几种情况要「重来」：

- 改了 `app.json`、原生依赖或 config plugin → 需要重新构建（Expo Go 装不了新原生模块）。
- 热更保留了旧状态、界面没变 → 在 Expo Go 里摇一摇选 Reload，或在终端按 `r`。
- 开发服务器进程死了 → 用 `预览.bat` / `npm start` 重新拉起，二维码会变；手机从 Expo Go 的「最近」进即可。

### 网页版和手机的差异

- 没有安全区、状态栏、原生手势、系统键盘行为；字体渲染也略有不同。
- 项目里没有原生专属 UI 组件依赖，布局 / 文案 / 逻辑在浏览器里和手机上很接近。

## 改代码前

- **先方案后实现**：跨 2 个以上文件、动数据模型、加权限，先开 Issue 说方案；单点 bug、文案、样式可以直接提 PR。
- **判断逻辑放 `src/core/`**：不 import react / expo，能单独测试。界面只负责展示。
- **装原生依赖用 `npx expo install <包>`**，不要 `npm install <包>`。新增依赖前先说明理由；30 行能解决的不引包。
- **不要凭记忆写 Expo API**：先看 `package.json` 里的 SDK 大版本，再查 <https://docs.expo.dev/versions/v57.0.0/>。

## 提交前自查

```bash
npm run typecheck   # tsc --noEmit
npm test            # vitest
npm run lint        # eslint
```

新增判断逻辑要带测试；修 bug 先补一个能复现的回归测试。CI 会再跑一遍这三项。

### 截图自查

界面改动建议截图，肉眼看一眼布局：

```bash
npm start                      # 另开一个终端，保持 Metro 在跑
npm run screenshots            # 产物在 .shots/，已 gitignore
```

`scripts/screenshot.mjs` 用系统自带 Edge / Chrome 的无头模式走 CDP，固定 390×844 / DPR 2 截图。macOS / Linux 找不到浏览器时，用 `BROWSER_PATH` 指向可执行文件。

想看「填过数据 + 输过金额」的样子，可以预置一份收支再截图（只在无头浏览器的临时 profile 里，不碰你自己的浏览器）：

```bash
SEED_PLAN='{"income":{"amount":8000,"period":"month"},"expenses":[{"id":"e1","name":"房租","amount":3000,"period":"month"},{"id":"e2","name":"吃饭","amount":2000,"period":"month"},{"id":"e3","name":"旅行","amount":6000,"period":"year"},{"id":"e4","name":"通勤","amount":10,"period":"day"}],"holidayEarns":true}' \
TYPE_AMOUNT=599 THEME=light npm run screenshots
```

其他可用的环境变量：

- `SEED_PREFS='{"theme":"dark","convertView":"grid"}'` 预置「我的」里的偏好
- `CLICK_TEXT='清空收支数据>清空'` 按文字连点（验证二次确认 / 主题切换）
- `DUMP_STORAGE=1` 点击后打印 `ml_plan_v2` / `ml_settings_v1`
- `PORT=8082` 指定 Metro 端口

注意：

- 截三个页面要 15–25 秒（每页等 Metro 打包和图标字体）；图标字体偶尔来不及加载会显示成方块。
- 单独截某个路由时，Git Bash 要把 `/` 参数转义：`MSYS_NO_PATHCONV=1 node scripts/screenshot.mjs / /plan`。
- 截图脚本里已经用 CDP 的 `Emulation.setDeviceMetricsOverride` 固定尺寸，不要用 `--window-size` 硬套（Windows 显示缩放会让视口和图片宽度对不上）。
- **不要 `taskkill /IM msedge.exe`**：会把你自己开着的 Edge 一起杀掉。清理无头浏览器要按 PID，且只挑命令行里带 `--headless` 的。

### 换图标 / 启动图

```bash
python scripts/make-icons.py    # 需要 Pillow；重新生成 assets/images 下的图标、启动图、favicon
```

纸底 + 墨绿小天平，颜色写在脚本顶部；启动图分纸色 / 暗色两套，由 `app.json` 的 `expo-splash-screen` 引用。

## 产品红线

这些不是风格偏好，是项目的边界。改功能前先确认没有越过：

- 不做账号墙，首次打开即可用全部工具。
- 数据默认只在本机；引入云端必须先回答「离线还能不能用」。
- 不做焦虑型增长：不推送「你已经 N 天…」、不做排名和攀比、不用红点催人。
- 不卖情绪：不靠制造焦虑变现，不接诱导消费的广告。
- 不制造负罪感：没有「今日超标」红字、没有断签惩罚。

## Fork / 自己打包

官方包身份是 `app.moreless.mobile`，scheme 是 `moreless`。Fork 后请改掉，否则和官方包冲突：

```bash
ML_APP_ID=dev.example.moreless ML_SCHEME=morelessdev npx expo start
```

也可以直接改 `app.json`，或用环境变量覆盖（见 `app.config.js`）。上架前确认 app id 不再变化。

## 提交 PR

- 从 `main` 开分支，PR 描述里写清楚「改了什么 / 为什么 / 怎么验证」。
- 一个 PR 只做一件事；格式化、重命名之类的噪音改动尽量单独提。
- 提交信息用中文或英文都可以，建议 `fix:` / `feat:` / `docs:` / `chore:` 前缀。
- 不要提交 `.env`、`.npmrc`、签名文件、`.shots/`、`dist/`。
- 第一次贡献不需要签 CLA；按 MIT 许可提交即可。

## 行为准则

参与本项目即表示同意遵守 [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md)。
