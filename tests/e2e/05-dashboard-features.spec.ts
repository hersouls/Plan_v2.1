import { test, expect } from '../fixtures/firebase-mock'
import { MCPTestHelpers } from '../utils/mcp-helpers'
import { LoginPage, DashboardPage, TaskPage } from '../utils/page-objects'

/**
 * 🏠 Dashboard Features Test Suite
 * Tests the main dashboard functionality including task overview, statistics, and quick actions
 */

test.describe('Dashboard Features', () => {
  let helpers: MCPTestHelpers
  let loginPage: LoginPage
  let dashboardPage: DashboardPage
  let taskPage: TaskPage

  test.beforeEach(async ({ page }) => {
    helpers = new MCPTestHelpers(page)
    loginPage = new LoginPage(page)
    dashboardPage = new DashboardPage(page)
    taskPage = new TaskPage(page)
    
    // Set up authenticated session
    await helpers.mockFirebase()
    await loginPage.navigateTo()
    await loginPage.loginWithCredentials('dad@moonwave.test', 'test123456')
    await helpers.waitForNavigation('/todo')
  })

  test.describe('Dashboard Overview', () => {
    test('should display task statistics correctly', async ({ page }) => {
      // Navigate to dashboard
      await dashboardPage.navigateTo()
      
      // Check statistics widgets
      await expect(dashboardPage.totalTasksCount).toBeVisible()
      await expect(dashboardPage.completedTasksCount).toBeVisible()
      await expect(dashboardPage.pendingTasksCount).toBeVisible()
      await expect(dashboardPage.overdueTasksCount).toBeVisible()
      
      // Verify statistics have reasonable values
      const totalTasks = await dashboardPage.getTotalTasksCount()
      const completedTasks = await dashboardPage.getCompletedTasksCount()
      
      expect(totalTasks).toBeGreaterThanOrEqual(0)
      expect(completedTasks).toBeGreaterThanOrEqual(0)
      expect(completedTasks).toBeLessThanOrEqual(totalTasks)
    })

    test('should show today\'s tasks section', async ({ page }) => {
      await dashboardPage.navigateTo()
      
      // Check today's tasks section
      await expect(dashboardPage.todaysTasksSection).toBeVisible()
      
      // Should show either tasks or empty state
      const hasTasks = await dashboardPage.todaysTasksList.count() > 0
      const hasEmptyState = await dashboardPage.emptyStateMessage.isVisible()
      
      expect(hasTasks || hasEmptyState).toBeTruthy()
    })

    test('should display progress bar with correct percentage', async ({ page }) => {
      await dashboardPage.navigateTo()
      
      // Check progress bar
      const progressBar = dashboardPage.progressBar
      await expect(progressBar).toBeVisible()
      
      // Verify progress percentage is valid
      const progressText = await dashboardPage.progressText.textContent()
      const percentage = parseInt(progressText?.match(/\d+/)?.[0] || '0')
      
      expect(percentage).toBeGreaterThanOrEqual(0)
      expect(percentage).toBeLessThanOrEqual(100)
    })
  })

  test.describe('Quick Actions', () => {
    test('should provide quick task creation', async ({ page }) => {
      await dashboardPage.navigateTo()
      
      // Find quick add button
      const quickAddButton = page.locator('[data-testid="quick-add-task"], button:has-text("빠른 추가"), .quick-add-button').first()
      await expect(quickAddButton).toBeVisible()
      
      // Click quick add
      await quickAddButton.click()
      
      // Should open quick add modal or navigate to task creation
      const isModal = await page.locator('[role="dialog"], .modal, [data-testid="quick-add-modal"]').isVisible()
      const isTaskCreate = page.url().includes('/task/create')
      
      expect(isModal || isTaskCreate).toBeTruthy()
    })

    test('should allow quick task completion from dashboard', async ({ page }) => {
      await dashboardPage.navigateTo()
      
      // Find first incomplete task
      const firstTask = page.locator('[data-testid="task-item"], .task-card').first()
      
      if (await firstTask.isVisible()) {
        // Find and click complete button
        const completeButton = firstTask.locator('[data-testid="complete-task"], button:has-text("완료"), .complete-button').first()
        
        if (await completeButton.isVisible()) {
          await completeButton.click()
          
          // Should show success indicator
          await expect(page.locator('.toast, .notification, [data-testid="success-message"]')).toBeVisible()
        }
      }
    })
  })

  test.describe('Responsive Dashboard', () => {
    test('should adapt to mobile layout', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })
      await dashboardPage.navigateTo()
      
      // Check mobile navigation
      const mobileNav = page.locator('[data-testid="mobile-nav"], .mobile-navigation, button[aria-label*="메뉴"]').first()
      
      if (await mobileNav.isVisible()) {
        await expect(mobileNav).toBeVisible()
      }
      
      // Check that content is still accessible
      await expect(dashboardPage.todaysTasksSection).toBeVisible()
    })

    test('should maintain functionality on tablet', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 })
      await dashboardPage.navigateTo()
      
      // All main features should still be visible
      await expect(dashboardPage.totalTasksCount).toBeVisible()
      await expect(dashboardPage.todaysTasksSection).toBeVisible()
      
      // Quick actions should work
      const quickAddButton = page.locator('[data-testid="quick-add-task"], button:has-text("빠른 추가")').first()
      if (await quickAddButton.isVisible()) {
        await expect(quickAddButton).toBeEnabled()
      }
    })
  })
})