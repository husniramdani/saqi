import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/coverage/**',
      '**/node_modules/**',
      'apps/api/src/db/migrations/**',
      // Vercel CLI build caches and output (`vercel build`, corepack downloads).
      '**/.vercel/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    languageOptions: { globals: { ...globals.node } },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    ...jsxA11y.flatConfigs.recommended,
    languageOptions: {
      ...jsxA11y.flatConfigs.recommended.languageOptions,
      globals: { ...globals.browser },
    },
  },
  {
    // App code only: Playwright's fixture callback `use` (apps/web/e2e) isn't a React hook.
    files: ['apps/web/src/**/*.{ts,tsx}'],
    ...reactHooks.configs.flat.recommended,
  },
  {
    files: ['apps/web/**/*.tsx'],
    rules: {
      // A labelled scroll box (role="region") must be focusable so keyboards can scroll it
      // (axe scrollable-region-focusable); tabpanel is the rule's own default.
      'jsx-a11y/no-noninteractive-tabindex': ['error', { roles: ['tabpanel', 'region'] }],
    },
  },
  {
    // The engine is pure: time and randomness are inputs, never ambient.
    files: ['packages/engine/**/*.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.object.name='Date'][callee.property.name='now']",
          message: 'The engine is pure: pass `now` in instead of calling Date.now().',
        },
        {
          selector: "MemberExpression[object.name='Math'][property.name='random']",
          message: 'The engine is deterministic: no Math.random().',
        },
      ],
    },
  },
);
