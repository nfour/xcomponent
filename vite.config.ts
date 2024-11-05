import reactPlugin from '@vitejs/plugin-react';
import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
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
  },
  resolve: {
    alias: [
      {
        find: /^~\/(.+)/,
        replacement: resolve('./src/$1'),
      },
    ],
  },
});
