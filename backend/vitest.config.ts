import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    fileParallelism: false,
    hookTimeout: 60000,
    testTimeout: 30000,
    setupFiles: ['./src/test/setup.ts'],
  },
});
