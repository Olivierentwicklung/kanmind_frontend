import { expect, Page, test } from '@playwright/test';

const member = { id: 43, email: 'grace@example.com', fullname: 'Grace Hopper' };
const owner = { id: 42, email: 'ada@example.com', fullname: 'Ada Lovelace' };

async function openBoards(page: Page): Promise<void> {
  const boards = [
    {
      id: 7,
      title: 'Migration Board',
      owner_id: 42,
      member_count: 2,
      ticket_count: 3,
      tasks_to_do_count: 1,
      tasks_high_prio_count: 1,
    },
    {
      id: 8,
      title: 'Product Roadmap',
      owner_id: 99,
      member_count: 2,
      ticket_count: 4,
      tasks_to_do_count: 2,
      tasks_high_prio_count: 0,
    },
  ];

  await page.addInitScript(() => {
    localStorage.setItem('auth-token', 'boards-token');
    localStorage.setItem('auth-user-id', '42');
    localStorage.setItem('auth-email', 'ada@example.com');
    localStorage.setItem('auth-fullname', 'Ada Lovelace');
  });

  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace(/\/$/, '');
    const method = request.method();

    if (method === 'GET' && path === '/api/boards') {
      await route.fulfill({ json: boards });
      return;
    }
    if (method === 'GET' && path === '/api/email-check') {
      const found = url.searchParams.get('email') === member.email;
      await route.fulfill(found ? { json: member } : { status: 404, json: { detail: 'Not found' } });
      return;
    }
    if (method === 'POST' && path === '/api/boards') {
      const body = request.postDataJSON() as { title: string; members: number[] };
      const created = {
        id: 9,
        title: body.title,
        owner_id: 42,
        member_count: body.members.length,
        ticket_count: 0,
        tasks_to_do_count: 0,
        tasks_high_prio_count: 0,
      };
      boards.push(created);
      await route.fulfill({ status: 201, json: created });
      return;
    }
    if (path === '/api/boards/7' && method === 'GET') {
      await route.fulfill({ json: { ...boards[0], members: [owner, member] } });
      return;
    }
    if (path === '/api/boards/7' && method === 'PATCH') {
      const body = request.postDataJSON() as { title?: string; members?: number[] };
      Object.assign(boards[0], body);
      await route.fulfill({ json: { ...boards[0], members: [owner, member] } });
      return;
    }
    if (path === '/api/boards/7' && method === 'DELETE') {
      boards.splice(0, 1);
      await route.fulfill({ status: 204, body: '' });
      return;
    }
    await route.fulfill({ status: 404, json: { detail: `${method} ${path} not mocked` } });
  });

  await page.goto('/boards');
  await expect(page.getByRole('heading', { name: 'Your Boards' })).toBeVisible();
}

test('boards list renders metrics, filters, and navigates to a board', async ({ page }) => {
  await openBoards(page);

  const board = page.getByRole('listitem').filter({ hasText: 'Migration Board' });
  await expect(board).toContainText('2 Members');
  await expect(board).toContainText('3 Tickets');

  await page.getByLabel('Search boards').fill('roadMAP');
  await expect(page.getByText('Product Roadmap')).toBeVisible();
  await expect(page.getByText('Migration Board')).toHaveCount(0);

  await page.getByRole('button', { name: 'Open Product Roadmap' }).click();
  await expect(page).toHaveURL(/\/board\?id=8$/);
});

test('a board can be created with an invited member', async ({ page }) => {
  await openBoards(page);

  await page.getByRole('button', { name: 'Create board' }).click();
  await page.getByLabel('E-mail').fill(member.email);
  await page.getByRole('button', { name: 'Add member' }).click();
  await expect(page.getByText(member.email)).toBeVisible();
  await page.getByLabel('Title').fill('Angular Migration');
  await page.getByRole('button', { name: 'Create', exact: true }).click();

  await expect(page.getByRole('button', { name: 'Open Angular Migration' })).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('settings preserve the owner, rename, and confirm deletion', async ({ page }) => {
  await openBoards(page);

  await page.getByRole('button', { name: 'Settings for Migration Board' }).click();
  await expect(page.getByText('ada@example.com (owner)')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Remove grace@example.com' })).toBeVisible();

  await page.getByRole('button', { name: 'Edit board title' }).click();
  await page.getByLabel('Board title').fill('Renamed Board');
  await page.getByRole('button', { name: 'Save title' }).click();
  await expect(page.getByRole('heading', { name: 'Renamed Board' })).toBeVisible();

  await page.getByRole('button', { name: 'Delete board' }).click();
  await expect(page.getByText('Are you sure you want to delete Renamed Board?')).toBeVisible();
  await page.getByRole('button', { name: 'Confirm delete board' }).click();
  await expect(page.getByText('Renamed Board')).toHaveCount(0);
});
