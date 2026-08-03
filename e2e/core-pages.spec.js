import { test, expect } from '@playwright/test'

const corePages = [
  { name: '个人工作台', path: '/portal', marker: /个人工作台/ },
  { name: '财务系统', path: '/finance', marker: /财务系统|财务管理/ },
  { name: '审批中心', path: '/workflow/tasks', marker: /审批|任务中心|我的待办/ },
  { name: '费用报销', path: '/expense-reimbursements', marker: /费用报销|报销单/ },
  { name: '知识系统', path: '/ai/knowledge', marker: /知识系统|知识库/ },
  { name: 'AI 助手', path: '/ai/assistant', marker: /AI 助手|智能助手/ },
  { name: '调度中心', path: '/scheduler/jobs', marker: /任务调度|调度中心/ },
  { name: '调度运行中心', path: '/scheduler/operations', marker: /调度运行|可靠性|异常恢复/ },
  { name: '消息中心', path: '/notifications', marker: /消息中心|通知中心/ },
  { name: 'IM 推送平台', path: '/im/management', marker: /IM 推送平台|应用管理/ },
  { name: '开放平台', path: '/openapi', marker: /开放平台|OpenAPI/ },
  { name: 'BOTP', path: '/botp', marker: /BOTP|单据下推|单据转换/ },
]

for (const target of corePages) {
  test(`${target.name}可以正常打开`, async ({ page }, testInfo) => {
    const pageErrors = []
    const consoleErrors = []
    const serverErrors = []
    const failedRequests = []

    page.on('pageerror', error => pageErrors.push(error.message))
    page.on('console', message => {
      if (message.type() === 'error') consoleErrors.push(message.text())
    })
    page.on('response', response => {
      if (response.url().includes('/api/') && response.status() >= 500) {
        serverErrors.push(`${response.status()} ${response.url()}`)
      }
    })
    page.on('requestfailed', request => {
      if (request.url().includes('/api/')) {
        failedRequests.push(`${request.failure()?.errorText || 'FAILED'} ${request.url()}`)
      }
    })

    const response = await page.goto(target.path, { waitUntil: 'domcontentloaded' })

    expect(response, `${target.name} 应返回 HTTP 响应`).not.toBeNull()
    expect(response.status(), `${target.name} 不应返回 5xx`).toBeLessThan(500)
    await expect(page).toHaveURL(new RegExp(`${target.path.replaceAll('/', '\\/')}(?:[?#].*)?$`))
    await expect(page.locator('body')).toContainText(target.marker)
    await expect(page.locator('body')).not.toContainText('占位页面')

    if (consoleErrors.length > 0) {
      await testInfo.attach('console-errors.txt', {
        body: consoleErrors.join('\n'),
        contentType: 'text/plain',
      })
    }
    if (failedRequests.length > 0) {
      await testInfo.attach('failed-api-requests.txt', {
        body: failedRequests.join('\n'),
        contentType: 'text/plain',
      })
    }

    expect(pageErrors, `页面运行错误：\n${pageErrors.join('\n')}`).toEqual([])
    expect(serverErrors, `接口 5xx：\n${serverErrors.join('\n')}`).toEqual([])
  })
}
