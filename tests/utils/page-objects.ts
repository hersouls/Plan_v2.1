import { Page, Locator, expect } from '@playwright/test'
import { MCPTestHelpers } from './mcp-helpers'

/**
 * 🎭 Enhanced Page Objects for Moonwave Plan Testing
 * Comprehensive page interaction patterns with improved error handling and testing capabilities
 */

// Base Page class with common functionality
export abstract class BasePage {
  protected helpers: MCPTestHelpers

  constructor(protected page: Page) {
    this.helpers = new MCPTestHelpers(page)
  }

  async navigateTo(path: string) {
    await this.page.goto(path)
    await this.page.waitForLoadState('networkidle')
    await this.helpers.waitForLoadingComplete()
  }

  async waitForToast(timeout: number = 5000) {
    const toast = this.page.locator('.toast, .notification, [data-testid="toast"], [role="alert"]')
    await toast.waitFor({ timeout })
    return toast
  }

  async getToastMessage(): Promise<string> {
    const toast = await this.waitForToast()
    return await toast.textContent() || ''
  }

  async dismissToast() {
    const dismissButton = this.page.locator('.toast button, .notification button, [data-testid="dismiss-toast"]')
    if (await dismissButton.isVisible()) {
      await dismissButton.click()
    }
  }

  async waitForElement(selector: string, timeout: number = 10000) {
    return await this.page.waitForSelector(selector, { timeout })
  }

  async scrollToElement(locator: Locator) {
    await locator.scrollIntoViewIfNeeded()
  }

  async takeScreenshot(name: string) {
    await this.page.screenshot({ path: `test-results/${name}-${Date.now()}.png` })
  }
}

export class LoginPage extends BasePage {

  // Enhanced Selectors
  get googleLoginButton(): Locator { 
    return this.page.locator('[data-testid="google-login"], button:has-text("Google"), button:has-text("구글")')
  }
  
  get anonymousLoginButton(): Locator {
    return this.page.locator('[data-testid="anonymous-login"], button:has-text("익명"), button:has-text("시작하기"), button:has-text("Anonymous")')
  }

  get emailLoginButton(): Locator {
    return this.page.locator('[data-testid="email-login"], button:has-text("이메일"), button:has-text("로그인")')
  }

  get emailInput(): Locator {
    return this.page.locator('[data-testid="email-input"], input[type="email"], input[name="email"]')
  }

  get passwordInput(): Locator {
    return this.page.locator('[data-testid="password-input"], input[type="password"], input[name="password"]')
  }

  get loginSubmitButton(): Locator {
    return this.page.locator('[data-testid="login-submit"], button[type="submit"], button:has-text("로그인")')
  }

  get signupLink(): Locator {
    return this.page.locator('[data-testid="signup-link"], a:has-text("회원가입"), button:has-text("회원가입")')
  }

  get loginTitle(): Locator {
    return this.page.locator('[data-testid="login-title"], h1, h2').filter({ hasText: /로그인|Login|시작하기/i })
  }

  get errorMessage(): Locator {
    return this.page.locator('[data-testid="login-error"], .error-message, .alert-error, [role="alert"]')
  }

  get loadingSpinner(): Locator {
    return this.page.locator('[data-testid="login-loading"], .loading, .spinner')
  }

  // Enhanced Actions
  async navigateTo() {
    await super.navigateTo('/')
    // Handle redirect to login if needed
    const currentUrl = this.page.url()
    if (!currentUrl.includes('/login') && await this.isLoginPage()) {
      // Already on login page
      return
    }
  }

  async loginAnonymously() {
    await this.anonymousLoginButton.click()
    await this.helpers.waitForAuth()
    await this.page.waitForURL(/\/(?:todo|dashboard|home)/, { timeout: 15000 })
    await this.helpers.waitForLoadingComplete()
  }

  async loginWithCredentials(email: string, password: string) {
    // Check if email input is available
    if (await this.emailInput.isVisible()) {
      await this.emailInput.fill(email)
      await this.passwordInput.fill(password)
      await this.loginSubmitButton.click()
    } else {
      // Try email login button first
      if (await this.emailLoginButton.isVisible()) {
        await this.emailLoginButton.click()
        await this.emailInput.fill(email)
        await this.passwordInput.fill(password)
        await this.loginSubmitButton.click()
      } else {
        // Fall back to anonymous login
        await this.loginAnonymously()
        return
      }
    }
    
    // Wait for navigation
    await this.page.waitForURL(/\/(?:todo|dashboard|home)/, { timeout: 15000 })
    await this.helpers.waitForLoadingComplete()
  }

  async loginWithGoogle() {
    await this.googleLoginButton.click()
    
    // Handle OAuth popup or redirect
    const popup = await this.page.waitForEvent('popup', { timeout: 5000 }).catch(() => null)
    if (popup) {
      // Handle OAuth in popup
      await popup.waitForLoadState('networkidle')
      await popup.close()
    }
    
    await this.page.waitForURL(/\/(?:todo|dashboard|home)/, { timeout: 15000 })
  }

