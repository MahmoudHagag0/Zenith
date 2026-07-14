const globals = require('globals');
const base = require('@zenith/tooling/eslint.config.js');

module.exports = [
  ...base,
  {
    // The Prisma seed script (S1-026) is a plain CommonJS Node script, not
    // TypeScript -- same treatment the shared config already gives *.config.js.
    files: ['prisma/seed.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: globals.node,
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
];
