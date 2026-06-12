import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    // React 19 only exposes `act` in its development build. If NODE_ENV=production
    // leaks in from the parent shell, react/react-dom resolve their production CJS
    // builds and @testing-library/react fails with "React.act is not a function"
    // (164-test failure documented in docs/CODEMAPS/10-test-and-build-status.md).
    env: { NODE_ENV: 'test' },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
