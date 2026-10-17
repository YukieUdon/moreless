/**
 * CSS 只在 web 上作为副作用 import。
 *
 * Expo 会在本地生成 `expo-env.d.ts` 提供这类声明，但那个文件是 gitignored 的；
 * CI 里没有它，`tsc --noEmit` 会报 `Cannot find module '*.css'`。
 * 这里补一个最小声明，让类型检查不依赖本地生成物。
 */
declare module '*.css';
