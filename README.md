# KanMind Frontend

KanMind is a standalone, zoneless Angular 22 application in an integrated Nx workspace. Authentication, legal pages, dashboard, boards, board settings, tasks, and comments are native Angular features. The complete vanilla application remains runnable as a frozen comparison baseline.

## Requirements and setup

- Node.js 24
- npm
- Chromium for Playwright

```bash
npm ci
npx playwright install chromium
```

For a first install without a lockfile-based CI environment, use `npm install` instead of `npm ci`.

## Workspace

```text
apps/kanmind                 Angular application
apps/kanmind-e2e             Angular Playwright tests
apps/kanmind-legacy          Frozen vanilla baseline
apps/kanmind-legacy-e2e      Existing 64-scenario / 128-check suite
libs/auth/feature            Lazy login page and form
libs/auth/domain             Session contracts, guard, root Signal Store
libs/auth/data-access        Login API, storage and auth interceptor
libs/legal/feature           Lazy Privacy and Imprint pages
libs/dashboard/*             Dashboard feature, domain state and data access
libs/boards/*                Boards/tasks feature, domain state and data access
libs/shared/ui               Reusable responsive application shell
```

Nx tags enforce `app -> feature -> domain/data-access` and `domain -> data-access`. Cross-library imports use the public aliases in `tsconfig.base.json`.

## Development

```bash
npm start                    # Angular at http://127.0.0.1:4200
npm run serve:legacy         # vanilla baseline at http://127.0.0.1:4174
npm run build
npm run lint
npm test
npm run affected
```

The Angular development server proxies `/api/` to `http://127.0.0.1:8000`. The default browser suites do not need Django: Playwright deterministically mocks login and all legacy backend calls.

## Browser tests

Both suites run Desktop Chrome and a Pixel 5-compatible Chromium profile.

```bash
npm run test:e2e
npm run test:e2e:headed
npm run test:e2e:ui
npm run test:e2e:report

npm run test:legacy:e2e
npm run test:legacy:e2e:headed
npm run test:legacy:e2e:ui
npm run test:legacy:e2e:report
```

UI mode opens Playwright's interactive browser test explorer. Headed mode opens the tested browser while the normal runner executes. HTML reports are written separately to `playwright-report/angular` and `playwright-report/legacy`.

## Authentication design

The frontend posts `{ email, password }` to `POST /api/login/` and adapts `{ token, user_id, email, fullname }` to the domain session. Browser storage is accessed only through the data-access abstraction and preserves `auth-token`, `auth-user-id`, `auth-email`, and `auth-fullname`. A root NgRx Signal Store owns the cross-route session, uses `exhaustMap` to ignore duplicate login submissions, and supplies the functional route guard. The interceptor sends future authenticated requests as `Authorization: Token <token>`.

NgRx Signal Store `22.0.0-beta.0` is pinned because it is the published line declaring Angular 22 peer compatibility; the stable NgRx 21 line declares Angular 21 peers.

## Regression workflow

Add unit and Angular Playwright coverage for behavior changes, then run the unchanged legacy suite when checking behavioral parity. Angular owns its CSS, fonts, and icons; it does not import runtime assets or code from `kanmind-legacy`. The legacy snapshot is a regression reference, not a production fallback.

Repository engineering policy is tracked in `AGENTS.md`, `CODEX-USAGE-GUIDE.md`, and `.agents/skills/`.
