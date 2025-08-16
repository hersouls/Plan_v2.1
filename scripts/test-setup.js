#!/usr/bin/env node

/**
 * Testing Infrastructure Setup
 * Creates comprehensive test coverage and CI/CD integration
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

console.log('🧪 Moonwave Plan Testing Setup')
console.log('=============================')

// Create test directory structure
const testDirs = [
  'src/__tests__',
  'src/components/__tests__',
  'src/hooks/__tests__',
  'src/utils/__tests__',
  'tests/e2e',
  'tests/fixtures'
]

console.log('\n📁 Creating test directories...')
testDirs.forEach(dir => {
  const fullPath = path.join(projectRoot, dir)
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true })
    console.log(`✅ Created ${dir}`)
  } else {
    console.log(`✓ ${dir} already exists`)
  }
})

// Create basic test files
const testFiles = {
  'src/__tests__/App.test.tsx': `
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import App from '../App'

// Mock Firebase to avoid initialization in tests
jest.mock('../lib/firebase', () => ({
  auth: {},
  db: {},
  storage: {}
}))

// Mock contexts to avoid Firebase dependencies
jest.mock('../contexts', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  AppProvider: ({ children }: { children: React.ReactNode }) => children,
  TaskProvider: ({ children }: { children: React.ReactNode }) => children,
  DataProvider: ({ children }: { children: React.ReactNode }) => children,
}))

const renderApp = () => {
  render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  )
}

describe('App', () => {
  test('renders without crashing', () => {
    renderApp()
    // Basic render test
    expect(document.body).toBeInTheDocument()
  })

  test('has wave background', () => {
    renderApp()
    // Check for visual elements (this may need adjustment based on implementation)
    const backgroundElements = document.querySelectorAll('[class*="wave"]')
    expect(backgroundElements.length).toBeGreaterThan(0)
  })
})
`,

  'src/hooks/__tests__/useOffline.test.ts': `
import { renderHook, act } from '@testing-library/react'
import { useOffline } from '../useOffline'

// Mock Firebase Firestore
jest.mock('firebase/firestore', () => ({
  enableNetwork: jest.fn(),
  disableNetwork: jest.fn(),
  collection: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  doc: jest.fn()
}))

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      store = {}
    })
  }
})()

Object.defineProperty(window, 'localStorage', { value: mockLocalStorage })

describe('useOffline', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLocalStorage.clear()
    
    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true
    })
  })

  test('initializes with online status', () => {
    const { result } = renderHook(() => useOffline())
    
    expect(result.current.isOnline).toBe(true)
    expect(result.current.isConnected).toBe(true)
    expect(result.current.pendingActions).toEqual([])
  })

  test('queues offline actions', () => {
    const { result } = renderHook(() => useOffline())
    
    act(() => {
      result.current.queueOfflineAction({
        type: 'create',
        collection: 'tasks',
        data: { title: 'Test Task' }
      })
    })

    expect(result.current.pendingActions).toHaveLength(1)
    expect(result.current.pendingActions[0].type).toBe('create')
    expect(result.current.pendingActions[0].data.title).toBe('Test Task')
  })

  test('clears pending actions', () => {
    const { result } = renderHook(() => useOffline())
    
    act(() => {
      result.current.queueOfflineAction({
        type: 'create',
        collection: 'tasks', 
        data: { title: 'Test Task' }
      })
    })

    expect(result.current.pendingActions).toHaveLength(1)

    act(() => {
      result.current.clearPendingActions()
    })

    expect(result.current.pendingActions).toHaveLength(0)
  })
})
`,

  'src/utils/__tests__/analytics.test.ts': `
import { trackEvent, trackPageView, initializeAnalytics } from '../analytics'

// Mock Firebase Analytics
jest.mock('firebase/analytics', () => ({
  getAnalytics: jest.fn(),
  logEvent: jest.fn(),
  setCurrentScreen: jest.fn()
}))

describe('Analytics', () => {
  test('trackEvent works without errors', () => {
    expect(() => {
      trackEvent('task_created', {
        category: 'household',
        priority: 'medium'
      })
    }).not.toThrow()
  })

  test('trackPageView works without errors', () => {
    expect(() => {
      trackPageView('/tasks', 'Tasks Page')
    }).not.toThrow()
  })

  test('initializeAnalytics works without errors', () => {
    expect(() => {
      initializeAnalytics()
    }).not.toThrow()
  })
})
`,

  'tests/e2e/basic.spec.ts': `
import { test, expect } from '@playwright/test'

test.describe('Moonwave Plan E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/')
  })

  test('should load the homepage', async ({ page }) => {
    // Check if the page loads
    await expect(page).toHaveTitle(/Moonwave Plan/)
    
    // Check for main elements
    await expect(page.locator('body')).toBeVisible()
  })

  test('should show login screen for unauthenticated users', async ({ page }) => {
    // Should redirect to login or show login form
    const loginButton = page.locator('button', { hasText: /로그인|Login/i })
    await expect(loginButton).toBeVisible()
  })

  test('should have PWA manifest', async ({ page }) => {
    // Check if manifest link exists
    const manifest = page.locator('link[rel="manifest"]')
    await expect(manifest).toHaveAttribute('href', 'manifest.json')
  })

  test('should load with proper meta tags', async ({ page }) => {
    // Check PWA meta tags
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#3b82f6')
    await expect(page.locator('meta[name="apple-mobile-web-app-capable"]')).toHaveAttribute('content', 'yes')
  })
})
`,

  '.github/workflows/test.yml': `
name: Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Use Node.js \${{ matrix.node-version }}
      uses: actions/setup-node@v4
      with:
        node-version: \${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run type check
      run: npm run type-check
    
    - name: Run lint
      run: npm run lint
    
    - name: Run unit tests
      run: npm test -- --coverage --watchAll=false
    
    - name: Run build
      run: npm run build
    
    - name: Install Playwright browsers
      run: npx playwright install --with-deps
    
    - name: Run Playwright tests
      run: npm run test:e2e
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
        flags: unittests
        name: codecov-umbrella
        
  security-checks:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    
    - name: Use Node.js 20.x
      uses: actions/setup-node@v4
      with:
        node-version: '20.x'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run security audit
      run: npm audit --audit-level high
    
    - name: Run security check script
      run: npm run security:check
    
    - name: Run PWA check script
      run: npm run pwa:check
`
}

console.log('\n📄 Creating test files...')
Object.entries(testFiles).forEach(([filePath, content]) => {
  const fullPath = path.join(projectRoot, filePath)
  const dir = path.dirname(fullPath)
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  
  if (!fs.existsSync(fullPath)) {
    fs.writeFileSync(fullPath, content.trim())
    console.log(`✅ Created ${filePath}`)
  } else {
    console.log(`✓ ${filePath} already exists`)
  }
})

console.log('\n🎯 Test Infrastructure Setup Complete!')
console.log('\n📋 Next Steps:')
console.log('1. Run tests: npm test')
console.log('2. Run E2E tests: npm run test:e2e') 
console.log('3. Generate coverage: npm run test:coverage')
console.log('4. Check PWA: npm run pwa:check')
console.log('5. Security audit: npm run security:check')

console.log('\n✨ Ready for comprehensive testing!')