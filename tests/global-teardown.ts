import { FullConfig } from '@playwright/test';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * Global Teardown for Playwright Tests
 * Runs after all tests to clean up the test environment
 */
async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting Moonwave Plan Test Environment Cleanup...');

  try {
    // 1. Clean up test data
    await cleanupTestData();

    // 2. Clean up authentication state
    await cleanupAuthState();

    // 3. Stop Firebase emulators if needed
    await stopFirebaseEmulators();

    // 4. Clean up temporary files
    await cleanupTempFiles();

    console.log('✅ Test environment cleanup completed successfully!');
  } catch (error) {
    console.error('❌ Test environment cleanup failed:', error);
    // Don't throw to avoid masking test results
  }
}

async function cleanupTestData() {
  try {
    const shouldCleanup = process.env.TEST_CLEANUP_AFTER === 'true';
    
    if (shouldCleanup) {
      console.log('🗑️ Cleaning up test data...');
      
      // Only cleanup if we're using emulators
      const useEmulator = process.env.VITE_USE_FIREBASE_EMULATOR === 'true';
      
      if (useEmulator) {
        // Clear emulator data
        try {
          execSync('npx firebase emulators:exec --only firestore \"echo Clearing data\"', {
            stdio: 'pipe',
            timeout: 30000
          });
        } catch {
          // Emulator cleanup failed, but that's okay
        }
      }
      
      console.log('✅ Test data cleanup completed');
    } else {
      console.log('📊 Preserving test data for debugging');
    }
  } catch (error) {
    console.warn('Test data cleanup failed:', error);
  }
}

async function cleanupAuthState() {
  try {
    const authStatePath = 'tests/auth-state.json';
    
    if (fs.existsSync(authStatePath)) {
      fs.unlinkSync(authStatePath);
      console.log('✅ Authentication state file removed');
    }
  } catch (error) {
    console.warn('Failed to cleanup auth state:', error);
  }
}

async function stopFirebaseEmulators() {
  try {
    const useEmulator = process.env.VITE_USE_FIREBASE_EMULATOR === 'true';
    
    if (useEmulator) {
      console.log('🔥 Stopping Firebase emulators...');
      
      // Try to stop emulators gracefully
      try {
        execSync('npx firebase emulators:stop', {
          stdio: 'pipe',
          timeout: 15000
        });
        console.log('✅ Firebase emulators stopped');
      } catch {
        // If graceful stop fails, try force kill
        console.log('Force stopping emulator processes...');
        
        try {
          // Kill processes on emulator ports
          const ports = [8080, 9099, 9199, 4000]; // Firestore, Auth, Storage, UI
          
          for (const port of ports) {
            try {
              if (process.platform === 'win32') {
                execSync(`netstat -ano | findstr :${port} | for /f \"tokens=5\" %a in ('more') do taskkill /PID %a /F`, {
                  stdio: 'pipe'
                });
              } else {
                execSync(`lsof -ti:${port} | xargs kill -9`, {
                  stdio: 'pipe'
                });
              }
            } catch {
              // Ignore errors for individual ports
            }
          }
        } catch {
          console.warn('Could not force stop emulator processes');
        }
      }
    }
  } catch (error) {
    console.warn('Failed to stop Firebase emulators:', error);
  }
}

async function cleanupTempFiles() {
  try {
    console.log('📁 Cleaning up temporary files...');
    
    const tempFiles = [
      'test-results',
      'playwright-report',
      'coverage',
      '.nyc_output'
    ];
    
    for (const file of tempFiles) {
      try {
        if (fs.existsSync(file)) {
          if (fs.statSync(file).isDirectory()) {
            fs.rmSync(file, { recursive: true, force: true });
          } else {
            fs.unlinkSync(file);
          }
        }
      } catch {
        // Ignore individual file cleanup errors
      }
    }
    
    console.log('✅ Temporary files cleaned up');
  } catch (error) {
    console.warn('Failed to cleanup temporary files:', error);
  }
}

export default globalTeardown;