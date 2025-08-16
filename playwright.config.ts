import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// Load environment variables for testing
dotenv.config({ path: '.env.test' });
dotenv.config({ path: '.env.example' });

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: !process.env.TEST_SEQUENTIAL, // Allow sequential testing via flag
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : (process.env.TEST_SEQUENTIAL ? 1 : undefined),
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }]
  ],
  use: {
    baseURL: process.env.TEST_BASE_URL || 'http://localhost:3004',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Test specific configurations
    headless: process.env.CI ? true : false,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    // Extended timeout for Firebase operations
    actionTimeout: 15000,
    navigationTimeout: 30000,
    // Test data and environment
    extraHTTPHeaders: {
      'X-Test-Environment': 'playwright',
      'X-Test-User': process.env.TEST_USER_EMAIL || 'dad@moonwave.test'
    },
  },
  // Global test timeout
  timeout: process.env.TEST_TIMEOUT ? parseInt(process.env.TEST_TIMEOUT) : 60000,
  expect: {
    // Extended timeout for Firebase assertions
    timeout: 15000,
  },
  // Test metadata and reporting
  metadata: {
    testEnvironment: process.env.NODE_ENV || 'test',
    firebaseProject: process.env.VITE_FIREBASE_PROJECT_ID || 'plan-e7bc6',
    testUser: process.env.TEST_USER_EMAIL || 'dad@moonwave.test'
  },
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Enable service worker for PWA testing
        contextOptions: {
          permissions: ['notifications']
        }
      },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    // MCP Mobile Testing
    {
      name: 'Mobile Chrome',
      use: { 
        ...devices['Pixel 5'],
        contextOptions: {
          permissions: ['notifications']
        }
      },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
    // MCP PWA Testing
    {
      name: 'PWA Chrome',
      use: {
        ...devices['Desktop Chrome'],
        contextOptions: {
          permissions: ['notifications'],
          serviceWorkers: 'allow'
        }
      },
    },
  ],
  webServer: {
    command: 'npm run dev -- --port 3004',
    url: 'http://localhost:3004',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutes
    env: {
      NODE_ENV: 'test',
      VITE_USE_FIREBASE_EMULATOR: 'true',
      VITE_FIREBASE_AUTH_EMULATOR_URL: 'http://localhost:9099',
      VITE_FIREBASE_FIRESTORE_EMULATOR_HOST: 'localhost:8080'
    }
  },
  // Global setup and teardown
  globalSetup: './tests/global-setup.ts',
  globalTeardown: './tests/global-teardown.ts',
}); 