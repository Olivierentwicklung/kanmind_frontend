const { test, expect } = require('@playwright/test');
const { authenticate, expectApiCall, mockApp } = require('./support/app');

async function openBoard(page, suffix = '', options) {
  await authenticate(page);
  const state = await mockApp(page, options);
  await page.goto(`/pages/board/?id=7${suffix}`);
  await expect(page.locator('#board_title')).toHaveText('Migration Board');
  return state;
}

test('board renders breadcrumb, title, member summary and status columns', async ({ page }) => {
  await openBoard(page);
  await expect(page.locator('#board_title_link')).toHaveText('Migration Board');
  await expect(page.locator('#short_profile_list')).toContainText('AL');
  await expect(page.locator('#short_profile_list')).toContainText('+1');
  await expect(page.getByRole('heading', { name: 'To-do', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'In-progress', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Review', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Done', exact: true })).toBeVisible();
});

test('tasks render in their matching status columns', async ({ page }) => {
  await openBoard(page);
  await expect(page.locator('#to-do_column')).toContainText('Build migration safety net');
  await expect(page.locator('#in-progress_column')).toContainText('Review API contracts');
  await expect(page.locator('#done_column')).toContainText('Ship Angular version');
  await expect(page.locator('#review_column .column_card')).toHaveCount(0);
});

test('task search matches title case-insensitively', async ({ page }) => {
  await openBoard(page);
  await page.locator('#searchbar_tasks').fill('ANGULAR VERSION');
  await page.locator('#searchbar_tasks').press('End');
  await expect(page.locator('.column_card')).toHaveCount(1);
  await expect(page.locator('.column_card')).toContainText('Ship Angular version');
});

test('task search also matches descriptions', async ({ page }) => {
  await openBoard(page);
  await page.locator('#searchbar_tasks').fill('request payload');
  await page.locator('#searchbar_tasks').press('End');
  await expect(page.locator('.column_card')).toHaveCount(1);
  await expect(page.locator('.column_card')).toContainText('Review API contracts');
});

test('task detail dialog renders the complete task contract', async ({ page }) => {
  await openBoard(page);
  await page.getByText('Build migration safety net', { exact: true }).click();
  await expect(page.locator('#dialog_wrapper')).toHaveAttribute('open', 'true');
  await expect(page.locator('#task_detail_dialog')).toHaveAttribute('current_dialog', 'true');
  await expect(page.locator('#detail_task_description')).toHaveText('Characterize the existing frontend before Angular');
  await expect(page.locator('#detail_task_due_date')).toHaveText('2099-12-31');
  await expect(page.locator('#detail_task_priority')).toContainText('high');
  await expect(page.locator('#detail_task_assignee')).toContainText('Ada Lovelace');
  await expect(page.locator('#detail_task_reviewer')).toContainText('Grace Hopper');
  await expect(page.locator('#task_comment_list')).toContainText('Existing comment');
});

test('task query parameter automatically opens task detail', async ({ page }) => {
  await openBoard(page, '&task_id=21');
  await expect(page.locator('#dialog_wrapper')).toHaveAttribute('open', 'true');
  await expect(page.locator('#detail_task_title')).toHaveText('Build migration safety net');
});

test('Add Task opens create mode with expected defaults', async ({ page }) => {
  await openBoard(page);
  await page.getByRole('button', { name: 'Add Task' }).click();
  await expect(page.locator('#create_edit_task_dialog')).toHaveAttribute('dialog-type', 'create');
  await expect(page.locator('#create_edit_task_dialog_select')).toHaveValue('to-do');
  await expect(page.locator('#create_edit_task_prio_head')).toContainText('medium');
  await expect(page.locator('#create_edit_task_assignee_head')).toContainText('unassigned');
  await expect(page.locator('#create_edit_task_reviewer_head')).toContainText('unassigned');
});

test('column add button preselects its status', async ({ page }) => {
  await openBoard(page);
  await page.locator('.board_column').nth(1).locator('.close_btn').click();
  await expect(page.locator('#create_edit_task_dialog_select')).toHaveValue('in-progress');
});

