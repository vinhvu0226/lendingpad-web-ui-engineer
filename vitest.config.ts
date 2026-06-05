import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
      include: ['src/**/*.ts'],
      exclude: [
        'src/counter.ts',
        'src/edit-record.ts',
        'src/styles.ts',
        'src/main.ts',
        'src/**/*.test.ts',
      ],
    },
  },
})
