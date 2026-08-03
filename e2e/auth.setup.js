import { test as setup, expect } from '@playwright/test'
import fs from 'node:fs'

const authStatePath = 'playwright/.auth/user.json'

setup('登录 Matrix 并保存认证状态', async ({ page }) => {
  const username = process.env.E2E_USERNAME
  const password = process.env.E2E_PASSWORD

  if (!username || !password) {
    throw new Error('缺少 E2E_USERNAME 或 E2E_PASSWORD 环境变量')
  }

  fs.mkdirSync('playwright/.auth', { recursive: true })

  await page.goto('/login')
  await expect(page.getByRole('heading', { name: '登录 Matrix' })).toBeVisible()

  await page.getByPlaceholder('请输入用户名').fill(username)
  await page.getByPlaceholder('请输入密码').fill(password)
  await page.getByRole('button', { name: '登录', exact: true }).click()

  await expect(page).toHaveURL(/\/portal(?:[?#].*)?$/)

  const token = await page.evaluate(() => localStorage.getItem('token'))
  expect(token, '登录成功后应写入 token').toBeTruthy()

  await page.context().storageState({ path: authStatePath })
})
