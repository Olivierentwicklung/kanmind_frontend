const { test, expect } = require('@playwright/test');
const { authenticate, mockApp } = require('./support/app');

test('imprint exposes its legal contact contract', async ({ page }) => {
  await page.goto('/pages/imprint/index.html');
  await expect(page.getByRole('heading', { name: 'Imprint' })).toBeVisible();
  await expect(page.getByText('Max Mustermann')).toBeVisible();
  await expect(page.getByRole('link', { name: '+44 123 456 789' })).toHaveAttribute('href', 'tel:+44123456789');
  await expect(page.getByRole('link', { name: 'info@example.com' })).toHaveAttribute('href', 'mailto:info@example.com');
  await expect(page.getByRole('heading', { name: 'Disclaimer' })).toBeVisible();
});

test('privacy page exposes its current content and imprint link', async ({ page }) => {
  await page.goto('/pages/privacy/index.html');
  await expect(page.getByRole('heading', { name: 'Privacy Policy' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Subtitle' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Imprint' })).toHaveAttribute('href', '../imprint/index.html');
});

test('legal pages hide dashboard breadcrumb for signed-out visitors', async ({ page }) => {
  await page.goto('/pages/privacy/index.html');
  await expect(page.locator('main nav')).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Log in' })).toBeVisible();
});

test('legal pages show dashboard breadcrumb for authenticated users', async ({ page }) => {
  await authenticate(page);
  await page.goto('/pages/imprint/index.html');
  await expect(page.locator('main nav')).toContainText('Dashboard / Imprint');
  await expect(page.locator('.profile_circle')).toContainText('AL');
});

test('footer navigation connects login, privacy and imprint pages', async ({ page }) => {
  await page.goto('/pages/auth/login.html');
  await page.getByRole('link', { name: 'Privacy Policy' }).click();
  await expect(page).toHaveURL(/\/pages\/privacy\/index\.html$/);
  await page.getByRole('link', { name: 'Imprint' }).click();
  await expect(page).toHaveURL(/\/pages\/imprint\/index\.html$/);
});

test('configured project applies a usable viewport without horizontal page overflow', async ({ page }) => {
  await authenticate(page);
  await mockApp(page);
  await page.goto('/pages/dashboard/index.html');
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport + 1);
});
