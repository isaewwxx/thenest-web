import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : 4,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:4321',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    actionTimeout: 10_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run preview -- --port 4321',
    url: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:4321',
    reuseExistingServer: true,
    timeout: 60_000,
    env: {
      ANTIGRAVITY_AGENT: '',
      ANTIGRAVITY_PROJECT_ID: '',
      CLAUDECODE: '',
      OPENCODE: '',
      CODEX_THREAD_ID: '',
      CURSOR_TRACE_ID: '',
    },
  },
});
