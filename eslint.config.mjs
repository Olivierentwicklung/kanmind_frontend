import nx from '@nx/eslint-plugin';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    ignores: ['**/dist', '**/out-tsc', '**/vitest.config.*.timestamp*'],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$'],
          depConstraints: [
            {
              sourceTag: 'type:app',
              onlyDependOnLibsWithTags: [
                'type:feature',
                'type:domain',
                'type:data-access',
                'type:ui',
              ],
            },
            { sourceTag: 'type:e2e', onlyDependOnLibsWithTags: ['type:app'] },
            {
              sourceTag: 'type:feature',
              onlyDependOnLibsWithTags: [
                'type:domain',
                'type:data-access',
                'type:ui',
              ],
            },
            {
              sourceTag: 'type:domain',
              onlyDependOnLibsWithTags: ['type:data-access'],
            },
            { sourceTag: 'type:data-access', onlyDependOnLibsWithTags: [] },
            {
              sourceTag: 'type:ui',
              onlyDependOnLibsWithTags: ['type:ui', 'type:util'],
            },
            {
              sourceTag: 'scope:app',
              onlyDependOnLibsWithTags: [
                'scope:app',
                'scope:auth',
                'scope:legal',
                'scope:dashboard',
                'scope:boards',
                'scope:shared',
              ],
            },
            {
              sourceTag: 'scope:auth',
              onlyDependOnLibsWithTags: ['scope:auth', 'scope:shared'],
            },
            {
              sourceTag: 'scope:legal',
              onlyDependOnLibsWithTags: [
                'scope:legal',
                'scope:auth',
                'scope:shared',
              ],
            },
            {
              sourceTag: 'scope:dashboard',
              onlyDependOnLibsWithTags: [
                'scope:dashboard',
                'scope:auth',
                'scope:shared',
              ],
            },
            {
              sourceTag: 'scope:boards',
              onlyDependOnLibsWithTags: [
                'scope:boards',
                'scope:auth',
                'scope:shared',
              ],
            },
            {
              sourceTag: 'scope:shared',
              onlyDependOnLibsWithTags: ['scope:shared'],
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.cts',
      '**/*.mts',
      '**/*.js',
      '**/*.jsx',
      '**/*.cjs',
      '**/*.mjs',
    ],
    // Override or add rules here
    rules: {},
  },
];
