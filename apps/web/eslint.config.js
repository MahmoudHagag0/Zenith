const { FlatCompat } = require('@eslint/eslintrc');
const baseConfig = require('@zenith/tooling/eslint.config.js');

const compat = new FlatCompat({ baseDirectory: __dirname });

module.exports = [
  ...baseConfig,
  ...compat.extends('next/core-web-vitals'),
  { ignores: ['next-env.d.ts'] },
];