test('task creation validates title and due date', async ({ page }) => {
  await openBoard(page);
  await page.getByRole('button', { name: 'Add Task' }).click();
  await page.locator('#create_edit_task_title_input').fill('ab');
  await page.locator('#create_edit_task_dialog').getByRole('button', { name: 'Add', exact: true }).click();
  await expect(page.locator('#create_edit_task_title_input_group')).toHaveAttribute('error', 'true');
  await page.locator('#create_edit_task_title_input').fill('Valid title');
  await page.locator('#create_edit_task_dialog').getByRole('button', { name: 'Add', exact: true }).click();
  await expect(page.locator('#create_edit_task_date_input_group')).toHaveAttribute('error', 'true');
});

test('task creation sends the current form contract', async ({ page }) => {
  const state = await openBoard(page);
  await page.getByRole('button', { name: 'Add Task' }).click();
  await page.locator('#create_edit_task_title_input').fill('Angular parity check');
  await page.locator('#create_edit_task_description').fill('Protect behavior');
  await page.locator('#create_edit_task_dialog_select').selectOption('review');
  await page.locator('#create_edit_task_date_input').fill('2099-09-30');
  await page.locator('#create_edit_task_prio_head').click();
  await page.locator('#create_edit_task_dialog .dropdown').last().getByText('High', { exact: true }).click();
  await page.locator('#create_edit_task_dialog').getByRole('button', { name: 'Add', exact: true }).click();
  await expectApiCall(state, 'POST', '/api/tasks', {
    board: 7,
    title: 'Angular parity check',
    description: 'Protect behavior',
    status: 'review',
    priority: 'high',
    reviewer_id: null,
    assignee_id: null,
    due_date: '2099-09-30',
  });
  await expect(page.locator('#review_column')).toContainText('Angular parity check');
});

test('task detail status selector patches and moves the task', async ({ page }) => {
  const state = await openBoard(page);
  await page.getByText('Build migration safety net', { exact: true }).click();
  await page.locator('#task_detail_dialog_select').selectOption('review');
  await expectApiCall(state, 'PATCH', '/api/tasks/21', { status: 'review' });
  await expect(page.locator('#review_column')).toContainText('Build migration safety net');
});

test('posting a comment sends trimmed content and refreshes activity', async ({ page }) => {
  const state = await openBoard(page);
  await page.getByText('Build migration safety net', { exact: true }).click();
  await page.locator('#comment_textarea').fill('  Migration comment  ');
  await page.locator('.comment_wrapper_textarea > img').click();
  await expectApiCall(state, 'POST', '/api/tasks/21/comments', { content: 'Migration comment' });
  await expect(page.locator('#task_comment_list')).toContainText('Migration comment');
  await expect(page.locator('#comment_textarea')).toHaveValue('');
});

test('empty comments are not submitted', async ({ page }) => {
  const state = await openBoard(page);
  await page.getByText('Build migration safety net', { exact: true }).click();
  await page.locator('#comment_textarea').fill('   ');
  await page.locator('.comment_wrapper_textarea > img').click();
  await page.waitForTimeout(100);
  expect(state.calls.filter((call) => call.method === 'POST' && call.path === '/api/tasks/21/comments')).toHaveLength(0);
});

test('own comments expose deletion and refresh the list', async ({ page }) => {
  const state = await openBoard(page);
  await page.getByText('Build migration safety net', { exact: true }).click();
  await expect(page.locator('.delete_btn')).toHaveCount(1);
  await page.locator('.comment_wrapper').filter({ hasText: 'Existing comment' }).hover();
  await page.locator('.delete_btn').click();
  await expectApiCall(state, 'DELETE', '/api/tasks/21/comments/31');
  await expect(page.locator('#task_comment_list')).not.toContainText('Existing comment');
});

test('board settings open from board and can rename the title', async ({ page }) => {
  const state = await openBoard(page);
  await page.locator('.board_settings_btn').click();
  await expect(page.locator('#edit_board_dialog')).toHaveAttribute('current_dialog', 'true');
  await page.locator('#board_settings_title_group .close_btn').click();
  await page.locator('#board_settings_title_input').fill('Angular Safe Board');
  await page.locator('#board_settings_title_group .confirm_btn').first().click();
  await expectApiCall(state, 'PATCH', '/api/boards/7', { title: 'Angular Safe Board' });
  await expect(page.locator('#board_title')).toHaveText('Angular Safe Board');
  await expect(page.locator('#board_title_link')).toHaveText('Angular Safe Board');
});
