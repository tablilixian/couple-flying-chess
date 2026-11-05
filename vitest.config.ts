import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// 独立于 vite.config.ts：测试只跑逻辑层，不需要 base / 部署路径
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    // 持久化层是本次稳定化的重点，优先保证这几组用例稳定
    sequence: { shuffle: false },
  },
});
