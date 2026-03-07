import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

// Vitest globals injected via `globals: true` in vite.config.ts
const vitestGlobals = {
  describe: 'readonly',
  it: 'readonly',
  test: 'readonly',
  expect: 'readonly',
  beforeEach: 'readonly',
  afterEach: 'readonly',
  beforeAll: 'readonly',
  afterAll: 'readonly',
  vi: 'readonly',
};

const browserGlobals = {
  window: 'readonly',
  document: 'readonly',
  console: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly',
  setInterval: 'readonly',
  clearInterval: 'readonly',
  requestAnimationFrame: 'readonly',
  cancelAnimationFrame: 'readonly',
  fetch: 'readonly',
  URL: 'readonly',
  URLSearchParams: 'readonly',
  Worker: 'readonly',
  performance: 'readonly',
  navigator: 'readonly',
  localStorage: 'readonly',
  AudioContext: 'readonly',
  AudioBuffer: 'readonly',
  SVGSVGElement: 'readonly',
  HTMLDivElement: 'readonly',
  HTMLInputElement: 'readonly',
  HTMLTextAreaElement: 'readonly',
  MouseEvent: 'readonly',
  Node: 'readonly',
  DOMPoint: 'readonly',
  React: 'readonly',
  Storage: 'readonly',
  Event: 'readonly',
  MessageEvent: 'readonly',
  RTCPeerConnection: 'readonly',
  RTCSessionDescription: 'readonly',
  RTCIceServer: 'readonly',
  RTCDataChannel: 'readonly',
  atob: 'readonly',
  btoa: 'readonly',
  queueMicrotask: 'readonly',
  Element: 'readonly',
};

export default [
  js.configs.recommended,
  {
    // All TypeScript/TSX source files
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
      globals: browserGlobals,
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
  {
    // Test files: add Vitest globals, relax rules for mocking patterns
    files: ['src/**/*.test.{ts,tsx}'],
    languageOptions: {
      globals: vitestGlobals,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    // Web Worker files: add worker globals (self, MessageEvent, postMessage)
    files: ['src/**/*worker*.ts'],
    languageOptions: {
      globals: {
        self: 'readonly',
        MessageEvent: 'readonly',
        postMessage: 'readonly',
      },
    },
  },
  {
    // Engine purity: no React, testing-library, or UI imports allowed (ENG-12)
    // Applied to non-test engine files only (test files import testing utilities)
    files: ['src/engine/**/*.ts'],
    ignores: ['src/engine/**/*.test.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            'react*',
            '@testing-library/*',
            '../components/*',
            '../../components/*',
            '../hooks/*',
            '../../hooks/*',
          ],
        },
      ],
    },
  },
];
