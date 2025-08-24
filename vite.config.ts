import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  loadEnv(mode, process.cwd(), '');

  return {
    // Use root path for Vercel deployment
    base: '/',
    plugins: [
      react(),
      tsconfigPaths({
        // 루트 tsconfig만 사용하여 외부 서브패키지의 tsconfig 파싱 에러 회피
        projects: ['tsconfig.json', 'tsconfig.app.json'],
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@hooks': path.resolve(__dirname, './src/hooks'),
        '@utils': path.resolve(__dirname, './src/utils'),
        '@types': path.resolve(__dirname, './src/types'),
        '@data': path.resolve(__dirname, './src/data'),
        '@styles': path.resolve(__dirname, './src/styles'),
        // Ensure a single React instance is used across the app and any linked packages
        react: path.resolve(__dirname, 'node_modules/react'),
        'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
        // Ensure jsx-runtime resolves to the same React package
        'react/jsx-runtime': path.resolve(
          __dirname,
          'node_modules/react/jsx-runtime.js'
        ),
        'react/jsx-dev-runtime': path.resolve(
          __dirname,
          'node_modules/react/jsx-dev-runtime.js'
        ),
      },
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
      dedupe: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
      ],
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
          // 외부화 규칙: 런타임에 로드되거나, 노드 내장/전역 의존성은 외부 처리
          // 현재 프로젝트는 브라우저 앱이므로 대부분 번들에 포함. Firebase optional은 분리(dyn import)만 허용
          const optionalFirebase = [
            'firebase/analytics',
            'firebase/performance',
            'firebase/messaging',
          ];
          if (optionalFirebase.some(pkg => id.includes(pkg))) {
            return false; // 번들 포함(동적 import 경로 유지) → external 아님
          }
          // node 내장 모듈은 외부화
          const nodeBuiltins = ['fs', 'path', 'os', 'crypto', 'stream'];
          if (nodeBuiltins.includes(id)) return true;
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
