import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom', // important for React
    coverage: {
      reporter: ['text', 'lcov']
    }
  }
});
