import { defineConfig } from 'vite';
import { defineConfig as defineVitestConfig, mergeConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

const isProduction = process.env.NODE_ENV === 'production';

const profiling = isProduction && {
  'react-dom/client': 'react-dom/profiling',
};

// https://vitejs.dev/config/
export default mergeConfig(
  defineConfig({
    plugins: [react()],
    resolve: {
      alias: {
        ...profiling, // for profile at runtime
      },
    },
  }),
  defineVitestConfig({
    test: {
      include: ['src/**/__test__/*'],
      environment: 'jsdom',
    },
  })
);
