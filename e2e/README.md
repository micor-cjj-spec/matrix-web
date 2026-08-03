# Matrix Playwright 验收

本目录用于对部署后的 Matrix Web 做只读自动化验收。

## 当前覆盖

- 登录页公开可访问
- 登录页桌面端与移动端基础渲染
- 账号密码登录并复用认证状态
- 工作台、财务、审批、费用、知识、AI、调度、消息、OpenAPI、BOTP 等核心路由巡检
- 页面 JavaScript 运行错误
- `/api/**` 接口 5xx
- 失败截图、视频、Trace 与 HTML 报告

当前测试不会新增、提交、审批或删除业务单据。

## 本地运行

先安装固定版本的 Playwright 测试运行时和 Chromium：

```bash
npm run e2e:install
```

只检查公开登录页：

```bash
PLAYWRIGHT_BASE_URL=https://micor.top npm run test:e2e:public
```

运行完整验收：

```bash
PLAYWRIGHT_BASE_URL=https://micor.top \
E2E_USERNAME=your-test-user \
E2E_PASSWORD=your-test-password \
npm run test:e2e
```

Windows PowerShell：

```powershell
$env:PLAYWRIGHT_BASE_URL='https://micor.top'
$env:E2E_USERNAME='your-test-user'
$env:E2E_PASSWORD='your-test-password'
npm run test:e2e
```

调试命令：

```bash
npm run test:e2e:headed
npm run test:e2e:ui
npm run test:e2e:report
```

## GitHub Actions

工作流：`Matrix Production E2E`

在仓库中配置以下 Actions Secrets 后，工作流会自动启用登录后验收：

- `E2E_USERNAME`
- `E2E_PASSWORD`

没有配置 Secrets 时，工作流只执行公开登录页检查。

建议使用独立的最小权限测试账号，避免使用个人管理员账号。测试账号密码必须保持正确；Matrix 连续登录失败达到阈值后会要求图形验证码，无人值守验收将无法继续。
