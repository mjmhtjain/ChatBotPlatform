import { test, expect, Page } from '@playwright/test'

async function login(page: Page) {
  await page.goto('/login')
  await page.waitForSelector('#password')
  await page.getByLabel(/email/i).fill('user@gmail.com')
  await page.locator('#password').fill('password')
  await page.getByRole('button', { name: /sign in/i }).click()
  await expect(page).toHaveURL(/\/projects/)
}

/** Creates a project and waits for the modal to close before returning. */
async function createProject(page: Page, name: string) {
  await page.getByRole('button', { name: /new project/i }).click()
  await page.getByLabel('Project name').fill(name)
  await page.getByRole('button', { name: 'Create' }).click()
  // Wait for the modal overlay to disappear
  await expect(page.locator('[data-testid="modal-overlay"]')).not.toBeAttached()
  await expect(page.getByText(name)).toBeVisible()
}

/** Returns a name unique enough to avoid collisions across test runs. */
function unique(base: string): string {
  return `${base} ${Date.now()}`
}

test.beforeEach(async ({ page }) => {
  await login(page)
})

test('create project → card appears in list', async ({ page }) => {
  const name = unique('E2E Test Project')
  await page.getByRole('button', { name: /new project/i }).click()
  await page.getByLabel('Project name').fill(name)
  await page.getByRole('button', { name: 'Create' }).click()
  await expect(page.locator('[data-testid="modal-overlay"]')).not.toBeAttached()
  await expect(page.getByText(name)).toBeVisible()
})

test('rename project → card shows new name', async ({ page }) => {
  const beforeName = unique('Before Rename')
  const afterName = unique('After Rename')

  // Create a project first, then wait for modal to close
  await createProject(page, beforeName)

  // Hover to reveal rename button, then click (scoped to this card)
  const card = page.locator('[data-testid="project-card"]').filter({ hasText: beforeName })
  await card.hover()
  await card.getByLabel('Rename project').click()

  // Clear input and type new name
  await page.getByLabel('Project name').clear()
  await page.getByLabel('Project name').fill(afterName)
  await page.getByRole('button', { name: 'Save' }).click()

  await expect(page.getByText(afterName)).toBeVisible()
  await expect(page.getByText(beforeName)).not.toBeVisible()
})

test('delete project → card removed from list', async ({ page }) => {
  const name = unique('To Be Deleted')

  // Create a project first, then wait for modal to close
  await createProject(page, name)

  // Hover to reveal delete button, then click (scoped to this card)
  const card = page.locator('[data-testid="project-card"]').filter({ hasText: name })
  await card.hover()
  await card.getByLabel('Delete project').click()

  // Confirm deletion in modal
  await page.getByRole('button', { name: 'Delete', exact: true }).click()

  // Wait for the modal to close, then verify card is gone
  await expect(page.locator('[data-testid="modal-overlay"]')).not.toBeAttached()
  await expect(page.getByText(name)).not.toBeVisible()
})

test('list projects → shows projects heading', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Projects' })).toBeVisible()
})
