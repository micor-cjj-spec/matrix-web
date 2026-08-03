import { defineConfig, devices } from '@playwright/test'

const authStatePath = 'playwright/.auth/user.json'
const hasCredentials = Boolean(process.env.E2E_USERNAME && process.env.E2E_PASSWORD)

const projects = [
  {
    name: 'public-chromium',
    testMatch: /public\.spec\.js/,
    use: {
      ...devices['Desktop Chrome'],
      storageState: {
        cookies: [],
        origins: [],
      },
    },
  },
]

if (hasCredentials) {
  projects.push(
    {
      name: 'auth-setup',
      testMatch: /auth\.setup\.js/,
    },
    {
      name: 'authenticated-chromium',
      testIgnore: [/public\.spec\.js/, /.*\.setup\.js/],
      use: {
        ...devices['Desktop Chrome'],
        storageState: authStatePath,
      },
      dependencies: ['auth-setup'],
    },
  )
}

export default defineConfig({
  testDir: './e2e',
  outputDir: 'test-results',
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'https://micor.top',
    headless: true,
    ignoreHTTPSErrors: false,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    navigationTimeout: 30_000,
    actionTimeout: 15_000,
  },
  projects,
})
