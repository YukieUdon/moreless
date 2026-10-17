# 安全策略

## 支持范围

| 版本 | 支持 |
|---|---|
| `main` 分支 | ✅ |
| 已发布的旧版本 | 尽力而为 |

## 报告漏洞

**请不要在公开 Issue 里贴漏洞细节。**

请通过 GitHub 的私密安全公告报告：

<https://github.com/YukieUdon/moreless/security/advisories/new>

也可以在 GitHub 上联系维护者 [@YukieUdon](https://github.com/YukieUdon)，说明复现步骤和影响。

## 这个项目的攻击面

- App 是本地优先的，没有后端、没有账号、没有云同步；发布包不发起业务网络请求。
- 数据存在设备本地的 AsyncStorage，卸载或「我的 → 清空收支数据」即删除。
- 仓库里不应出现任何密钥、签名、`.env`、真实用户数据；如果你发现了，请按上面的方式私密报告。

## 依赖漏洞

依赖漏洞优先通过 Dependabot 和安全公告跟进。涉及 Expo / React Native 上游的，可能需要等上游修复后再升级 SDK。

## 响应

这是个人维护的开源项目，维护者会尽力在 7 天内确认收到报告；复杂问题的时间线会在私密公告里同步。
