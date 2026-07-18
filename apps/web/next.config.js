/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // M5-003 §17: workspace UI/token packages are consumed as TS/CSS
  // source, not pre-built -- Next transpiles them as part of this app's
  // own build, avoiding a separate build-order dependency.
  transpilePackages: ['@zenith/ui', '@zenith/design-tokens'],
};

module.exports = nextConfig;
