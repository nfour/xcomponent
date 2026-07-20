import reactPlugin from '@vitejs/plugin-react';
import { resolve } from 'path';
import { defineConfig } from 'vite-plus';

export default defineConfig({
  fmt: {
    trailingComma: 'all',
    semi: true,
    singleQuote: true,
    quoteProps: 'consistent',
    bracketSpacing: true,
    arrowParens: 'always',
    tabWidth: 2,
    printWidth: 80,
    sortPackageJson: false,
    ignorePatterns: [],
  },
  plugins: [
    reactPlugin({
      jsxImportSource: '@emotion/react',
      include: ['**/*.tsx', '**/*.ts'],
    }),
  ],
  preview: {
    open: false,
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.spec.{ts,tsx}'],
  },
  resolve: {
    alias: [
      {
        find: /^~\/(.+)/,
        replacement: resolve('./src/stories/demoApp/$1'),
      },
    ],
  },
});
