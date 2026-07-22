const { defineConfig, devices } = require('@playwright/test');
const { workspaceRoot } = require('@nx/devkit');

module.exports = defineConfig({
  testDir: './src',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  // Keep local Chromium context creation stable on development machines.
  // CI remains sequential for maximum reproducibility.
  workers: process.env.CI ? 1 : 2,
  reporter: [
    [process.env.CI ? 'line' : 'list'],
    ['html', { open: 'never', outputFolder: '../../playwright-report/legacy' }],
  ],
  use: {
    baseURL: 'http://127.0.0.1:4174',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  outputDir: '../../test-results/legacy',
  projects: [
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chromium',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'npx http-server apps/kanmind-legacy/src -a 127.0.0.1 -p 4174 -c-1',
    url: 'http://127.0.0.1:4174',
    reuseExistingServer: !process.env.CI,
    cwd: workspaceRoot,
  },
});
