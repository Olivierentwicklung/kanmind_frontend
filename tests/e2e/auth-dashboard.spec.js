const { test, expect } = require('@playwright/test');

const apiBaseUrl = 'http://127.0.0.1:8000/api';

async function mockDashboardDependencies(page) {
  await page.route('https://cdn.jsdelivr.net/**', async (route) => {
    await route.fulfill({
      contentType: 'application/javascript',
      body: 'window.Chart = class Chart {};',
    });
  });

  await page.route(`${apiBaseUrl}/**`, async (route) => {
    const pathname = new URL(route.request().url()).pathname;

    if (pathname === '/api/login/') {
      await route.fulfill({
        json: {
          token: 'playwright-token',
          user_id: 42,
          email: 'ada@example.com',
          fullname: 'Ada Lovelace',
        },
      });
      return;
    }

    if (pathname === '/api/boards/') {
      await route.fulfill({
        json: [{ id: 7, title: 'QA Board', owner_id: 99 }],
      });
      return;
    }

    if (pathname === '/api/tasks/assigned-to-me/') {
      await route.fulfill({
        json: [
          {
            id: 21,
            board: 7,
            title: 'Verify dashboard',
            description: 'Covered by Playwright',
            due_date: '2099-12-31',
            priority: 'high',
            status: 'to-do',
            comments_count: 2,
            assignee: { fullname: 'Ada Lovelace' },
          },
        ],
      });
      return;
    }

    await route.fulfill({ status: 404, json: { detail: 'Not mocked' } });
  });
}

test('redirects an unauthenticated visitor to the login page', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveURL(/\/pages\/auth\/login\.html$/);
  await expect(page.getByRole('heading', { name: 'Log in' })).toBeVisible();
});

test('shows the existing validation state for an invalid email', async ({ page }) => {
  await page.goto('/pages/auth/login.html');

  await page.getByLabel('Email').fill('not-an-email');
  await page.getByLabel('Password').focus();

  await expect(page.locator('#email_group')).toHaveAttribute('error', 'true');
  await expect(page.getByText('Please enter a valid email address.')).toBeVisible();
  await expect(page).toHaveURL(/\/pages\/auth\/login\.html$/);
});

test('logs in with mocked API data and renders the dashboard', async ({ page }) => {
  await mockDashboardDependencies(page);
  await page.goto('/pages/auth/login.html');

  await page.getByLabel('Email').fill('ada@example.com');
  await page.getByLabel('Password').fill('correct-horse-battery-staple');
  await page.getByRole('button', { name: 'Log in', exact: true }).click();

  await expect(page).toHaveURL(/\/pages\/dashboard\/index\.html$/);
  await expect(page.locator('#welcome_message')).toContainText('Welcome Ada Lovelace!');
  await expect(page.getByRole('link', { name: 'QA Board' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Verify dashboard' })).toBeVisible();
  await expect(page.locator('#dashboard_task_count')).toHaveText('1');
  await expect(page.locator('#dashboard_member_count')).toHaveText('1');
  await expect(page.locator('#high_prio_count')).toHaveText('1');

  const credentials = await page.evaluate(() => ({
    token: localStorage.getItem('auth-token'),
    userId: localStorage.getItem('auth-user-id'),
    email: localStorage.getItem('auth-email'),
    fullname: localStorage.getItem('auth-fullname'),
  }));

  expect(credentials).toEqual({
    token: 'playwright-token',
    userId: '42',
    email: 'ada@example.com',
    fullname: 'Ada Lovelace',
  });
});
