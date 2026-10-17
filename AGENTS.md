# AGENTS.md — 多少 / moreless

> 工程约定与入口。产品取舍、代码结构、质量门槛写在这里；更长的说明放 `docs/`。

## 名字

- **中文产品名**：多少 —— 两层意思叠加：`how much`（量）＋「什么该多、什么该少」（自知与取舍）。
- **英文 / 工程名**：`moreless` —— 结构即「多·少」，同时是 `more or less`（差不多就好）的拆写。
- **slogan**：*More of what matters. Less of what doesn't.*
- **wordmark**：`more.less` —— 中间那个点不要省，它把「more or less 的错拼」变成「多 / 少」两栏。

## 产品态度（决定功能取舍）

1. **不是「省」，是「分配」。** 用户打开 App 该得到「我知道力气该放哪」，而不是「我又花超了」。
2. **不制造负罪感。** 没有「今日消费超标」红字、没有断签惩罚、没有排名和攀比。
3. **降低摩擦，不增加任务。** 小工具的定义是「打开 10 秒内解决问题」。任何需要先填五个字段才能用的功能，要么删掉，要么简化。
4. **它是用来「松」的，不是用来「管」的。** 任何让用户更焦虑的红点、提醒、推送，一律不做。

## 红线（不可协商）

1. **不做账号墙。** 首次打开即可用全部工具，数据默认只在本机。
2. **本地优先。** 工具与记录类数据先落本地；引入云端必须先回答「离线还能不能用」。
3. **不做焦虑型增长。** 不推送「你已经 N 天…」「你的朋友…」。通知只能由用户主动开启，且内容不评判。
4. **不卖情绪。** 这个 App 自己不靠制造焦虑变现，也不接诱导消费的广告——否则主旨自相矛盾。

## 开源与协作

- 仓库：<https://github.com/YukieUdon/moreless>
- 许可证：MIT（`LICENSE`）；Expo 模板和文档来源声明见 `THIRD_PARTY_NOTICES.md`
- 参与：`CONTRIBUTING.md`；安全：`SECURITY.md`；行为准则：`CODE_OF_CONDUCT.md`
- 本项目接受 AI 辅助开发。无论代码由谁写，合并门槛相同：类型检查、测试、lint、人工验收。

## 命名与标识（已定，勿改）

| 用途 | 值 |
|---|---|
| 仓库名 | `moreless` |
| 包名 / scope | `@moreless/*` |
| CLI | `moreless` |
| iOS / Android app id | `app.moreless.mobile` |
| Deep link | `moreless://` |
| 表名 / 字段前缀 | `ml_` |
| 环境变量前缀 | `ML_` |

> `app id` 上架后不可改。先确认 `moreless.app` / `moreless.dev` 域名在自己的名下，再反写成 app id。

## 技术栈（已定 2026-10-17）

**Expo (React Native) + TypeScript。** 选型依据：

- **真机验证快**：Expo Go 扫码即开，不用 Android Studio / Xcode / 模拟器；修改保存即刷新。
- **构建链路短**：EAS Build 云端出包，iOS 不需要 Mac。
- **生态成熟**：RN + TS 的类型、测试、lint 工具齐全，长期维护成本低。

不选纯网页（PWA）：原生通知、离线能力、应用商店分发都不如原生包。
不选 Flutter：现有工具链和代码都在 RN / TS 上，迁移成本大于收益。
不做 monorepo：单工程的 Metro 配置更简单，收益抵不过维护成本。

### 依赖规矩

- **装原生包一律 `npx expo install <pkg>`**，不要 `npm install`——前者会挑与 SDK 版本匹配的那个。
- 新增依赖前先说明理由；自己写 30 行能解决的，不引包。
- 包管理器固定 **npm**。不用 pnpm / yarn，Metro 的 hoisting 坑不值得。

### 命令

| 动作 | 命令 |
|---|---|
| 装依赖 | `npm install` |
| 手机预览 | `npm start` → Expo Go 扫码 |
| 浏览器预览 | `npm run web` |
| 加原生依赖 | `npx expo install <包名>` |
| 类型检查 | `npm run typecheck` |
| 单元测试 | `npm test` |
| Lint | `npm run lint` |
| 截图自查 | `npm run screenshots` |
| 依赖体检 | `npx expo-doctor` |
| 安卓安装包 | `npx eas build -p android --profile preview` |
| iOS 上架包 | `npx eas build -p ios --profile production` |

每次改完至少跑 `npm run typecheck`、`npm test`、`npm run lint`；CI 会再跑一遍。

## 工程结构

```
moreless/
├─ src/
│  ├─ app/                  Expo Router 页面；文件名即路由（_layout.tsx 定义导航）
│  ├─ core/                 纯逻辑：判断、计算、规则（禁止 import react / expo）
│  ├─ components/           可复用 UI
│  ├─ constants/theme.ts    颜色、字号、间距 token
│  ├─ hooks/                主题、偏好、收支数据 Provider
│  ├─ lib/                  存储、格式化、平台适配
│  └─ data/                 换算用的默认物品清单
├─ assets/                  图标、启动图
├─ docs/
│  ├─ expo.md               Expo 版本纪律
│  ├─ 隐私.md               隐私说明（上架 / 商店用）
│  └─ screenshots/          README 截图
├─ scripts/                 图标生成、网页截图
├─ .github/                 CI、Issue / PR 模板、Dependabot
├─ app.json / app.config.js 应用身份（app.config.js 支持 ML_APP_ID / ML_SCHEME）
├─ eas.json                 EAS 构建 profile
├─ CONTRIBUTING.md
├─ SECURITY.md
├─ CODE_OF_CONDUCT.md
├─ THIRD_PARTY_NOTICES.md
└─ AGENTS.md
```

