import { test, expect } from '@playwright/test'

test('登录页可以公开访问', async ({ page }) => {
  const pageErrors = []
  const serverErrors = []

  page.on('pageerror', error => pageErrors.push(error.message))
  page.on('response', response => {
    if (response.url().includes('/api/') && response.status() >= 500) {
      serverErrors.push(`${response.status()} ${response.url()}`)
    }
  })

  const response = await page.goto('/login', { waitUntil: 'domcontentloaded' })

  expect(response, '登录页应返回 HTTP 响应').not.toBeNull()
  expect(response.status(), '登录页不应返回 5xx').toBeLessThan(500)
  await expect(page.getByRole('heading', { name: '登录 Matrix' })).toBeVisible()
  await expect(page.getByPlaceholder('请输入用户名')).toBeVisible()
  await expect(page.getByPlaceholder('请输入密码')).toBeVisible()
  await expect(page.getByRole('button', { name: '登录', exact: true })).toBeVisible()
  await expect(page).toHaveTitle(/\S+/)

  expect(pageErrors, `页面运行错误：\n${pageErrors.join('\n')}`).toEqual([])
  expect(serverErrors, `接口 5xx：\n${serverErrors.join('\n')}`).toEqual([])
})

test('登录页在桌面和移动端宽度下均可渲染', async ({ page }) => {
  await page.goto('/login')
  await expect(page.locator('#app')).toBeVisible()

  await page.setViewportSize({ width: 390, height: 844 })
  await expect(page.getByRole('heading', { name: '登录 Matrix' })).toBeVisible()
  await expect(page.getByRole('button', { name: '登录', exact: true })).toBeVisible()
})
