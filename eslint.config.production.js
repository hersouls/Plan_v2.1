import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { 
    ignores: [
      'dist',
      'build', 
      'coverage',
      'node_modules',
      '*.min.js',
      '*.d.ts',
      // Exclude problematic files for production builds
      'public/**/*.js',
      'scripts/**/*',
      'functions/**/*',
      'tests/**/*',
      'src/**/*.test.ts',
      'src/**/*.test.tsx',
      'src/**/__tests__/**/*',
      // Legacy/migration files that may have issues
      'src/utils/seed-data.ts',
      'src/lib/migration.ts',
      'vite.config.ts',
      'playwright.config.ts',
      '*.config.js',
      '*.config.ts'
    ] 
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2020,
      },
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      // More lenient rules for production build
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/ban-ts-comment': 'warn',
      'prefer-const': 'error',
      'no-var': 'error',
      'no-console': 'warn',
      // Allow some flexibility during development
      '@typescript-eslint/no-non-null-assertion': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  {
    // Special rules for test files
    files: ['src/**/*.test.{ts,tsx}', 'src/**/*.spec.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      'no-console': 'off',
    },
  }
);