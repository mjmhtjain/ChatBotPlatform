import { test, expect } from '@playwright/test'

test('valid credentials → lands on /projects', async ({ page }) => {
  await page.goto('/login')
  await page.waitForSelector('#password')
  await page.getByLabel(/email/i).fill('user@gmail.com')
  await page.locator('#password').fill('password')
  await page.getByRole('button', { name: /sign in/i }).click()
  await expect(page).toHaveURL(/\/projects/)
})

test('wrong password → error message visible', async ({ page }) => {
  await page.goto('/login')
  await page.waitForSelector('#password')
  await page.getByLabel(/email/i).fill('user@gmail.com')
  await page.locator('#password').fill('wrongpassword')
  await page.getByRole('button', { name: /sign in/i }).click()
  await expect(page.getByText(/invalid email or password/i)).toBeVisible()
})

test('no token → redirected to /login', async ({ page }) => {
  await page.goto('/login')
  await page.evaluate(() => localStorage.clear())
  await page.goto('/projects')
  await expect(page).toHaveURL(/\/login/)
})
