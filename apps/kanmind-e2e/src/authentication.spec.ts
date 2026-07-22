import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
});

test('root redirects unauthenticated users to login', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: 'Log in' })).toBeVisible();
});

test('legacy login URL redirects and preserves its query', async ({ page }) => {
  await page.goto('/pages/auth/login.html?from=legacy');
  await expect(page).toHaveURL(/\/login\?from=legacy$/);
});

test('invalid form exposes email and password validation', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('not-an-email');
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await expect(page.getByText('Please enter a valid email address.')).toBeVisible();
  await expect(page.getByText('Password is required.')).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});

test('password visibility can be toggled accessibly', async ({ page }) => {
  await page.goto('/login');
  const password = page.getByLabel('Password', { exact: true });
  await password.fill('secret');
  await page.getByRole('button', { name: 'Show password' }).click();
  await expect(password).toHaveAttribute('type', 'text');
  await page.getByRole('button', { name: 'Hide password' }).click();
  await expect(password).toHaveAttribute('type', 'password');
});

test('rejected login shows the existing credential feedback', async ({ page }) => {
  await page.route('**/api/login/', (route) => route.fulfill({ status: 401, contentType: 'application/json', body: '{}' }));
  await page.goto('/login');
  await page.getByLabel('Email').fill('user@example.com');
  await page.getByLabel('Password', { exact: true }).fill('wrong');
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Benutzer oder Passwort falsch');
});

test('successful login preserves the wire contract, storage keys and navigation', async ({ page }) => {
  let requestBody: unknown;
  await page.route('**/api/login/', async (route) => {
    requestBody = route.request().postDataJSON();
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ token: 'test-token', user_id: 12, email: 'user@example.com', fullname: 'Test User' }) });
  });
  await page.goto('/login');
  await page.getByLabel('Email').fill('user@example.com');
  await page.getByLabel('Password', { exact: true }).fill('secret');
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  expect(requestBody).toEqual({ email: 'user@example.com', password: 'secret' });
  expect(await page.evaluate(() => Object.fromEntries(['auth-token', 'auth-user-id', 'auth-email', 'auth-fullname'].map((key) => [key, localStorage.getItem(key)])))).toEqual({ 'auth-token': 'test-token', 'auth-user-id': '12', 'auth-email': 'user@example.com', 'auth-fullname': 'Test User' });
});

test('guest login submits the configured demo account', async ({ page }) => {
  let requestBody: unknown;
  await page.route('**/api/login/', async (route) => {
    requestBody = route.request().postDataJSON();
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ token: 'guest', user_id: 1, email: 'kevin@kovacsi.de', fullname: 'Guest User' }) });
  });
  await page.goto('/login');
  await page.getByRole('button', { name: 'Guest Log in' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  expect(requestBody).toEqual({ email: 'kevin@kovacsi.de', password: 'asdasdasd' });
});
