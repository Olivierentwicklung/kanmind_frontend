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

test('authenticated legal pages expose the application shell and logout', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('auth-token', 'legal-token');
    localStorage.setItem('auth-user-id', '42');
    localStorage.setItem('auth-email', 'ada@example.com');
    localStorage.setItem('auth-fullname', 'Ada Lovelace');
  });
  await page.goto('/imprint');

  await expect(page.getByLabel('Signed in as Ada Lovelace')).toHaveText('AL');
  await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toContainText(
    'Dashboard / Imprint',
  );
  await page.getByRole('button', { name: 'Log out' }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect.poll(() => page.evaluate(() => localStorage.getItem('auth-token'))).toBeNull();
});

test('invalid board URLs return authenticated users to the boards collection', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('auth-token', 'route-token');
    localStorage.setItem('auth-user-id', '42');
    localStorage.setItem('auth-email', 'ada@example.com');
    localStorage.setItem('auth-fullname', 'Ada Lovelace');
  });
  await page.route('**/api/boards/', (route) => route.fulfill({ json: [] }));
  await page.goto('/board');

  await expect(page).toHaveURL(/\/boards$/);
  await expect(page.getByRole('heading', { name: 'Your Boards' })).toBeVisible();
});

test('authenticated pages do not overflow the mobile viewport', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('auth-token', 'mobile-token');
    localStorage.setItem('auth-user-id', '42');
    localStorage.setItem('auth-email', 'ada@example.com');
    localStorage.setItem('auth-fullname', 'Ada Lovelace');
  });
  await page.goto('/privacy');

  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport + 1);
});
