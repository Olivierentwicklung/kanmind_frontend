import { defineConfig, devices } from '@playwright/test';
import { workspaceRoot } from '@nx/devkit';

export default defineConfig({
  testDir: './src',
  fullyParallel: true,
  forbidOnly: Boolean(process.env['CI']),
  retries: process.env['CI'] ? 2 : 0,
  workers: process.env['CI'] ? 1 : 2,
  reporter: [[process.env['CI'] ? 'line' : 'list'], ['html', { open: 'never', outputFolder: '../../playwright-report/angular' }]],
  outputDir: '../../test-results/angular',
  use: {
    baseURL: 'http://127.0.0.1:4200',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 5'] } },
  ],
  webServer: {
    command: 'npm run serve -- --host 127.0.0.1 --port 4200',
    url: 'http://127.0.0.1:4200',
    reuseExistingServer: !process.env['CI'],
    cwd: workspaceRoot,
  },
});
