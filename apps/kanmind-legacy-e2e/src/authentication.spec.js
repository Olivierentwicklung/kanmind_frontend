const { test, expect } = require('@playwright/test');
const { authenticate, defaultUser, expectApiCall, mockApp } = require('./support/app');

test('redirects an unauthenticated root visit to login', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/pages\/auth\/login\.html$/);
});

test('redirects an authenticated root visit to dashboard', async ({ page }) => {
  await authenticate(page);
  await mockApp(page);
  await page.goto('/');
  await expect(page).toHaveURL(/\/pages\/dashboard\/index\.html$/);
});

test('login page exposes the sign-up navigation', async ({ page }) => {
  await page.goto('/pages/auth/login.html');
  await expect(page.getByRole('heading', { name: 'Log in' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Sign up', exact: true })).toHaveAttribute('href', './register.html');
});

test('login validates malformed email addresses on blur', async ({ page }) => {
  await page.goto('/pages/auth/login.html');
  await page.getByLabel('Email').fill('not-an-email');
  await page.getByLabel('Password').focus();
  await expect(page.locator('#email_group')).toHaveAttribute('error', 'true');
  await expect(page.getByText('Please enter a valid email address.')).toBeVisible();
});

test('login clears the email error for a valid address', async ({ page }) => {
  await page.goto('/pages/auth/login.html');
  await page.getByLabel('Email').fill('ada@example.com');
  await page.getByLabel('Password').focus();
  await expect(page.locator('#email_group')).toHaveAttribute('error', 'false');
});

test('login validates an empty password on blur', async ({ page }) => {
  await page.goto('/pages/auth/login.html');
  await page.getByLabel('Password').focus();
  await page.getByLabel('Email').focus();
  await expect(page.locator('#password_group')).toHaveAttribute('error', 'true');
  await expect(page.getByText('Password is required.')).toBeVisible();
});

test('password visibility control toggles the input type', async ({ page }) => {
  await page.goto('/pages/auth/login.html');
  const password = page.getByLabel('Password');
  await expect(password).toHaveAttribute('type', 'password');
  await page.locator('.password_eye').click();
  await expect(password).toHaveAttribute('type', 'text');
  await page.locator('.password_eye').click();
  await expect(password).toHaveAttribute('type', 'password');
});

test('rejected login displays the existing credentials error', async ({ page }) => {
  await mockApp(page, { loginOk: false });
  await page.goto('/pages/auth/login.html');
  await page.getByLabel('Email').fill('ada@example.com');
  await page.getByLabel('Password').fill('wrong-password');
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await expect(page.locator('#error_login')).toHaveAttribute('error', 'true');
  await expect(page.locator('#error_login')).toBeVisible();
  await expect(page).toHaveURL(/login\.html$/);
});

test('successful login sends the form payload and stores all credentials', async ({ page }) => {
  const state = await mockApp(page);
  await page.goto('/pages/auth/login.html');
  await page.getByLabel('Email').fill('ada@example.com');
  await page.getByLabel('Password').fill('secret-password');
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await expect(page).toHaveURL(/\/pages\/dashboard\/index\.html$/);
  await expectApiCall(state, 'POST', '/api/login', { email: 'ada@example.com', password: 'secret-password' });
  await expect.poll(() => page.evaluate(() => Object.fromEntries([
    ['token', localStorage.getItem('auth-token')],
    ['userId', localStorage.getItem('auth-user-id')],
    ['email', localStorage.getItem('auth-email')],
    ['fullname', localStorage.getItem('auth-fullname')],
  ]))).toEqual({ token: defaultUser.token, userId: '42', email: defaultUser.email, fullname: defaultUser.fullname });
});

test('guest login uses the configured guest credentials', async ({ page }) => {
  const state = await mockApp(page);
  await page.goto('/pages/auth/login.html');
  await page.getByRole('button', { name: 'Guest Log in' }).click();
  await expect(page).toHaveURL(/\/pages\/dashboard\/index\.html$/);
  await expectApiCall(state, 'POST', '/api/login', { email: 'kevin@kovacsi.de', password: 'asdasdasd' });
});
