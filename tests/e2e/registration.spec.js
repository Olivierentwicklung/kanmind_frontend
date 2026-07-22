const { test, expect } = require('@playwright/test');
const { expectApiCall, mockApp } = require('./support/app');

test('registration page exposes the login navigation', async ({ page }) => {
  await page.goto('/pages/auth/register.html');
  await expect(page.getByRole('heading', { name: 'Sign up' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Log in/i })).toHaveAttribute('href', './login.html');
});

test('empty registration submission marks every required group invalid', async ({ page }) => {
  await page.goto('/pages/auth/register.html');
  await page.getByRole('button', { name: 'Sign up', exact: true }).click();
  for (const id of ['fullname_group', 'email_group', 'password_group', 'privacy_policy_checkbox_group']) {
    await expect(page.locator(`#${id}`)).toHaveAttribute('error', 'true');
  }
  await expect(page.locator('#repeated_password_group')).toHaveAttribute('error', 'false');
});

test('full name requires at least two words', async ({ page }) => {
  await page.goto('/pages/auth/register.html');
  await page.getByLabel('Full name').fill('Ada');
  await page.getByLabel('Email').focus();
  await expect(page.locator('#fullname_group')).toHaveAttribute('error', 'true');
  await page.getByLabel('Full name').fill('Ada Lovelace');
  await page.getByLabel('Email').focus();
  await expect(page.locator('#fullname_group')).toHaveAttribute('error', 'false');
});

test('registration validates email format', async ({ page }) => {
  await page.goto('/pages/auth/register.html');
  await page.getByLabel('Email').fill('broken');
  await page.getByLabel('Password', { exact: true }).focus();
  await expect(page.locator('#email_group')).toHaveAttribute('error', 'true');
});

test('registration requires a password of at least eight characters', async ({ page }) => {
  await page.goto('/pages/auth/register.html');
  await page.getByLabel('Password', { exact: true }).fill('short');
  await page.getByLabel('Confirm password').focus();
  await expect(page.locator('#password_group')).toHaveAttribute('error', 'true');
  await page.getByLabel('Password', { exact: true }).fill('long-enough');
  await page.getByLabel('Confirm password').focus();
  await expect(page.locator('#password_group')).toHaveAttribute('error', 'false');
});

test('registration detects mismatched password confirmation', async ({ page }) => {
  await page.goto('/pages/auth/register.html');
  await page.getByLabel('Password', { exact: true }).fill('long-enough');
  await page.getByLabel('Confirm password').fill('different');
  await page.getByLabel('Email').focus();
  await expect(page.locator('#repeated_password_group')).toHaveAttribute('error', 'true');
  await expect(page.getByText('Passwords do not match.')).toBeVisible();
});

test('privacy checkbox updates its validation state', async ({ page }) => {
  await page.goto('/pages/auth/register.html');
  const privacy = page.getByLabel(/I have read and agree/);
  await page.locator('.checkbox_icon').click();
  await expect(privacy).toBeChecked();
  await expect(page.locator('#privacy_policy_checkbox_group')).toHaveAttribute('error', 'false');
  await page.locator('.checkbox_icon').click();
  await expect(privacy).not.toBeChecked();
  await expect(page.locator('#privacy_policy_checkbox_group')).toHaveAttribute('error', 'true');
});

test('successful registration sends the exact API contract', async ({ page }) => {
  const state = await mockApp(page);
  await page.goto('/pages/auth/register.html');
  await page.getByLabel('Full name').fill('Ada Lovelace');
  await page.getByLabel('Email').fill('ada@example.com');
  await page.getByLabel('Password', { exact: true }).fill('long-enough');
  await page.getByLabel('Confirm password').fill('long-enough');
  await page.locator('.checkbox_icon').click();
  await page.getByRole('button', { name: 'Sign up', exact: true }).click();
  await expect(page).toHaveURL(/\/pages\/dashboard\/index\.html$/);
  await expectApiCall(state, 'POST', '/api/registration', {
    fullname: 'Ada Lovelace', email: 'ada@example.com', password: 'long-enough', repeated_password: 'long-enough',
  });
});

test('registration API errors are rendered in a toast', async ({ page }) => {
  await mockApp(page, { fail: { 'POST /api/registration': { status: 400, body: { email: ['Email already exists'] } } } });
  await page.goto('/pages/auth/register.html');
  await page.getByLabel('Full name').fill('Ada Lovelace');
  await page.getByLabel('Email').fill('ada@example.com');
  await page.getByLabel('Password', { exact: true }).fill('long-enough');
  await page.getByLabel('Confirm password').fill('long-enough');
  await page.locator('.checkbox_icon').click();
  await page.getByRole('button', { name: 'Sign up', exact: true }).click();
  await expect(page.locator('.toast_msg')).toContainText('Email already exists');
  await expect(page).toHaveURL(/register\.html$/);
});
