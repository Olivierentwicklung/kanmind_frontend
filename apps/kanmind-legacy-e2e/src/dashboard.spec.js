const { test, expect } = require('@playwright/test');
const { authenticate, expectApiCall, mockApp } = require('./support/app');

async function openDashboard(page, options) {
  await authenticate(page);
  const state = await mockApp(page, options);
  await page.goto('/pages/dashboard/index.html');
  await expect(page.locator('#welcome_message')).toContainText('Ada Lovelace');
  return state;
}

test('protected dashboard redirects visitors without credentials', async ({ page }) => {
  await mockApp(page);
  await page.goto('/pages/dashboard/index.html');
  await expect(page).toHaveURL(/\/pages\/auth\/login\.html$/);
});

test('dashboard renders welcome text, counts, urgent task and boards', async ({ page }) => {
  await openDashboard(page);
  await expect(page.locator('#dashboard_task_count')).toHaveText('3');
  await expect(page.locator('#dashboard_member_count')).toHaveText('1');
  await expect(page.locator('#high_prio_count')).toHaveText('1');
  await expect(page.locator('#upcoming_deadline')).toContainText('October 31, 2099');
  await expect(page.getByRole('link', { name: 'Migration Board' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Product Roadmap' })).toBeVisible();
});

test('dashboard renders assigned task rows and their metadata', async ({ page }) => {
  await openDashboard(page);
  const row = page.getByRole('row').filter({ hasText: 'Build migration safety net' });
  await expect(row).toContainText('2099-12-31');
  await expect(row).toContainText('to-do');
  await expect(row).toContainText('2');
  await expect(page.getByRole('row').filter({ hasText: 'Review API contracts' })).toBeVisible();
});

test('dashboard has explicit empty states', async ({ page }) => {
  await openDashboard(page, { boards: [], tasks: [] });
  await expect(page.getByText('No boards available')).toBeVisible();
  await expect(page.getByText('No tasks available')).toBeVisible();
  await expect(page.locator('#dashboard_task_count')).toHaveText('0');
  await expect(page.locator('#upcoming_deadline')).toHaveText('no upcoming deadline');
});

test('task insight switch loads reviewer tasks', async ({ page }) => {
  const state = await openDashboard(page);
  await page.locator('.switch').click();
  await expectApiCall(state, 'GET', '/api/tasks/reviewing');
  await expect(page.getByRole('cell', { name: 'Review API contracts' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Build migration safety net' })).toHaveCount(0);
});

test('dashboard board link navigates to its board', async ({ page }) => {
  await openDashboard(page);
  await page.getByRole('link', { name: 'Migration Board' }).click();
  await expect(page).toHaveURL(/\/pages\/board\/(?:index\.html)?\?id=7$/);
});

test('dashboard task row navigates to board and task query parameters', async ({ page }) => {
  await openDashboard(page);
  await page.getByRole('cell', { name: 'Build migration safety net' }).click();
  await expect(page).toHaveURL(/\/pages\/board\/\?id=7&task_id=21$/);
});

test('Boards button navigates to the board collection', async ({ page }) => {
  await openDashboard(page);
  await page.getByRole('button', { name: 'Boards' }).click();
  await expect(page).toHaveURL(/\/pages\/boards\/$/);
});

test('header menu exposes dashboard and boards navigation', async ({ page }) => {
  await openDashboard(page);
  await page.locator('.menu_toggle').first().click();
  await expect(page.locator('.menu_content').first()).toContainText('Dashboard');
  await expect(page.locator('.menu_content').first()).toContainText('Boards');
  await expect(page.locator('.menu_toggle').first()).toHaveAttribute('open', 'true');
});

test('logout removes credentials and returns to login', async ({ page }) => {
  await openDashboard(page);
  await page.locator('.menu_toggle').nth(1).click();
  await page.getByText('Log out', { exact: true }).click();
  await expect(page).toHaveURL(/\/pages\/auth\/login\.html$/);
  await expect.poll(() => page.evaluate(() => localStorage.getItem('auth-token'))).toBeNull();
});