原则：

- **判断逻辑必须落在 `src/core`，且不依赖 UI。** 规则能单独测试，改界面时才不会悄悄改坏算法。
- `src/app` 只做路由和页面组合；可复用组件放 `src/components`。
- 数据读写集中在 `src/hooks` / `src/lib`，不要散落在页面里。
- 新增逻辑要能单测；修 bug 先补一个能复现的回归测试。
- 不提交密钥、本地配置、构建产物；`.env`、`.npmrc`、`.shots/`、`dist/` 都在 gitignore 里。

## 质量门槛

- **TypeScript**：`tsconfig.json` 开启 `strict`，不靠 `@ts-ignore` 掩盖问题。
- **ESLint**：`eslint-config-expo`，`npm run lint` 必须 0 error / 0 warning。
- **Vitest**：`src/core` 的逻辑都要有测试，CI 会跑。
- **GitHub Actions**：push / PR 到 `main` 自动跑 typecheck、test、lint 和 Expo config 校验。
- **UI 改动**：至少附一张 `npm run screenshots` 的截图，并在 PR 里写「在哪个页面看什么」。
- **隐私**：不新增运行时网络请求；确实需要时，先在 Issue 里说明用途、数据范围和离线降级方案。

## Expo 版本纪律（写代码前必读）

本项目是 **Expo SDK 57**（以 `package.json` 里 `expo` 的版本为准）。Expo 每个 SDK 都会改名、移走、删掉 API，**不要凭记忆写 Expo / EAS / React Native 的代码**。

- 动 Expo API 前：先看 `package.json` 的 expo 大版本，再查 <https://docs.expo.dev/versions/v57.0.0/>。
- 拿不准就查 <https://docs.expo.dev/llms.txt> —— 官方索引，附常见误记纠正。
- 更细的规则在 `docs/expo.md`。

## 工作流

- **先方案后实现。** 跨 2 个以上文件、动数据模型、加权限，先开 Issue 说方案；单点 bug、文案、样式可以直接提 PR。
- **写入前重读文件。** 可能并行开着别的会话，上次读到的内容未必还是现在的。
- **一个 PR 只做一件事。** 格式化、重命名之类的噪音改动单独提。
- **收尾**：把长期有用的事实回写 `docs/`，不要只留在对话里；提交时只 `git add` 自己改过的文件。
- **交付要能被看见**：界面改动给一句「在手机 Expo Go 里点哪里、能看到什么」，并附截图；不要只回「已完成」。
- 提交信息用中文或英文都可以，建议 `fix:` / `feat:` / `docs:` / `chore:` 前缀。

## 已知坑

- **npm 走国内镜像**：本机可以保留一份 **未跟踪** 的根目录 `.npmrc`（已 gitignore），固定 `registry=https://registry.npmmirror.com`。本机直连 `registry.npmjs.org` 要 8 秒以上，装一次包像卡死；镜像 0.8 秒。仓库里只提交 `.npmrc.example`，不要把镜像地址推给所有贡献者。换到没有墙的网络时可以删掉本机的 `.npmrc`。
- **SDK 必须和手机上的 Expo Go 对齐**：Expo Go 每个版本只内置一个 SDK。当前真机测试用的是 **Expo Go 57.0.9**，所以项目锁在 SDK 57；升 SDK 前先确认真机上的 Expo Go 能跟着升，否则扫码会报 `Project is incompatible with this version of Expo Go`。
- **tsconfig 的 `extends` 必须写相对路径** `./node_modules/expo/tsconfig.base.json`。写成 `expo/tsconfig.base` 时 `tsc` 正常，但 vitest transform 解析不到，测试会以 `TSCONFIG_ERROR` 失败。
- **vitest 配置文件用 `.mts`**（`vitest.config.mts`），写成 `.ts` 会触发 Vite 的 CommonJS 加载警告。
- **图标一律用 `@expo/vector-icons` 的 MaterialCommunityIcons**，名字先在 `node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/MaterialCommunityIcons.json` 里确认存在，写错只会静默渲染成问号。
- **安卓弹键盘会把长表单的滚动位置清零**：`adjustResize` 压短窗口那一下，有的机型把 `ScrollView` 的 offset 归零，正在编辑的那一行被顶出屏幕。收支页已改成自己接管（`scrollsChildToFocus={false}` + 聚焦时记位置、键盘弹起后只补「被遮住的那点距离」，见 `src/app/(tabs)/plan.tsx` 的 `revealFocusedRow`）。以后新增长表单页照这个来，别再依赖系统自动滚动。

## 文档

- `README.md` —— 项目介绍、启动、数据与隐私、Fork / 打包。
- `CONTRIBUTING.md` —— 环境、预览、截图、提交前自查、PR 流程。
- `docs/隐私.md` —— 隐私说明，上架应用商店时可以直接用。
- `docs/expo.md` —— Expo 官方给的 SDK 版本纪律，动 Expo API 前读。
- `CHANGELOG.md` —— 版本记录（Keep a Changelog / SemVer）。
- `SECURITY.md` / `CODE_OF_CONDUCT.md` —— 安全报告与行为准则。
- `THIRD_PARTY_NOTICES.md` —— Expo 模板与文档来源的 MIT 声明。
