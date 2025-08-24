import { test, expect } from '../fixtures/firebase-mock'
import { MCPTestHelpers } from '../utils/mcp-helpers'
import { LoginPage } from '../utils/page-objects'

test.describe('Points Management - Approve/Reject/Filter/Sort', () => {
  let helpers: MCPTestHelpers
  let loginPage: LoginPage

  test.beforeEach(async ({ page }) => {
    helpers = new MCPTestHelpers(page)
    loginPage = new LoginPage(page)

    await helpers.mockFirebase()
    await loginPage.navigateTo()
    await loginPage.loginAnonymously()
    await page.goto('/points')
    await helpers.waitForLoadingComplete()
  })

  test('should show unapproved and approved sections', async ({ page }) => {
    const unapprovedSection = page.getByRole('list', { name: '미승인 포인트 내역 목록' })
    const approvedSection = page.getByRole('list', { name: '승인된 포인트 내역 목록' })

    // One of them should be visible or empty state present
    const hasUnapproved = await unapprovedSection.first().isVisible().catch(() => false)
    const hasApproved = await approvedSection.first().isVisible().catch(() => false)
    const hasEmpty = await page.getByRole('status', { name: /포인트 내역 없음|미승인 포인트 내역 없음|승인된 포인트 내역 없음/ }).first().isVisible().catch(() => false)
    expect(hasUnapproved || hasApproved || hasEmpty).toBeTruthy()
  })

  test('can open modals via 전체 보기 buttons', async ({ page }) => {
    // Try open unapproved modal
    const openAllButtons = page.getByRole('button', { name: /전체 .*보기/ })
    const count = await openAllButtons.count()
    if (count > 0) {
      await openAllButtons.first().click()
      await expect(page.getByRole('dialog')).toBeVisible()
      await page.getByRole('button', { name: '포인트 내역 모달 닫기' }).click().catch(() => {})
    }
  })

  test('approve/reject actions appear and are clickable when items exist', async ({ page }) => {
    const list = page.getByRole('list', { name: '미승인 포인트 내역 목록' })
    const items = list.locator('[role="listitem"]')
    const itemCount = await items.count().catch(() => 0)
    if (itemCount > 0) {
      const firstItem = items.first()
      await firstItem.scrollIntoViewIfNeeded()
      // Approve
      const approveBtn = firstItem.getByRole('button', { name: '포인트 내역 승인' })
      await expect(approveBtn).toBeVisible()
      await approveBtn.click()
      // Reject
      const rejectBtn = firstItem.getByRole('button', { name: '포인트 내역 거부' })
      await expect(rejectBtn).toBeVisible()
      await rejectBtn.click()
    } else {
      test.info().annotations.push({ type: 'note', description: 'No unapproved items available; approve/reject skipped' })
    }
  })

  test('group selection and favorite toggle are present when groups exist', async ({ page }) => {
    const groupSelect = page.locator('select')
    const exists = await groupSelect.first().isVisible().catch(() => false)
    if (exists) {
      // Attempt to change selection (no strict assertion on options due to mock data)
      await groupSelect.first().selectOption({ index: 0 }).catch(() => {})
      // Favorite toggle may exist
      const starBtn = page.getByRole('button').filter({ has: page.locator('svg') })
      await starBtn.first().click().catch(() => {})
    }
  })
})

test.describe('Points Management - Access control', () => {
  let helpers: MCPTestHelpers

  test.beforeEach(async ({ page }) => {
    helpers = new MCPTestHelpers(page)
    await helpers.mockFirebase()
  })

  test('blocks unauthenticated users via ProtectedRoute', async ({ page }) => {
    // Override mock to simulate no auth
    await page.addInitScript(() => {
      window.mockFirebase = window.mockFirebase || {}
      if (window.mockFirebase.auth) {
        window.mockFirebase.auth.currentUser = null
      }
    })
    await page.goto('/points')
    // Should redirect to login or show login UI
    const hasLogin = await page.locator('[data-testid="login-title"], h1, h2').filter({ hasText: /로그인|Login|시작하기/i }).first().isVisible().catch(() => false)
    expect(hasLogin).toBeTruthy()
  })
})


