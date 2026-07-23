import { expect, Page, test } from '@playwright/test';

const owner = { id: 42, email: 'ada@example.com', fullname: 'Ada Lovelace' };
const reviewer = { id: 43, email: 'grace@example.com', fullname: 'Grace Hopper' };
const defaultTasks = [
  {
    id: 21,
    board: 7,
    title: 'Build migration safety net',
    description: 'Characterize the Angular migration',
    due_date: '2099-12-31',
    priority: 'high',
    status: 'to-do',
    comments_count: 1,
    assignee: owner,
    reviewer,
  },
  {
    id: 22,
    board: 7,
    title: 'Ship Angular version',
    description: 'Preserve visible behavior',
    due_date: '2099-10-31',
    priority: 'low',
    status: 'done',
    comments_count: 0,
    assignee: reviewer,
    reviewer: null,
  },
];

async function openBoard(page: Page, suffix = ''): Promise<void> {
  const tasks = structuredClone(defaultTasks);
  await page.addInitScript(() => {
    localStorage.setItem('auth-token', 'board-token');
    localStorage.setItem('auth-user-id', '42');
    localStorage.setItem('auth-email', 'ada@example.com');
    localStorage.setItem('auth-fullname', 'Ada Lovelace');
  });

  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname.replace(/\/$/, '');
    const method = request.method();

    if (method === 'GET' && path === '/api/boards/7') {
      await route.fulfill({
        json: {
          id: 7,
          title: 'Migration Board',
          owner_id: 42,
          member_count: 2,
          ticket_count: tasks.length,
          tasks_to_do_count: 1,
          tasks_high_prio_count: 1,
          members: [owner, reviewer],
          tasks,
        },
      });
      return;
    }
    if (method === 'GET' && path === '/api/tasks/21/comments') {
      await route.fulfill({
        json: [
          {
            id: 31,
            author: 'Ada Lovelace',
            content: 'Existing migration comment',
            created_at: '2025-01-01T00:00:00Z',
          },
        ],
      });
      return;
    }
    if (method === 'PATCH' && path === '/api/tasks/21') {
      Object.assign(tasks[0], request.postDataJSON());
      await route.fulfill({ json: tasks[0] });
      return;
    }
    await route.fulfill({ status: 404, json: { detail: `${method} ${path}` } });
  });

  await page.goto(`/board?id=7${suffix}`);
  await expect(page.getByRole('heading', { name: 'Migration Board' })).toBeVisible();
}

test('board renders columns and filters tasks by description', async ({ page }) => {
  await openBoard(page);

  await expect(page.getByRole('heading', { name: 'To-do' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Done' })).toBeVisible();
  await page.getByLabel('Search tasks').fill('visible behavior');
  await expect(page.getByText('Ship Angular version')).toBeVisible();
  await expect(page.getByText('Build migration safety net')).toHaveCount(0);
});

test('task query parameter opens its details and comments', async ({ page }) => {
  await openBoard(page, '&task_id=21');

  await expect(page.getByRole('dialog')).toContainText('Characterize the Angular migration');
  await expect(page.getByRole('dialog')).toContainText('Existing migration comment');
});

test('moving a task updates its status column', async ({ page }) => {
  await openBoard(page);

  const card = page.getByRole('listitem').filter({ hasText: 'Build migration safety net' });
  await card.getByRole('button', { name: /In-progress/ }).click();
  await expect(
    page.getByRole('region', { name: 'In-progress' }).getByText('Build migration safety net'),
  ).toBeVisible();
});
