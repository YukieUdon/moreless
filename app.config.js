/**
 * 动态 Expo 配置：app.json 仍是默认值，这里只允许用环境变量覆盖包身份。
 *
 * Fork 这个项目时务必改掉 app id / scheme，否则会和官方包冲突：
 *
 *   ML_APP_ID=dev.example.moreless npx expo start
 *   ML_SCHEME=morelessdev npx eas build -p android --profile preview
 */
const appJson = require('./app.json');

const DEFAULT_APP_ID = 'app.moreless.mobile';
const DEFAULT_SCHEME = 'moreless';

module.exports = ({ config }) => {
  const base = { ...appJson.expo, ...(config ?? {}) };
  const appId = process.env.ML_APP_ID || base.ios?.bundleIdentifier || DEFAULT_APP_ID;

  return {
    ...base,
    scheme: process.env.ML_SCHEME || base.scheme || DEFAULT_SCHEME,
    ios: {
      ...(base.ios ?? {}),
      bundleIdentifier: appId,
    },
    android: {
      ...(base.android ?? {}),
      package: appId,
    },
  };
};
