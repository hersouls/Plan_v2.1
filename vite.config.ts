import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    // Use root path for Vercel deployment
    base: '/',
    plugins: [react(), tsconfigPaths()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@hooks': path.resolve(__dirname, './src/hooks'),
        '@utils': path.resolve(__dirname, './src/utils'),
        '@types': path.resolve(__dirname, './src/types'),
        '@data': path.resolve(__dirname, './src/data'),
        '@styles': path.resolve(__dirname, './src/styles'),
      },
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
      dedupe: ['react', 'react-dom'],
    },
    server: {
      host: 'localhost',
      port: 5173,
      strictPort: true, // 다른 프로세스가 쓰면 즉시 실패
      open: true,
      fs: {
        strict: false,
        allow: ['..'],
      },
      hmr: {
        host: 'localhost',
        port: 5173,
        clientPort: 5173,
        protocol: 'ws',
      },
      // 프록시 완전 제거 - Vite 단독 실행 보장
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      commonjsOptions: { include: [/node_modules/] },
      rollupOptions: {
        external: id => {
          // Exclude Firebase optional services from main bundle
          if (
            id.includes('firebase/analytics') ||
            id.includes('firebase/performance') ||
            id.includes('firebase/messaging')
          ) {
            return false; // Let them be dynamically imported
          }
          return false;
        },
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            router: ['react-router-dom'],
            ui: [
              'lucide-react',
              '@radix-ui/react-dialog',
              '@radix-ui/react-dropdown-menu',
              '@radix-ui/react-popover',
              '@radix-ui/react-select',
              '@radix-ui/react-tabs',
            ],
            firebase: [
              'firebase/app',
              'firebase/auth',
              'firebase/firestore',
              'firebase/storage',
            ],
            // Note: analytics, performance, messaging excluded for dynamic loading
            utils: [
              'date-fns',
              'clsx',
              'class-variance-authority',
              'tailwind-merge',
            ],
          },
        },
      },
      chunkSizeWarningLimit: 1000,
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'lucide-react',
        'date-fns',
        'recharts',
        'firebase/app',
        'firebase/auth',
        'firebase/firestore',
      ],
      exclude: [],
    },
    define: {
      global: 'globalThis',
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
      __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
    },
    envPrefix: ['VITE_'],
    // TypeScript 모듈 처리 설정
    esbuild: {
      loader: 'tsx',
      include: ['src/**/*.ts', 'src/**/*.tsx'],
    },
    // 추가 설정
    css: {
      devSourcemap: true,
    },
  };
});
