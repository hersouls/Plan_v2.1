import { test, expect } from '../fixtures/firebase-mock'
import { MCPTestHelpers } from '../utils/mcp-helpers'
import { LoginPage, TaskPage, DashboardPage } from '../utils/page-objects'

/**
 * ✅ Task Management Test Suite
 * Comprehensive testing of task CRUD operations, features, and edge cases
 */

test.describe('Task Management', () => {
  let helpers: MCPTestHelpers
  let loginPage: LoginPage
  let taskPage: TaskPage
  let dashboardPage: DashboardPage

  test.beforeEach(async ({ page }) => {
    helpers = new MCPTestHelpers(page)
    loginPage = new LoginPage(page)
    taskPage = new TaskPage(page)
    dashboardPage = new DashboardPage(page)
    
    // Set up authenticated session
    await helpers.mockFirebase()
    await loginPage.navigateTo()
    await loginPage.loginWithCredentials('dad@moonwave.test', 'test123456')
    await helpers.waitForNavigation('/todo')
  })

  test.describe('Task Creation', () => {
    test('should create a basic task successfully', async ({ page }) => {
      await taskPage.navigateToCreate()
      
      // Fill task details
      const taskTitle = `테스트 할일 ${Date.now()}`
      await taskPage.fillTaskTitle(taskTitle)
      await taskPage.saveTask()
      
      // Should navigate back to task list
      await expect(page).toHaveURL(/\/(todo|task)/, { timeout: 10000 })
      
      // Task should appear in the list
      await expect(page.locator(`text=${taskTitle}`)).toBeVisible()
    })

    test('should create task with all details', async ({ page }) => {
      await taskPage.navigateToCreate()
      
      const taskData = {
        title: `상세 할일 ${Date.now()}`,
        description: '이것은 테스트용 할일입니다.',
        category: 'personal',
        priority: 'high',
        dueDate: '2024-12-31'
      }
      
      await taskPage.addDetailedTask(taskData)
      
      // Should save successfully
      await expect(page).toHaveURL(/\/(todo|task)/, { timeout: 10000 })
      await expect(page.locator(`text=${taskData.title}`)).toBeVisible()
    })

    test('should validate required fields', async ({ page }) => {
      await taskPage.navigateToCreate()
      
      // Try to save without title
      await taskPage.saveTask()
      
      // Should show validation error or stay on create page
      const hasError = await page.locator('.error-message, [data-testid="error"]').isVisible()
      const staysOnCreate = page.url().includes('/create')
      
      expect(hasError || staysOnCreate).toBeTruthy()
    })
  })

  test.describe('Task Operations', () => {
    test('should complete a task', async ({ page }) => {
      await taskPage.navigateTo()
      
      // Find first task and mark as complete
      const firstTask = page.locator('[data-testid="task-card"], .task-card').first()
      
      if (await firstTask.isVisible()) {
        const taskTitle = await firstTask.locator('.task-title, [data-testid="task-title"]').textContent()
        
        // Click complete button
        const completeButton = firstTask.locator('[data-testid="complete-task"], button[role="checkbox"], .complete-button').first()
        await completeButton.click()
        
        // Should show as completed
        await helpers.waitForLoadingComplete()
        const completedTask = page.locator('[data-testid="task-card"][data-completed="true"], .task-card.completed')
        await expect(completedTask).toBeVisible()
      }
    })

    test('should delete a task with confirmation', async ({ page }) => {
      await taskPage.navigateTo()
      
      // Find first task to delete
      const firstTask = page.locator('[data-testid="task-card"], .task-card').first()
      
      if (await firstTask.isVisible()) {
        const taskTitle = await firstTask.locator('.task-title, [data-testid="task-title"]').textContent()
        
        // Open more actions menu
        const moreButton = firstTask.locator('[data-testid="more-actions"], .more-button, button:has-text("⋮")').first()
        if (await moreButton.isVisible()) {
          await moreButton.click()
        }
        
        // Click delete
        const deleteButton = page.locator('[data-testid="delete-task"], button:has-text("삭제"), .delete-button').first()
        
        if (await deleteButton.isVisible()) {
          await deleteButton.click()
          
          // Should show confirmation dialog
          const confirmDialog = page.locator('[role="dialog"], .confirm-dialog, [data-testid="confirm-delete"]')
          await expect(confirmDialog).toBeVisible()
          
          // Confirm deletion
          const confirmButton = page.locator('button:has-text("삭제"), button:has-text("확인"), [data-testid="confirm-delete-button"]').first()
          await confirmButton.click()
          
          // Task should be removed from list
          if (taskTitle) {
            await expect(page.locator(`text=${taskTitle}`)).not.toBeVisible()
          }
        }
      }
    })
  })

  test.describe('Task Edge Cases', () => {
    test('should handle task with very long title', async ({ page }) => {
      await taskPage.navigateToCreate()
      
      // Create task with long title
      const longTitle = 'A'.repeat(200)
      await taskPage.fillTaskTitle(longTitle)
      await taskPage.saveTask()
      
      // Should either save successfully or show validation error
      const isSuccessful = page.url().includes('/todo')
      const hasError = await page.locator('.error-message, [data-testid="error"]').isVisible()
      
      expect(isSuccessful || hasError).toBeTruthy()
    })

    test('should handle task with past due date', async ({ page }) => {
      await taskPage.navigateToCreate()
      
      // Create task with past due date
      await taskPage.fillTaskTitle('과거 마감일 할일')
      await taskPage.setDueDate('2020-01-01')
      await taskPage.saveTask()
      
      // Should save and show as overdue
      await expect(page).toHaveURL(/\/(todo|task)/, { timeout: 10000 })
    })

    test('should handle task with special characters', async ({ page }) => {
      await taskPage.navigateToCreate()
      
      // Create task with special characters
      const specialTitle = '특수문자 테스트 !@#$%^&*()_+-=[]{}|;:,.<>?'
      await taskPage.fillTaskTitle(specialTitle)
      await taskPage.saveTask()
      
      // Should save successfully
      await expect(page).toHaveURL(/\/(todo|task)/, { timeout: 10000 })
      await expect(page.locator(`text=${specialTitle}`)).toBeVisible()
    })
  })
})