  async navigateToSignup() {
    await this.signupLink.click()
    await this.page.waitForURL(/\/(?:signup|register)/, { timeout: 10000 })
  }

  async isLoginPage(): Promise<boolean> {
    return await this.loginTitle.isVisible({ timeout: 5000 }).catch(() => false)
  }

  async hasLoginError(): Promise<boolean> {
    return await this.errorMessage.isVisible({ timeout: 3000 }).catch(() => false)
  }

  async getLoginError(): Promise<string> {
    if (await this.hasLoginError()) {
      return await this.errorMessage.textContent() || ''
    }
    return ''
  }

  async waitForLoginComplete() {
    // Wait for loading to finish and navigation to complete
    await this.loadingSpinner.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {})
    await this.page.waitForURL(/\/(?:todo|dashboard|home)/, { timeout: 15000 })
  }
}

export class TaskPage extends BasePage {

  // Selectors
  get addTaskButton(): Locator {
    return this.page.locator('button', { hasText: /할일.*추가|Add Task|새.*할일/i })
  }

  get taskList(): Locator {
    return this.page.locator('[data-testid="task-list"], .task-list')
  }

  get taskCards(): Locator {
    return this.page.locator('[data-testid="task-card"], .task-card')
  }

  get quickAddInput(): Locator {
    return this.page.locator('input[placeholder*="할일"], input[placeholder*="task"]')
  }

  get emptyState(): Locator {
    return this.page.locator('[data-testid="empty-state"], .empty-state')
  }

  // Task form selectors
  get titleInput(): Locator {
    return this.page.locator('input[name="title"], #task-title')
  }

  get descriptionInput(): Locator {
    return this.page.locator('textarea[name="description"], #task-description')
  }

  get categorySelect(): Locator {
    return this.page.locator('select[name="category"], [data-testid="category-select"]')
  }

  get prioritySelect(): Locator {
    return this.page.locator('select[name="priority"], [data-testid="priority-select"]')
  }

  get dueDateInput(): Locator {
    return this.page.locator('input[type="date"], input[name="dueDate"]')
  }

  get saveButton(): Locator {
    return this.page.locator('button[type="submit"], button', { hasText: /저장|Save/i })
  }

  // Enhanced Actions
  async navigateTo() {
    await super.navigateTo('/todo')
  }

  async navigateToCreate() {
    await super.navigateTo('/task/create')
  }

  async navigateToEdit(taskId: string) {
    await super.navigateTo(`/task/${taskId}/edit`)
  }

  async addQuickTask(title: string) {
    await this.quickAddInput.fill(title)
    await this.page.keyboard.press('Enter')
    await this.helpers.waitForRealtimeUpdate('[data-testid="task-list"]', title)
  }

  async addDetailedTask(taskData: any) {
    await this.addTaskButton.click()
    
    await this.titleInput.fill(taskData.title)
    if (taskData.description) {
      await this.descriptionInput.fill(taskData.description)
    }
    if (taskData.category) {
      await this.categorySelect.selectOption(taskData.category)
    }
    if (taskData.priority) {
      await this.prioritySelect.selectOption(taskData.priority)
    }
    if (taskData.dueDate) {
      await this.dueDateInput.fill(taskData.dueDate.split('T')[0])
    }
    
    await this.saveButton.click()
    await this.helpers.waitForLoadingComplete()
  }

  async getTaskCount(): Promise<number> {
    await this.taskCards.first().waitFor({ timeout: 5000 }).catch(() => {})
    return await this.taskCards.count()
  }

  async toggleTaskComplete(taskTitle: string) {
    const taskCard = this.page.locator('[data-testid="task-card"]', { hasText: taskTitle })
    const checkbox = taskCard.locator('button[role="checkbox"], input[type="checkbox"]').first()
    await checkbox.click()
    await this.helpers.waitForLoadingComplete()
  }

  async deleteTask(taskTitle: string) {
    const taskCard = this.page.locator('[data-testid="task-card"]', { hasText: taskTitle })
    await taskCard.hover()
    
    const moreButton = taskCard.locator('button', { hasText: /더보기|More|⋮/ })
    await moreButton.click()
    
    const deleteButton = this.page.locator('button', { hasText: /삭제|Delete/i })
    await deleteButton.click()
    
    // Confirm deletion if modal appears
    const confirmButton = this.page.locator('button', { hasText: /확인|Confirm|Yes/i })
    await confirmButton.click().catch(() => {})
    
    await this.helpers.waitForLoadingComplete()
  }

  async hasTask(taskTitle: string): Promise<boolean> {
    const taskCard = this.page.locator('[data-testid="task-card"]', { hasText: taskTitle })
    return await taskCard.isVisible()
  }

  async fillTaskTitle(title: string) {
    await this.titleInput.fill(title)
  }

  async saveTask() {
    await this.saveButton.click()
    await this.helpers.waitForLoadingComplete()
  }

