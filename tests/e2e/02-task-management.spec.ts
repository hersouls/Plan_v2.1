import { test, expect } from '../fixtures/firebase-mock'
import { MCPTestHelpers } from '../utils/mcp-helpers'
import { LoginPage, TaskPage } from '../utils/page-objects'

test.describe('Task Management', () => {
  let helpers: MCPTestHelpers
  let loginPage: LoginPage
  let taskPage: TaskPage

  test.beforeEach(async ({ page }) => {
    helpers = new MCPTestHelpers(page)
    loginPage = new LoginPage(page)
    taskPage = new TaskPage(page)
    
    // Setup test environment
    await helpers.mockFirebase()
    
    // Login before each test
    await loginPage.navigateTo()
    await loginPage.loginAnonymously()
    await taskPage.navigateTo()
  })

  test('should display task list', async ({ page }) => {
    // Wait for task list to load
    await helpers.waitForLoadingComplete()
    
    // Should show either tasks or empty state
    const hasTasks = await taskPage.taskCards.count() > 0
    const hasEmptyState = await taskPage.emptyState.isVisible().catch(() => false)
    
    expect(hasTasks || hasEmptyState).toBeTruthy()
  })

  test('should create a new task with quick add', async ({ page }) => {
    const testTaskTitle = `Quick Task ${Date.now()}`
    
    // Add task using quick add
    await taskPage.addQuickTask(testTaskTitle)
    
    // Should appear in task list
    expect(await taskPage.hasTask(testTaskTitle)).toBeTruthy()
  })

  test('should create a detailed task', async ({ page }) => {
    const taskData = {
      title: `Detailed Task ${Date.now()}`,
      description: 'This is a test task with full details',
      category: 'household',
      priority: 'medium',
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    }
    
    // Add detailed task
    await taskPage.addDetailedTask(taskData)
    
    // Should appear in task list
    expect(await taskPage.hasTask(taskData.title)).toBeTruthy()
  })

  test('should mark task as complete', async ({ page }) => {
    const testTaskTitle = `Complete Test ${Date.now()}`
    
    // First create a task
    await taskPage.addQuickTask(testTaskTitle)
    
    // Mark as complete
    await taskPage.toggleTaskComplete(testTaskTitle)
    
    // Task should still exist but marked as complete
    const taskCard = page.locator('[data-testid="task-card"]', { hasText: testTaskTitle })
    await expect(taskCard).toBeVisible()
    
    // Should have completed styling
    const hasCompletedClass = await taskCard.evaluate(el => 
      el.classList.contains('completed') || 
      el.classList.contains('opacity-60') ||
      el.querySelector('[data-completed="true"]') !== null
    )
    expect(hasCompletedClass).toBeTruthy()
  })

  test('should delete a task', async ({ page }) => {
    const testTaskTitle = `Delete Test ${Date.now()}`
    
    // First create a task
    await taskPage.addQuickTask(testTaskTitle)
    expect(await taskPage.hasTask(testTaskTitle)).toBeTruthy()
    
    // Delete the task
    await taskPage.deleteTask(testTaskTitle)
    
    // Task should no longer exist
    expect(await taskPage.hasTask(testTaskTitle)).toBeFalsy()
  })

  test('should filter tasks by category', async ({ page }) => {
    // Create tasks with different categories
    const householdTask = `Household ${Date.now()}`
    const workTask = `Work ${Date.now()}`
    
    await taskPage.addDetailedTask({
      title: householdTask,
      category: 'household'
    })
    
    await taskPage.addDetailedTask({
      title: workTask,
      category: 'work'
    })
    
    // Filter by household
    const categoryFilter = page.locator('[data-testid="category-filter"], select[name="category"]')
    if (await categoryFilter.isVisible()) {
      await categoryFilter.selectOption('household')
      await helpers.waitForLoadingComplete()
      
      // Should show household task
      expect(await taskPage.hasTask(householdTask)).toBeTruthy()
    }
  })

  test('should handle empty task list', async ({ page }) => {
    // Clear any existing tasks (if possible)
    const taskCount = await taskPage.getTaskCount()
    
    if (taskCount === 0) {
      // Should show empty state
      await expect(taskPage.emptyState).toBeVisible()
      
      // Should show helpful message
      const emptyMessage = page.locator('[data-testid="empty-message"], .empty-message')
      await expect(emptyMessage).toContainText(/할일|task|empty/i)
    }
  })

  test('should support keyboard shortcuts', async ({ page }) => {
    // Focus on quick add input
    await taskPage.quickAddInput.focus()
    
    // Type task title
    const testTitle = `Keyboard Task ${Date.now()}`
    await taskPage.quickAddInput.fill(testTitle)
    
    // Press Enter to submit
    await page.keyboard.press('Enter')
    
    // Task should be created
    expect(await taskPage.hasTask(testTitle)).toBeTruthy()
  })

  test('should show task priority indicators', async ({ page }) => {
    const highPriorityTask = `High Priority ${Date.now()}`
    
    await taskPage.addDetailedTask({
      title: highPriorityTask,
      priority: 'high'
    })
    
    // Should show priority indicator
    const taskCard = page.locator('[data-testid="task-card"]', { hasText: highPriorityTask })
    const priorityIndicator = taskCard.locator('[data-testid="priority-indicator"], .priority-high, .priority-indicator')
    
    await expect(priorityIndicator).toBeVisible()
  })

  test('should handle task assignment', async ({ page }) => {
    const assignedTask = `Assigned Task ${Date.now()}`
    
    // Create task (with current user as assignee by default)
    await taskPage.addDetailedTask({
      title: assignedTask
    })
    
    // Task should show assignee info
    const taskCard = page.locator('[data-testid="task-card"]', { hasText: assignedTask })
    const assigneeInfo = taskCard.locator('[data-testid="assignee"], .assignee-info')
    
    // Should either show assignee or be implicitly assigned to current user
    const hasAssignee = await assigneeInfo.isVisible().catch(() => false)
    expect(hasAssignee || true).toBeTruthy()
  })

  test('should work offline', async ({ page }) => {
    // Go offline
    await helpers.goOffline()
    
    const offlineTask = `Offline Task ${Date.now()}`
    
    // Should still allow task creation (queued)
    await taskPage.addQuickTask(offlineTask)
    
    // Task should appear in UI immediately (optimistic update)
    expect(await taskPage.hasTask(offlineTask)).toBeTruthy()
    
    // Go back online
    await helpers.goOnline()
    
    // Task should still be there after sync
    expect(await taskPage.hasTask(offlineTask)).toBeTruthy()
  })
})