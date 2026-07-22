const { test, expect } = require('@playwright/test');
const { authenticate, expectApiCall, mockApp } = require('./support/app');

async function openBoards(page, options) {
  await authenticate(page);
  const state = await mockApp(page, options);
  await page.goto('/pages/boards/index.html');
  await expect(page.getByRole('heading', { name: 'Your Boards' })).toBeVisible();
  return state;
}

async function openCreateBoard(page) {
  await page.locator('header .add_btn').click({ force: true });
  await expect(page.locator('#dialog_wrapper')).toHaveAttribute('current-dialog', 'board_create');
}

async function openFirstBoardSettings(page) {
  const board = page.locator('#board_list > li').filter({ hasText: 'Migration Board' });
  await board.hover();
  await board.locator('.board_settings_btn').click({ force: true });
  await expect(page.locator('#dialog_wrapper')).toHaveAttribute('current-dialog', 'board_settings');
}

test('protected boards page redirects visitors without credentials', async ({ page }) => {
  await mockApp(page);
  await page.goto('/pages/boards/index.html');
  await expect(page).toHaveURL(/\/pages\/auth\/login\.html$/);
});

test('boards list renders titles and all summary metrics', async ({ page }) => {
  await openBoards(page);
  const board = page.locator('#board_list > li').filter({ hasText: 'Migration Board' });
  await expect(board).toContainText('5');
  await expect(board).toContainText('Members');
  await expect(board).toContainText('3');
  await expect(board).toContainText('Tickets');
  await expect(board).toContainText('Tasks To-do');
  await expect(board).toContainText('High Prio');
});

test('board search filters case-insensitively', async ({ page }) => {
  await openBoards(page);
  await page.locator('#board_search').fill('roadMAP');
  await page.locator('#board_search').press('End');
  await expect(page.getByText('Product Roadmap')).toBeVisible();
  await expect(page.getByText('Migration Board')).toHaveCount(0);
});

test('board search renders an explicit no-results state', async ({ page }) => {
  await openBoards(page);
  await page.locator('#board_search').fill('missing board');
  await page.locator('#board_search').press('End');
  await expect(page.getByText('...No boards available...')).toBeVisible();
});

test('clicking a board entry opens the board page', async ({ page }) => {
  await openBoards(page);
  await page.getByText('Migration Board').click();
  await expect(page).toHaveURL(/\/pages\/board\/\?id=7$/);
});

test('create-board button opens a clean dialog', async ({ page }) => {
  await openBoards(page);
  await openCreateBoard(page);
  await expect(page.locator('#dialog_wrapper')).toHaveAttribute('open', 'true');
  await expect(page.locator('#dialog_wrapper')).toHaveAttribute('current-dialog', 'board_create');
  await expect(page.getByRole('heading', { name: 'Add Board' })).toBeVisible();
  await expect(page.locator('#board_title_input')).toHaveValue('');
});

test('board title enforces its minimum length', async ({ page }) => {
  await openBoards(page);
  await openCreateBoard(page);
  await page.locator('#board_title_input').fill('ab');
  await page.getByRole('button', { name: 'Create', exact: true }).click();
  await expect(page.locator('#board_title_input_group')).toHaveAttribute('error', 'true');
  await expect(page.locator('#board_title_input_group').getByText('Title must be between 3 an 64 characters long.')).toBeVisible();
});

test('member invitation validates malformed email addresses', async ({ page }) => {
  await openBoards(page);
  await openCreateBoard(page);
  await page.locator('#create_board_email_input').fill('invalid');
  await page.locator('#create_board_email_input_group').getByRole('button', { name: 'Add' }).click();
  await expect(page.locator('#create_board_email_input_group')).toHaveAttribute('error', 'true');
  await expect(page.locator('#create_board_email_input_group #email_error_label')).toHaveText('Please enter a valid email address.');
});

test('member invitation reports an unknown email address', async ({ page }) => {
  await openBoards(page);
  await openCreateBoard(page);
  await page.locator('#create_board_email_input').fill('missing@example.com');
  await page.locator('#create_board_email_input_group').getByRole('button', { name: 'Add' }).click();
  await expect(page.locator('#create_board_email_input_group #email_error_label')).toHaveText("This email adress doesn't exist.");
});

test('known member can be added to a new board', async ({ page }) => {
  await openBoards(page);
  await openCreateBoard(page);
  await page.locator('#create_board_email_input').fill('grace@example.com');
  await page.locator('#create_board_email_input_group').getByRole('button', { name: 'Add' }).click();
  await expect(page.locator('#create_board_member_list')).toContainText('grace@example.com');
  await expect(page.locator('#create_board_email_input')).toHaveValue('');
});

test('creating a board sends title and member IDs then refreshes the list', async ({ page }) => {
  const state = await openBoards(page);
  await openCreateBoard(page);
  await page.locator('#create_board_email_input').fill('grace@example.com');
  await page.locator('#create_board_email_input_group').getByRole('button', { name: 'Add' }).click();
  await page.locator('#board_title_input').fill('Angular Migration');
  await page.getByRole('button', { name: 'Create', exact: true }).click();
  await expectApiCall(state, 'POST', '/api/boards', { title: 'Angular Migration', members: [43] });
  await expect(page.getByText('Angular Migration')).toBeVisible();
  await expect(page.locator('#dialog_wrapper')).toHaveAttribute('open', 'false');
});

test('board settings render owner and removable members', async ({ page }) => {
  await openBoards(page);
  await openFirstBoardSettings(page);
  await expect(page.getByRole('heading', { name: 'Board Settings' })).toBeVisible();
  await expect(page.locator('#board_settings_title')).toHaveText('Migration Board');
  await expect(page.locator('#board_settings_member_list')).toContainText('ada@example.com (owner)');
  await expect(page.locator('#board_settings_member_list')).toContainText('grace@example.comRemove');
});

test('board title can be renamed from settings', async ({ page }) => {
  const state = await openBoards(page);
  await openFirstBoardSettings(page);
  await page.locator('#board_settings_title_group .close_btn').click();
  await page.locator('#board_settings_title_input').fill('Renamed Board');
  await page.locator('#board_settings_title_group .confirm_btn').first().click();
  await expectApiCall(state, 'PATCH', '/api/boards/7', { title: 'Renamed Board' });
  await expect(page.locator('#board_settings_title')).toHaveText('Renamed Board');
});

test('board deletion requires confirmation and calls DELETE', async ({ page }) => {
  const state = await openBoards(page);
  await openFirstBoardSettings(page);
  await page.locator('[dialog-type="board_settings"] .add_btn').click({ force: true });
  const toast = page.locator('.toast_msg');
  await expect(toast).toContainText('Are you sure you want to delete the board Migration Board?');
  await toast.getByRole('button', { name: 'Delete Board' }).click();
  await expectApiCall(state, 'DELETE', '/api/boards/7');
  await expect(page.locator('#board_list').getByText('Migration Board')).toHaveCount(0);
});
