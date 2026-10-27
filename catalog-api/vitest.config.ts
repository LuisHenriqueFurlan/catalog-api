import { defineConfig } from 'vitest/config';
import swc from 'unplugin-swc';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  // O SWC emite os metadados de decorators (necessários para a DI do Nest).
  plugins: [tsconfigPaths(), swc.vite()],
  test: {
    globals: true,
    root: './',
    include: ['src/**/*.spec.ts', 'test/**/*.e2e-spec.ts'],
    fileParallelism: false,
    setupFiles: ['test/setup-env.ts'],
    hookTimeout: 120000,
    testTimeout: 30000,
  },
});
