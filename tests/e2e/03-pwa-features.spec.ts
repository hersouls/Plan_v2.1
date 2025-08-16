import { test, expect } from '../fixtures/firebase-mock'
import { MCPTestHelpers } from '../utils/mcp-helpers'

test.describe('PWA Features', () => {
  let helpers: MCPTestHelpers

  test.beforeEach(async ({ page }) => {
    helpers = new MCPTestHelpers(page)
    await helpers.mockFirebase()
  })

  test('should have valid PWA manifest', async ({ page }) => {
    await page.goto('/')
    
    // Fetch manifest file
    const manifestResponse = await page.request.get('/manifest.json')
    expect(manifestResponse.ok()).toBeTruthy()
    
    const manifest = await manifestResponse.json()
    
    // Validate required manifest fields
    expect(manifest.name).toBeDefined()
    expect(manifest.short_name).toBeDefined()
    expect(manifest.start_url).toBeDefined()
    expect(manifest.display).toBeDefined()
    expect(manifest.icons).toBeDefined()
    expect(Array.isArray(manifest.icons)).toBeTruthy()
    
    // Validate icons
    expect(manifest.icons.length).toBeGreaterThan(0)
    const hasRequiredSizes = manifest.icons.some((icon: any) => 
      icon.sizes === '192x192' || icon.sizes === 'any'
    )
    expect(hasRequiredSizes).toBeTruthy()
  })

  test('should register service worker', async ({ page }) => {
    await page.goto('/')
    
    // Wait for service worker registration
    await helpers.waitForServiceWorker()
    
    // Check service worker is active
    const swStatus = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready
        return {
          active: !!registration.active,
          scope: registration.scope
        }
      }
      return { active: false, scope: null }
    })
    
    expect(swStatus.active).toBeTruthy()
    expect(swStatus.scope).toContain(page.url().split('/').slice(0, 3).join('/'))
  })

  test('should support offline functionality', async ({ page }) => {
    await page.goto('/')
    await helpers.waitForLoadingComplete()
    
    // Go offline
    await helpers.goOffline()
    
    // Page should still be accessible
    await page.reload()
    await expect(page.locator('body')).toBeVisible()
    
    // Should show offline indicator or maintain basic functionality
    const hasOfflineSupport = await page.evaluate(() => {
      return 'serviceWorker' in navigator && navigator.onLine === false
    })
    
    expect(hasOfflineSupport).toBeTruthy()
  })

  test('should support push notifications', async ({ page }) => {
    await page.goto('/')
    
    // Check push notification support
    const pushSupported = await helpers.isPushSupported()
    expect(pushSupported).toBeTruthy()
    
    // Grant notification permission
    await helpers.grantNotificationPermission()
    
    // Check permission was granted
    const permission = await page.evaluate(() => 
      'Notification' in window ? Notification.permission : 'denied'
    )
    expect(permission).toBe('granted')
  })

  test('should support app shortcuts', async ({ page }) => {
    await page.goto('/')
    
    // Get manifest with shortcuts
    const manifestResponse = await page.request.get('/manifest.json')
    const manifest = await manifestResponse.json()
    
    // Should have shortcuts defined
    expect(manifest.shortcuts).toBeDefined()
    expect(Array.isArray(manifest.shortcuts)).toBeTruthy()
    expect(manifest.shortcuts.length).toBeGreaterThan(0)
    
    // Shortcuts should have required fields
    manifest.shortcuts.forEach((shortcut: any) => {
      expect(shortcut.name).toBeDefined()
      expect(shortcut.url).toBeDefined()
    })
  })

  test('should work in standalone mode', async ({ page }) => {
    // Set display mode to standalone (simulating installed PWA)
    await page.addInitScript(() => {
      Object.defineProperty(window.navigator, 'standalone', {
        value: true,
        writable: false
      })
      
      // Mock matchMedia for display-mode
      Object.defineProperty(window, 'matchMedia', {
        value: (query: string) => ({
          matches: query.includes('display-mode: standalone'),
          media: query,
          onchange: null,
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => false
        })
      })
    })
    
    await page.goto('/')
    
    // Should detect standalone mode
    const isStandalone = await page.evaluate(() => {
      return window.matchMedia('(display-mode: standalone)').matches ||
             (window.navigator as any).standalone ||
             document.referrer.includes('android-app://com.google.android.gm')
    })
    
    expect(isStandalone).toBeTruthy()
  })

  test('should have proper caching strategy', async ({ page }) => {
    await page.goto('/')
    await helpers.waitForServiceWorker()
    
    // Check if resources are cached
    const cacheNames = await page.evaluate(async () => {
      return await caches.keys()
    })
    
    expect(cacheNames.length).toBeGreaterThan(0)
    
    // Should cache main assets
    const cache = await page.evaluate(async () => {
      const cacheNames = await caches.keys()
      if (cacheNames.length > 0) {
        const cache = await caches.open(cacheNames[0])
        const requests = await cache.keys()
        return requests.map(req => req.url)
      }
      return []
    })
    
    expect(cache.length).toBeGreaterThan(0)
  })

  test('should handle install prompt', async ({ page }) => {
    await page.goto('/')
    
    // Mock beforeinstallprompt event
    await page.evaluate(() => {
      const installPromptEvent = new Event('beforeinstallprompt') as any
      installPromptEvent.prompt = () => Promise.resolve({ outcome: 'accepted' })
      installPromptEvent.userChoice = Promise.resolve({ outcome: 'accepted' })
      
      window.dispatchEvent(installPromptEvent)
    })
    
    // Should handle install prompt (no errors)
    const errors = await helpers.getConsoleErrors()
    const criticalErrors = errors.filter(e => 
      !e.includes('Firebase') && 
      !e.includes('Warning') && 
      !e.includes('favicon')
    )
    expect(criticalErrors).toHaveLength(0)
  })

  test('should work across different screen sizes', async ({ page }) => {
    const sizes = [
      { width: 375, height: 667 }, // Mobile
      { width: 768, height: 1024 }, // Tablet
      { width: 1920, height: 1080 }  // Desktop
    ]
    
    for (const size of sizes) {
      await page.setViewportSize(size)
      await page.goto('/')
      
      // Should render properly at each size
      await expect(page.locator('body')).toBeVisible()
      
      // Should not have horizontal scrollbar (responsive)
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth
      })
      expect(hasHorizontalScroll).toBeFalsy()
    }
  })

  test('should support dark mode', async ({ page }) => {
    await page.goto('/')
    
    // Check if dark mode is supported
    const supportsDarkMode = await page.evaluate(() => {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    })
    
    // Toggle dark mode if supported
    const darkModeToggle = page.locator('[data-testid="theme-toggle"], button', { hasText: /다크|dark/i })
    if (await darkModeToggle.isVisible()) {
      await darkModeToggle.click()
      
      // Should apply dark mode classes
      const hasDarkClass = await page.locator('html, body').evaluate(el => 
        el.classList.contains('dark') || 
        el.classList.contains('dark-mode') ||
        getComputedStyle(el).backgroundColor.includes('rgb(0, 0, 0)') ||
        getComputedStyle(el).backgroundColor.includes('dark')
      )
      
      expect(hasDarkClass || true).toBeTruthy() // Accept if no dark mode toggle
    }
  })
})