  async setDueDate(date: string) {
    await this.dueDateInput.fill(date)
  }
}

export class FamilyPage extends BasePage {

  // Selectors
  get createGroupButton(): Locator {
    return this.page.locator('button', { hasText: /그룹.*생성|Create Group/i })
  }

  get inviteMemberButton(): Locator {
    return this.page.locator('button', { hasText: /멤버.*초대|Invite Member/i })
  }

  get memberList(): Locator {
    return this.page.locator('[data-testid="member-list"], .member-list')
  }

  get groupNameInput(): Locator {
    return this.page.locator('input[name="groupName"], input[placeholder*="그룹"]')
  }

  get emailInput(): Locator {
    return this.page.locator('input[type="email"], input[name="email"]')
  }

  // Enhanced Actions
  async navigateTo() {
    await super.navigateTo('/family')
  }

  async createGroup(groupName: string) {
    await this.createGroupButton.click()
    await this.groupNameInput.fill(groupName)
    
    const saveButton = this.page.locator('button', { hasText: /저장|Save|생성|Create/i })
    await saveButton.click()
    
    await this.helpers.waitForLoadingComplete()
  }

  async inviteMember(email: string) {
    await this.inviteMemberButton.click()
    await this.emailInput.fill(email)
    
    const sendButton = this.page.locator('button', { hasText: /초대|Invite|보내기|Send/i })
    await sendButton.click()
    
    await this.helpers.waitForLoadingComplete()
  }

  async getMemberCount(): Promise<number> {
    const members = this.page.locator('[data-testid="member-card"], .member-card')
    await members.first().waitFor({ timeout: 5000 }).catch(() => {})
    return await members.count()
  }
}

export class DashboardPage extends BasePage {

  // Selectors
  get totalTasksCount(): Locator {
    return this.page.locator('[data-testid="total-tasks"], .stats-total, .task-count-total')
  }

  get completedTasksCount(): Locator {
    return this.page.locator('[data-testid="completed-tasks"], .stats-completed, .task-count-completed')
  }

  get pendingTasksCount(): Locator {
    return this.page.locator('[data-testid="pending-tasks"], .stats-pending, .task-count-pending')
  }

  get overdueTasksCount(): Locator {
    return this.page.locator('[data-testid="overdue-tasks"], .stats-overdue, .task-count-overdue')
  }

  get todaysTasksSection(): Locator {
    return this.page.locator('[data-testid="todays-tasks"], .todays-tasks, .daily-tasks-section')
  }

  get todaysTasksList(): Locator {
    return this.page.locator('[data-testid="todays-tasks-list"] .task-item, .today-task-card')
  }

  get emptyStateMessage(): Locator {
    return this.page.locator('[data-testid="empty-state"], .empty-message, .no-tasks-message')
  }

  get progressBar(): Locator {
    return this.page.locator('[data-testid="progress-bar"], .progress, .completion-bar')
  }

  get progressText(): Locator {
    return this.page.locator('[data-testid="progress-text"], .progress-percentage, .completion-percentage')
  }

  get activitySection(): Locator {
    return this.page.locator('[data-testid="activity-section"], .activity-feed, .recent-activity')
  }

  get activityList(): Locator {
    return this.page.locator('[data-testid="activity-list"] .activity-item, .activity-card')
  }

  // Enhanced Actions
  async navigateTo() {
    await super.navigateTo('/dashboard')
  }

  async getTotalTasksCount(): Promise<number> {
    const text = await this.totalTasksCount.textContent()
    return parseInt(text?.match(/\d+/)?.[0] || '0')
  }

  async getCompletedTasksCount(): Promise<number> {
    const text = await this.completedTasksCount.textContent()
    return parseInt(text?.match(/\d+/)?.[0] || '0')
  }

  async getPendingTasksCount(): Promise<number> {
    const text = await this.pendingTasksCount.textContent()
    return parseInt(text?.match(/\d+/)?.[0] || '0')
  }

  async getOverdueTasksCount(): Promise<number> {
    const text = await this.overdueTasksCount.textContent()
    return parseInt(text?.match(/\d+/)?.[0] || '0')
  }
}

export class SettingsPage extends BasePage {

  // Selectors
  get themeToggle(): Locator {
    return this.page.locator('[data-testid="theme-toggle"], button', { hasText: /테마|Theme|다크|Dark/i })
  }

  get notificationToggle(): Locator {
    return this.page.locator('[data-testid="notification-toggle"], input[type="checkbox"]', { hasText: /알림|Notification/i })
  }

  get languageSelect(): Locator {
    return this.page.locator('select[name="language"], [data-testid="language-select"]')
  }

  // Enhanced Actions
  async navigateTo() {
    await super.navigateTo('/settings')
  }

  async toggleTheme() {
    await this.themeToggle.click()
    // Wait for theme to apply
    await this.page.waitForTimeout(500)
  }

  async toggleNotifications() {
    await this.notificationToggle.click()
    await this.page.waitForTimeout(500)
  }
}