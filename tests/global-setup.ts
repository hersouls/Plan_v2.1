import { chromium, FullConfig } from '@playwright/test';
import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * Global Setup for Playwright Tests
 * Runs before all tests to prepare the test environment
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting Moonwave Plan Test Environment Setup...');

  try {
    // 1. Check if Firebase emulators are needed
    const useEmulator = process.env.VITE_USE_FIREBASE_EMULATOR === 'true';
    
    if (useEmulator) {
      console.log('🔥 Starting Firebase Emulators...');
      await startFirebaseEmulators();
    }

    // 2. Set up test data
    console.log('📊 Setting up test data...');
    await setupTestData();

    // 3. Create test authentication state
    console.log('👤 Setting up test authentication...');
    await setupTestAuth();

    // 4. Verify application is accessible
    console.log('🌐 Verifying application accessibility...');
    await verifyApplication();

    console.log('✅ Test environment setup completed successfully!');
  } catch (error) {
    console.error('❌ Test environment setup failed:', error);
    throw error;
  }
}

async function startFirebaseEmulators() {
  try {
    // Check if emulators are already running
    const emulatorsRunning = await checkEmulatorsRunning();
    
    if (!emulatorsRunning) {
      console.log('Starting Firebase emulators...');
      // Start emulators in background using spawn
      const emulatorProcess = spawn('npx', ['firebase', 'emulators:start', '--only', 'auth,firestore,storage'], {
        detached: true,
        stdio: 'pipe'
      });
      
      // Don't wait for the process to complete, let it run in background
      emulatorProcess.unref();
      
      // Wait for emulators to be ready
      await waitForEmulators();
    } else {
      console.log('Firebase emulators already running');
    }
  } catch (error) {
    console.warn('Failed to start Firebase emulators:', error);
    // Continue without emulators if they fail to start
  }
}

async function checkEmulatorsRunning(): Promise<boolean> {
  try {
    const response = await fetch('http://localhost:8080');
    return response.ok;
  } catch {
    return false;
  }
}

async function waitForEmulators() {
  const maxAttempts = 30;
  const delay = 1000;
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const firestoreResponse = await fetch('http://localhost:8080');
      const authResponse = await fetch('http://localhost:9099');
      
      if (firestoreResponse.ok && authResponse.ok) {
        console.log('✅ Firebase emulators are ready!');
        return;
      }
    } catch {
      // Continue waiting
    }
    
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  throw new Error('Firebase emulators failed to start within timeout');
}

async function setupTestData() {
  try {
    // Run the test data setup script
    console.log('Executing test data setup...');
    execSync('node scripts/setupTestData.js', {
      stdio: 'pipe',
      timeout: 60000,
      env: { ...process.env, NODE_ENV: 'test' }
    });
    console.log('✅ Test data setup completed');
  } catch (error) {
    console.warn('Test data setup failed, continuing with mock data:', error);
  }
}

async function setupTestAuth() {
  try {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    // Navigate to the application
    await page.goto(process.env.TEST_BASE_URL || 'http://localhost:3004');

    // Try to perform anonymous login for test state
    try {
      await page.waitForSelector('[data-testid=\"anonymous-login\"], button:has-text(\"로그인\"), button:has-text(\"시작하기\")', { timeout: 10000 });
      
      const loginButton = page.locator('[data-testid=\"anonymous-login\"], button:has-text(\"시작하기\")').first();
      if (await loginButton.isVisible()) {
        await loginButton.click();
        await page.waitForNavigation({ timeout: 10000 });
      }
    } catch (error) {
      console.log('No login needed or login failed, continuing...');
    }

    // Save authentication state for reuse in tests
    await context.storageState({ path: 'tests/auth-state.json' });
    
    await browser.close();
    console.log('✅ Test authentication state saved');
  } catch (error) {
    console.warn('Failed to setup test auth, tests will handle auth individually:', error);
  }
}

async function verifyApplication() {
  try {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    await page.goto(process.env.TEST_BASE_URL || 'http://localhost:3004');
    
    // Wait for the app to load
    await page.waitForSelector('body', { timeout: 30000 });
    
    // Check if the app loads without critical errors
    const title = await page.title();
    if (!title.includes('Moonwave') && !title.includes('Plan')) {
      throw new Error(`Unexpected page title: ${title}`);
    }
    
    await browser.close();
    console.log('✅ Application is accessible and loads correctly');
  } catch (error) {
    console.error('Application verification failed:', error);
    throw error;
  }
}

export default globalSetup;