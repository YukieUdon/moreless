const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/**', '.expo/**', '.shots/**', 'node_modules/**'],
  },
  {
    // scripts/ 是 Node 脚本，不是 RN 运行时；Buffer 只在浏览器调试协议里用
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      globals: { Buffer: 'readonly' },
    },
  },
]);
