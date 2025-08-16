import { Page, expect } from '@playwright/test'

/**
 * MCP Test Helpers for Moonwave Plan
 * Advanced testing utilities for complex interactions
 */

export class MCPTestHelpers {
  constructor(private page: Page) {}

  /**
   * Wait for Firebase authentication to complete
   */
  async waitForAuth(timeout = 10000) {
    await this.page.waitForFunction(
      () => window.firebase?.auth?.currentUser !== undefined,
      { timeout }
    )
  }

  /**
   * Mock Firebase for testing without real backend
   */
  async mockFirebase() {
    await this.page.addInitScript(() => {
      // Mock Firebase objects
      window.mockFirebase = {
        auth: {
          currentUser: null,
          signInAnonymously: () => Promise.resolve({ user: { uid: 'test-user' } }),
          onAuthStateChanged: (callback: any) => {
            setTimeout(() => callback({ uid: 'test-user' }), 100)
            return () => {}
          }
        },
        firestore: {
          collection: () => ({
            doc: () => ({
              get: () => Promise.resolve({ exists: true, data: () => ({}) }),
              set: () => Promise.resolve(),
              update: () => Promise.resolve(),
              delete: () => Promise.resolve(),
              onSnapshot: (callback: any) => {
                callback({ docs: [] })
                return () => {}
              }
            }),
            add: () => Promise.resolve({ id: 'test-doc-id' }),
            where: () => ({ get: () => Promise.resolve({ docs: [] }) })
          })
        }
      }
    })
  }

  /**
   * Wait for PWA installation prompt
   */
  async waitForPWAPrompt() {
    return await this.page.waitForEvent('dialog', { timeout: 5000 })
      .catch(() => null)
  }

  /**
   * Simulate offline mode
   */
  async goOffline() {
    await this.page.context().setOffline(true)
    await this.page.reload()
  }

  /**
   * Simulate online mode
   */
  async goOnline() {
    await this.page.context().setOffline(false)
    await this.page.reload()
  }

  /**
   * Wait for service worker registration
   */
  async waitForServiceWorker() {
    await this.page.waitForFunction(
      () => 'serviceWorker' in navigator && navigator.serviceWorker.ready,
      { timeout: 10000 }
    )
  }

  /**
   * Check if push notifications are supported
   */
  async isPushSupported(): Promise<boolean> {
    return await this.page.evaluate(() => {
      return 'serviceWorker' in navigator && 'PushManager' in window
    })
  }

  /**
   * Grant notification permissions
   */
  async grantNotificationPermission() {
    await this.page.context().grantPermissions(['notifications'])
  }

  /**
   * Wait for real-time data update
   */
  async waitForRealtimeUpdate(selector: string, expectedText: string) {
    await expect(this.page.locator(selector)).toContainText(expectedText, {
      timeout: 15000
    })
  }

  /**
   * Create test task data
   */
  createTestTaskData() {
    return {
      title: `Test Task ${Date.now()}`,
      description: 'Automated test task',
      category: 'household',
      priority: 'medium',
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    }
  }

  /**
   * Create test user data
   */
  createTestUserData() {
    return {
      uid: `test-user-${Date.now()}`,
      displayName: 'Test User',
      email: 'test@moonwave.kr',
    }
  }

  /**
   * Simulate typing with realistic delays
   */
  async typeRealistic(selector: string, text: string) {
    const input = this.page.locator(selector)
    await input.click()
    await input.clear()
    
    for (const char of text) {
      await input.type(char)
      await this.page.waitForTimeout(Math.random() * 100 + 50) // 50-150ms delay
    }
  }

  /**
   * Take screenshot with timestamp
   */
  async takeTimestampedScreenshot(name: string) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    await this.page.screenshot({
      path: `test-results/screenshots/${name}-${timestamp}.png`,
      fullPage: true
    })
  }

  /**
   * Wait for loading to complete
   */
  async waitForLoadingComplete() {
    // Wait for loading spinner to disappear
    await this.page.waitForSelector('[data-testid="loading-spinner"]', { 
      state: 'detached', 
      timeout: 10000 
    }).catch(() => {})
    
    // Wait for network to be idle
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Check for console errors
   */
  async getConsoleErrors(): Promise<string[]> {
    const errors: string[] = []
    
    this.page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })
    
    return errors
  }
}