import { test, expect, Page } from '@playwright/test'

async function login(page: Page) {
  await page.goto('/login')
  await page.waitForSelector('#password')
  await page.getByLabel(/email/i).fill('user@gmail.com')
  await page.locator('#password').fill('password')
  await page.getByRole('button', { name: /sign in/i }).click()
  await expect(page).toHaveURL(/\/projects/)
}

async function createProject(page: Page, name: string) {
  await page.getByRole('button', { name: /new project/i }).click()
  await page.getByLabel('Project name').fill(name)
  await page.getByRole('button', { name: 'Create' }).click()
  await expect(page.locator('[data-testid="modal-overlay"]')).not.toBeAttached()
  await expect(page.getByText(name)).toBeVisible()
}

async function openProject(page: Page, name: string) {
  await page.locator('[data-testid="project-card"]').filter({ hasText: name }).click()
  await expect(page.getByRole('heading', { name: 'Flows' })).toBeVisible()
}

async function createFlow(page: Page, name: string) {
  await page.getByRole('button', { name: /new flow/i }).click()
  await page.getByLabel('Flow name').fill(name)
  await page.getByRole('button', { name: 'Create' }).click()
  // Lands on /projects/:projectId/flows/:flowId
  await expect(page).toHaveURL(/\/flows\//)
}

/**
 * React Flow uses native HTML5 drag-and-drop. Playwright's built-in dragTo doesn't
 * carry dataTransfer payloads, and Chromium's `new DragEvent(type, { dataTransfer })`
 * silently replaces the property on dispatch — so the slot's `getData` returns ''.
 *
 * Workaround: dispatch a plain `Event` and `Object.defineProperty` the shared
 * DataTransfer onto it before dispatching. This is the well-known pattern for
 * testing HTML5 DnD from page scripts and is stable across Chromium versions.
 */
async function dragMessageNodeToEmptySlot(page: Page) {
  await page.evaluate(() => {
    const source = document.querySelector<HTMLElement>('[draggable="true"]')
    // React Flow wraps each node in .react-flow__node-emptySlot; the React onDrop
    // is on the inner div the component renders. Dispatch there so the synthetic
    // event target matches the element React registered the handler against.
    const target = document.querySelector<HTMLElement>('.react-flow__node-emptySlot > div')
    if (!source || !target) throw new Error('drag source or target not found')

    const dataTransfer = new DataTransfer()
    const fire = (el: HTMLElement, type: string) => {
      const ev = new Event(type, { bubbles: true, cancelable: true }) as Event & { dataTransfer: DataTransfer }
      Object.defineProperty(ev, 'dataTransfer', { value: dataTransfer })
      el.dispatchEvent(ev)
    }

    fire(source, 'dragstart')
    fire(target, 'dragenter')
    fire(target, 'dragover')
    fire(target, 'drop')
    fire(source, 'dragend')
  })
}

function unique(base: string): string {
  return `${base} ${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

test.beforeEach(async ({ page }) => {
  await login(page)
})

test('flow editor renders initial chain (Start → empty slot → End)', async ({ page }) => {
  const projectName = unique('Flow Smoke Project')
  await createProject(page, projectName)
  await openProject(page, projectName)
  await createFlow(page, unique('Smoke Flow'))

  await expect(page.locator('.react-flow__node-startAnchor')).toBeVisible()
  await expect(page.locator('.react-flow__node-emptySlot')).toHaveCount(1)
  await expect(page.locator('.react-flow__node-endAnchor')).toBeVisible()
  await expect(page.getByText('Start')).toBeVisible()
  await expect(page.getByText('End')).toBeVisible()
})

test('drop Message node → save → reload persists the node', async ({ page }) => {
  const projectName = unique('Flow Persist Project')
  const flowName = unique('Persist Flow')
  await createProject(page, projectName)
  await openProject(page, projectName)
  await createFlow(page, flowName)

  // Wait for initial chain
  await expect(page.locator('.react-flow__node-emptySlot')).toHaveCount(1)

  await dragMessageNodeToEmptySlot(page)

  // After the growth rule fires we should have a messageNode and two empty slots.
  await expect(page.locator('.react-flow__node-messageNode')).toHaveCount(1)
  await expect(page.locator('.react-flow__node-emptySlot')).toHaveCount(2)
  await expect(page.getByText(/unsaved changes/i)).toBeVisible()

  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText(/unsaved changes/i)).not.toBeVisible()

  await page.reload()
  await expect(page.locator('.react-flow__node-messageNode')).toHaveCount(1)
  await expect(page.locator('.react-flow__node-emptySlot')).toHaveCount(2)
})
