const { expect } = require('@playwright/test');

const API_BASE_URL = 'http://127.0.0.1:8000/api';

const defaultUser = {
  token: 'playwright-token',
  user_id: 42,
  email: 'ada@example.com',
  fullname: 'Ada Lovelace',
};

const defaultMembers = [
  { id: 42, email: 'ada@example.com', fullname: 'Ada Lovelace' },
  { id: 43, email: 'grace@example.com', fullname: 'Grace Hopper' },
  { id: 44, email: 'alan@example.com', fullname: 'Alan Turing' },
  { id: 45, email: 'katherine@example.com', fullname: 'Katherine Johnson' },
  { id: 46, email: 'margaret@example.com', fullname: 'Margaret Hamilton' },
];

const defaultTasks = [
  {
    id: 21,
    board: 7,
    title: 'Build migration safety net',
    description: 'Characterize the existing frontend before Angular',
    due_date: '2099-12-31',
    priority: 'high',
    status: 'to-do',
    comments_count: 2,
    assignee: defaultMembers[0],
    reviewer: defaultMembers[1],
  },
  {
    id: 22,
    board: 7,
    title: 'Review API contracts',
    description: 'Verify every request payload',
    due_date: '2099-11-30',
    priority: 'medium',
    status: 'in-progress',
    comments_count: 0,
    assignee: null,
    reviewer: defaultMembers[0],
  },
  {
    id: 23,
    board: 7,
    title: 'Ship Angular version',
    description: 'Preserve all visible behavior',
    due_date: '2099-10-31',
    priority: 'low',
    status: 'done',
    comments_count: 1,
    assignee: defaultMembers[1],
    reviewer: null,
  },
];

const defaultBoards = [
  {
    id: 7,
    title: 'Migration Board',
    owner_id: 42,
    member_count: 5,
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

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

async function authenticate(page, user = defaultUser) {
  await page.addInitScript((authUser) => {
    if (sessionStorage.getItem('playwright-auth-seeded')) return;
    localStorage.setItem('auth-token', authUser.token);
    localStorage.setItem('auth-user-id', String(authUser.user_id));
    localStorage.setItem('auth-email', authUser.email);
    localStorage.setItem('auth-fullname', authUser.fullname);
    sessionStorage.setItem('playwright-auth-seeded', 'true');
  }, user);
}

async function mockApp(page, options = {}) {
  const state = {
    user: clone(options.user || defaultUser),
    boards: clone(options.boards || defaultBoards),
    tasks: clone(options.tasks || defaultTasks),
    reviewerTasks: clone(options.reviewerTasks || [defaultTasks[1]]),
    members: clone(options.members || defaultMembers),
    comments: clone(options.comments || [
      { id: 31, author: 'Ada Lovelace', content: 'Existing comment', created_at: '2025-01-01T00:00:00Z' },
      { id: 32, author: 'Grace Hopper', content: 'Reviewer feedback', created_at: '2025-01-02T00:00:00Z' },
    ]),
    calls: [],
  };

  await page.route('https://cdn.jsdelivr.net/**', (route) => route.fulfill({
    contentType: 'application/javascript',
    body: 'window.Chart = class Chart {};',
  }));

  await page.route(`${API_BASE_URL}/**`, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace(/\/$/, '');
    const method = request.method();
    const body = request.postDataJSON?.() || null;
    state.calls.push({ method, path, body, search: url.search });

    if (options.fail?.[`${method} ${path}`]) {
      await route.fulfill({ status: options.fail[`${method} ${path}`].status || 400, json: options.fail[`${method} ${path}`].body });
      return;
    }

    if (method === 'POST' && path === '/api/login') {
      const loginOk = options.loginOk !== false;
      await route.fulfill(loginOk
        ? { json: state.user }
        : { status: 400, json: { detail: 'Invalid credentials' } });
      return;
    }

    if (method === 'POST' && path === '/api/registration') {
      await route.fulfill({ status: 201, json: state.user });
      return;
    }

    if (method === 'GET' && path === '/api/email-check') {
      const member = state.members.find((item) => item.email === url.searchParams.get('email'));
      await route.fulfill(member ? { json: member } : { status: 404, json: { detail: 'Not found' } });
      return;
    }

    if (method === 'GET' && path === '/api/boards') {
      await route.fulfill({ json: state.boards });
      return;
    }

    if (method === 'POST' && path === '/api/boards') {
      const created = {
        id: 9,
        owner_id: state.user.user_id,
        member_count: body.members.length,
        ticket_count: 0,
        tasks_to_do_count: 0,
        tasks_high_prio_count: 0,
        ...body,
      };
      state.boards.push(created);
      await route.fulfill({ status: 201, json: created });
      return;
    }

    if (path === '/api/boards/7') {
      if (method === 'GET') {
        await route.fulfill({ json: detailedBoard(state) });
        return;
      }
      if (method === 'PATCH') {
        Object.assign(state.boards[0], body);
        await route.fulfill({ json: { ...detailedBoard(state), ...body } });
        return;
      }
      if (method === 'DELETE') {
        state.boards = state.boards.filter((board) => board.id !== 7);
        await route.fulfill({ status: 204, body: '' });
        return;
      }
    }

    if (method === 'GET' && path === '/api/tasks/assigned-to-me') {
      await route.fulfill({ json: state.tasks });
      return;
    }

    if (method === 'GET' && path === '/api/tasks/reviewing') {
      await route.fulfill({ json: state.reviewerTasks });
      return;
    }

    if (method === 'POST' && path === '/api/tasks') {
      const created = { id: 24, comments_count: 0, assignee: null, reviewer: null, ...body };
      state.tasks.push(created);
      await route.fulfill({ status: 201, json: created });
      return;
    }

    const commentMatch = path.match(/^\/api\/tasks\/(\d+)\/comments(?:\/(\d+))?$/);
    if (commentMatch) {
      if (method === 'GET') {
        await route.fulfill({ json: state.comments });
        return;
      }
      if (method === 'POST') {
        state.comments.push({ id: 33, author: state.user.fullname, created_at: new Date().toISOString(), ...body });
        await route.fulfill({ status: 201, json: state.comments.at(-1) });
        return;
      }
      if (method === 'DELETE') {
        state.comments = state.comments.filter((comment) => comment.id !== Number(commentMatch[2]));
        await route.fulfill({ status: 204, body: '' });
        return;
      }
    }

    const taskMatch = path.match(/^\/api\/tasks\/(\d+)$/);
    if (taskMatch) {
      const id = Number(taskMatch[1]);
      if (method === 'PATCH') {
        const task = state.tasks.find((item) => item.id === id);
        if (task) Object.assign(task, body);
        await route.fulfill({ json: task || body });
        return;
      }
      if (method === 'DELETE') {
        state.tasks = state.tasks.filter((task) => task.id !== id);
        await route.fulfill({ status: 204, body: '' });
        return;
      }
    }

    await route.fulfill({ status: 404, json: { detail: `No mock for ${method} ${path}` } });
  });

  return state;
}

function detailedBoard(state) {
  return {
    ...state.boards[0],
    members: state.members,
    tasks: state.tasks,
  };
}

async function expectApiCall(state, method, path, body) {
  await expect.poll(() => state.calls.find((call) => call.method === method && call.path === path)).toBeTruthy();
  const call = state.calls.findLast((item) => item.method === method && item.path === path);
  if (body !== undefined) expect(call.body).toEqual(body);
  return call;
}

module.exports = {
  API_BASE_URL,
  authenticate,
  defaultBoards,
  defaultMembers,
  defaultTasks,
  defaultUser,
  expectApiCall,
  mockApp,
};
