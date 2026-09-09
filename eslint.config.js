import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import prettier from 'eslint-config-prettier'

export default [
  { ignores: ['dist', 'node_modules', '.qa'] },

  // 通用推荐规则（所有 JS/JSX）
  js.configs.recommended,

  // 源码：浏览器全局 + React Hooks
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
  },

  // Fast refresh 只针对 React 组件文件
  {
    files: ['src/**/*.jsx'],
    rules: {
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },

  // 构建脚本 / Vite 配置：Node 全局；qa-* 的 page.evaluate 回调跑在浏览器，故兼收
  {
    files: ['scripts/**/*.mjs', 'vite.config.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.node, ...globals.browser },
    },
  },

  // 关闭与 Prettier 冲突的格式类规则
  prettier,
]
