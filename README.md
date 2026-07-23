# KanMind Frontend

KanMind is a standalone, zoneless Angular 22 application in an integrated Nx workspace. Authentication, legal pages, dashboard, boards, board settings, tasks, and comments are native Angular features.

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
npm run build
npm run lint
npm test
npm run test:all
npm run affected
```

The Angular development server proxies `/api/` to `http://127.0.0.1:8000`. The browser suite does not need Django: Playwright deterministically mocks the backend calls used by each scenario.

## Browser tests

Both suites run Desktop Chrome and a Pixel 5-compatible Chromium profile.

```bash
npm run test:e2e
npm run test:e2e:headed
npm run test:e2e:ui
npm run test:e2e:report
```

UI mode opens Playwright's interactive browser test explorer. Headed mode opens the tested browser while the normal runner executes. The HTML report is written to `playwright-report/angular`.

`npm run test:all` runs lint, all Angular unit and integration tests, the Playwright browser suite, and the production build.

## Authentication design

The frontend posts `{ email, password }` to `POST /api/login/` and adapts `{ token, user_id, email, fullname }` to the domain session. Browser storage is accessed only through the data-access abstraction and preserves `auth-token`, `auth-user-id`, `auth-email`, and `auth-fullname`. A root NgRx Signal Store owns the cross-route session, uses `exhaustMap` to ignore duplicate login submissions, and supplies the functional route guard. The interceptor sends future authenticated requests as `Authorization: Token <token>`.

NgRx Signal Store `22.0.0-beta.0` is pinned because it is the published line declaring Angular 22 peer compatibility; the stable NgRx 21 line declares Angular 21 peers.

## Regression workflow

Add focused unit or integration coverage for behavior changes and Playwright coverage for complete user journeys. Run `npm run test:all` before merging. Earlier implementations remain available through Git history; the workspace contains only the current Angular application.

Repository engineering policy is tracked in `AGENTS.md`, `CODEX-USAGE-GUIDE.md`, and `.agents/skills/`.
