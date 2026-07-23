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
    if (method === 'POST' && path === '/api/tasks') {
      const body = request.postDataJSON();
      const created = {
        id: 23,
        comments_count: 0,
        assignee: null,
        reviewer: null,
        ...body,
      };
      tasks.push(created);
      await route.fulfill({ status: 201, json: created });
      return;
    }
    if (method === 'POST' && path === '/api/tasks/21/comments') {
      await route.fulfill({
        status: 201,
        json: {
          id: 32,
          author: 'Ada Lovelace',
          content: request.postDataJSON().content,
          created_at: '2026-07-23T00:00:00Z',
        },
      });
      return;
    }
    if (method === 'DELETE' && path === '/api/tasks/21/comments/31') {
      await route.fulfill({ status: 204, body: '' });
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

test('a task can be validated and created in a selected column', async ({ page }) => {
  await openBoard(page);

  await page.getByRole('button', { name: 'Add Task', exact: true }).click();
  await page.getByRole('button', { name: 'Add task', exact: true }).click();
  await expect(page.getByText('Title must be at least 3 characters long.')).toBeVisible();
  await page.getByRole('dialog').getByLabel('Status').selectOption('review');
  await page.getByLabel('Title').fill('Finish Angular migration');
  await page.getByLabel('Due date').fill('2099-09-30');
  await page.getByRole('button', { name: 'Add task', exact: true }).click();

  await expect(
    page.getByRole('region', { name: 'Review' }).getByText('Finish Angular migration'),
  ).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('task activity supports adding and deleting own comments', async ({ page }) => {
  await openBoard(page, '&task_id=21');

  await page.getByLabel('Add comment').fill('  Migration complete  ');
  await page.getByLabel('Add comment').press('Enter');
  await expect(page.getByText('Migration complete')).toBeVisible();

  await page.getByRole('button', { name: 'Delete comment by Ada Lovelace' }).first().click();
  await expect(page.getByText('Existing migration comment')).toHaveCount(0);
});
