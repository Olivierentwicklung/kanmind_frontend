import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => { await page.addInitScript(() => localStorage.clear()); });

test('guarded migration pages redirect guests to login', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login$/);
});

test('registration is a public Angular page', async ({ page }) => {
  await page.goto('/register');
  await expect(page.getByRole('heading', { name: 'Sign up' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Log in/i })).toHaveAttribute('href', '/login');
});

test('privacy and imprint remain reachable from the login footer', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('link', { name: 'Privacy Policy' }).click();
  await expect(page.getByRole('heading', { name: 'Privacy Policy' })).toBeVisible();
  await page.getByRole('link', { name: 'Imprint' }).click();
  await expect(page.getByRole('heading', { name: 'Imprint' })).toBeVisible();
  await expect(page.getByText('Max Mustermann')).toBeVisible();
});

test('unknown routes render an accessible not-found page', async ({ page }) => {
  await page.goto('/does-not-exist');
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Go to KanMind' })).toBeVisible();
});
