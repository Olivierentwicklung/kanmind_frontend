import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
});

test('root redirects unauthenticated users to login', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: 'Log in' })).toBeVisible();
});

test('previous login URL redirects and preserves its query', async ({ page }) => {
  await page.goto('/pages/auth/login.html?from=previous-client');
  await expect(page).toHaveURL(/\/login\?from=previous-client$/);
});

test('invalid form exposes email and password validation', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('not-an-email');
  await page.getByLabel('Password', { exact: true }).fill('x');
  await page.getByLabel('Password', { exact: true }).fill('');
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

test('registration validates required fields and matching passwords', async ({ page }) => {
  await page.goto('/register');
  await page.getByLabel('Full name').fill('Ada');
  await page.getByLabel('Email').fill('broken');
  await page.getByLabel('Password', { exact: true }).fill('long-enough');
  await page.getByLabel('Confirm password', { exact: true }).fill('different');
  await page.getByRole('button', { name: 'Sign up', exact: true }).click();

  await expect(page.getByText('Enter your full name')).toBeVisible();
  await expect(page.getByText('Please enter a valid email address.')).toBeVisible();
  await expect(page.getByText('Passwords do not match.')).toBeVisible();
  await expect(page.getByText('Please accept the privacy policy.')).toBeVisible();
});

test('successful registration preserves the wire contract, session and navigation', async ({ page }) => {
  let requestBody: unknown;
  await page.route('**/api/registration/', async (route) => {
    requestBody = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        token: 'registration-token',
        user_id: 14,
        email: 'ada@example.com',
        fullname: 'Ada Lovelace',
      }),
    });
  });
  await page.goto('/register');
  await page.getByLabel('Full name').fill('Ada Lovelace');
  await page.getByLabel('Email').fill('ada@example.com');
  await page.getByLabel('Password', { exact: true }).fill('long-enough');
  await page.getByLabel('Confirm password', { exact: true }).fill('long-enough');
  await page.getByRole('checkbox', { name: /I have read and agree/i }).check();
  await page.getByRole('button', { name: 'Sign up', exact: true }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  expect(requestBody).toEqual({
    fullname: 'Ada Lovelace',
    email: 'ada@example.com',
    password: 'long-enough',
    repeated_password: 'long-enough',
  });
  expect(await page.evaluate(() => localStorage.getItem('auth-token'))).toBe('registration-token');
});

test('registration API validation messages are announced', async ({ page }) => {
  await page.route('**/api/registration/', (route) => route.fulfill({
    status: 400,
    contentType: 'application/json',
    body: JSON.stringify({ email: ['Email already exists'] }),
  }));
  await page.goto('/register');
  await page.getByLabel('Full name').fill('Ada Lovelace');
  await page.getByLabel('Email').fill('ada@example.com');
  await page.getByLabel('Password', { exact: true }).fill('long-enough');
  await page.getByLabel('Confirm password', { exact: true }).fill('long-enough');
  await page.getByRole('checkbox', { name: /I have read and agree/i }).check();
  await page.getByRole('button', { name: 'Sign up', exact: true }).click();

  await expect(page.getByRole('alert')).toContainText('Email already exists');
  await expect(page).toHaveURL(/\/register$/);
});
