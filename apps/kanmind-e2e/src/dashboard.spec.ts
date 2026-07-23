import { expect, Page, test } from '@playwright/test';

const boards = [
  { id: 7, title: 'Migration Board', owner_id: 42 },
  { id: 8, title: 'Product Roadmap', owner_id: 99 },
];

const assignedTasks = [
  {
    id: 21,
    board: 7,
    title: 'Build migration safety net',
    due_date: '2099-12-31',
    priority: 'high',
    status: 'to-do',
    comments_count: 2,
    assignee: { id: 42, fullname: 'Ada Lovelace' },
  },
  {
    id: 22,
    board: 7,
    title: 'Ship Angular version',
    due_date: '2099-10-31',
    priority: 'low',
    status: 'done',
    comments_count: 0,
    assignee: null,
  },
];

async function openDashboard(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.setItem('auth-token', 'dashboard-token');
    localStorage.setItem('auth-user-id', '42');
    localStorage.setItem('auth-email', 'ada@example.com');
    localStorage.setItem('auth-fullname', 'Ada Lovelace');
  });
  await page.route('**/api/boards/', (route) => route.fulfill({ json: boards }));
  await page.route('**/api/tasks/assigned-to-me/', (route) =>
    route.fulfill({ json: assignedTasks }),
  );
  await page.route('**/api/tasks/reviewing/', (route) =>
    route.fulfill({ json: [assignedTasks[1]] }),
  );
  await page.goto('/dashboard');
}

test('dashboard renders migrated overview and task components', async ({ page }) => {
  await openDashboard(page);

  await expect(page.getByRole('heading', { level: 1 })).toContainText('Welcome Ada Lovelace');
  await expect(page.getByText('Migration Board')).toBeVisible();
  await expect(page.getByText('Product Roadmap')).toBeVisible();
  await expect(page.getByRole('button', { name: /Open task Build migration safety net/ })).toBeVisible();
  await expect(page.getByRole('progressbar', { name: 'Completed assigned tasks' })).toHaveAttribute(
    'aria-valuenow',
    '50',
  );
});

test('dashboard switches to reviewer tasks and preserves task navigation', async ({ page }) => {
  await openDashboard(page);

  await page.getByRole('button', { name: 'Tasks to review' }).click();
  await expect(page.getByRole('button', { name: /Open task Ship Angular version/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Open task Build migration safety net/ })).toHaveCount(0);

  await page.getByRole('button', { name: /Open task Ship Angular version/ }).click();
  await expect(page).toHaveURL(/\/board\?id=7&task_id=22$/);
});
